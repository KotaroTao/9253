# 新規アプリ セットアッププロンプト（Claude Code + GitHub + GCP）

以下のプロンプトをClaude Codeに投げることで、MIERU Clinicと同じ技術構成のプロジェクトを新規作成できます。
`{{...}}` の部分をあなたのプロジェクトに合わせて書き換えてください。

---

## プロンプト

```
以下の技術構成で新規Webアプリケーションのプロジェクトを作成してください。

## プロジェクト情報
- サービス名: {{サービス名（例: MyApp）}}
- 目的: {{アプリの目的（例: 社内タスク管理ツール）}}
- ドメイン: {{ドメイン（例: myapp.example.com）}}
- 本番環境: Google Cloud Run（asia-northeast1）
- 言語: {{日本語 or 英語}}

## 技術スタック
- Next.js 14+（App Router, standalone output）
- TypeScript（strict mode）
- Tailwind CSS + shadcn/ui
- Prisma + PostgreSQL（Cloud SQL）
- Auth.js v5（JWT戦略、Credentials Provider）
- Zod（バリデーション）
- Vitest（テスト）
- date-fns（日付処理）

## 1. プロジェクト初期化

以下を順番に実行してください:

```bash
npx create-next-app@latest {{プロジェクト名}} --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd {{プロジェクト名}}
```

## 2. 依存パッケージのインストール

```bash
# 本番依存
npm install @prisma/client next-auth@5.0.0-beta.30 @auth/prisma-adapter zod bcryptjs date-fns server-only

# 開発依存
npm install -D prisma vitest @types/bcryptjs prettier eslint-config-prettier tsx
```

## 3. shadcn/ui セットアップ

```bash
npx shadcn@latest init
```

設定:
- Style: Default
- Base color: Slate
- CSS variables: Yes

基本コンポーネントをインストール:
```bash
npx shadcn@latest add button card input label dialog select toast
```

## 4. 設定ファイル

### next.config.js
```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
```

### tsconfig.json（追記・確認）
```json
{
  "compilerOptions": {
    "strict": true,
    "noEmit": true,
    "paths": { "@/*": ["./src/*"] }
  }
}
```

### .prettierrc.json
```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "endOfLine": "lf"
}
```

### .eslintrc.json
```json
{
  "extends": ["next/core-web-vitals", "prettier"],
  "rules": {
    "no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
    "no-eval": "error",
    "no-var": "error",
    "eqeqeq": "error"
  }
}
```

### vitest.config.ts
```ts
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

## 5. package.json scripts（追加）

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "typecheck": "tsc --noEmit",
    "validate": "npm run typecheck && npm run lint",
    "test": "vitest run",
    "test:watch": "vitest",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:seed": "npx tsx prisma/seed.ts",
    "db:studio": "prisma studio",
    "postinstall": "prisma generate"
  }
}
```

## 6. Prisma セットアップ

```bash
npx prisma init
```

### prisma/schema.prisma（雛形）
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String   @id @default(uuid())
  email         String   @unique
  passwordHash  String   @map("password_hash")
  name          String?
  role          String   @default("user")
  isActive      Boolean  @default(true) @map("is_active")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  @@map("users")
}
```

### src/lib/prisma.ts
```ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

## 7. Auth.js v5 セットアップ

### src/auth.config.ts
```ts
import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  pages: { signIn: '/login' },
  session: { strategy: 'jwt' as const },
  trustHost: true,
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isPublicPage = ['/login', '/register'].includes(nextUrl.pathname);
      if (!isPublicPage && !isLoggedIn) return false;
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
```

### src/auth.ts
```ts
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { authConfig } from './auth.config';
import { prisma } from '@/lib/prisma';

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        const { email, password } = credentials as { email: string; password: string };
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.isActive) return null;
        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;
        return { id: user.id, email: user.email, name: user.name, role: user.role };
      },
    }),
  ],
});
```

### src/app/api/auth/[...nextauth]/route.ts
```ts
import { handlers } from '@/auth';
export const { GET, POST } = handlers;
```

### src/middleware.ts
```ts
import NextAuth from 'next-auth';
import { authConfig } from './auth.config';

export default NextAuth(authConfig).auth;

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

## 8. ディレクトリ構成

