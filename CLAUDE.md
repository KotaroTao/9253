# MIERU Clinic - プロジェクトルール

## プロジェクト概要
- **サービス名**: MIERU Clinic（ミエル クリニック）
- **目的**: 医療機関専用 患者体験改善プラットフォーム（MVP完成済み、Phase 1Z ポリッシュ継続中）
- **開発主体**: 株式会社ファンクション・ティ
- **ドメイン**: mieru-clinic.com
- **本番環境**: Google Cloud Run（asia-northeast1）

## ポジショニング（重要）
- **主軸は「患者体験改善」** — 口コミ獲得ツールではない
- **口コミ誘導は非搭載**（意図的）。LINE誘導はオプション。詳細は `docs/design-decisions.md`
- KPI: 患者満足度スコア（primary）、アンケート回答率（secondary）

## 技術スタック
Next.js 14+ (App Router) / TypeScript / Tailwind CSS + shadcn/ui / Prisma + PostgreSQL / Auth.js v5 (JWT) / Zod / Recharts / date-fns

## ディレクトリ構成
```
src/
├── app/           # ページ・API（(auth), (survey), (kiosk), (dashboard), (admin), api/）
├── components/    # UI（ui/, layout/, survey/, dashboard/, admin/, staff/, settings/, landing/）
├── lib/           # ユーティリティ（messages.ts, constants.ts, queries/, services/, validations/）
└── types/         # 型定義
```

## DB設計（9テーブル）
Clinic, Staff, User, SurveyTemplate, SurveyResponse, ImprovementAction, ImprovementActionLog, MonthlyClinicMetrics, PlatformSetting
- Clinic.settings: JSONB（dailyGoal、regularClosedDays、closedDates、postSurveyAction、lineUrl、clinicHomepageUrl等）
- SurveyResponse: answers/patientAttributes: JSONB、overallScore、freeText、ipHash、staffId（nullable）

## ロール
| ロール | アクセス範囲 |
|--------|-------------|
| system_admin | /admin/* + /dashboard/*（オペレーターモードで任意クリニック操作） |
| clinic_admin | /dashboard/* 自クリニックのみ |
| staff | ダッシュボード（ホームのみ） |

## コーディング規約
- TypeScript 厳格モード
- UIテキスト: 全て日本語、`src/lib/messages.ts` に集約
- API: `NextResponse.json()`。エラーは `{ error: "日本語メッセージ" }`
- DB: モデル名 PascalCase、テーブル/カラム名 `@@map` で snake_case
- コンポーネント: サーバーコンポーネント優先、"use client" は最小限
- 認証ガード: 全 API Route で `auth()` チェック（`/api/surveys/submit` のみ例外）

## 開発ワークフロー
```bash
npm run validate     # typecheck + lint 一括実行（変更後は必ず実行）
npm test             # ユニットテスト（vitest run）
npm run db:push      # スキーマをDBに反映
npx prisma generate  # Prismaクライアント再生成（スキーマ変更後）
```

### 開発の進め方
1. コード変更後 → `npm run validate`
2. DBスキーマ変更時 → `npx prisma generate` → `npm run typecheck`
3. API変更時 → `auth()` ガードを忘れずに
4. テキスト追加時 → `src/lib/messages.ts` に集約
5. 新セッション開始後は `.claude/dev-context.md` を読んで状況把握

## 法令遵守（絶対要件）
- 個人情報非収集（IPはSHA-256ハッシュのみ）、医療広告ガイドライン準拠、アンケートは匿名・任意

## 言語と話し方
- 日本語で回答する
- ユーザーはプログラミング超初心者
- 専門用語は初出時にプログラミング超初心者でも分かりやすいたとえを用いて説明（コミット→ゲームのセーブポイント）

## ツール実行時の許可ルール
- ツール実行（Bash、ファイル操作など）の許可を求めるときは、必ず日本語で説明・確認を行うこと
- 許可を求める際、以下のセキュリティリスクをパーセンテージ(%)で提示すること
  - パスワードや秘密鍵が外に漏れる可能性
  - 外部サーバーにデータが送られる可能性
  - 悪意あるコードが勝手に動く可能性
  - PCの設定が書き換わる可能性

## 作業後
- 何を変更したかをプログラミング超初心者でも分かりやすいたとえを用いて説明

## 関連ドキュメント
- `docs/architecture.md` — 実装済み機能一覧、ゲーミフィケーション、dailyGoal算出ロジック、分析機能詳細
- `docs/design-decisions.md` — 設計判断の記録（口コミ非搭載の理由、LINE誘導の設計等）
- `docs/operations.md` — デプロイ、本番DB操作手順、デモデータ
- `docs/research-protocol.md` — 研究計画書ドラフト
- `docs/strategy-and-pricing-proposal.md` — 価格提案
- `docs/market-value-enhancement-proposal.md` — 市場価値向上提案書
- `docs/competitive-analysis.md` — 競合調査レポート
