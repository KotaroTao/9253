#!/bin/bash
# =============================================================
# MIERU Clinic デプロイスクリプト
# /var/www/9253 で実行
# =============================================================

set -e

APP_DIR="/var/www/9253"
cd "$APP_DIR"

echo "=========================================="
echo " MIERU Clinic デプロイ"
echo "=========================================="

# --- 1. 最新コード取得 ---
echo ""
echo "[1/5] 最新コード取得..."
git fetch origin main
git reset --hard origin/main
echo "  ✓ 完了"

# --- 2. 依存関係インストール ---
echo ""
echo "[2/5] npm install..."
npm ci --production=false
echo "  ✓ 完了"

# --- 3. Prisma マイグレーション + シード ---
echo ""
echo "[3/5] Prisma マイグレーション..."
npx prisma generate
npx prisma migrate deploy
# 初回のみ: デモデータが存在しなければseed実行
npx tsx -e "
  const { PrismaClient } = require('@prisma/client');
  const p = new PrismaClient();
  p.user.count().then(c => {
    if (c === 0) { console.log('  DB is empty, running seed...'); process.exit(0); }
    else { console.log('  Seed skipped (users exist)'); process.exit(1); }
  }).catch(() => process.exit(0)).finally(() => p.\$disconnect());
" && npm run db:seed || true
echo "  ✓ 完了"

# --- 4. Next.js ビルド ---
echo ""
echo "[4/5] Next.js ビルド..."
npm run build
echo "  ✓ 完了"

# --- 5. PM2 再起動 ---
echo ""
echo "[5/5] アプリ再起動..."
pm2 restart mieru-clinic || pm2 start "$APP_DIR/deploy/ecosystem.config.js"
echo "  ✓ 完了"

echo ""
echo "=========================================="
echo " デプロイ完了！"
echo "=========================================="
echo " https://mieru-clinic.com/ で確認してください"
echo ""
