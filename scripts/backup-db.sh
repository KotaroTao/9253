#!/bin/bash
# ==============================================================================
# MIERU Clinic - PostgreSQL 総合バックアップスクリプト
# ==============================================================================
#
# 概要:
#   本番サーバー（Xserver VPS / Ubuntu）用の総合バックアップスクリプト。
#   PostgreSQLデータベース、アップロード画像、設定ファイル、サーバー設定を
#   まとめてバックアップし、tar.gzに圧縮して保存する。
#
# 設定:
#   - 保存先: ~/backups/
#   - 保持日数: 7日間（自動削除）
#   - ログ: ~/backups/backup.log
#   - 実行タイミング: crontab で毎日午前3時推奨
#
# 本番サーバーでの設置手順:
#   1. スクリプトを本番サーバーにコピー
#      scp scripts/backup-db.sh root@210.131.223.161:/root/backup_mieru.sh
#
#   2. 実行権限を付与（パスワード保護のため700）
#      ssh root@210.131.223.161 "chmod 700 /root/backup_mieru.sh"
#
#   3. PGPASSWORDを本番の実際のパスワードに書き換え
#      ssh root@210.131.223.161 "nano /root/backup_mieru.sh"
#
#   4. バックアップディレクトリ作成
#      ssh root@210.131.223.161 "mkdir -p ~/backups"
#
#   5. テスト実行
#      ssh root@210.131.223.161 "/root/backup_mieru.sh"
#
#   6. crontab登録（毎日午前3時）
#      ssh root@210.131.223.161 '(crontab -l 2>/dev/null; echo "0 3 * * * /root/backup_mieru.sh") | crontab -'
#
#   7. crontab確認
#      ssh root@210.131.223.161 "crontab -l"
#
# ==============================================================================

# --- 設定 ---
BACKUP_ROOT="$HOME/backups"
LOG="$BACKUP_ROOT/backup.log"
RETENTION_DAYS=7
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="$BACKUP_ROOT/$TIMESTAMP"

# PostgreSQL接続情報
export PGPASSWORD="__PGPASSWORD__"
DB_HOST="localhost"
DB_USER="mieru"
DB_NAME="mieru_clinic"

# アプリケーション情報
APP_DIR="/var/www/9253"
UPLOADS_DIR="$APP_DIR/public/uploads"
NGINX_CONF_NAME="mieru-clinic.com"
BACKUP_SCRIPT_SRC="$HOME/backup_mieru.sh"

# 最小ダンプサイズ（バイト）: これ未満は空とみなす
MIN_DUMP_SIZE=1024

# ディスク空き容量の警告閾値（KB）: 2GB
DISK_WARN_THRESHOLD=$((2 * 1024 * 1024))

# --- 初期化 ---
mkdir -p "$BACKUP_DIR" 2>/dev/null

log_info() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] INFO: $1" >> "$LOG"
}

log_warn() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] WARNING: $1" >> "$LOG"
}

log_error() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1" >> "$LOG"
}

log_info "=== バックアップ開始 ==="

# ==============================================================================
# ステップ1: データベースバックアップ
# ==============================================================================
log_info "Step 1: データベースバックアップ"

DUMP_FILE="$BACKUP_DIR/mieru_clinic.dump"

pg_dump -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -F c -Z 9 -f "$DUMP_FILE" 2>> "$LOG"

if [ $? -ne 0 ]; then
    log_error "pg_dump が失敗しました"
    rm -rf "$BACKUP_DIR" 2>/dev/null
    exit 1
fi

# ダンプファイルのサイズチェック
DUMP_SIZE=$(stat -c%s "$DUMP_FILE" 2>/dev/null || echo "0")
if [ "$DUMP_SIZE" -lt "$MIN_DUMP_SIZE" ]; then
    log_error "ダンプファイルが小さすぎます (${DUMP_SIZE} bytes)。空の可能性があります"
    rm -rf "$BACKUP_DIR" 2>/dev/null
    exit 1
fi

log_info "Step 1 完了: DB dump ${DUMP_SIZE} bytes"

# ==============================================================================
# ステップ2: アップロード画像バックアップ
# ==============================================================================
log_info "Step 2: アップロード画像バックアップ"

UPLOADS_SIZE="N/A"
if [ -d "$UPLOADS_DIR" ]; then
    tar -czf "$BACKUP_DIR/uploads.tar.gz" -C "$APP_DIR/public" uploads 2>> "$LOG"
    if [ $? -eq 0 ]; then
        UPLOADS_SIZE=$(stat -c%s "$BACKUP_DIR/uploads.tar.gz" 2>/dev/null || echo "0")
        log_info "Step 2 完了: uploads ${UPLOADS_SIZE} bytes"
    else
        log_warn "uploads の圧縮に失敗しました"
    fi
else
    log_info "Step 2 スキップ: $UPLOADS_DIR が存在しません"
fi

