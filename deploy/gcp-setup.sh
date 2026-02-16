#!/bin/bash
# =============================================================
# MIERU Clinic - GCP環境構築スクリプト
# Cloud SQL (PostgreSQL) + Cloud Run + Artifact Registry
# =============================================================
#
# 【前提条件】
# - gcloud CLI がインストール済み
# - gcloud auth login 済み
# - 課金が有効な GCPプロジェクトが存在する
#
# 【使い方】
# 各セクションのコマンドを順番に実行してください。
# 全自動ではなく、確認しながら進めることを推奨します。
#
# =============================================================

set -e

# --- 設定値（環境に合わせて変更） ---
PROJECT_ID="mieru-clinic"            # GCPプロジェクトID
REGION="asia-northeast1"            # 東京リージョン
ZONE="asia-northeast1-a"

# Cloud SQL
SQL_INSTANCE="mieru-clinic-db"
DB_NAME="mieru_clinic"
DB_USER="mieru"
DB_PASSWORD="${DB_PASSWORD:-$(openssl rand -base64 24)}"  # 未設定なら自動生成

# Cloud Run
SERVICE_NAME="mieru-clinic"
MIN_INSTANCES=0                     # コスト最適化: リクエストなし時は0
MAX_INSTANCES=3                     # MVP規模

# Artifact Registry
REPO_NAME="mieru-clinic"

# サービスアカウント（GitHub Actions用）
SA_NAME="github-actions"
SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

# Cloud Run実行用サービスアカウント
CLOUD_RUN_SA_NAME="cloud-run-mieru"
CLOUD_RUN_SA_EMAIL="${CLOUD_RUN_SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

echo "=========================================="
echo " MIERU Clinic GCP環境構築"
echo "=========================================="
echo "プロジェクト: ${PROJECT_ID}"
echo "リージョン:   ${REGION}"
echo "DB パスワード: ${DB_PASSWORD}"
echo ""
echo "  ⚠ DB パスワードを安全な場所に保存してください"
echo ""

# =============================================================
# ステップ1: GCPプロジェクトの設定 & 課金リンク
# =============================================================
echo "[1/9] GCPプロジェクトの設定..."

gcloud config set project "${PROJECT_ID}"

# 課金アカウントのリンク（既にリンク済みの場合はスキップ）
BILLING_LINKED=$(gcloud billing projects describe "${PROJECT_ID}" --format='value(billingAccountName)' 2>/dev/null || true)
if [ -z "${BILLING_LINKED}" ]; then
  echo "  課金アカウントをリンクします..."
  BILLING_ACCOUNT=$(gcloud billing accounts list --filter='open=true' --format='value(ACCOUNT_ID)' --limit=1)
  if [ -n "${BILLING_ACCOUNT}" ]; then
    gcloud billing projects link "${PROJECT_ID}" --billing-account="${BILLING_ACCOUNT}"
    echo "  ✓ 課金アカウント ${BILLING_ACCOUNT} をリンクしました"
  else
    echo "  ❌ 有効な課金アカウントが見つかりません。GCPコンソールで設定してください"
    exit 1
  fi
else
  echo "  ✓ 課金アカウントはリンク済み"
fi

# =============================================================
# ステップ2: 必要なAPIの有効化
# =============================================================
echo ""
echo "[2/9] APIの有効化..."

gcloud services enable \
  run.googleapis.com \
  sqladmin.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  secretmanager.googleapis.com \
  compute.googleapis.com

echo "  ✓ API有効化完了"

# =============================================================
# ステップ3: Artifact Registry リポジトリ作成
# =============================================================
echo ""
echo "[3/9] Artifact Registryリポジトリ作成..."

gcloud artifacts repositories create "${REPO_NAME}" \
  --repository-format=docker \
  --location="${REGION}" \
  --description="MIERU Clinic Docker images" \
  || echo "  (既に存在します)"

echo "  ✓ リポジトリ: ${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}"

# =============================================================
# ステップ4: Cloud SQL インスタンス作成
# =============================================================
echo ""
echo "[4/9] Cloud SQLインスタンス作成..."
echo "  ※ 数分かかります"

