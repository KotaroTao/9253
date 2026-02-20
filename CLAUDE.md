# MIERU Clinic - プロジェクトルール

## プロジェクト概要
- **サービス名**: MIERU Clinic（ミエル クリニック）
- **目的**: 医療機関専用 患者体験改善プラットフォーム
- **開発主体**: 株式会社ファンクション・ティ
- **ドメイン**: mieru-clinic.com（取得済み）
- **本番環境**: Google Cloud Run（asia-northeast1）
- **旧VPS**: Xserver VPS `/var/www/9253`（Cloud Runに移行済み、VPSデプロイは無効化）

## 本ツールの価値定義

### 解決する課題
歯科医院の院長は「患者がどう感じているか」を客観的に把握する手段がない。
口コミは極端な意見に偏り、スタッフからの報告はバイアスがかかる。
結果として、改善すべき点が見えないまま患者が離脱する。

### MIERU Clinicが提供する価値
1. **患者体験の可視化** — アンケートで満足度を定量化し、質問別スコアで改善ポイントを特定
2. **スタッフの行動習慣化** — 日次目標・ストリーク・ランクシステム・ゲーミフィケーションで「アンケート配布」を日常業務に定着
3. **経営指標との接続** — 経営レポートで患者満足度と来院数・売上・自費率の相関を可視化

### ポジショニング（重要）
- **主軸は「患者体験改善」**であり、口コミ獲得ツールではない
- **口コミ導線は非搭載** — 患者への口コミ依頼・誘導機能は意図的に搭載していない
- KPI: 患者満足度スコア（primary）、アンケート回答率（secondary）
- 数値は保守的に: アンケート協力率30-40%

### 競合との差別化
- 口コミツールではなく「患者体験改善」が主軸（医療広告ガイドライン準拠）
- キオスクモード対応（iPad受付運用、スタッフが患者に手渡し）
- スタッフのモチベーション設計（ランク・ストリーク・Confetti・ハピネスメーター等のゲーミフィケーション）
- 月次経営指標との統合ダッシュボード

## 現在の実装状況（MVP完成済み）

### 実装済み機能一覧