以下のディレクトリとファイルを作成:

```
src/
├── app/
│   ├── (auth)/login/page.tsx       # ログインページ
│   ├── (auth)/register/page.tsx    # 登録ページ
│   ├── (dashboard)/dashboard/
│   │   ├── layout.tsx              # 認証済みレイアウト
│   │   └── page.tsx                # ダッシュボードトップ
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts
│   │   └── health/route.ts         # ヘルスチェック
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── ui/                         # shadcn/ui
│   └── layout/                     # ヘッダー、サイドバー等
├── lib/
│   ├── prisma.ts
│   ├── constants.ts
│   ├── messages.ts                 # UIテキスト集約
│   └── validations/                # Zodスキーマ
├── types/
│   ├── index.ts
│   └── next-auth.d.ts              # Auth.js型拡張
```

### src/app/api/health/route.ts
```ts
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ status: 'ok', timestamp: new Date().toISOString() });
}
```

## 9. .env.example

```
DATABASE_URL="postgresql://user:password@localhost:5432/{{db名}}"
AUTH_SECRET="openssl-rand-base64-32-で生成"
AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## 10. Docker（Cloud Run用）

### Dockerfile
```dockerfile
# ステージ1: 依存関係
FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache openssl
COPY package.json package-lock.json ./
COPY prisma ./prisma/
RUN npm ci
RUN npx prisma generate

# ステージ2: ビルド
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npm run build

# ステージ3: 本番
FROM node:20-alpine AS runner
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN apk add --no-cache openssl
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=deps /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=deps /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=deps /app/node_modules/prisma ./node_modules/prisma
COPY deploy/docker-entrypoint.sh ./docker-entrypoint.sh
USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENTRYPOINT ["sh", "docker-entrypoint.sh"]
```

### deploy/docker-entrypoint.sh
```bash
#!/bin/sh
set -e

echo "=== {{サービス名}} 起動 ==="

if [ "${RUN_MIGRATIONS}" = "true" ]; then
  echo "[1/2] Prismaスキーマ同期..."
  MAX_RETRIES=5
  RETRY_DELAY=5
  for i in $(seq 1 $MAX_RETRIES); do
    if node node_modules/prisma/build/index.js db push --skip-generate --accept-data-loss; then
      echo "  スキーマ同期完了"
      break
    fi
    if [ $i -eq $MAX_RETRIES ]; then
      echo "  マイグレーション失敗"
      break
    fi
    echo "  リトライ ${i}/${MAX_RETRIES}..."
    sleep $RETRY_DELAY
  done
else
  echo "[1/2] マイグレーションスキップ"
fi

echo "[2/2] Next.js起動..."
exec node server.js
```

### .dockerignore
```
node_modules
.next
.git
.env
.env.local
*.md
```

## 11. GitHub Actions（Cloud Runデプロイ）

### .github/workflows/deploy.yml
```yaml
name: Deploy to Cloud Run

on:
  push:
    branches: [main]