# ==============================================================================
# ステップ3: 設定ファイル・Git情報バックアップ
# ==============================================================================
log_info "Step 3: 設定ファイル・Git情報バックアップ"

# .env バックアップ
if [ -f "$APP_DIR/.env" ]; then
    cp "$APP_DIR/.env" "$BACKUP_DIR/env_backup" 2>> "$LOG"
    log_info ".env をバックアップしました"
else
    log_warn "$APP_DIR/.env が見つかりません"
fi

# Git情報
if [ -d "$APP_DIR/.git" ]; then
    git -C "$APP_DIR" log --oneline -1 > "$BACKUP_DIR/git_commit.txt" 2>> "$LOG"
    git -C "$APP_DIR" diff > "$BACKUP_DIR/local_changes.patch" 2>> "$LOG"
    log_info "Git情報をバックアップしました"
else
    log_warn "$APP_DIR に .git ディレクトリがありません"
fi

log_info "Step 3 完了"

# ==============================================================================
# ステップ4: サーバー設定バックアップ
# ==============================================================================
log_info "Step 4: サーバー設定バックアップ"

mkdir -p "$BACKUP_DIR/server_config" 2>/dev/null

# Nginx設定
if [ -f "/etc/nginx/sites-available/$NGINX_CONF_NAME" ]; then
    cp "/etc/nginx/sites-available/$NGINX_CONF_NAME" "$BACKUP_DIR/server_config/nginx_sites-available_${NGINX_CONF_NAME}" 2>> "$LOG"
    log_info "Nginx sites-available をバックアップしました"
else
    log_warn "Nginx設定 /etc/nginx/sites-available/$NGINX_CONF_NAME が見つかりません"
fi

if [ -f "/etc/nginx/sites-enabled/$NGINX_CONF_NAME" ]; then
    cp "/etc/nginx/sites-enabled/$NGINX_CONF_NAME" "$BACKUP_DIR/server_config/nginx_sites-enabled_${NGINX_CONF_NAME}" 2>> "$LOG"
    log_info "Nginx sites-enabled をバックアップしました"
elif [ -L "/etc/nginx/sites-enabled/$NGINX_CONF_NAME" ]; then
    cp -L "/etc/nginx/sites-enabled/$NGINX_CONF_NAME" "$BACKUP_DIR/server_config/nginx_sites-enabled_${NGINX_CONF_NAME}" 2>> "$LOG"
    log_info "Nginx sites-enabled (symlink) をバックアップしました"
else
    log_warn "Nginx設定 /etc/nginx/sites-enabled/$NGINX_CONF_NAME が見つかりません"
fi

# PM2設定
pm2 save 2>> "$LOG"
if [ -f "$HOME/.pm2/dump.pm2" ]; then
    cp "$HOME/.pm2/dump.pm2" "$BACKUP_DIR/server_config/pm2_dump.pm2" 2>> "$LOG"
    log_info "PM2設定をバックアップしました"
else
    log_warn "PM2 dump ファイルが見つかりません"
fi

# バックアップスクリプト自体
if [ -f "$BACKUP_SCRIPT_SRC" ]; then
    cp "$BACKUP_SCRIPT_SRC" "$BACKUP_DIR/server_config/backup_mieru.sh" 2>> "$LOG"
    log_info "バックアップスクリプトをバックアップしました"
else
    log_warn "バックアップスクリプト $BACKUP_SCRIPT_SRC が見つかりません"
fi

log_info "Step 4 完了"

# ==============================================================================
# ステップ5: SSL証明書バックアップ
# ==============================================================================
log_info "Step 5: SSL証明書バックアップ"

if [ -d "/etc/letsencrypt" ]; then
    mkdir -p "$BACKUP_DIR/ssl" 2>/dev/null
    tar -czf "$BACKUP_DIR/ssl/letsencrypt.tar.gz" -C /etc letsencrypt 2>> "$LOG"
    if [ $? -eq 0 ]; then
        log_info "SSL証明書をバックアップしました"
    else
        log_warn "SSL証明書の圧縮に失敗しました"
    fi
else
    log_info "Step 5 スキップ: /etc/letsencrypt が存在しません"
fi

log_info "Step 5 完了"

# ==============================================================================
# ステップ6: crontabバックアップ
# ==============================================================================
log_info "Step 6: crontabバックアップ"

crontab -l > "$BACKUP_DIR/server_config/crontab.txt" 2>/dev/null
if [ $? -eq 0 ]; then
    log_info "crontab をバックアップしました"
else
    log_warn "crontab の取得に失敗しました（未設定の可能性）"
fi

log_info "Step 6 完了"

# ==============================================================================
# ステップ7: PostgreSQL設定バックアップ
# ==============================================================================
log_info "Step 7: PostgreSQL設定バックアップ"

mkdir -p "$BACKUP_DIR/server_config/postgresql" 2>/dev/null

