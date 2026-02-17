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
# RUN_SEED=true のときは RUN_MIGRATIONS も自動で有効化（スキーマ同期が前提）
if [ "${RUN_MIGRATIONS}" = "true" ] || [ "${RUN_SEED}" = "true" ]; then
  echo "[1/3] Prismaスキーマ同期..."
  MAX_RETRIES=5
  RETRY_DELAY=5
  for i in $(seq 1 $MAX_RETRIES); do
    if node node_modules/prisma/build/index.js db push --skip-generate --accept-data-loss; then
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
  echo "[1/3] マイグレーションスキップ（RUN_MIGRATIONS != true）"
fi

# --- Seed（デモデータ投入）---
# RUN_SEED=true の場合のみ実行（一度きり）
# Cloud Run の環境変数で RUN_SEED=true を設定→デプロイ→完了後に環境変数を削除
if [ "${RUN_SEED}" = "true" ]; then
  echo "[2/3] Seed実行..."
  if node prisma/seed.js; then
    echo "  ✓ Seed完了"
  else
    echo "  ❌ Seed失敗（アプリ起動は継続します）"
  fi
else
  echo "[2/3] Seedスキップ（RUN_SEED != true）"
fi

# --- アプリケーション起動 ---
echo "[3/3] Next.js起動..."
exec node server.js
