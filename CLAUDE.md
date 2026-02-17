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
| 患者アンケートフロー | ✅ | QR→ウェルカム→回答（プログレスバー付き）→サンクス→歯の豆知識 |
| キオスクモード | ✅ | iPad受付用。患者属性入力→テンプレート自動選択→自動リセット |
| ダッシュボード（スタッフ） | ✅ | 挨拶、エンカレッジメント、ランクシステム、ハピネスメーター、日次目標（Confetti付き）、ストリーク（マイルストーンバッジ付き）、今週の実績、患者の声、通算マイルストーン、ヒント |
| ダッシュボード（管理者） | ✅ | 満足度スコア（トレンドバッジ付き）、InsightCards（自動改善提案）、質問別分析、推移チャート、回答一覧 |
| スタッフ管理 | ✅ | CRUD、QRコード生成・ダウンロード・印刷 |
| 月次レポート | ✅ | 来院数・売上・自費率・Google口コミ入力、8+KPI自動算出 |
| 回答一覧 | ✅ | ページネーション、患者属性表示、フリーテキスト |
| 患者満足度向上のヒント | ✅ | プラットフォーム全体管理（/admin/tips）、クリニック個別カスタム（Clinic.settings JSONB）、ローテーション表示 |
| 設定 | ✅ | クリニック名、管理者パスワード |
| 改善アクション管理 | ✅ | 作成・完了・削除、InsightCardsからの質問プリセレクト遷移、ベースライン/結果スコア記録 |
| 満足度ヒートマップ | ✅ | 曜日×時間帯の満足度分布を管理者ダッシュボードに表示 |
| 運営モード | ✅ | system_admin用の全クリニック横断管理ダッシュボード |
| ビュー切替 | ✅ | ヘッダー右上でスタッフ/管理者ビューをロールベースで切替（旧管理者モード廃止） |
| システム管理 | ✅ | 全クリニック一覧、プラットフォーム統計、ヒント管理 |
| ランディングページ | ✅ | ヒーロー、特徴、フロー、FAQ、CTA |

### スタッフダッシュボードのゲーミフィケーション機能
- **ランクシステム**: 通算回答数に応じた8段階（ルーキー→ブロンズ→シルバー→ゴールド→プラチナ→ダイヤモンド→マスター→レジェンド）
- **ハピネスメーター**: 本日の平均スコアをemoji（😄😊🙂😐）で可視化
- **Confetti**: 日次目標達成時にアニメーション表示
- **ストリークマイルストーン**: 3日/7日/14日/30日/60日/90日の連続記録バッジ
- **エンカレッジメント**: 状況に応じた動的メッセージ（目標残り僅か/高スコア/ストリーク中/時間帯別）
- **今週の実績**: 今週の回答数・平均スコア表示

### 管理者ダッシュボードのインサイト機能
- **InsightCards**: スコア推移（前月比較）、低スコア質問の自動検出、月次レポート入力促進、高満足度維持通知を自動生成

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
- **QRコード**: react-qrcode-logo
- **パスワード**: bcryptjs
- **日付**: date-fns