if [ -d "/etc/postgresql" ]; then
    # pg_hba.conf を探してコピー
    PG_HBA=$(find /etc/postgresql -name "pg_hba.conf" -type f 2>/dev/null | head -1)
    if [ -n "$PG_HBA" ]; then
        cp "$PG_HBA" "$BACKUP_DIR/server_config/postgresql/pg_hba.conf" 2>> "$LOG"
        log_info "pg_hba.conf をバックアップしました: $PG_HBA"
    else
        log_warn "pg_hba.conf が見つかりません"
    fi

    # postgresql.conf を探してコピー
    PG_CONF=$(find /etc/postgresql -name "postgresql.conf" -type f 2>/dev/null | head -1)
    if [ -n "$PG_CONF" ]; then
        cp "$PG_CONF" "$BACKUP_DIR/server_config/postgresql/postgresql.conf" 2>> "$LOG"
        log_info "postgresql.conf をバックアップしました: $PG_CONF"
    else
        log_warn "postgresql.conf が見つかりません"
    fi
else
    log_warn "/etc/postgresql ディレクトリが存在しません"
fi

log_info "Step 7 完了"

# ==============================================================================
# ステップ8: ファイアウォール設定バックアップ
# ==============================================================================
log_info "Step 8: ファイアウォール設定バックアップ"

if command -v ufw > /dev/null 2>&1; then
    ufw status verbose > "$BACKUP_DIR/server_config/ufw_rules.txt" 2>> "$LOG"
    log_info "UFW設定をバックアップしました"
else
    log_info "Step 8 スキップ: ufw がインストールされていません"
fi

log_info "Step 8 完了"

# ==============================================================================
# ステップ9: サイズ計測
# ==============================================================================
log_info "Step 9: サイズ計測"

# DB dumpサイズ（人間が読める形式）
DB_SIZE_HR=$(du -h "$DUMP_FILE" 2>/dev/null | cut -f1)

# uploadsサイズ（人間が読める形式）
if [ -f "$BACKUP_DIR/uploads.tar.gz" ]; then
    UPLOADS_SIZE_HR=$(du -h "$BACKUP_DIR/uploads.tar.gz" 2>/dev/null | cut -f1)
else
    UPLOADS_SIZE_HR="N/A"
fi

log_info "Step 9 完了: DB=${DB_SIZE_HR}, Uploads=${UPLOADS_SIZE_HR}"

# ==============================================================================
# ステップ10: 圧縮・クリーンアップ
# ==============================================================================
log_info "Step 10: 圧縮・クリーンアップ"

# 日時ディレクトリをtar.gzに圧縮
ARCHIVE_FILE="$BACKUP_ROOT/${TIMESTAMP}.tar.gz"
tar -czf "$ARCHIVE_FILE" -C "$BACKUP_ROOT" "$TIMESTAMP" 2>> "$LOG"

if [ $? -eq 0 ]; then
    rm -rf "$BACKUP_DIR" 2>/dev/null
    ARCHIVE_SIZE_HR=$(du -h "$ARCHIVE_FILE" 2>/dev/null | cut -f1)
    log_info "圧縮完了: ${ARCHIVE_FILE} (${ARCHIVE_SIZE_HR})"
else
    log_error "圧縮に失敗しました。元ディレクトリを残します: $BACKUP_DIR"
fi

# 古いバックアップを削除
DELETED_COUNT=0
for OLD_FILE in $(find "$BACKUP_ROOT" -name "*.tar.gz" -type f -mtime +${RETENTION_DAYS} 2>/dev/null); do
    rm -f "$OLD_FILE" 2>> "$LOG"
    DELETED_COUNT=$((DELETED_COUNT + 1))
    log_info "古いバックアップを削除: $OLD_FILE"
done

if [ "$DELETED_COUNT" -gt 0 ]; then
    log_info "${DELETED_COUNT}件の古いバックアップを削除しました"
fi

log_info "Step 10 完了"

# ==============================================================================
# ステップ11: ディスク容量チェック＋ログ出力
# ==============================================================================
log_info "Step 11: ディスク容量チェック"

# /root の空き容量を取得（KB単位）
AVAILABLE_KB=$(df "$HOME" 2>/dev/null | tail -1 | awk '{print $4}')

if [ -n "$AVAILABLE_KB" ] && [ "$AVAILABLE_KB" -lt "$DISK_WARN_THRESHOLD" ] 2>/dev/null; then
    AVAILABLE_HR=$(df -h "$HOME" 2>/dev/null | tail -1 | awk '{print $4}')
    log_warn "ディスク空き容量が少なくなっています: ${AVAILABLE_HR} (閾値: 2GB)"
fi

# 完了ログ
log_info "OK: Backup completed (DB: ${DB_SIZE_HR}, Uploads: ${UPLOADS_SIZE_HR})"
log_info "=== バックアップ完了 ==="

# PGPASSWORDをクリア
unset PGPASSWORD

exit 0
