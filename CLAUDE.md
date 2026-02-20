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
- **複数医院の横断分析による施策効果の数値化** — 複数クリニックのデータを横断的に分析し、どの改善施策がどの程度満足度向上や経営改善に効果があったかを数値化する。本当に歯科医院と患者にとって有益な施策を「見える化」することもプラットフォームの重要な目的の一つ
- KPI: 患者満足度スコア（primary）、アンケート回答率（secondary）

## 現在の実装状況（MVP完成済み）

### 実装済み機能一覧

| 機能 | 状態 | 概要 |
|------|------|------|
| 認証 | ✅ | Credentials認証、JWT、ロール別リダイレクト |
| 患者アンケートフロー | ✅ | URL→ウェルカム→回答（プログレスバー付き）→サンクス→歯の豆知識。未回答時自動スクロール |
| キオスクモード | ✅ | iPad受付用。患者属性入力→テンプレート自動選択→連続アンケート対応→自動リセット |
| ダッシュボード（スタッフ） | ✅ | 挨拶、エンカレッジメント、ランクシステム、ハピネスメーター、日次目標（Confetti付き）、ストリーク（休診日スキップ・マイルストーンバッジ付き）、今週の実績（曜日別チャート）、患者の声、通算マイルストーン、実施中の改善アクション（上位5件）、ヒント |
| ダッシュボード（管理者） | ✅ | 満足度スコア（トレンドバッジ付き）、InsightCards（自動改善提案）、月次サマリー |
| 満足度レポート | ✅ | 期間セレクタ（7/30/90/180/365日+カスタム日付範囲）、患者属性フィルタ（5軸）、テンプレート別スモールマルチプル（前期比較）、日次トレンド、質問別分析、診療内容別満足度、満足度ヒートマップ（曜日×時間帯）、スタッフリーダーボード |
| スタッフ管理 | ✅ | CRUD、有効/無効切替 |
| 経営レポート | ✅ | 来院数・売上・自費率入力（サマリータブ+データ入力タブ）、8+KPI自動算出、未入力月の視覚的表示、期間セレクタ（6ヶ月/1年/2年/3年+カスタム月範囲） |
| 回答一覧 | ✅ | ページネーション、患者属性表示、フリーテキスト、ページサイズ選択 |
| 患者満足度向上のヒント | ✅ | プラットフォーム全体管理（/admin/tips）、クリニック個別カスタム（Clinic.settings JSONB）、ローテーション表示 |
| 設定 | ✅ | クリニック名、日次目標、営業日数/週、定休日、臨時休診日 |
| 改善アクション管理 | ✅ | 専用ページ（/dashboard/actions）。作成・完了・削除、カテゴリ別提案、ベースライン/結果スコア記録、実施履歴ログ編集 |
| 運営モード | ✅ | system_admin用の全クリニック横断管理、オペレーターとして特定クリニックに「ログイン」 |
| ナビゲーション | ✅ | ロールに応じたサイドバー自動表示（clinic_admin/system_adminは管理者メニューが追加表示） |
| PX-Valueランキング | ✅ | system_admin管理画面でクリニック別PX-Valueスコア・ランク（SSS/S/A/B）・信頼性・安定性を一覧表示 |
| システム管理 | ✅ | 全クリニック一覧（ヘルスチェック付き）、プラットフォーム統計、PX-Valueランキング、ヒント管理、バックアップ管理 |
| ランディングページ | ✅ | ヒーロー、課題提起、特徴、フロー、実績、コンプライアンス、FAQ、CTA |
| 販促戦略共有ページ | ✅ | `/strategy` — 社内・パートナー向け1ページ共有ページ（認証不要、noindex） |
| 研究計画書Webページ | ✅ | `/research-protocol` — 全20章・スクロール連動目次付き（認証不要、noindex） |

### スタッフダッシュボードのゲーミフィケーション機能
- **ランクシステム**: 通算回答数に応じた8段階（ルーキー→ブロンズ→シルバー→ゴールド→プラチナ→ダイヤモンド→マスター→レジェンド）
- **ハピネスメーター**: 本日の平均スコアをemoji（😄😊🙂😐）で可視化
- **Confetti**: 日次目標達成時にアニメーション表示
- **ストリークマイルストーン**: 3日/7日/14日/30日/60日/90日の連続記録バッジ（休診日は自動スキップ）
- **エンカレッジメント**: 状況に応じた動的メッセージ（目標残り僅か/高スコア/ストリーク中/時間帯別）
- **今週の実績**: 今週の回答数・平均スコア・曜日別チャート（目標ライン付き）
- **通算マイルストーン**: 50/100/250/500/1,000/2,000/5,000/10,000件到達バッジ
- **改善アクション表示**: 実施中の改善アクション上位5件を現在スコア・詳細付きで表示

