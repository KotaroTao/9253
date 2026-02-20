# MIERU Clinic - プロジェクトルール

## プロジェクト概要
- **サービス名**: MIERU Clinic（ミエル クリニック）
- **目的**: 医療機関専用 患者体験改善プラットフォーム
- **開発主体**: 株式会社ファンクション・ティ
- **ドメイン**: mieru-clinic.com（取得済み）
- **本番環境**: Google Cloud Run（asia-northeast1）

## ポジショニング（重要）
- **主軸は「患者体験改善」**であり、口コミ獲得ツールではない
- **口コミ導線は非搭載** — 患者への口コミ依頼・誘導機能は意図的に搭載していない
- KPI: 患者満足度スコア（primary）、アンケート回答率（secondary）

## 現在の実装状況（MVP完成済み・Phase 1Z ポリッシュ継続中）

認証、患者アンケートフロー、キオスクモード、スタッフ/管理者ダッシュボード、満足度レポート（期間セレクタ+属性フィルタ5軸）、スタッフ管理、経営レポート、回答一覧、改善アクション管理、ヒント、運営モード、PX-Valueランキング、システム管理、ランディングページ、販促戦略共有ページ(`/strategy`)、研究計画書Webページ(`/research-protocol`) — すべて実装済み。

## 開発ワークフロー

### 検証コマンド（変更後は必ず実行）
```bash
npm run validate     # typecheck + lint 一括実行（推奨）
npm run build        # 本番ビルド確認
```

### DB操作
```bash
npm run db:push      # スキーマをDBに反映（prisma db push）
npm run db:seed      # デモデータ投入（npx tsx prisma/seed.ts）
npm run db:migrate   # マイグレーション作成（prisma migrate dev）
npx prisma generate  # Prismaクライアント再生成（スキーマ変更後）
```

### 開発の進め方
1. コード変更後 → `npm run validate` で型エラー・lint違反がないか確認
2. DBスキーマ変更時 → `npx prisma generate` → `npm run typecheck`
3. UI変更時 → サーバーコンポーネント優先、"use client" は最小限
4. API変更時 → `auth()` ガードを忘れずに（`/api/surveys/submit` のみ例外）
5. テキスト追加時 → `src/lib/messages.ts` に日本語テキストを集約

### セッション開始時の自動コンテキスト復元
SessionStartフック（`.claude/hooks/session-start.sh`）が `npm install` + `prisma generate` + `.claude/dev-context.md` 自動生成を実行。
**新セッション開始後は `.claude/dev-context.md` を読んで状況を把握してから作業を開始すること。**

## 技術スタック
- **フレームワーク**: Next.js 14+ (App Router) + TypeScript
- **UI**: Tailwind CSS + shadcn/ui
- **ORM**: Prisma + PostgreSQL
- **認証**: Auth.js v5 (Credentials Provider, JWT)
- **バリデーション**: Zod
- **チャート**: Recharts
- **日付**: date-fns

## ディレクトリ構成
```
src/
├── app/
│   ├── page.tsx                   # ランディングページ
│   ├── (auth)/login/              # ログイン画面
│   ├── (survey)/s/[token]/        # 患者向けアンケート（認証不要、slugベース）
│   ├── (kiosk)/kiosk/[token]/     # キオスクモード（認証不要、slugベース）
│   ├── (dashboard)/dashboard/     # ダッシュボード（analytics/actions/staff/surveys/metrics/settings）
│   ├── (admin)/admin/             # システム管理者画面（tips/backups）
│   ├── strategy/                  # 販促戦略共有ページ（認証不要）
│   ├── research-protocol/         # 研究計画書Webページ（認証不要）
│   └── api/                       # API Route Handlers
├── components/
│   ├── ui/                        # shadcn/ui コンポーネント
│   ├── layout/                    # サイドバー、ヘッダー、ボトムナビ
│   ├── survey/                    # アンケート関連
│   ├── admin/                     # システム管理関連
│   ├── dashboard/                 # ダッシュボード関連（20+コンポーネント）
│   ├── staff/                     # スタッフ管理関連
│   ├── settings/                  # 設定関連
│   ├── landing/                   # LP関連
│   └── research/                  # 研究計画書ページ関連
├── lib/
│   ├── prisma.ts                  # Prisma シングルトン
│   ├── utils.ts                   # cn() ヘルパー
│   ├── messages.ts                # 日本語UIテキスト辞書（全UIテキスト集約先）
│   ├── constants.ts               # アプリ定数（ランク、ストリーク、患者属性、改善提案等）
│   ├── patient-tips.ts            # 患者満足度向上ヒント（30件・12カテゴリ）
│   ├── api-helpers.ts             # API レスポンスヘルパー
│   ├── auth-helpers.ts            # API認証ガード
│   ├── date-jst.ts                # JST日付ユーティリティ
│   ├── rate-limit.ts              # IP レート制限
│   ├── ip.ts                      # IP取得・ハッシュ化
│   ├── services/                  # PX-Valueエンジン
│   ├── validations/               # Zod スキーマ
│   └── queries/                   # DB クエリ関数（stats/engagement/clinics/staff/surveys）
└── types/                         # TypeScript 型定義
```