if [ -z "${DB_PASSWORD}" ]; then
  echo "  ❌ エラー: DB_PASSWORD を設定してください"
  echo "  例: DB_PASSWORD=\$(openssl rand -base64 24)"
  exit 1
fi

gcloud sql instances create "${SQL_INSTANCE}" \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region="${REGION}" \
  --storage-type=SSD \
  --storage-size=10GB \
  --storage-auto-increase \
  --backup-start-time=03:00 \
  --availability-type=zonal \
  --database-flags=max_connections=100 \
  || echo "  (既に存在します)"

echo "  ✓ Cloud SQLインスタンス: ${SQL_INSTANCE}"

# =============================================================
# ステップ5: データベース & ユーザー作成
# =============================================================
echo ""
echo "[5/9] データベース & ユーザー作成..."

# データベース作成
gcloud sql databases create "${DB_NAME}" \
  --instance="${SQL_INSTANCE}" \
  || echo "  (DBは既に存在します)"

# ユーザー作成
gcloud sql users create "${DB_USER}" \
  --instance="${SQL_INSTANCE}" \
  --password="${DB_PASSWORD}" \
  || echo "  (ユーザーは既に存在します)"

echo "  ✓ DB: ${DB_NAME}, ユーザー: ${DB_USER}"

# =============================================================
# ステップ6: Cloud Run用サービスアカウント作成
# =============================================================
echo ""
echo "[6/9] Cloud Run用サービスアカウント作成..."

gcloud iam service-accounts create "${CLOUD_RUN_SA_NAME}" \
  --display-name="Cloud Run MIERU Clinic" \
  || echo "  (既に存在します)"

# Cloud SQL Clientロールを付与
gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
  --member="serviceAccount:${CLOUD_RUN_SA_EMAIL}" \
  --role="roles/cloudsql.client" \
  --quiet

echo "  ✓ サービスアカウント: ${CLOUD_RUN_SA_EMAIL}"

# =============================================================
# ステップ7: GitHub Actions用サービスアカウント作成
# =============================================================
echo ""
echo "[7/9] GitHub Actions用サービスアカウント作成..."

gcloud iam service-accounts create "${SA_NAME}" \
  --display-name="GitHub Actions Deploy" \
  || echo "  (既に存在します)"

# 必要なロールを付与
ROLES=(
  "roles/run.admin"
  "roles/artifactregistry.writer"
  "roles/cloudbuild.builds.editor"
  "roles/iam.serviceAccountUser"
  "roles/cloudsql.client"
)

for ROLE in "${ROLES[@]}"; do
  gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
    --member="serviceAccount:${SA_EMAIL}" \
    --role="${ROLE}" \
    --quiet
done

echo "  ✓ サービスアカウント: ${SA_EMAIL}"

# =============================================================
# ステップ7.5: VPCコネクタ作成（Cloud Run ↔ Cloud SQL接続用）
# =============================================================
echo ""
echo "[7.5/9] VPCコネクタ作成..."

gcloud compute networks vpc-access connectors create mieru-vpc-connector \
  --region="${REGION}" \
  --network=default \
  --range=10.8.0.0/28 \
  --machine-type=e2-micro \
  --min-instances=2 \
  --max-instances=10 \
  || echo "  (既に存在します)"

echo "  ✓ VPCコネクタ: mieru-vpc-connector"

# JSONキー生成（Cloud Shellのホームに出力）
KEY_FILE="${HOME}/github-actions-key.json"
gcloud iam service-accounts keys create "${KEY_FILE}" \
  --iam-account="${SA_EMAIL}"

echo ""
echo "  ⚠ 重要: ${KEY_FILE} をGitHub Secretsに登録してください"
echo "  GitHub → Settings → Secrets → Actions → GCP_SA_KEY"
echo "  登録後、このファイルは削除してください"

# =============================================================
# ステップ8: Secret Manager にシークレットを登録
# =============================================================
echo ""
echo "[8/9] Secret Manager にシークレットを登録..."