| 機能 | 状態 | 概要 |
|------|------|------|
| 認証 | ✅ | Credentials認証、JWT、ロール別リダイレクト |
| 患者アンケートフロー | ✅ | URL→ウェルカム→回答（プログレスバー付き）→サンクス→歯の豆知識。未回答時自動スクロール |
| キオスクモード | ✅ | iPad受付用。患者属性入力→テンプレート自動選択→連続アンケート対応→自動リセット |
| ダッシュボード（スタッフ） | ✅ | 挨拶、エンカレッジメント、ランクシステム、ハピネスメーター、日次目標（Confetti付き）、ストリーク（休診日スキップ・マイルストーンバッジ付き）、今週の実績（曜日別チャート）、患者の声、通算マイルストーン、実施中の改善アクション（上位5件）、ヒント |
| ダッシュボード（管理者） | ✅ | 満足度スコア（トレンドバッジ付き）、InsightCards（自動改善提案）、月次サマリー |
| 満足度レポート | ✅ | 期間セレクタ（7/30/90/180/365日）、テンプレート別スモールマルチプル（前期比較）、日次トレンド、質問別分析、満足度ヒートマップ（曜日×時間帯）、スタッフリーダーボード |
| スタッフ管理 | ✅ | CRUD、有効/無効切替 |
| 経営レポート | ✅ | 来院数・売上・自費率入力（サマリータブ+データ入力タブ）、8+KPI自動算出、未入力月の視覚的表示 |
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
- **満足度レポート（/dashboard/analytics）**: 期間セレクタ（7/30/90/180/365日）で以下を動的切替
  - テンプレート別スモールマルチプル: 初診/再診ごとの加重平均スコア + 前期比較（↑↓→トレンド矢印）+ ミニチャート
  - 日次トレンド: 回答数 + 平均スコアの折れ線グラフ
  - 質問別分析: テンプレートごとの設問別平均スコア（展開可能）
  - 満足度ヒートマップ: 曜日×時間帯のスコア分布（カラーグラデーション）
  - スタッフリーダーボード: 月次/通算の回答数ランキング

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
npm run typecheck    # TypeScript型チェック（tsc --noEmit）
npm run lint         # ESLintチェック
npm run lint:fix     # ESLint自動修正付き
npm run validate     # typecheck + lint 一括実行（推奨）
npm run build        # 本番ビルド確認
```

### DB操作
```bash
npm run db:push      # スキーマをDBに反映（prisma db push）
npm run db:seed      # デモデータ投入（npx tsx prisma/seed.ts）
npm run db:migrate   # マイグレーション作成（prisma migrate dev）
npm run db:studio    # Prisma Studio（ブラウザGUI）
npx prisma generate  # Prismaクライアント再生成（スキーマ変更後）
```

### 開発の進め方
1. コード変更後 → `npm run validate` で型エラー・lint違反がないか確認
2. DBスキーマ変更時 → `npx prisma generate` → `npm run typecheck`
3. UI変更時 → サーバーコンポーネント優先、"use client" は最小限
4. API変更時 → `auth()` ガードを忘れずに（`/api/surveys/submit` のみ例外）
5. テキスト追加時 → `src/lib/messages.ts` に日本語テキストを集約

### セッション開始時の自動コンテキスト復元
SessionStartフック（`.claude/hooks/session-start.sh`）が以下を自動実行:
1. `npm install` + `prisma generate`（依存関係・クライアント準備）
2. `.claude/dev-context.md` を自動生成（gitから現状を復元）
   - 現在のブランチ・mainとの差分
   - 未コミットの変更
   - 直近10件のコミット履歴

**新セッション開始後は `.claude/dev-context.md` を読んで状況を把握してから作業を開始すること。**

### Claude Code自動許可設定（`.claude/settings.json`）
git操作、npm検証コマンド、Prisma操作は承認不要で即実行される設定済み。

## 技術スタック
- **フレームワーク**: Next.js 14+ (App Router) + TypeScript
- **UI**: Tailwind CSS + shadcn/ui
- **ORM**: Prisma + PostgreSQL
- **認証**: Auth.js v5 (Credentials Provider, JWT)
- **バリデーション**: Zod
- **チャート**: Recharts
- **パスワード**: bcryptjs
- **日付**: date-fns

## ディレクトリ構成
```
src/
├── app/
│   ├── page.tsx                   # ランディングページ
│   ├── (auth)/login/              # ログイン画面
│   ├── (survey)/s/[token]/        # 患者向けアンケート（認証不要、実質slugベース）
│   ├── (kiosk)/kiosk/[token]/     # キオスクモード（認証不要、実質slugベース）
│   ├── (dashboard)/dashboard/     # ダッシュボード
│   │   ├── analytics/             # 満足度レポート（期間セレクタ付き）
│   │   ├── actions/               # 改善アクション管理
│   │   ├── staff/                 # スタッフ管理
│   │   ├── surveys/               # 回答一覧
│   │   ├── metrics/               # 経営レポート
│   │   ├── settings/              # 設定
│   │   └── survey-start/          # アンケート開始（→dashboard）
│   ├── (admin)/admin/             # システム管理者画面
│   │   ├── tips/                  # ヒント管理
│   │   └── backups/               # バックアップ管理
│   ├── strategy/                  # 販促戦略共有ページ（認証不要）
│   ├── research-protocol/         # 研究計画書Webページ（認証不要）
│   └── api/                       # API Route Handlers
├── components/
│   ├── ui/                        # shadcn/ui コンポーネント
│   ├── layout/                    # サイドバー、ヘッダー、ボトムナビ
│   ├── survey/                    # アンケート関連（Confetti含む）
│   ├── admin/                     # システム管理関連（PxValueDashboard等）
│   ├── dashboard/                 # ダッシュボード関連（19コンポーネント）
│   ├── staff/                     # スタッフ管理関連
│   ├── settings/                  # 設定関連
│   ├── landing/                   # LP関連
│   └── research/                  # 研究計画書ページ関連（TOCサイドバー等）
├── lib/
│   ├── prisma.ts                  # Prisma シングルトン
│   ├── utils.ts                   # cn() ヘルパー
│   ├── messages.ts                # 日本語UIテキスト辞書
│   ├── constants.ts               # アプリ定数（ランク、ストリーク、患者属性、改善提案等）
│   ├── patient-tips.ts            # 患者満足度向上ヒント（30件・12カテゴリ）+ ローテーション
│   ├── api-helpers.ts             # API レスポンスヘルパー（successResponse, errorResponse）
│   ├── auth-helpers.ts            # API認証ガード（requireAuth, isAuthError）
│   ├── date-jst.ts                # JST日付ユーティリティ
│   ├── rate-limit.ts              # IP レート制限
│   ├── ip.ts                      # IP取得・ハッシュ化
│   ├── services/                  # PX-Valueエンジン（px-value-engine, px-constants, px-segmentation）
│   ├── validations/               # Zod スキーマ
│   └── queries/                   # DB クエリ関数（5モジュール）
└── types/                         # TypeScript 型定義
```

## ダッシュボードコンポーネント一覧（`src/components/dashboard/`）

| コンポーネント | 用途 |
|--------------|------|
| `analytics-charts.tsx` | 満足度レポートのクライアント側オーケストレーター。期間セレクタ（7/30/90/180/365日）でAPI再取得 |
| `template-trend-small-multiples.tsx` | テンプレート別スモールマルチプル。前期比較（prevData）、加重平均スコア、トレンド矢印、ミニチャート |
| `template-trend-chart.tsx` | テンプレート別日次推移チャート（折れ線グラフ） |
| `daily-trend-chart.tsx` | 日次回答数+平均スコアの複合チャート（棒+線） |
| `question-breakdown.tsx` | テンプレートごとの設問別平均スコア。展開可能な詳細行 |
| `satisfaction-heatmap.tsx` | 曜日×時間帯の満足度ヒートマップ。期間セレクタ連動 |
| `staff-leaderboard.tsx` | スタッフ別月次/通算回答数ランキング |
| `staff-engagement.tsx` | スタッフダッシュボードの主コンポーネント。日次目標、週間チャート、マイルストーンバッジ、ランク、ポジティブコメント、改善アクション表示 |
| `insight-cards.tsx` | 自動生成インサイト: スコア推移、低スコア質問検出、経営レポート促進、高満足度通知 |
| `improvement-actions.tsx` | 改善アクションCRUD。カテゴリ別提案、ステータスタブ、実施履歴ログ |
| `satisfaction-trend.tsx` | 12ヶ月満足度推移チャート（管理者ダッシュボード用） |
| `satisfaction-cards.tsx` | 当月満足度概要カード |
| `monthly-summary-section.tsx` | 当月の経営指標入力フォーム |
| `monthly-metrics-view.tsx` | 月次サマリー + 自動算出KPI表示 |
| `monthly-chart.tsx` | 月次推移可視化（6ヶ月） |
| `recent-responses.tsx` | ページネーション付き回答一覧。患者属性表示 |
| `page-size-selector.tsx` | ページネーションサイズ制御 |
| `daily-tip.tsx` | ローテーション表示のヒント（クリニック別カスタム対応） |
| `survey-response-list.tsx` | 個別回答カード表示コンポーネント |

## APIルート一覧

### 分析系（管理者認証必須）
| ルート | メソッド | 概要 |
|--------|---------|------|
| `/api/template-trend?days=30&offset=0` | GET | テンプレート別日次スコア。offset対応で前期比較 |
| `/api/daily-trend?days=30` | GET | 日次回答数+平均スコア |
| `/api/question-breakdown?days=30` | GET | テンプレート別設問スコア（7/30/90/180/365日） |
| `/api/heatmap?days=90` | GET | 曜日×時間帯の満足度ヒートマップ |
| `/api/staff-leaderboard` | GET | スタッフ別月次/通算回答数 |
| `/api/recent-responses` | GET | ページネーション付き回答一覧 |

### 改善アクション系（管理者認証必須）
| ルート | メソッド | 概要 |
|--------|---------|------|
| `/api/improvement-actions` | GET/POST | 一覧取得/新規作成（ベースラインスコア自動取得） |
| `/api/improvement-actions/[id]` | PATCH/DELETE | ステータス更新/削除 |
| `/api/improvement-action-logs/[id]` | PATCH | 実施履歴ログの編集 |

### 経営レポート・設定系（管理者認証必須）
| ルート | メソッド | 概要 |
|--------|---------|------|
| `/api/monthly-metrics` | GET/POST | 月次経営指標の取得/保存 |
| `/api/settings` | GET/PATCH | クリニック設定（日次目標、営業日数、定休日等） |
| `/api/closed-dates` | POST/DELETE | 臨時休診日のトグル |
| `/api/daily-tip` | GET | 本日のヒント取得 |
| `/api/staff` | GET/POST | スタッフ一覧取得/新規作成 |
| `/api/staff/[id]` | PATCH/DELETE | スタッフ更新/削除 |

### アンケート
| ルート | メソッド | 概要 |
|--------|---------|------|
| `/api/surveys/submit` | POST | アンケート回答送信（認証不要、IPレート制限あり） |
| `/api/surveys/[id]` | DELETE | 個別回答削除（管理者認証必須） |

### システム管理（system_admin認証必須）
| ルート | メソッド | 概要 |
|--------|---------|------|
| `/api/admin/operator-login` | POST | オペレーターモードでクリニックにログイン |
| `/api/admin/px-values` | GET | PX-Valueランキング一覧（全クリニックのスコア・ランク・安定性） |
| `/api/admin/tips` | GET/POST/PATCH/DELETE | プラットフォームヒント管理 |
| `/api/admin/backups` | GET/POST | バックアップ状態・手動実行 |

### その他
| ルート | メソッド | 概要 |
|--------|---------|------|
| `/api/auth/[...nextauth]` | GET/POST | Auth.js認証エンドポイント |
| `/api/health` | GET | ヘルスチェック（Cloud Run用） |

## DBクエリモジュール詳細（`src/lib/queries/`）

### `stats.ts` — ダッシュボード統計
| 関数 | 戻り値 | 用途 |
|------|--------|------|
| `getDashboardStats(clinicId, dateFrom?, dateTo?)` | `{totalResponses, averageScore, prevAverageScore}` | 当月+前月平均（1本のraw SQL） |
| `getMonthlySurveyCount(clinicId, year, month)` | `number` | 月間回答数 |
| `getMonthlySurveyQuality(clinicId, year, month)` | `{lowScoreCount, freeTextRate}` | 品質指標（3点以下件数、自由記述率%） |
| `getCombinedMonthlyTrends(clinicId)` | `{monthlyTrend, satisfactionTrend}` | 12ヶ月分1クエリ→6ヶ月/12ヶ月に分離 |
| `getQuestionBreakdown(clinicId, months=3)` | `TemplateQuestionScores[]` | 設問別平均スコア（月数指定） |
| `getQuestionBreakdownByDays(clinicId, days=30)` | `TemplateQuestionScores[]` | 設問別平均スコア（日数指定、満足度レポート用） |
| `getDailyTrend(clinicId, days=30)` | `DailyTrendPoint[]` | 日次回答数+平均スコア |
| `getTemplateTrend(clinicId, days=30, offsetDays=0)` | `TemplateTrendPoint[]` | テンプレート別日次スコア（offset=前期比較用） |
| `getHourlyHeatmapData(clinicId, days=90)` | `HeatmapCell[]` | 曜日×時間帯のスコア分布 |
| `getCurrentSatisfactionScore(clinicId)` | `number \| null` | 直近30日の平均スコア |
| `getQuestionCurrentScore(clinicId, questionId)` | `number \| null` | 特定設問の直近30日平均 |
| `getQuestionCurrentScores(clinicId, questionIds[])` | `Record<string, number>` | 複数設問の現在スコア一括取得 |
| `getSatisfactionTrend(clinicId, months=12)` | `SatisfactionTrend[]` | 12ヶ月推移（管理者ダッシュボード用） |

### `engagement.ts` — スタッフエンゲージメント
| 関数 | 戻り値 | 用途 |
|------|--------|------|
| `getStaffEngagementData(clinicId)` | `EngagementData` | 統合エンゲージメントデータ |

**EngagementData の主要フィールド:**
- `todayCount` / `dailyGoal`: 本日回答数 / 目標
- `streak`: 連続稼働日数（休診日スキップ）
- `streakBreak`: ストリーク切断日（{date, dayOfWeek} or null）
- `totalCount` / `currentMilestone` / `nextMilestone`: 通算回答数とマイルストーン
- `rank` / `nextRank` / `rankProgress`: 現在ランクと進捗（0-100%）
- `weekCount` / `weekAvgScore` / `weekActiveDays` / `weekDays[]`: 今週の実績と曜日別内訳
- `todayAvgScore`: 本日の平均スコア
- `positiveComment`: ランダムな高スコアコメント（30日以内）

### `clinics.ts` — クリニック管理
| 関数 | 用途 |
|------|------|
| `getClinicById(clinicId)` | クリニック詳細（スタッフ数・回答数付き） |
| `getAllClinics({page, limit, search})` | 全クリニック一覧（ページネーション、検索） |
| `updateClinicSettings(clinicId, patch)` | JSONB settings の安全な部分更新 |
| `getPlatformTodayStats()` | プラットフォーム全体KPI（本日回答数、アクティブクリニック、平均スコア） |
| `getClinicHealthBatch(clinicIds[])` | クリニック一括ヘルスチェック |

### `staff.ts` — スタッフ管理
| 関数 | 用途 |
|------|------|
| `getStaffByClinic(clinicId, includeInactive)` | スタッフ一覧（回答数付き） |
| `getStaffWithStats(clinicId)` | スタッフ + 統計情報 |

### `surveys.ts` — アンケート
| 関数 | 用途 |
|------|------|
| `getStaffByToken(qrToken)` | トークンからスタッフ取得（クリニック・テンプレート含む） |
| `getClinicBySlug(slug)` | スラッグからクリニック取得（公開アンケート用、アクティブテンプレート含む） |
| `createSurveyResponse(data)` | 回答の保存 |
| `hasRecentSubmission(ipHash, clinicId)` | 1日以内の重複チェック（IPハッシュ） |
| `getSurveyResponses(clinicId, {page, limit, staffId, from, to})` | ページネーション付き回答一覧 |

## DB設計（9テーブル）
- **Clinic**: UUID主キー、settings: JSONB（dailyGoal、regularClosedDays、closedDates、dailyTipカスタム設定を格納）
- **Staff**: UUID主キー、qrToken (unique UUID)（レガシー、現在未使用）、isActive フラグ
- **User**: email/password認証、role: system_admin / clinic_admin / staff、isActive フラグ
- **SurveyTemplate**: questions: JSONB（初診/再診の2テンプレート）、isActive フラグ
- **SurveyResponse**: answers: JSONB、overallScore、freeText、patientAttributes: JSONB、ipHash、staffId（nullable）
- **ImprovementAction**: 改善アクション履歴（baselineScore→resultScore、status: active/completed/cancelled）
- **ImprovementActionLog**: 改善アクションの実施履歴（action, satisfactionScore, note）。ImprovementActionとリレーション
- **MonthlyClinicMetrics**: 月次経営指標（来院数、売上、自費売上、Google口コミ件数・平均点）。(clinicId, year, month) でユニーク
- **PlatformSetting**: key-value形式のプラットフォーム設定（患者ヒント管理、ローテーション間隔等）

## 定数定義（`src/lib/constants.ts`）

### ランクシステム（8段階）
| ランク | 必要回答数 |
|--------|-----------|
| ルーキー | 0 |
| ブロンズ | 50 |
| シルバー | 100 |
| ゴールド | 250 |
| プラチナ | 500 |
| ダイヤモンド | 1,000 |
| マスター | 2,000 |
| レジェンド | 5,000 |

### ストリークマイルストーン（6段階）
3日連続、1週間、2週間、1ヶ月、2ヶ月、3ヶ月

### 通算マイルストーン
50 / 100 / 250 / 500 / 1,000 / 2,000 / 5,000 / 10,000 件

### 患者属性（キオスクモード）
- 来院種別: 初診、再診
- 診療区分（insuranceType）: 保険診療、自費診療
- 診療内容（purpose）:
  - 保険: う蝕処置、歯周治療、被せもの・ブリッジ(保険)、保険義歯、保険メンテ、抜歯、急患・応急処置、その他
  - 自費: う蝕処置、歯周治療、被せもの・ブリッジ(自費)、自費義歯、自費メンテ、インプラント、ワイヤー矯正、マウスピース矯正、ホワイトニング、その他
- 年代: ~20代、30代、40代、50代、60代~（任意）
- 性別: 男性、女性、未回答（任意）

### 改善アクション提案（10カテゴリ）
clinic_environment / reception / wait_time / hearing / explanation / cost_explanation / comfort / pain_care / staff_courtesy / loyalty（各3件の定型提案）

## メッセージ辞書（`src/lib/messages.ts`）
日本語UIテキストを一元管理。以下のセクション:
- `common`: 保存、キャンセル、削除、ログアウト等
- `errors`: 認証、バリデーション、クリニック関連エラー
- `auth`: ログインフォーム
- `survey`: ウェルカム、サンクス、プログレス
- `dashboard`: KPI、エンゲージメント、エンカレッジメント（時間帯別）
- `improvementActions`: CRUD、ステータス、履歴
- `staffLeaderboard`: カラムラベル
- `monthlyMetrics`: KPI、自動算出指標
- `pxValue`: PX-Valueランキング画面（管理タイトル、スコア、ランク、加重平均、信頼性、安定性等）
- `staff` / `kiosk` / `patientSetup` / `dailyTip` / `tipManager` / `settings` / `nav` / `admin` / `operatorMode` / `backup` / `landing`

**患者満足度向上ヒント**: 30件・12カテゴリ（接遇、コミュニケーション、不安軽減、院内環境、待ち時間、チーム連携、初診対応、治療説明、フォローアップ、予防指導、小児対応、高齢者対応）— `src/lib/patient-tips.ts`
**歯の豆知識**: 60件・7カテゴリ（ブラッシング、虫歯予防、歯周病、食事・栄養、定期検診・予防、生活習慣、お子さまの歯）— `src/lib/constants.ts` の `DENTAL_TIPS`

## デモデータ（seed — `prisma/seed.ts`）

### アカウント
- クリニック: "MIERU デモ歯科クリニック" (slug: demo-dental, 管理者パスワード: 1111)
- ユーザー: mail@function-t.com / MUNP1687 (system_admin), clinic@demo.com / clinic123 (clinic_admin)
- スタッフ: 田中花子(衛生士), 佐藤太郎(歯科医師), 鈴木美咲(スタッフ)
- テンプレート: 初診(8問), 再診(6問)

### 6ヶ月分リアルアンケートデータ（約1,500件）
決定的乱数（seed固定）により毎回同一データを生成。デモで以下が確認できる:
- **スコア推移**: 3.5→4.2へS字カーブで半年間に改善
- **曜日変動**: 土曜（混雑で低め）、月曜（やや低め）、水曜（高め）
- **時間帯変動**: 午前（高い）、昼（谷）、夕方（低い）
- **スタッフ差**: 田中花子45%回収/佐藤太郎35%/鈴木美咲20%、スコアにもスタッフ差あり
- **設問難易度**: 待ち時間・費用説明は低スコア傾向、スタッフ対応・丁寧さは高スコア傾向
- **フリーテキスト**: 低スコア時はネガティブ、高スコア時はポジティブが出やすい

### 改善アクション6件（4完了 + 2実施中）
アクション効果がスコアに連動（開始月から2ヶ月かけて最大効果）:
1. 待ち時間の見える化と声がけ（完了: 月0→月2）
2. 受付マニュアルの作成と研修（完了: 月1→月3）
3. 視覚資料を活用した治療説明（完了: 月2→月4）
4. 接遇マナー研修の定期実施（完了: 月2→月4）
5. 予約枠にバッファを確保（実施中: 月4→）
6. 痛みへの配慮を言語化して伝える（実施中: 月4→）

### 経営レポート
過去5ヶ月分を自動生成（当月は未入力=InsightBanner表示用）

## アンケートURL
```
https://mieru-clinic.com/s/{clinicSlug}
```
- クリニックのslugベースの固定URL
- レート制限 + IPハッシュで防御

## ロール
| ロール | アクセス範囲 |
|--------|-------------|
| system_admin | /admin/* 全クリニック管理 + /dashboard/*（オペレーターモードで任意クリニック操作） |
| clinic_admin | /dashboard/* 自クリニックのみ（全メニュー） |
| staff | ダッシュボード（ホームのみ） |

## ナビゲーション（ロールベース）
- 全ロール共通: ダッシュボードホーム（スタッフエンゲージメント + 管理者ウィジェット）、キオスクモード起動リンク
- clinic_admin / system_admin: サイドバーに分析・改善アクション・回答一覧・スタッフ管理・設定メニューが追加表示
- system_admin: さらにシステム管理（/admin）リンクが表示
- staff ロールはダッシュボードホームのみ
- ※旧パスワード認証方式の管理者モードは廃止済み
- ※旧ビュー切替トグルも廃止済み（ロールで自動的にメニュー項目を制御）

## コーディング規約
- 言語: TypeScript 厳格モード
- UIテキスト: 全て日本語。src/lib/messages.ts に集約
- API: NextResponse.json() でレスポンス。エラーは { error: "日本語メッセージ" }
- DB: Prisma モデル名は PascalCase、テーブル/カラム名は @@map で snake_case
- コンポーネント: サーバーコンポーネント優先。インタラクティブな場合のみ "use client"
- 認証ガード: 全 API Route で auth() チェック（/api/surveys/submit は除外）

## 設計判断の記録
- **口コミ導線は非搭載**: 患者満足度改善に特化。口コミ依頼・誘導機能は意図的に排除
- **他院比較（ベンチマーク）は削除**: MVP段階ではクリニック数不足で機能しない。カテゴリ分類なしの比較は不公平。将来的にクリニック数・カテゴリ分類が揃った段階で再検討
- **管理者モード→ロールベースナビゲーションに変更**: パスワード認証+Cookie方式を廃止。ビュー切替トグルも廃止し、ユーザーロールに応じてサイドバーメニュー項目を自動制御
- **改善アクションとスコアの連動**: seedデータでは改善アクションの開始月からスコアへの効果が徐々に反映される設計。デモ時にスコア推移と改善施策の因果関係を説明可能
- **決定的乱数によるseedデータ**: rng seed固定により毎回同一データを生成。デモ・スクリーンショットの再現性を保証
- **満足度レポートの期間セレクタ**: 7/30/90/180/365日の5段階。サーバーサイドで初期データ（30日分）をプリフェッチし、クライアント側で期間変更時にAPIを再取得
- **テンプレート別スモールマルチプルの前期比較**: 同じ日数の前期間データをoffsetパラメータで取得し、加重平均スコアの差分でトレンド矢印（↑↓→）を表示
- **ストリークの休診日スキップ**: 定休日（regularClosedDays）と臨時休診日（closedDates）をストリーク計算から除外。休診日に回答がなくてもストリークが途切れない
- **PX-Valueはsystem_admin専用**: クリニック横断比較指標のため、system_admin管理画面のみに表示。clinic_admin/staffには非公開
- **テンプレートを3→2に簡素化**: 初診/治療中/定期検診の3テンプレート構成を初診/再診の2テンプレートに変更。キオスクでは保険/自費→purpose選択の2ステップでテンプレートを自動決定

## PX-Valueシステム（`src/lib/services/`）

### 概要
クリニック間の患者体験品質を横断比較するT-Score正規化指標。system_admin管理画面のみに表示。

### 算出フロー
1. **回答ごとの重み付きスコア**: `rawScore × deviceWeight × complaintWeight × engagementWeight`
2. **クリニック別加重平均**: 直近90日の信頼済み回答（trustFactor > 0）で算出
3. **T-Score正規化**: `50 + 10 × (clinic_avg - global_mean) / global_std_dev`
4. **ランク付与**: SSS(70+) / S(60+) / A(50+) / B(<50)

### 重み付け定数（`px-constants.ts`）
| カテゴリ | 定数 | 値 |
|---------|------|-----|
| デバイス | patient_url / kiosk_authorized / kiosk_unauthorized | 1.5 / 1.0 / 0.8 |
| 診療内容 | emergency / maintenance系 / default | 1.2 / 0.9 / 1.0 |
| エンゲージメント | テキストなし / 短文(10-29字) / 長文(30字+) | 1.0 / 1.05 / 1.1 |

### 信頼性検証（4トラップ）
- **Speed Trap**: 回答速度チェック（2秒/問未満で減点）
- **Continuity Trap**: 短時間連続送信チェック（60秒以内）
- **Capacity Trap**: ユニット数に対する回答数上限チェック
- **Similarity Trap**: フリーテキストのbigram類似度チェック（閾値0.8）

### 安定性スコア
変動係数ベースの0-100指標。月間スコアの安定性を評価。

### 関連ファイル
| ファイル | 役割 |
|---------|------|
| `px-constants.ts` | 全定数定義（重み、閾値、ランク境界） |
| `px-value-engine.ts` | コアエンジン（processSubmission, calculateAllPxValues, calculateStabilityScore） |
| `px-segmentation.ts` | 患者セグメント分類（emergency/maintenance/highValue/general） |
| `src/components/admin/px-value-dashboard.tsx` | 管理画面UIコンポーネント |
| `src/app/api/admin/px-values/route.ts` | APIエンドポイント |

## パフォーマンス最適化（1000医院×1万回答規模対応）

### クエリ統合・最適化
- **getDashboardStats()**: count + avg + prevAvg を1本の raw SQL に統合（FILTER句使用）。従来の4クエリ→2クエリに削減
- **getStaffEngagementData()**: totalCount / todayCount / weekData を1本の raw SQL FILTER句で統合。7並列クエリ→4並列クエリに削減
- **getCombinedMonthlyTrends()**: getMonthlyTrend（6ヶ月）と getSatisfactionTrend（12ヶ月）を統合。12ヶ月分を1クエリで取得し、JS側で6ヶ月/12ヶ月に分離
- **getQuestionBreakdown()**: JSONB展開（jsonb_each_text）を直近3ヶ月に限定。全件走査を排除
- **ダッシュボード合計**: DBラウンドトリップ 9本→5本に削減

### 安全制限
- `/api/improvement-actions`: `take: 100` 追加（無制限fetch防止）
- `/api/staff-leaderboard`: スタッフ取得に `take: 100` 追加
- `/admin` 全回答数: `COUNT(*)` → `pg_class.reltuples` 推定値に変更（1千万行の全件カウント回避）

### DBインデックス
- `survey_responses` に複合インデックス追加:
  - `(clinic_id, responded_at, overall_score)` — ダッシュボード統計クエリ用
  - `(clinic_id, template_id, responded_at)` — 質問別分析クエリ用

## GCPインフラ構成

### GCPプロジェクト
- **プロジェクトID**: `mieru-clinic`
- **リージョン**: `asia-northeast1`（東京）

### 使用サービス一覧
| サービス | リソース名 | 用途 |
|----------|-----------|------|
| Cloud Run | `mieru-clinic` | アプリケーション実行（Next.js standalone） |
| Cloud SQL | `mieru-clinic-db` (PostgreSQL 15, db-f1-micro) | データベース |
| Artifact Registry | `mieru-clinic` | Dockerイメージ保管 |
| VPC Connector | `mieru-vpc-connector` | Cloud Run ↔ Cloud SQL 内部接続 |

### Cloud Run 設定
- **メモリ**: 512Mi / **CPU**: 1
- **インスタンス数**: 0〜3（リクエストなし時は0でコスト最適化）
- **ポート**: 3000
- **サービスアカウント**: `cloud-run-mieru@mieru-clinic.iam.gserviceaccount.com`
- **Cloud SQL接続**: `mieru-clinic:asia-northeast1:mieru-clinic-db`（Unix Socket経由）
- **VPC**: `mieru-vpc-connector`（private-ranges-only）

### Cloud SQL 設定
- **インスタンス**: `mieru-clinic-db`
- **バージョン**: PostgreSQL 15
- **ティア**: db-f1-micro（SSD 10GB、自動拡張）
- **バックアップ**: 毎日 03:00 UTC（JST 12:00）、保持7世代、PITR有効（トランザクションログ7日間保持）
- **DB名**: `mieru_clinic` / **ユーザー**: `mieru`

### ドメイン・DNS
- **ドメイン**: `mieru-clinic.com`（Cloud Run にマッピング済み）
- **SSL**: Google マネージド証明書（自動発行・更新）
- **DNS**: A/AAAA レコードで Google のサーバー（216.239.32/34/36/38.21）に向けている

### 環境変数（Cloud Run に設定済み）
| 変数名 | 値 |
|--------|-----|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Cloud SQL Unix Socket形式（Secrets管理） |
| `AUTH_SECRET` | ランダム生成（Secrets管理） |
| `AUTH_URL` | `https://mieru-clinic.com` |
| `NEXT_PUBLIC_APP_URL` | `https://mieru-clinic.com` |
| `RUN_MIGRATIONS` | `true`（コンテナ起動時にPrisma db push実行） |

