#!/bin/bash
# =============================================================
# MIERU Clinic VPS セットアップスクリプト
# エックスサーバーVPS (Ubuntu/Debian) 用
# サーバー: 210.131.223.161
# ドメイン: mieru-clinic.com
# =============================================================

set -e

echo "=========================================="
echo " MIERU Clinic VPS セットアップ開始"
echo "=========================================="

# --- 1. ディレクトリ作成 ---
echo ""
echo "[1/7] ディレクトリ作成..."
mkdir -p /var/www/9253
echo "  ✓ /var/www/9253 作成完了"

# --- 2. システムパッケージ更新 ---
echo ""
echo "[2/7] システムパッケージ更新..."
apt update -y && apt upgrade -y
apt install -y curl git nginx certbot python3-certbot-nginx ufw

# --- 3. Node.js 20.x インストール ---
echo ""
echo "[3/7] Node.js インストール..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
    echo "  ✓ Node.js $(node -v) インストール完了"
else
    echo "  ✓ Node.js $(node -v) は既にインストール済み"
fi

# PM2 インストール
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
    echo "  ✓ PM2 インストール完了"
else
    echo "  ✓ PM2 は既にインストール済み"
fi

# --- 4. PostgreSQL インストール ---
echo ""
echo "[4/7] PostgreSQL セットアップ..."
if ! command -v psql &> /dev/null; then
    apt install -y postgresql postgresql-contrib
    systemctl enable postgresql
    systemctl start postgresql
    echo "  ✓ PostgreSQL インストール完了"
else
    echo "  ✓ PostgreSQL は既にインストール済み"
fi

# DB & ユーザー作成（既に存在する場合はスキップ）
echo "  PostgreSQL DB作成中..."
sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='mieru'" | grep -q 1 || \
    sudo -u postgres psql -c "CREATE USER mieru WITH PASSWORD 'CHANGE_THIS_PASSWORD';"
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='mieru_clinic'" | grep -q 1 || \
    sudo -u postgres psql -c "CREATE DATABASE mieru_clinic OWNER mieru;"
echo "  ✓ DB: mieru_clinic / User: mieru 作成完了"
echo ""
echo "  ⚠️  重要: PostgreSQLのパスワードを変更してください！"
echo "     sudo -u postgres psql -c \"ALTER USER mieru WITH PASSWORD 'あなたの強力なパスワード';\""

# --- 5. Nginx 設定（HTTP のみ、SSL は certbot が後で自動追加） ---
echo ""
echo "[5/7] Nginx 設定..."
cat > /etc/nginx/sites-available/mieru-clinic.com << 'NGINX_CONF'
server {
    listen 80;
    listen [::]:80;
    server_name mieru-clinic.com www.mieru-clinic.com;

    # Let's Encrypt 認証用
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    # Next.js アプリへのリバースプロキシ
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 60s;
        proxy_send_timeout 60s;
    }

    # 静的ファイルキャッシュ
    location /_next/static {
        proxy_pass http://127.0.0.1:3000;
        proxy_cache_valid 60m;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}
NGINX_CONF

# シンボリックリンク作成
ln -sf /etc/nginx/sites-available/mieru-clinic.com /etc/nginx/sites-enabled/

# デフォルト設定を無効化
rm -f /etc/nginx/sites-enabled/default

# Nginx 設定テスト
nginx -t
echo "  ✓ Nginx 設定完了"

# --- 6. ファイアウォール設定 ---
echo ""
echo "[6/7] ファイアウォール設定..."
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable
echo "  ✓ UFW 設定完了 (SSH + Nginx許可)"

# --- 7. Nginx 起動 & SSL案内 ---
echo ""
echo "[7/7] Nginx 起動..."
systemctl restart nginx

echo ""
echo "  ✓ Nginx を HTTP で起動しました。"
echo "  SSL証明書を取得するには以下を実行してください："
echo ""
echo "  certbot --nginx -d mieru-clinic.com -d www.mieru-clinic.com"
echo ""
echo "  ※ certbot が Nginx 設定にSSL(HTTPS)を自動追加します"

# --- 完了 ---
echo ""
echo "=========================================="
echo " セットアップ完了！"
echo "=========================================="
echo ""
echo " 次のステップ："
echo "  1. PostgreSQLパスワードを変更"
echo "     sudo -u postgres psql -c \"ALTER USER mieru WITH PASSWORD 'SECURE_PASSWORD';\""
echo ""
echo "  2. アプリをデプロイ"
echo "     cd /var/www/9253"
echo "     git clone <リポジトリURL> ."
echo "     cp .env.example .env"
echo "     # .env を編集してDB接続情報等を設定"
echo "     npm install"
echo "     npx prisma migrate deploy"
echo "     npx prisma db seed"
echo "     npm run build"
echo ""
echo "  3. PM2 でアプリ起動"
echo "     pm2 start npm --name mieru-clinic -- start"
echo "     pm2 save"
echo "     pm2 startup"
echo ""
echo "  4. SSL証明書取得"
echo "     certbot --nginx -d mieru-clinic.com -d www.mieru-clinic.com"
echo ""
echo "  5. 動作確認"
echo "     https://mieru-clinic.com/"
echo ""
