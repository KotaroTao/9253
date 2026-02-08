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

### Phase 0: 基盤構築（Week 1-4）← 次に着手
- [ ] Next.js 15 + TypeScript プロジェクト初期化
- [ ] Prisma + PostgreSQL セットアップ
- [ ] NextAuth.js v5 基本認証（メールログイン）
- [ ] tRPC セットアップ
- [ ] Tailwind CSS + shadcn/ui 導入
- [ ] PM2 設定
- [ ] GitHub Actions CI 設定（Vitest + Playwright）

### Phase 1: MVP（Week 5-16）— 5機能に絞込み
- [ ] アンケートビルダー（歯科テンプレート付き）
- [ ] QRコード生成（PDF/PNG、A4・診察券・卓上POP）
- [ ] 患者用アンケートページ（スマホ最適化、1ページ完結、30秒以内）
- [ ] 全員向けGoogle口コミ導線（アンケート完了後に全員に表示）
- [ ] 管理画面ダッシュボード（回答一覧、基本集計）
- [ ] ホワイトラベル対応（医院ロゴ・カラー）
- [ ] コンプライアンスE2Eテスト
- [ ] → **MVP販売開始（10院パイロット → 14日間無料トライアル）**

### Phase 2: AI・口コミ管理（Week 17-28）
- [ ] AI口コミ下書き支援（GPT-4o-mini）
- [ ] AI返信生成
- [ ] Google口コミ取得（GBP API or 手動インポート）
- [ ] 口コミ分析（感情分析、キーワード分析）
- [ ] RBAC（owner/admin/staff）
- [ ] SMS配信（Twilio）

### Phase 3: 削除支援・MEO（Week 29-40）
- [ ] 口コミ削除判定AI
- [ ] 削除申請ガイド・テンプレート
- [ ] MEO順位計測
- [ ] 月次レポート自動生成
- [ ] 競合分析・低評価アラート
- [ ] Stripe決済連携

### Phase 4: 拡張（Week 41+）
- [ ] LINE連携
- [ ] 多言語対応
- [ ] 電子カルテ連携
- [ ] クラウド移行準備

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