### デプロイフロー（CI/CD）
```
main ブランチに push
  → GitHub Actions (.github/workflows/deploy.yml)
  → Docker build & push (Artifact Registry)
  → gcloud run deploy
  → 自動デプロイ完了
```

### GitHub Secrets（必要）
| Secret名 | 内容 |
|-----------|------|
| `GCP_PROJECT_ID` | `mieru-clinic` |
| `GCP_SA_KEY` | GitHub Actions用サービスアカウントのJSONキー |
| `GCP_REGION` | `asia-northeast1` |
| `DATABASE_URL` | PostgreSQL接続URL（Unix Socket形式） |
| `AUTH_SECRET` | Auth.js用シークレットキー |
| `CLOUD_SQL_CONNECTION` | `mieru-clinic:asia-northeast1:mieru-clinic-db` |

### デプロイ関連ファイル
| ファイル | 用途 |
|----------|------|
| `Dockerfile` | マルチステージビルド（deps → builder → runner） |
| `.dockerignore` | Docker除外ファイル定義 |
| `deploy/gcp-setup.sh` | GCP環境初期構築スクリプト（初回のみ） |
| `deploy/docker-entrypoint.sh` | コンテナ起動時スクリプト（マイグレーション+起動） |
| `deploy/migrate-cloud-sql.sh` | Cloud SQL Auth Proxy経由の手動マイグレーション |
| `.github/workflows/deploy.yml` | Cloud Run 自動デプロイ（main push時） |
| `.github/workflows/deploy-vps.yml` | 旧VPSデプロイ（無効化済み、手動実行のみ） |

