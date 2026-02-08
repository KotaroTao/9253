# 医療機関向け口コミ対策ツール（クチコミDoctor）

## プロジェクト概要

株式会社ファンクション・ティが開発する、医療機関（歯科・クリニック・病院）特化のGoogle口コミ対策クラウドSaaS。
独自ドメインでWebサービスとして提供する。既存の約3,000歯科医院リストを持つ。

### 既存資産
- Google口コミ削除解説ページ: https://function-t.com/delete_2025.html
- 口コミ削除判定ツール（ChatGPT GPTs）: https://chatgpt.com/g/g-68849d013b30819184bbc852185546a7
- 約3,000歯科医院のリスト

## 確定した技術的意思決定

### インフラ
- **サーバー**: エックスサーバーVPS
- **Docker不使用**: GitHub + PM2による直接デプロイ（慣れたワークフロー優先）
- **ポート**: localhost:3100（3000〜3010は使用中）
- **リバースプロキシ**: Nginx + Let's Encrypt（SSL）
- **デプロイフロー**: GitHub push → GitHub Actions → VPSにSSHデプロイ（または git pull → npm build → pm2 reload）

### 技術スタック
- **フロントエンド/バックエンド**: Next.js 15 (App Router) + TypeScript
- **API**: tRPC（型安全）
- **ORM**: Prisma
- **データベース**: PostgreSQL 16
- **キャッシュ**: Redis
- **認証**: NextAuth.js v5
- **UI**: Tailwind CSS + shadcn/ui
- **AI**: OpenAI GPT-4o API
- **ジョブキュー**: BullMQ (Redis)
- **メール**: SendGrid
- **SMS**: Twilio
- **プロセス管理**: PM2

### 設計原則
- **Googleポリシー完全準拠**: レビューゲーティング禁止。全患者に等しく口コミを依頼
- **景品表示法遵守**: 口コミの見返りの割引・特典機能は実装しない
- **AI下書きは支援のみ**: 患者が確認・修正するステップを必須とする
- **マルチテナント**: 1アプリで全医院管理（clinic_idで分離）

## ディレクトリ構成

```
/
├── CLAUDE.md                  # このファイル（プロジェクトコンテキスト）
├── DEVELOPMENT_PLAN.md        # 包括的な開発プラン
├── DECISIONS.md               # 技術的意思決定ログ
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── (auth)/            # 認証関連ページ
│   │   ├── (dashboard)/       # 医院管理画面
│   │   ├── (public)/          # 患者用ページ（アンケート等）
│   │   ├── api/               # API Routes
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/                # shadcn/ui コンポーネント
│   │   └── features/          # 機能別コンポーネント
│   ├── server/
│   │   ├── routers/           # tRPC routers
│   │   ├── services/          # ビジネスロジック
│   │   └── db/                # Prisma client
│   ├── lib/                   # ユーティリティ
│   └── types/                 # 型定義
├── prisma/
│   ├── schema.prisma          # DBスキーマ
│   └── migrations/
├── public/
├── .env.example               # 環境変数テンプレート
├── .github/
│   └── workflows/             # GitHub Actions
├── ecosystem.config.js        # PM2設定
├── nginx/                     # Nginx設定例
├── package.json
├── tsconfig.json
└── next.config.ts
```

## 開発フェーズ

### Phase 0: 基盤構築（Week 1-2）← 次に着手
- [ ] Next.js + TypeScript プロジェクト初期化
- [ ] Prisma + PostgreSQL セットアップ
- [ ] NextAuth.js v5 認証基盤
- [ ] tRPC セットアップ
- [ ] Tailwind CSS + shadcn/ui 導入
- [ ] PM2 設定
- [ ] GitHub Actions CI 設定

### Phase 1: MVP（Week 3-8）
- [ ] 管理画面ダッシュボード
- [ ] アンケートビルダー（歯科テンプレート付き）
- [ ] QRコード生成
- [ ] 患者用アンケートページ（レスポンシブ）
- [ ] 全員向けGoogle口コミ導線
- [ ] AI口コミ下書き支援
- [ ] 口コミ一覧・検索
- [ ] AI返信生成
- [ ] 基本口コミ分析
- [ ] ユーザー管理 (RBAC)

### Phase 2: 成長機能（Week 9-16）
- [ ] 口コミ削除判定AI統合
- [ ] 口コミ削除申請ワークフロー
- [ ] MEO順位計測
- [ ] SMS配信
- [ ] 月次レポート自動生成
- [ ] 競合分析
- [ ] 低評価アラート

### Phase 3: 差別化機能（Week 17-24）
- [ ] LINE連携
- [ ] 多言語対応
- [ ] 改善提案AI
- [ ] コンプライアンスチェッカー
- [ ] Stripe決済連携

## コーディング規約

- TypeScript strict mode
- ESLint + Prettier
- コンポーネント: PascalCase
- 関数・変数: camelCase
- DB カラム: snake_case
- コミットメッセージ: 日本語OK、変更内容を簡潔に
- エラーハンドリング: tRPCのエラーハンドリング機構を使用

## 主要コマンド

```bash
npm run dev          # 開発サーバー起動 (port 3100)
npm run build        # 本番ビルド
npm run start        # 本番起動
npm run lint         # ESLint
npx prisma migrate dev    # DBマイグレーション（開発）
npx prisma migrate deploy # DBマイグレーション（本番）
npx prisma studio    # DBブラウザ
pm2 start ecosystem.config.js  # PM2でプロセス起動
```