### 日次目標（dailyGoal）算出ロジック
1. **基本計算**: `前月の月間総実人数（firstVisitCount + revisitCount）÷ 前月の診療日数 × 乗数`
2. **乗数（goalLevel）**: 0.3（初期）→ 0.4 → 0.5 の3段階
   - 7日連続で目標達成 → 1段階UP（上限 0.5）
   - 7日連続で目標未達成 → 1段階DOWN（下限 0.3）
   - 休診日（regularClosedDays, closedDates）は連続日数カウントから除外
3. **フォールバック**: 前月データ未入力時は 10件/日（`DEFAULTS.DAILY_GOAL_FALLBACK`）
4. **永続化**: `Clinic.settings` JSONB に以下を保存（ダッシュボード表示時に自動評価・更新）
   - `goalLevel`: 現在の乗数段階（0/1/2）
   - `goalAchieveStreak`: 連続達成日数
   - `goalMissStreak`: 連続未達成日数
   - `goalLastCheckedDate`: 最終評価日（YYYY-MM-DD）
5. **関連定数**: `DEFAULTS.GOAL_MULTIPLIERS = [0.3, 0.4, 0.5]`, `DEFAULTS.GOAL_STREAK_THRESHOLD = 7`

### 管理者ダッシュボードの分析機能
- **InsightCards**: スコア推移（前月比較）、低スコア質問の自動検出、経営レポート入力促進、高満足度維持通知を自動生成
- **満足度レポート（/dashboard/analytics）**: 期間セレクタ（7/30/90/180/365日+カスタム日付範囲）+ 患者属性フィルタで以下を動的切替
  - テンプレート別スモールマルチプル: 初診/再診ごとの加重平均スコア + 前期比較（↑↓→トレンド矢印）+ ミニチャート
  - 日次トレンド: 回答数 + 平均スコアの複合チャート（棒+線）。長期はweek/month粒度に自動切替
  - 質問別分析: テンプレートごとの設問別平均スコア（展開可能）
  - 診療内容別満足度: 保険/自費 × 診療内容のスコア内訳
  - 満足度ヒートマップ: 曜日×時間帯のスコア分布（カラーグラデーション）
  - スタッフリーダーボード: 月次/通算の回答数ランキング
  - **患者属性フィルタ**: 来院種別・診療区分・診療内容・年代・性別の5軸（キオスクモード回答のみ対象）。全チャートに横断適用

### 実装フェーズ
- Phase 0: スキャフォールド ✅
- Phase 1A: DB + ORM ✅
- Phase 1B: 認証 ✅
- Phase 1C: アンケートフロー（コア機能） ✅
- Phase 1D: ダッシュボード ✅
- Phase 1E: スタッフ管理 ✅
- Phase 1F: 設定 ✅
- Phase 1G: ランディングページ ✅
- Phase 1H: システム管理 ✅
- Phase 1Z: ポリッシュ ⏳（継続中）

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
- **他院比較（ベンチマーク）は将来実装予定**: MVP段階ではクリニック数不足のため非搭載。医院数が増加した段階で医院間比較機能を検討。横断分析による施策効果の数値化（どの施策がどの程度有効か）は設計段階から想定済み
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
- **環境変数**: DATABASE_URL, AUTH_SECRET, AUTH_URL, NEXT_PUBLIC_APP_URL（Cloud Run環境変数として直接設定、Secrets Managerではない）

## 本番DB操作（重要）
### 接続情報
- **DBユーザー**: `mieru`（`postgres` ではない。全テーブルの所有者は `mieru`）
- **DATABASE_URL（Cloud Run）**: Cloud Run環境変数に直接設定（`gcloud run services describe` で確認可能）
- **Cloud Shell からの接続手順**:
  ```bash
  # 1. Cloud SQL Auth Proxy 起動
  cloud-sql-proxy mieru-clinic:asia-northeast1:mieru-clinic-db --port=5432 &
  # 2. proxy起動を待ってからコマンド実行（sleepを入れる）
  sleep 2 && DATABASE_URL="postgresql://mieru:<パスワード>@127.0.0.1:5432/mieru_clinic" npm run db:update-templates
  # 3. 完了後 proxy 停止
  kill %1
  ```

### 禁止事項
- **`gcloud sql users set-password` でDBユーザーのパスワードを変更しないこと** — Cloud Runの環境変数に設定されたDATABASE_URLと不整合が発生し、本番サイトが即座にダウンする
- パスワードが不明な場合は `gcloud run services describe mieru-clinic --region=asia-northeast1 --format=json` でCloud RunのDATABASE_URL環境変数から確認する

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