### 運用コマンド集
```bash
# --- デプロイ状態確認 ---
gcloud run services describe mieru-clinic --region asia-northeast1

# --- ログ確認 ---
gcloud run services logs read mieru-clinic --region asia-northeast1 --limit 50

# --- Cloud SQL接続（Cloud Shell経由） ---
gcloud sql connect mieru-clinic-db --user=mieru --database=mieru_clinic

# --- 手動デプロイ（緊急時） ---
IMAGE="asia-northeast1-docker.pkg.dev/mieru-clinic/mieru-clinic/mieru-clinic:manual"
gcloud builds submit --tag "${IMAGE}" .
gcloud run deploy mieru-clinic --image "${IMAGE}" --region asia-northeast1

# --- ローカルからDBマイグレーション ---
# deploy/migrate-cloud-sql.sh を参照（Cloud SQL Auth Proxy経由）

# --- ドメインマッピング状態確認 ---
gcloud beta run domain-mappings describe --domain mieru-clinic.com --region asia-northeast1
```

## 先送り機能（MVPに含めない）
- カスタム質問編集UI / メール通知 / Google口コミスクレイピング
- CSV/PDFエクスポート / OAuth認証 / 自動テスト / 料金ページ
- AI分析（実データ蓄積後に検証してから判断）
- 従業員サーベイ（削除済み — コア価値に集中）
- 他院比較ベンチマーク（クリニック数・カテゴリ分類が揃ってから再検討）

