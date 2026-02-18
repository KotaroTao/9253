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
3. **経営指標との接続** — 月次レポートで患者満足度と来院数・売上・自費率の相関を可視化

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
| 分析ページ | ✅ | 期間セレクタ（7/30/90/180/365日）、テンプレート別スモールマルチプル（前期比較）、日次トレンド、質問別分析、満足度ヒートマップ（曜日×時間帯）、スタッフリーダーボード |
| スタッフ管理 | ✅ | CRUD、有効/無効切替 |
| 月次レポート | ✅ | 来院数・売上・自費率・Google口コミ入力、8+KPI自動算出 |
| 回答一覧 | ✅ | ページネーション、患者属性表示、フリーテキスト、ページサイズ選択 |
| 患者満足度向上のヒント | ✅ | プラットフォーム全体管理（/admin/tips）、クリニック個別カスタム（Clinic.settings JSONB）、ローテーション表示 |
| 設定 | ✅ | クリニック名、日次目標、営業日数/週、定休日、臨時休診日 |
| 改善アクション管理 | ✅ | 専用ページ（/dashboard/actions）。作成・完了・削除、カテゴリ別提案、ベースライン/結果スコア記録、実施履歴ログ編集 |
| 運営モード | ✅ | system_admin用の全クリニック横断管理、オペレーターとして特定クリニックに「ログイン」 |
| ナビゲーション | ✅ | ロールに応じたサイドバー自動表示（clinic_admin/system_adminは管理者メニューが追加表示） |
| システム管理 | ✅ | 全クリニック一覧（ヘルスチェック付き）、プラットフォーム統計、ヒント管理、バックアップ管理 |
| ランディングページ | ✅ | ヒーロー、課題提起、特徴、フロー、実績、コンプライアンス、FAQ、CTA |

### スタッフダッシュボードのゲーミフィケーション機能
- **ランクシステム**: 通算回答数に応じた8段階（ルーキー→ブロンズ→シルバー→ゴールド→プラチナ→ダイヤモンド→マスター→レジェンド）
- **ハピネスメーター**: 本日の平均スコアをemoji（😄😊🙂😐）で可視化
- **Confetti**: 日次目標達成時にアニメーション表示
- **ストリークマイルストーン**: 3日/7日/14日/30日/60日/90日の連続記録バッジ（休診日は自動スキップ）
- **エンカレッジメント**: 状況に応じた動的メッセージ（目標残り僅か/高スコア/ストリーク中/時間帯別）
- **今週の実績**: 今週の回答数・平均スコア・曜日別チャート（目標ライン付き）
- **通算マイルストーン**: 50/100/250/500/1,000/2,000/5,000/10,000件到達バッジ
- **改善アクション表示**: 実施中の改善アクション上位5件を現在スコア付きで表示

