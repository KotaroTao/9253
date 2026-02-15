#!/bin/bash
set -euo pipefail

# Only run in remote (Claude Code on the web) environment
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR"

# Install Node.js dependencies (uses cache on subsequent runs)
npm install

# Prisma client generation (postinstall handles this, but ensure it's done)
npx prisma generate