## ディレクトリ構成
```
src/
├── app/
│   ├── page.tsx                   # ランディングページ
│   ├── (auth)/login/              # ログイン画面
│   ├── (survey)/s/[token]/        # 患者向けアンケート（認証不要）
│   ├── (kiosk)/kiosk/[token]/     # キオスクモード（認証不要）
│   ├── (dashboard)/dashboard/     # ダッシュボード
│   │   ├── staff/                 # スタッフ管理
│   │   ├── surveys/               # 回答一覧
│   │   ├── metrics/               # 月次レポート
│   │   ├── settings/              # 設定
│   │   └── survey-start/          # アンケート開始（→dashboard）
│   ├── (admin)/admin/             # システム管理者画面
│   │   └── tips/                  # ヒント管理
│   └── api/                       # API Route Handlers
├── components/
│   ├── ui/                        # shadcn/ui コンポーネント
│   ├── layout/                    # サイドバー、ヘッダー、ボトムナビ
│   ├── survey/                    # アンケート関連（Confetti含む）
│   ├── dashboard/                 # ダッシュボード関連（InsightCards含む）
│   ├── staff/                     # スタッフ管理関連
│   ├── settings/                  # 設定関連
│   └── landing/                   # LP関連
├── lib/
│   ├── prisma.ts                  # Prisma シングルトン
│   ├── utils.ts                   # cn() ヘルパー
│   ├── messages.ts                # 日本語UIテキスト辞書
│   ├── constants.ts               # アプリ定数（ランク、ストリークマイルストーン等）
│   ├── patient-tips.ts            # 患者満足度向上ヒント（30件）+ ローテーション
│   ├── admin-mode.ts              # 管理者モードCookie制御
│   ├── rate-limit.ts              # IP レート制限
│   ├── ip.ts                      # IP取得・ハッシュ化
│   ├── validations/               # Zod スキーマ
│   └── queries/                   # DB クエリ関数（5モジュール）
├── hooks/                         # カスタムフック
└── types/                         # TypeScript 型定義
```

## DB設計（8テーブル）
- **Clinic**: UUID主キー、settings: JSONB（adminPasswordハッシュ、dailyGoal、dailyTipカスタム設定を格納）
- **Staff**: UUID主キー、qrToken (unique UUID) = QRコードURL用
- **User**: email/password認証、role: system_admin / clinic_admin / staff
- **SurveyTemplate**: questions: JSONB（初診/治療中/定期検診の3テンプレート）
- **SurveyResponse**: answers: JSONB、overallScore、freeText、patientAttributes、ipHash
- **ImprovementAction**: 改善アクション履歴（baselineScore→resultScore、status: active/completed/cancelled）
- **MonthlyClinicMetrics**: 月次経営指標（来院数、売上、Google口コミ等）
- **PlatformSetting**: key-value形式のプラットフォーム設定（患者ヒント管理、ローテーション間隔等）

### DBクエリモジュール（`src/lib/queries/`）
| ファイル | 内容 |
|---------|------|
| `clinics.ts` | クリニック取得・設定更新 |
| `stats.ts` | ダッシュボード統計（getDashboardStats, getCombinedMonthlyTrends, getQuestionBreakdown等） |
| `engagement.ts` | スタッフエンゲージメント（getStaffEngagementData — ランク・ストリーク・日次目標） |
| `staff.ts` | スタッフCRUD・リーダーボード |
| `surveys.ts` | アンケート回答取得・作成 |

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

## QRコードURL
```
https://app.mieru-clinic.com/s/{clinicSlug}
```
- ラミネートカード（物理固定）なのでURLは静的
- レート制限 + IPハッシュで防御

## ロール
| ロール | アクセス範囲 |
|--------|-------------|
| system_admin | /admin/* 全クリニック管理 + /dashboard/* |
| clinic_admin | /dashboard/* 自クリニックのみ |
| staff | ダッシュボード（スタッフビュー）のみ |

## ビュー切替（ロールベース）
- ダッシュボードはデフォルトで「スタッフビュー」（日次目標、ストリーク、ランク等）
- clinic_admin / system_admin はヘッダー右上のトグルで「管理者ビュー」に切替（分析、スタッフ管理、設定等）
- staff ロールは管理者ビューへの切替不可
- ※旧パスワード認証方式の管理者モードは廃止済み

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
- **管理者モード→ロールベースビュー切替に変更**: パスワード認証+Cookie方式を廃止し、ユーザーロール（clinic_admin/system_admin）による切替に簡素化
- **改善アクションとスコアの連動**: seedデータでは改善アクションの開始月からスコアへの効果が徐々に反映される設計。デモ時にスコア推移と改善施策の因果関係を説明可能
- **決定的乱数によるseedデータ**: rng seed固定により毎回同一データを生成。デモ・スクリーンショットの再現性を保証

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
- **バックアップ**: 毎日 03:00 JST
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