env:
  GCP_PROJECT_ID: ${{ secrets.GCP_PROJECT_ID }}
  GCP_REGION: ${{ secrets.GCP_REGION }}
  SERVICE_NAME: {{サービス名（小文字ハイフン区切り）}}
  REPOSITORY: {{サービス名（小文字ハイフン区切り）}}

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: GCP認証
        uses: google-github-actions/auth@v2
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}

      - name: gcloud セットアップ
        uses: google-github-actions/setup-gcloud@v2
        with:
          project_id: ${{ env.GCP_PROJECT_ID }}

      - name: Docker認証
        run: gcloud auth configure-docker ${{ env.GCP_REGION }}-docker.pkg.dev --quiet

      - name: ビルド & プッシュ
        run: |
          IMAGE="${{ env.GCP_REGION }}-docker.pkg.dev/${{ env.GCP_PROJECT_ID }}/${{ env.REPOSITORY }}/${{ env.SERVICE_NAME }}:${{ github.sha }}"
          docker build -t "$IMAGE" .
          docker push "$IMAGE"

      - name: Cloud Runデプロイ
        run: |
          IMAGE="${{ env.GCP_REGION }}-docker.pkg.dev/${{ env.GCP_PROJECT_ID }}/${{ env.REPOSITORY }}/${{ env.SERVICE_NAME }}:${{ github.sha }}"
          gcloud run deploy ${{ env.SERVICE_NAME }} \
            --image "$IMAGE" \
            --region ${{ env.GCP_REGION }} \
            --platform managed \
            --allow-unauthenticated \
            --port 3000 \
            --memory 512Mi \
            --cpu 1 \
            --min-instances 0 \
            --max-instances 3 \
            --service-account "cloud-run-{{サービス名}}@${{ env.GCP_PROJECT_ID }}.iam.gserviceaccount.com" \
            --add-cloudsql-instances ${{ secrets.CLOUD_SQL_CONNECTION }} \
            --network "default" \
            --subnet "default" \
            --vpc-egress "private-ranges-only" \
            --set-env-vars "NODE_ENV=production" \
            --set-env-vars "DATABASE_URL=${{ secrets.DATABASE_URL }}" \
            --set-env-vars "AUTH_SECRET=${{ secrets.AUTH_SECRET }}" \
            --set-env-vars "AUTH_URL=https://{{ドメイン}}" \
            --set-env-vars "NEXT_PUBLIC_APP_URL=https://{{ドメイン}}" \
            --set-env-vars "RUN_MIGRATIONS=true"

      - name: ヘルスチェック
        run: |
          URL=$(gcloud run services describe ${{ env.SERVICE_NAME }} \
            --region ${{ env.GCP_REGION }} \
            --format 'value(status.url)')
          for i in 1 2 3 4 5; do
            STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$URL/api/health" --max-time 10) || true
            if [ "$STATUS" = "200" ]; then
              echo "ヘルスチェック成功"
              exit 0
            fi
            echo "待機中... (attempt $i)"
            sleep 10
          done
          echo "ヘルスチェック失敗"
          exit 1
```

## 12. GCP環境構築スクリプト

### deploy/gcp-setup.sh
```bash
#!/bin/bash
set -e

PROJECT_ID="{{GCPプロジェクトID}}"
REGION="asia-northeast1"
SQL_INSTANCE="{{サービス名}}-db"
DB_NAME="{{DB名}}"
DB_USER="{{DBユーザー名}}"
DB_PASSWORD="${DB_PASSWORD:-$(openssl rand -base64 24)}"
SERVICE_NAME="{{サービス名}}"
REPO_NAME="{{サービス名}}"
SA_NAME="github-actions"
SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
CLOUD_RUN_SA_NAME="cloud-run-{{サービス名}}"
CLOUD_RUN_SA_EMAIL="${CLOUD_RUN_SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

echo "GCP環境構築開始: ${PROJECT_ID}"

gcloud config set project "${PROJECT_ID}"

# API有効化
gcloud services enable \
  run.googleapis.com \
  sqladmin.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  secretmanager.googleapis.com \
  compute.googleapis.com

# Artifact Registry
gcloud artifacts repositories create "${REPO_NAME}" \
  --repository-format=docker \
  --location="${REGION}" \
  || echo "(既に存在)"

# Cloud SQL
gcloud sql instances create "${SQL_INSTANCE}" \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region="${REGION}" \
  --storage-type=SSD \
  --storage-size=10GB \
  --storage-auto-increase \
  --availability-type=zonal \
  || echo "(既に存在)"

gcloud sql databases create "${DB_NAME}" --instance="${SQL_INSTANCE}" || echo "(既に存在)"
gcloud sql users create "${DB_USER}" --instance="${SQL_INSTANCE}" --password="${DB_PASSWORD}" || echo "(既に存在)"

# Cloud Run用SA
gcloud iam service-accounts create "${CLOUD_RUN_SA_NAME}" \
  --display-name="Cloud Run ${SERVICE_NAME}" || echo "(既に存在)"

gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
  --member="serviceAccount:${CLOUD_RUN_SA_EMAIL}" \
  --role="roles/cloudsql.client" --quiet

# GitHub Actions用SA
gcloud iam service-accounts create "${SA_NAME}" \
  --display-name="GitHub Actions Deploy" || echo "(既に存在)"

for ROLE in roles/run.admin roles/artifactregistry.writer roles/cloudbuild.builds.editor roles/iam.serviceAccountUser roles/cloudsql.client; do
  gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
    --member="serviceAccount:${SA_EMAIL}" --role="${ROLE}" --quiet
