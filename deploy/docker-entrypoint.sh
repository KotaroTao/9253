#!/bin/sh
# =============================================================
# MIERU Clinic - Cloud Run エントリポイント
# コンテナ起動時にPrismaマイグレーションを実行してからアプリを起動
# =============================================================

set -e

echo "=== MIERU Clinic 起動 ==="

# --- Prisma DBマイグレーション（本番用）---
# db push はスキーマの差分を検出して適用する
# Cloud Run ではコンテナ起動時に毎回実行（冪等）
# Cloud SQL Auth Proxy サイドカーの起動を待つためリトライ付き
if [ "${RUN_MIGRATIONS}" = "true" ]; then
  echo "[1/2] Prismaスキーマ同期..."
  MAX_RETRIES=5
  RETRY_DELAY=5
  for i in $(seq 1 $MAX_RETRIES); do
    if npx prisma db push --skip-generate --accept-data-loss; then
      echo "  ✓ スキーマ同期完了"
      break
    fi
    if [ $i -eq $MAX_RETRIES ]; then
      echo "  ❌ マイグレーション失敗（${MAX_RETRIES}回リトライ後）"
      echo "  → deploy/migrate-cloud-sql.sh で手動実行してください"
      break
    fi
    echo "  リトライ ${i}/${MAX_RETRIES} (${RETRY_DELAY}秒待機)..."
    sleep $RETRY_DELAY
  done
else
  echo "[1/2] マイグレーションスキップ（RUN_MIGRATIONS != true）"
fi

# --- アプリケーション起動 ---
echo "[2/2] Next.js起動..."
exec node server.js