## 法令遵守（絶対要件）
- 個人情報非収集: IPはSHA-256ハッシュのみ保存
- 医療広告ガイドライン準拠: 口コミ誘導機能は非搭載
- 患者アンケートは匿名・任意

## 研究計画・論文作成（エビデンス構築戦略）

### 概要
MIERUの有効性を学術的に検証し、査読付き論文として発表する計画。3チャネル（サロン500名＋LINE 2,000名＋SNS 5,000名、計7,500名）から30院を選定し、待機リスト対照RCTを実施。

### 研究デザイン
- **種別**: 前向き・多施設・非盲検・待機リスト対照・クラスターRCT
- **対象**: 歯科医院30院（介入群15院 + 対照群15院）
- **介入**: MIERUフル機能の6ヶ月間使用
- **主要アウトカム**: 患者満足度スコア（5段階）の変化量の群間差
- **副次アウトカム**: 回答率、質問別スコア変化、スタッフ行動指標、経営指標相関
- **解析**: マルチレベル線形混合効果モデル（患者→医院の階層構造）
- **報告基準**: CONSORT 2010（クラスターRCT拡張版）

### 3チャネル募集戦略
| チャネル | 母数 | 期待応募率 | 期待応募数 | 役割 |
|---------|------|-----------|-----------|------|
| オンラインサロン | 500名 | 10-15% | 50-75院 | 主力（信頼関係あり、脱落率低） |
| LINEグループ | 2,000名 | 3-5% | 60-100院 | 補完（層別の穴埋め） |
| SNSフォロワー | 5,000名 | 1-2% | 50-100院 | 補完（多様性確保、外的妥当性向上） |
| **合計** | **7,500名** | — | **160-275院** | → 30院を厳選 |