### 管理者ダッシュボードの分析機能
- **InsightCards**: スコア推移（前月比較）、低スコア質問の自動検出、月次レポート入力促進、高満足度維持通知を自動生成
- **分析ページ（/dashboard/analytics）**: 期間セレクタ（7/30/90/180/365日）で以下を動的切替
  - テンプレート別スモールマルチプル: 初診/治療中/定期検診ごとの加重平均スコア + 前期比較（↑↓→トレンド矢印）+ ミニチャート
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
│   │   ├── analytics/             # 分析ページ（期間セレクタ付き）
│   │   ├── actions/               # 改善アクション管理
│   │   ├── staff/                 # スタッフ管理
│   │   ├── surveys/               # 回答一覧
│   │   ├── metrics/               # 月次レポート
│   │   ├── settings/              # 設定
│   │   └── survey-start/          # アンケート開始（→dashboard）
│   ├── (admin)/admin/             # システム管理者画面
│   │   ├── tips/                  # ヒント管理
│   │   └── backups/               # バックアップ管理
│   └── api/                       # API Route Handlers
├── components/
│   ├── ui/                        # shadcn/ui コンポーネント
│   ├── layout/                    # サイドバー、ヘッダー、ボトムナビ
│   ├── survey/                    # アンケート関連（Confetti含む）
│   ├── dashboard/                 # ダッシュボード関連（19コンポーネント）
│   ├── staff/                     # スタッフ管理関連
│   ├── settings/                  # 設定関連
│   └── landing/                   # LP関連
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
│   ├── validations/               # Zod スキーマ
│   └── queries/                   # DB クエリ関数（5モジュール）
└── types/                         # TypeScript 型定義
```

## ダッシュボードコンポーネント一覧（`src/components/dashboard/`）

| コンポーネント | 用途 |
|--------------|------|
| `analytics-charts.tsx` | 分析ページのクライアント側オーケストレーター。期間セレクタ（7/30/90/180/365日）でAPI再取得 |
| `template-trend-small-multiples.tsx` | テンプレート別スモールマルチプル。前期比較（prevData）、加重平均スコア、トレンド矢印、ミニチャート |
| `template-trend-chart.tsx` | テンプレート別日次推移チャート（折れ線グラフ） |
| `daily-trend-chart.tsx` | 日次回答数+平均スコアの複合チャート（棒+線） |
| `question-breakdown.tsx` | テンプレートごとの設問別平均スコア。展開可能な詳細行 |
| `satisfaction-heatmap.tsx` | 曜日×時間帯の満足度ヒートマップ。期間セレクタ連動 |
| `staff-leaderboard.tsx` | スタッフ別月次/通算回答数ランキング |
| `staff-engagement.tsx` | スタッフダッシュボードの主コンポーネント。日次目標、週間チャート、マイルストーンバッジ、ランク、ポジティブコメント、改善アクション表示 |
| `insight-cards.tsx` | 自動生成インサイト: スコア推移、低スコア質問検出、月次レポート促進、高満足度通知 |
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

### 月次レポート・設定系（管理者認証必須）
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
| `getQuestionBreakdownByDays(clinicId, days=30)` | `TemplateQuestionScores[]` | 設問別平均スコア（日数指定、分析ページ用） |
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
- **SurveyTemplate**: questions: JSONB（初診/治療中/定期検診の3テンプレート）、isActive フラグ
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
- 治療種別: 治療、定期検診、相談
- 主訴: 痛み・違和感、詰め物・被せ物、歯周病・歯ぐき、審美、予防、矯正、入れ歯・インプラント、その他
- 年代: ~20代、30代、40代、50代、60代~
- 性別: 男性、女性、未回答

### 改善アクション提案（11カテゴリ）
clinic_environment / reception / wait_time / hearing / explanation / cost_explanation / comfort / pain_care / staff_courtesy / booking / loyalty（各3件の定型提案）

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
- `staff` / `kiosk` / `patientSetup` / `dailyTip` / `tipManager` / `settings` / `nav` / `admin` / `operatorMode` / `backup` / `landing`

**患者満足度向上ヒント**: 30件・12カテゴリ（接遇、コミュニケーション、不安軽減、院内環境、待ち時間、チーム連携、初診対応、治療説明、フォローアップ、予防指導、小児対応、高齢者対応）— `src/lib/patient-tips.ts`
**歯の豆知識**: 60件・7カテゴリ（ブラッシング、虫歯予防、歯周病、食事・栄養、定期検診・予防、生活習慣、お子さまの歯）— `src/lib/constants.ts` の `DENTAL_TIPS`

## デモデータ（seed — `prisma/seed.ts`）

### アカウント
- クリニック: "MIERU デモ歯科クリニック" (slug: demo-dental, 管理者パスワード: 1111)
- ユーザー: mail@function-t.com / MUNP1687 (system_admin), clinic@demo.com / clinic123 (clinic_admin)
- スタッフ: 田中花子(衛生士), 佐藤太郎(歯科医師), 鈴木美咲(スタッフ)
- テンプレート: 初診(8問), 治療中(6問), 定期検診(6問)

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

### 月次レポート
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
- **分析ページの期間セレクタ**: 7/30/90/180/365日の5段階。サーバーサイドで初期データ（30日分）をプリフェッチし、クライアント側で期間変更時にAPIを再取得
- **テンプレート別スモールマルチプルの前期比較**: 同じ日数の前期間データをoffsetパラメータで取得し、加重平均スコアの差分でトレンド矢印（↑↓→）を表示
- **ストリークの休診日スキップ**: 定休日（regularClosedDays）と臨時休診日（closedDates）をストリーク計算から除外。休診日に回答がなくてもストリークが途切れない

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

## 参考URL
- 公式: https://mieru-clinic.com/
- 訴訟勝訴: https://note.com/dentalmania88/n/n1dfe8d9ff1f6
- 口コミ削除解説: https://function-t.com/delete_2025.html
- LUCHT研修: https://function-t.com/9253.html