# Cloud SQLの接続名を取得
CONNECTION_NAME=$(gcloud sql instances describe "${SQL_INSTANCE}" \
  --format='value(connectionName)')

echo "  Cloud SQL接続名: ${CONNECTION_NAME}"

# DATABASE_URL（Cloud SQL Unix Socket経由）
DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@localhost:5432/${DB_NAME}?host=/cloudsql/${CONNECTION_NAME}"

# AUTH_SECRET生成
AUTH_SECRET=$(openssl rand -base64 32)

echo ""
echo "  ============================================"
echo "  以下の値をGitHub Secretsに登録してください:"
echo "  ============================================"
echo ""
echo "  GCP_PROJECT_ID:      ${PROJECT_ID}"
echo "  GCP_REGION:          ${REGION}"
echo "  GCP_SA_KEY:          (上で生成したJSONキーの中身)"
echo "  DATABASE_URL:        ${DATABASE_URL}"
echo "  AUTH_SECRET:         ${AUTH_SECRET}"
echo "  CLOUD_SQL_CONNECTION: ${CONNECTION_NAME}"
echo ""

# =============================================================
# ステップ9: 初回デプロイ（手動）
# =============================================================
echo ""
echo "[9/9] 初回デプロイの手順"
echo ""
echo "  GitHub Actionsの自動デプロイの前に、手動で初回デプロイを行います:"
echo ""
echo "  # 1. Cloud Build でビルド & プッシュ（推奨）"
echo "  IMAGE=\"${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/${SERVICE_NAME}:initial\""
echo "  gcloud builds submit --tag \"\${IMAGE}\" ."
echo ""
echo "  # ※ docker build + push でも可（Cloud Shellでは接続エラーが出る場合あり）"
echo "  # docker build -t \"\${IMAGE}\" ."
echo "  # gcloud auth configure-docker ${REGION}-docker.pkg.dev --quiet"
echo "  # docker push \"\${IMAGE}\""
echo ""
echo "  # 2. Cloud Runにデプロイ"
echo "  gcloud run deploy ${SERVICE_NAME} \\"
echo "    --image \"\${IMAGE}\" \\"
echo "    --region ${REGION} \\"
echo "    --platform managed \\"
echo "    --allow-unauthenticated \\"
echo "    --port 3000 \\"
echo "    --memory 512Mi \\"
echo "    --cpu 1 \\"
echo "    --min-instances ${MIN_INSTANCES} \\"
echo "    --max-instances ${MAX_INSTANCES} \\"
echo "    --service-account ${CLOUD_RUN_SA_EMAIL} \\"
echo "    --add-cloudsql-instances ${CONNECTION_NAME} \\"
echo "    --vpc-connector mieru-vpc-connector \\"
echo "    --vpc-egress private-ranges-only \\"
echo "    --set-env-vars \"NODE_ENV=production\" \\"
echo "    --set-env-vars \"DATABASE_URL=${DATABASE_URL}\" \\"
echo "    --set-env-vars \"AUTH_SECRET=${AUTH_SECRET}\" \\"
echo "    --set-env-vars \"AUTH_URL=https://mieru-clinic.com\" \\"
echo "    --set-env-vars \"NEXT_PUBLIC_APP_URL=https://mieru-clinic.com\" \\"
echo "    --set-env-vars \"RUN_MIGRATIONS=false\""
echo ""
echo "  # ※ 初回はRUN_MIGRATIONS=falseでデプロイし、"
echo "  #   deploy/migrate-cloud-sql.sh で手動マイグレーション推奨"
echo ""
echo "  # 3. DBマイグレーション & シード（初回のみ）"
echo "  # Cloud Run Jobs または Cloud SQL Auth Proxyを使用："
echo "  # → deploy/migrate-cloud-sql.sh を参照"
echo ""
echo "  # 4. ドメインマッピング"
echo "  gcloud run domain-mappings create \\"
echo "    --service ${SERVICE_NAME} \\"
echo "    --domain app.mieru-clinic.com \\"
echo "    --region ${REGION}"
echo ""
echo "=========================================="
echo " GCP環境構築完了"
echo "=========================================="