- 推奨混合比: サロン会員50-60%（15-18院）+ LINE/SNS経由40-50%（12-15院）
- 選外の応募院（130-245院）→ 有料版リリース時の優先案内リスト
- 汚染リスク管理: 地理的分離、対照群への待機保証、プロトコル逸脱の記録

### 30院選定の層別サンプリング（6軸）
1. 立地（都市部 / 郊外・地方）
2. 医院規模（ユニット3台以下 / 4台以上）
3. 開業年数（5年未満 / 5-15年 / 16年以上）
4. 自費率（20%未満 / 20%以上）
5. 患者満足度自己評価（高 / 普通 / 低）
6. 地域（東日本 / 西日本）

### タイムライン（約18ヶ月）
```
月0-2:  準備期（共著者確定、倫理審査、UMIN-CTR登録、募集）
月3:    ベースライン測定
月4-9:  介入期（6ヶ月間データ収集）
月10:   最終測定・データクリーニング
月11-13: 分析・執筆
月14-16: 共著者レビュー・投稿
月17-18: 査読対応
```

### 共著者チーム（必要構成）
| 役割 | 人数 | 理由 |
|------|------|------|
| 筆頭著者 | 1 | 研究設計・データ収集・執筆 |
| 統計専門家 | 1 | 検出力分析・ランダム化・主解析 |
| 歯科系大学教員 | 1-2 | 学術的信頼性・IRBの受け皿 |
| 医療情報学研究者 | 0-1 | デジタルヘルス方法論 |

