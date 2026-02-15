# MIERU Clinic - 運用マニュアル

## 自動バックアップ

### 設定概要

| 項目 | 値 |
|------|-----|
| 実行時刻 | 毎日 午前3:00 (crontab) |
| 保存場所 | `~/backups/` |
| 保持期間 | 7日間（自動削除） |
| ログファイル | `~/backups/backup.log` |
| スクリプト（リポジトリ） | `scripts/backup-db.sh` |
| スクリプト（本番） | `/root/backup_mieru.sh` |

### バックアップ内容

| 対象 | 説明 |
|------|------|
| PostgreSQL | `mieru_clinic` DB のカスタムフォーマットダンプ (圧縮レベル9) |
| アップロード画像 | `/var/www/9253/public/uploads` の tar.gz |
| 設定ファイル | `.env`、Git情報（コミットハッシュ、ローカル変更差分） |
| サーバー設定 | Nginx、PM2、crontab、バックアップスクリプト自体 |
| SSL証明書 | `/etc/letsencrypt` の tar.gz |
| PostgreSQL設定 | `pg_hba.conf`、`postgresql.conf` |
| ファイアウォール | UFWルール |

### 本番サーバーでの設置手順

```bash
# 1. スクリプトを本番サーバーにコピー
scp scripts/backup-db.sh root@210.131.223.161:/root/backup_mieru.sh

# 2. 実行権限を付与（パスワード保護のため700）
ssh root@210.131.223.161 "chmod 700 /root/backup_mieru.sh"

# 3. PGPASSWORDを本番の実際のパスワードに書き換え
ssh root@210.131.223.161 "nano /root/backup_mieru.sh"

# 4. バックアップディレクトリ作成
ssh root@210.131.223.161 "mkdir -p ~/backups"

# 5. テスト実行
ssh root@210.131.223.161 "/root/backup_mieru.sh"

# 6. crontab登録（毎日午前3時）
ssh root@210.131.223.161 '(crontab -l 2>/dev/null; echo "0 3 * * * /root/backup_mieru.sh") | crontab -'

# 7. crontab確認
ssh root@210.131.223.161 "crontab -l"
```

> **注意**: スクリプト内の `__PGPASSWORD__` を本番の実際のDBパスワードに必ず書き換えてください。

### バックアップ確認コマンド

```bash
# バックアップ一覧を確認
ssh root@210.131.223.161 "ls -lh ~/backups/*.tar.gz"

# 最新バックアップの中身を確認
ssh root@210.131.223.161 "ls -lh ~/backups/ | tail -5"
```

### バックアップログ確認コマンド

```bash
# ログ全体を確認
ssh root@210.131.223.161 "cat ~/backups/backup.log"

# 最新10行を確認
ssh root@210.131.223.161 "tail -10 ~/backups/backup.log"

# エラーのみ確認
ssh root@210.131.223.161 "grep ERROR ~/backups/backup.log"

# 警告のみ確認
ssh root@210.131.223.161 "grep WARNING ~/backups/backup.log"
```

### 手動バックアップ（スクリプト実行）

```bash
ssh root@210.131.223.161 "/root/backup_mieru.sh"
```

### 手動バックアップ（pg_dump 直接）

```bash
# サーバーにSSH接続
ssh root@210.131.223.161

# pg_dump でバックアップ（カスタムフォーマット、圧縮レベル9）
pg_dump -h localhost -U mieru -d mieru_clinic -F c -Z 9 -f ~/backups/manual_backup.dump

# pg_dump でバックアップ（SQL形式、可読性重視）
pg_dump -h localhost -U mieru -d mieru_clinic > ~/backups/manual_backup.sql
```

### リストアコマンド

```bash
# サーバーにSSH接続
ssh root@210.131.223.161

# カスタムフォーマット (.dump) からリストア
# ※ 既存データを上書きするため、必ず確認してから実行
pg_restore -h localhost -U mieru -d mieru_clinic --clean --if-exists ~/backups/manual_backup.dump

# SQL形式 (.sql) からリストア
psql -h localhost -U mieru -d mieru_clinic < ~/backups/manual_backup.sql

# バックアップアーカイブ (.tar.gz) を展開してからリストア
cd ~/backups
tar -xzf 20250101_030000.tar.gz
pg_restore -h localhost -U mieru -d mieru_clinic --clean --if-exists 20250101_030000/mieru_clinic.dump
```

### crontab設定

```
0 3 * * * /root/backup_mieru.sh
```

毎日午前3時に自動実行。変更する場合:

```bash
ssh root@210.131.223.161 "crontab -e"
```
