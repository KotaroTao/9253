#!/bin/bash
# =============================================================
# MIERU Clinic - Cloud Armor (WAF) セットアップ
# =============================================================
#
# 【前提条件】
# - gcloud CLI がインストール済み・認証済み
# - Cloud Run サービスが外部ロードバランサ経由でアクセスされること
#   ※ Cloud Armor は Cloud Run にロードバランサ (GCLB) 経由で
#     アクセスする構成でのみ有効。direct URL には適用されない。
#
# 【適用手順】
# 1. このスクリプトを実行して Security Policy を作成
# 2. Serverless NEG + Backend Service + URL Map + HTTPS Proxy + Forwarding Rule を設定
# 3. Security Policy を Backend Service にアタッチ
#
# 【注意】
# Cloud Armor は月額課金が発生します。Standard tier は $1/policy + $0.75/10K requests。
# =============================================================

set -e

PROJECT_ID="${GCP_PROJECT_ID:-mieru-clinic}"
REGION="${GCP_REGION:-asia-northeast1}"
POLICY_NAME="mieru-clinic-waf"
BACKEND_SERVICE="mieru-clinic-backend"

echo "=========================================="
echo " Cloud Armor (WAF) セットアップ"
echo "=========================================="
echo "プロジェクト: ${PROJECT_ID}"
echo "ポリシー名:   ${POLICY_NAME}"
echo ""

# =============================================================
# ステップ1: Security Policy 作成
# =============================================================
echo "[1/5] Security Policy 作成..."

gcloud compute security-policies create "${POLICY_NAME}" \
  --description="MIERU Clinic WAF policy" \
  --type=CLOUD_ARMOR \
  2>/dev/null || echo "  (既に存在します)"

echo "  ✓ ポリシー作成完了"

# =============================================================
# ステップ2: OWASP Top 10 保護ルール（プリセット WAF ルール）
# =============================================================
echo ""
echo "[2/5] OWASP Top 10 保護ルール追加..."

# --- SQLインジェクション防御 ---
gcloud compute security-policies rules create 1000 \
  --security-policy="${POLICY_NAME}" \
  --expression="evaluatePreconfiguredExpr('sqli-v33-stable')" \
  --action=deny-403 \
  --description="SQLi protection (OWASP CRS)" \
  2>/dev/null || echo "  Rule 1000: (既に存在)"

# --- XSS (クロスサイトスクリプティング) 防御 ---
gcloud compute security-policies rules create 1100 \
  --security-policy="${POLICY_NAME}" \
  --expression="evaluatePreconfiguredExpr('xss-v33-stable')" \
  --action=deny-403 \
  --description="XSS protection (OWASP CRS)" \
  2>/dev/null || echo "  Rule 1100: (既に存在)"

# --- Local File Inclusion (LFI) 防御 ---
gcloud compute security-policies rules create 1200 \
  --security-policy="${POLICY_NAME}" \
  --expression="evaluatePreconfiguredExpr('lfi-v33-stable')" \
  --action=deny-403 \
  --description="LFI protection (OWASP CRS)" \
  2>/dev/null || echo "  Rule 1200: (既に存在)"

# --- Remote File Inclusion (RFI) 防御 ---
gcloud compute security-policies rules create 1300 \
  --security-policy="${POLICY_NAME}" \
  --expression="evaluatePreconfiguredExpr('rfi-v33-stable')" \
  --action=deny-403 \
  --description="RFI protection (OWASP CRS)" \
  2>/dev/null || echo "  Rule 1300: (既に存在)"

# --- Remote Code Execution (RCE) 防御 ---
gcloud compute security-policies rules create 1400 \
  --security-policy="${POLICY_NAME}" \
  --expression="evaluatePreconfiguredExpr('rce-v33-stable')" \
  --action=deny-403 \
  --description="RCE protection (OWASP CRS)" \
  2>/dev/null || echo "  Rule 1400: (既に存在)"

# --- Protocol Attack 防御 ---
gcloud compute security-policies rules create 1500 \
  --security-policy="${POLICY_NAME}" \
  --expression="evaluatePreconfiguredExpr('protocolattack-v33-stable')" \
  --action=deny-403 \
  --description="Protocol attack protection (OWASP CRS)" \
  2>/dev/null || echo "  Rule 1500: (既に存在)"