### 投稿先候補
1. JMIR (IF ~7.0) — デジタルヘルス最高峰
2. BMC Oral Health (IF ~4.0) — OA、歯科×デジタルヘルス
3. International Dental Journal (IF ~3.5) — 国際歯科
4. 日本歯科医療管理学会雑誌 — 日本語、実績作り

### COI管理方針
開発元との利益相反を透明に開示。ランダム化・データ分析は独立した共著者が実施。プロトコルはUMIN-CTRに事前登録。

### 最優先アクション
1. 歯科系大学教員の共著者候補にコンタクト
2. 統計専門家（生物統計）の確保
3. 研究計画書の正式版作成（ドラフト: `docs/research-protocol.md`）
4. UMIN-CTR登録準備
5. 3チャネル（サロン・LINE・SNS）での募集告知準備

### 研究計画書Webページ
- `/research-protocol` — 研究計画書のWeb版（全20章・スクロール連動目次付き、noindex）

### 関連ドキュメント
- `docs/research-protocol.md` — 研究計画書ドラフト（全20章）

## 販促戦略（Go-to-Market）

### ポジショニング
- **カテゴリ**: 「患者体験改善プラットフォーム」（口コミツールではない新カテゴリ）
- **比較対象**: 経営コンサル（月5-30万）、PX調査代行（1回5-15万）に対する自動化ツール
- **訴求軸**: 「口コミを増やす」ではなく「患者が戻ってくる医院になる」