done

# SAキー生成
KEY_FILE="${HOME}/github-actions-key.json"
gcloud iam service-accounts keys create "${KEY_FILE}" --iam-account="${SA_EMAIL}"

CONNECTION_NAME=$(gcloud sql instances describe "${SQL_INSTANCE}" --format='value(connectionName)')
DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@localhost:5432/${DB_NAME}?host=/cloudsql/${CONNECTION_NAME}"
AUTH_SECRET=$(openssl rand -base64 32)

echo ""
echo "===== GitHub Secretsに登録 ====="
echo "GCP_PROJECT_ID:       ${PROJECT_ID}"
echo "GCP_REGION:           ${REGION}"
echo "GCP_SA_KEY:           ${KEY_FILE} の内容"
echo "DATABASE_URL:         ${DATABASE_URL}"
echo "AUTH_SECRET:          ${AUTH_SECRET}"
echo "CLOUD_SQL_CONNECTION: ${CONNECTION_NAME}"
```

## 13. Claude Code設定

### CLAUDE.md
```markdown
# {{サービス名}} - プロジェクトルール

## プロジェクト概要
- サービス名: {{サービス名}}
- 目的: {{目的}}
- 本番環境: Google Cloud Run（asia-northeast1）

## 技術スタック
Next.js 14+ (App Router) / TypeScript / Tailwind CSS + shadcn/ui / Prisma + PostgreSQL / Auth.js v5 (JWT) / Zod / Vitest / date-fns

## ディレクトリ構成
src/
├── app/           # ページ・API
├── components/    # UIコンポーネント（ui/, layout/）
├── lib/           # ユーティリティ（prisma.ts, constants.ts, validations/）
└── types/         # 型定義

## コーディング規約
- TypeScript 厳格モード
- UIテキスト: src/lib/messages.ts に集約
- API: NextResponse.json()。エラーは { error: "メッセージ" }
- コンポーネント: サーバーコンポーネント優先、"use client" は最小限
- 認証ガード: 全API Routeで auth() チェック（/api/health等は例外）

## 開発ワークフロー
npm run validate     # typecheck + lint（変更後は必ず実行）
npm test             # ユニットテスト
npm run db:push      # スキーマをDBに反映
npx prisma generate  # Prismaクライアント再生成
```

### .claude/settings.json
```json
{
  "permissions": {
    "allow": [
      "Bash(npm run lint)",
      "Bash(npm run lint:fix)",
      "Bash(npm run typecheck)",
      "Bash(npm run validate)",
      "Bash(npm run build)",
      "Bash(npx tsc --noEmit*)",
      "Bash(npx next lint*)",
      "Bash(npx prisma generate)",
      "Bash(npx prisma format)",
      "Bash(npx prisma db push*)",
      "Bash(npx prisma migrate*)",
      "Bash(npm run db:push)",
      "Bash(npm run db:seed)",
      "Bash(npm run db:migrate*)",
      "Bash(npm test*)",
      "Bash(git status*)",
      "Bash(git log*)",
      "Bash(git diff*)",
      "Bash(git branch*)",
      "Bash(git add *)",
      "Bash(git commit*)",
      "Bash(git push*)",
      "Bash(git fetch*)",
      "Bash(git pull*)",
      "Bash(git checkout*)",
      "Bash(git stash*)",
      "Bash(git merge*)",
      "Bash(git rebase*)",
      "Bash(git remote*)",
      "Bash(git show*)",
      "Bash(git rev-parse*)"
    ]
  },
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/session-start.sh"
          }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Bash(git commit*)",
        "hooks": [
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/pre-commit-validate.sh"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/post-edit-lint-fix.sh"
          }
        ]
      }
    ]
  }
}
```

### .claude/hooks/session-start.sh
```bash
#!/bin/bash
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR"

npm install
npx prisma generate

SUMMARY_FILE="$CLAUDE_PROJECT_DIR/.claude/dev-context.md"

