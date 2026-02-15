#!/bin/bash
# =============================================================
# MIERU Clinic - Cloud SQL マイグレーション & シード
# Cloud SQL Auth Proxy経由でローカルからDBを操作
# =============================================================
#
# 【前提条件】
# - gcloud CLI がインストール済み & 認証済み
# - cloud-sql-proxy がインストール済み
#   brew install cloud-sql-proxy  (macOS)
#   または https://cloud.google.com/sql/docs/postgres/sql-proxy
#
# 【使い方】
# 1. 環境変数を設定:
#    export GCP_PROJECT_ID="mieru-9253"
#    export SQL_INSTANCE="mieru-clinic-db"
#    export DB_USER="mieru"
#    export DB_PASSWORD="your-password"
# 2. スクリプトを実行:
#    bash deploy/migrate-cloud-sql.sh
#
# =============================================================

set -e

# --- 設定値 ---
PROJECT_ID="${GCP_PROJECT_ID:-mieru-9253}"
REGION="${GCP_REGION:-asia-northeast1}"
SQL_INSTANCE="${SQL_INSTANCE:-mieru-clinic-db}"
DB_NAME="${DB_NAME:-mieru_clinic}"
DB_USER="${DB_USER:-mieru}"
DB_PASSWORD="${DB_PASSWORD:-}"
PROXY_PORT=15432  # ローカルでの競合を避けるためデフォルトと変更

if [ -z "${DB_PASSWORD}" ]; then
  echo "❌ エラー: DB_PASSWORD を環境変数に設定してください"
  exit 1
fi

# Cloud SQL 接続名を取得
CONNECTION_NAME=$(gcloud sql instances describe "${SQL_INSTANCE}" \
  --project="${PROJECT_ID}" \
  --format='value(connectionName)')

echo "=========================================="
echo " Cloud SQL マイグレーション"
echo "=========================================="
echo "接続先: ${CONNECTION_NAME}"
echo "DB:     ${DB_NAME}"
echo ""

# --- Cloud SQL Auth Proxy を起動 ---
echo "[1/4] Cloud SQL Auth Proxy 起動..."

cloud-sql-proxy "${CONNECTION_NAME}" \
  --port=${PROXY_PORT} \
  --quiet &
PROXY_PID=$!

# Proxyの起動を待つ
sleep 3

# 終了時にProxyを停止
cleanup() {
  echo ""
  echo "Cloud SQL Auth Proxy 停止..."
  kill ${PROXY_PID} 2>/dev/null || true
}
trap cleanup EXIT

# --- DATABASE_URL をProxy経由に設定 ---
export DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@localhost:${PROXY_PORT}/${DB_NAME}?schema=public"

echo "  ✓ Proxy起動完了 (PID: ${PROXY_PID}, port: ${PROXY_PORT})"

# --- Prisma スキーマ同期 ---
echo ""
echo "[2/4] Prisma スキーマ同期..."
npx prisma db push --accept-data-loss
echo "  ✓ 完了"

# --- Prisma Client 生成 ---
echo ""
echo "[3/4] Prisma Client 生成..."
npx prisma generate
echo "  ✓ 完了"

# --- シードデータ投入 ---
echo ""
echo "[4/4] シードデータ投入..."
read -p "シードデータを投入しますか？ (y/N): " SEED_CONFIRM
if [ "${SEED_CONFIRM}" = "y" ] || [ "${SEED_CONFIRM}" = "Y" ]; then
  npm run db:seed
  echo "  ✓ シード完了"
else
  echo "  スキップ"
fi

echo ""
echo "=========================================="
echo " マイグレーション完了"
echo "=========================================="