### ターゲットセグメント
1. **メインターゲット**: オンラインサロン会員（約500名の歯科院長、月額¥3,300）
2. **セカンダリ**: サロン外の歯科医院（Web広告・学会・紹介経由）
3. **将来拡大**: 一般クリニック、美容クリニック、動物病院

### 価格体系（3プラン）
| プラン | 月額（税抜） | スタッフ数 | ターゲット |
|--------|-------------|-----------|-----------|
| ライト | ¥9,800 | 最大3名 | 小規模個人医院 |
| スタンダード（推奨） | ¥19,800 | 最大10名 | 中規模医院 |
| プレミアム | ¥39,800 | 無制限 | 多拠点・法人 |
- 年間契約: 2ヶ月無料（17%割引）
- 無料トライアル: 30日間、カード不要、スタンダード全機能

### 販促チャネルと施策
| チャネル | 施策 | 優先度 |
|---------|------|--------|
| オンラインサロン | パイロット30院無償提供 → 成果発表 → 有料転換 | 最優先 |
| 学会発表 | 日本歯科医療管理学会・日本医療情報学会で研究発表 | 高 |
| 論文出版 | RCT論文で学術的エビデンスを確立 | 高（中長期） |
| コンテンツ | ステマ規制・コンプライアンス記事、改善事例 | 中 |
| 紹介 | 既存ユーザーからの紹介プログラム | 中 |

### 収益目標
| 時点 | 契約院数 | MRR | ARR |
|------|---------|-----|-----|
| 1年目（12ヶ月） | 48院 | ¥71万 | ¥850万 |
| 2年目（24ヶ月） | 140院 | ¥217万 | ¥2,600万 |

### 競合優位性（5つの差別化）
1. **コンプライアンス準拠** — 口コミゲーティング非実施（競合の大半は違反）
2. **患者体験が主軸** — 日本市場にこのポジショニングの競合なし
3. **ゲーミフィケーション** — スタッフの配布行動を習慣化する仕組み
4. **即日導入** — QR/キオスクでEHR連携不要
5. **経営指標との接続** — 満足度と売上・来院数の相関を可視化

### 販促戦略共有ページ
- `/strategy` — 社内・パートナー向け1ページ共有ページ（認証不要）

### 関連ドキュメント
- `docs/strategy-and-pricing-proposal.md` — 強み強化施策・価格提案
- `docs/market-value-enhancement-proposal.md` — 市場価値向上提案書
- `docs/competitive-analysis.md` — 競合・類似ツール調査レポート

## 参考URL
- 公式: https://mieru-clinic.com/
- 訴訟勝訴: https://note.com/dentalmania88/n/n1dfe8d9ff1f6
- 口コミ削除解説: https://function-t.com/delete_2025.html
- LUCHT研修: https://function-t.com/9253.html