## DB設計（9テーブル）
- **Clinic**: UUID主キー、settings: JSONB（dailyGoal、regularClosedDays、closedDates、dailyTipカスタム設定）
- **Staff**: UUID主キー、qrToken (unique, レガシー未使用)、isActive
- **User**: email/password認証、role: system_admin / clinic_admin / staff、isActive
- **SurveyTemplate**: questions: JSONB（初診/再診の2テンプレート）、isActive
- **SurveyResponse**: answers: JSONB、overallScore、freeText、patientAttributes: JSONB、ipHash、staffId（nullable）
- **ImprovementAction**: baselineScore→resultScore、status: active/completed/cancelled
- **ImprovementActionLog**: 実施履歴（action, satisfactionScore, note）
- **MonthlyClinicMetrics**: 月次経営指標。(clinicId, year, month) でユニーク
- **PlatformSetting**: key-value形式のプラットフォーム設定

## ロール
| ロール | アクセス範囲 |
|--------|-------------|
| system_admin | /admin/* 全クリニック管理 + /dashboard/*（オペレーターモードで任意クリニック操作） |
| clinic_admin | /dashboard/* 自クリニックのみ（全メニュー） |
| staff | ダッシュボード（ホームのみ） |

## コーディング規約
- 言語: TypeScript 厳格モード
- UIテキスト: 全て日本語。`src/lib/messages.ts` に集約
- API: NextResponse.json() でレスポンス。エラーは `{ error: "日本語メッセージ" }`
- DB: Prisma モデル名は PascalCase、テーブル/カラム名は `@@map` で snake_case
- コンポーネント: サーバーコンポーネント優先。インタラクティブな場合のみ "use client"
- 認証ガード: 全 API Route で `auth()` チェック（`/api/surveys/submit` は除外）

## 設計判断の記録
- **口コミ導線は非搭載**: 患者満足度改善に特化。口コミ依頼・誘導機能は意図的に排除
- **他院比較（ベンチマーク）は削除**: MVP段階ではクリニック数不足。将来再検討
- **ロールベースナビゲーション**: 旧パスワード認証+Cookie方式・ビュー切替トグルは廃止済み
- **テンプレートを3→2に簡素化**: 初診/治療中/定期検診 → 初診/再診。キオスクでは保険/自費→purpose選択でテンプレート自動決定
- **ストリークの休診日スキップ**: 定休日・臨時休診日をストリーク計算から除外
- **PX-Valueはsystem_admin専用**: クリニック横断比較指標のため管理画面のみ
- **患者属性フィルタ**: 5軸（来院種別・診療区分・診療内容・年代・性別）でJSONBフィルタ。キオスク回答のみ対象。`Prisma.sql`テンプレートリテラルでSQLインジェクション防止

## デモデータ（`prisma/seed.ts`）
- クリニック: "MIERU デモ歯科クリニック" (slug: demo-dental)
- ユーザー: mail@function-t.com / MUNP1687 (system_admin), clinic@demo.com / clinic123 (clinic_admin)
- テンプレート: 初診(8問), 再診(6問)
- 6ヶ月分アンケート約1,500件（決定的乱数、S字カーブでスコア改善）
- 改善アクション6件（4完了+2実施中）、経営レポート5ヶ月分

## デプロイ
- **CI/CD**: main push → GitHub Actions → Docker build → Cloud Run自動デプロイ
- **設定ファイル**: `Dockerfile`, `.github/workflows/deploy.yml`, `deploy/docker-entrypoint.sh`
- **Cloud SQL**: PostgreSQL 15, `mieru-clinic-db`（日次バックアップ+PITR）
- **環境変数**: DATABASE_URL, AUTH_SECRET, AUTH_URL, NEXT_PUBLIC_APP_URL（Cloud Run Secrets管理）

## アンケートURL
```
https://mieru-clinic.com/s/{clinicSlug}
```

## 先送り機能（MVPに含めない）
- カスタム質問編集UI / メール通知 / Google口コミスクレイピング
- CSV/PDFエクスポート / OAuth認証 / 自動テスト / 料金ページ
- AI分析（実データ蓄積後に判断）

## 法令遵守（絶対要件）
- 個人情報非収集: IPはSHA-256ハッシュのみ保存
- 医療広告ガイドライン準拠: 口コミ誘導機能は非搭載
- 患者アンケートは匿名・任意

## 関連ドキュメント（詳細は各ファイル参照）
- `docs/research-protocol.md` — 研究計画書ドラフト
- `docs/strategy-and-pricing-proposal.md` — 価格提案
- `docs/market-value-enhancement-proposal.md` — 市場価値向上提案書
- `docs/competitive-analysis.md` — 競合調査レポート