# --- Scanner Detection ---
gcloud compute security-policies rules create 1600 \
  --security-policy="${POLICY_NAME}" \
  --expression="evaluatePreconfiguredExpr('scannerdetection-v33-stable')" \
  --action=deny-403 \
  --description="Scanner detection (OWASP CRS)" \
  2>/dev/null || echo "  Rule 1600: (既に存在)"

echo "  ✓ OWASP WAF ルール追加完了"

# =============================================================
# ステップ3: レート制限ルール
# =============================================================
echo ""
echo "[3/5] レート制限ルール追加..."

# --- API全体のレート制限: 300 req/min per IP ---
gcloud compute security-policies rules create 2000 \
  --security-policy="${POLICY_NAME}" \
  --expression="true" \
  --action=throttle \
  --rate-limit-threshold-count=300 \
  --rate-limit-threshold-interval-sec=60 \
  --conform-action=allow \
  --exceed-action=deny-429 \
  --enforce-on-key=IP \
  --description="Global rate limit: 300 req/min per IP" \
  2>/dev/null || echo "  Rule 2000: (既に存在)"

# --- 認証系エンドポイントの厳格レート制限: 10 req/min per IP ---
gcloud compute security-policies rules create 2100 \
  --security-policy="${POLICY_NAME}" \
  --expression="request.path.matches('/api/auth/.*')" \
  --action=throttle \
  --rate-limit-threshold-count=10 \
  --rate-limit-threshold-interval-sec=60 \
  --conform-action=allow \
  --exceed-action=deny-429 \
  --enforce-on-key=IP \
  --description="Auth rate limit: 10 req/min per IP" \
  2>/dev/null || echo "  Rule 2100: (既に存在)"

echo "  ✓ レート制限ルール追加完了"

# =============================================================
# ステップ4: Geo制限（日本のみ許可、オプション）
# =============================================================
echo ""
echo "[4/5] Geo制限ルール追加（日本以外をブロック）..."
echo "  ※ 海外からのアクセスが不要な場合のみ有効化してください"

# 以下はコメントアウト状態 — 必要に応じて有効化
cat << 'SKIP'
gcloud compute security-policies rules create 3000 \
  --security-policy="${POLICY_NAME}" \
  --expression="origin.region_code != 'JP'" \
  --action=deny-403 \
  --description="Allow only Japan (JP)" \
  2>/dev/null || echo "  Rule 3000: (既に存在)"
SKIP

echo "  ⏭ Geo制限はデフォルトで無効。必要に応じてスクリプト内で有効化してください"

# =============================================================
# ステップ5: Backend Service にポリシーをアタッチ
# =============================================================
echo ""
echo "[5/5] Backend Service にポリシーをアタッチ..."
echo ""
echo "  ※ Cloud Run に Cloud Armor を適用するには、以下の構成が必要です:"
echo ""
echo "  1. Serverless NEG 作成:"
echo "     gcloud compute network-endpoint-groups create mieru-neg \\"
echo "       --region=${REGION} \\"
echo "       --network-endpoint-type=serverless \\"
echo "       --cloud-run-service=mieru-clinic"
echo ""
echo "  2. Backend Service 作成:"
echo "     gcloud compute backend-services create ${BACKEND_SERVICE} \\"
echo "       --global \\"
echo "       --load-balancing-scheme=EXTERNAL_MANAGED"
echo ""
echo "  3. NEG を Backend Service にアタッチ:"
echo "     gcloud compute backend-services add-backend ${BACKEND_SERVICE} \\"
echo "       --global \\"
echo "       --network-endpoint-group=mieru-neg \\"
echo "       --network-endpoint-group-region=${REGION}"
echo ""
echo "  4. Security Policy をアタッチ:"
echo "     gcloud compute backend-services update ${BACKEND_SERVICE} \\"
echo "       --global \\"
echo "       --security-policy=${POLICY_NAME}"
echo ""
echo "  5. URL Map + HTTPS Proxy + Forwarding Rule + SSL証明書を設定"
echo "     （ドメイン mieru-clinic.com のロードバランサ構成）"
echo ""
echo "=========================================="
echo " Cloud Armor セットアップ完了"
echo "=========================================="
echo ""
echo "ルール一覧確認:"
echo "  gcloud compute security-policies describe ${POLICY_NAME}"
echo ""
echo "ルール詳細:"
echo "  gcloud compute security-policies rules list --security-policy=${POLICY_NAME}"