{
  echo "# 開発コンテキスト（自動生成: $(date '+%Y-%m-%d %H:%M')）"
  echo ""
  echo "## ブランチ"
  CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || echo "detached")
  echo "- 現在: \`${CURRENT_BRANCH}\`"
  if git rev-parse --verify origin/main >/dev/null 2>&1; then
    BASE_REF="origin/main"
  elif git rev-parse --verify main >/dev/null 2>&1; then
    BASE_REF="main"
  else
    BASE_REF=""
  fi
  if [ -n "$BASE_REF" ] && [ "$CURRENT_BRANCH" != "main" ] && [ "$CURRENT_BRANCH" != "detached" ]; then
    AHEAD=$(git rev-list --count "${BASE_REF}..HEAD" 2>/dev/null || echo "?")
    BEHIND=$(git rev-list --count "HEAD..${BASE_REF}" 2>/dev/null || echo "?")
    echo "- ${BASE_REF}に対して: ${AHEAD}コミット先行 / ${BEHIND}コミット後方"
  fi
  echo ""

  echo "## 未コミットの変更"
  STAGED=$(git diff --cached --stat 2>/dev/null)
  UNSTAGED=$(git diff --stat 2>/dev/null)
  UNTRACKED=$(git ls-files --others --exclude-standard 2>/dev/null | head -20)
  if [ -z "$STAGED" ] && [ -z "$UNSTAGED" ] && [ -z "$UNTRACKED" ]; then
    echo "なし"
  else
    [ -n "$STAGED" ] && echo '```' && echo "$STAGED" && echo '```'
    [ -n "$UNSTAGED" ] && echo '```' && echo "$UNSTAGED" && echo '```'
    [ -n "$UNTRACKED" ] && echo '```' && echo "$UNTRACKED" && echo '```'
  fi
  echo ""

  echo "## コード品質"
  TS_ERRORS=$(npx tsc --noEmit 2>&1 | grep -c "error TS" || true)
  [ "$TS_ERRORS" -gt 0 ] 2>/dev/null && echo "- TypeScript: **${TS_ERRORS}件のエラー**" || echo "- TypeScript: エラーなし"
  echo ""

  echo "## 直近コミット（10件）"
  echo '```'
  git log --oneline -10 2>/dev/null || echo "(取得失敗)"
  echo '```'
} > "$SUMMARY_FILE" 2>/dev/null || true

echo "dev-context.md generated"
```

### .claude/hooks/pre-commit-validate.sh
```bash
#!/bin/bash
set -euo pipefail
cd "$CLAUDE_PROJECT_DIR"

echo "--- コミット前検証: typecheck + lint ---"

if ! npx tsc --noEmit 2>&1; then
  echo "BLOCKED: TypeScript型エラーがあります。修正してから再度コミットしてください。"
  exit 2
fi

if ! npx next lint 2>&1; then
  echo "BLOCKED: ESLintエラーがあります。修正してから再度コミットしてください。"
  exit 2
fi

echo "--- 検証OK ---"
exit 0
```

### .claude/hooks/post-edit-lint-fix.sh
```bash
#!/bin/bash
set -euo pipefail
cd "$CLAUDE_PROJECT_DIR"

FILE_PATH=$(echo "$TOOL_INPUT" | grep -o '"file_path"\s*:\s*"[^"]*"' | head -1 | sed 's/.*: *"//;s/"$//') || true

if [ -z "$FILE_PATH" ]; then
  exit 0
fi

case "$FILE_PATH" in
  *.ts|*.tsx|*.js|*.jsx)
    RELATIVE_PATH="${FILE_PATH#$CLAUDE_PROJECT_DIR/}"
    if [[ "$RELATIVE_PATH" == /* ]]; then
      exit 0
    fi
    npx next lint --fix --file "$RELATIVE_PATH" 2>/dev/null || true
    ;;
esac

exit 0
```

## 14. .gitignore

```
node_modules/
.next/
.env
.env.local
.env.production
*.tsbuildinfo
.claude/dev-context.md
```

## 15. 最終確認

全てのファイルを作成した後、以下を実行して正常に動作することを確認してください:

1. `npm install`
2. `npx prisma generate`
3. `npm run validate` （TypeScript + ESLint エラーなし）
4. `npm run build` （ビルド成功）
5. Git初期コミット

以上で、Claude Code + GitHub + GCP（Cloud Run）構成のプロジェクトが完成します。
```
