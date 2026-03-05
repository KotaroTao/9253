#!/bin/bash
set -euo pipefail

# PostToolUse hook: ファイル編集後に対象ファイルの lint fix を自動実行
# Edit / Write ツール使用後にトリガーされる

cd "$CLAUDE_PROJECT_DIR"

# ツール入力JSONからファイルパスを取得
FILE_PATH=$(echo "$TOOL_INPUT" | grep -o '"file_path"\s*:\s*"[^"]*"' | head -1 | sed 's/.*: *"//;s/"$//') || true

if [ -z "$FILE_PATH" ]; then
  exit 0
fi

# .ts/.tsx/.js/.jsx ファイルのみ対象
case "$FILE_PATH" in
  *.ts|*.tsx|*.js|*.jsx)
    # 絶対パスからプロジェクト相対パスに正規化
    RELATIVE_PATH="${FILE_PATH#$CLAUDE_PROJECT_DIR/}"

    # プロジェクト外のファイルは除外（正規化後もまだ絶対パスなら外部ファイル）
    if [[ "$RELATIVE_PATH" == /* ]]; then
      exit 0
    fi

    npx next lint --fix --file "$RELATIVE_PATH" 2>/dev/null || true
    ;;
esac

exit 0
