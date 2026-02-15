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
if [ "${RUN_MIGRATIONS}" = "true" ]; then
  echo "[1/2] Prismaスキーマ同期..."
  npx prisma db push --skip-generate --accept-data-loss
  echo "  ✓ スキーマ同期完了"
else
  echo "[1/2] マイグレーションスキップ（RUN_MIGRATIONS != true）"
fi

# --- アプリケーション起動 ---
echo "[2/2] Next.js起動..."
exec node server.js
