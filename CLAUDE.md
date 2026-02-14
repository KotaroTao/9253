# MIERU Clinic - プロジェクトルール

## プロジェクト概要
- **サービス名**: MIERU Clinic（ミエル クリニック）
- **目的**: 医療機関専用 患者体験改善プラットフォーム
- **開発主体**: 株式会社ファンクション・ティ
- **ドメイン**: mieru-clinic.com（取得済み）

## 本ツールの価値定義

### 解決する課題
歯科医院の院長は「患者がどう感じているか」を客観的に把握する手段がない。
口コミは極端な意見に偏り、スタッフからの報告はバイアスがかかる。
結果として、改善すべき点が見えないまま患者が離脱する。

### MIERU Clinicが提供する価値
1. **患者体験の可視化** — アンケートで満足度を定量化し、質問別スコアで改善ポイントを特定
2. **スタッフの行動習慣化** — 日次目標・ストリーク・マイルストーンで「アンケート配布」を日常業務に定着
3. **経営指標との接続** — 月次レポートで患者満足度と来院数・売上・自費率の相関を可視化
4. **Google口コミの自然な増加** — 満足度に関係なく全患者に同一の口コミ導線を表示（法令準拠）

### ポジショニング（重要）
- **主軸は「患者体験改善」**であり、口コミ獲得ツールではない
- KPI: 患者満足度スコア（primary）、レビュークリック率（secondary）
- LPやUI上で口コミ数をメイン指標にしない
- 数値は保守的に: アンケート協力率30-40%、レビュークリック率15-20%

### 競合との差別化
- 口コミツールではなく「患者体験改善」が主軸（医療広告ガイドライン準拠）
- キオスクモード対応（iPad受付運用、スタッフが患者に手渡し）
- スタッフのモチベーション設計（ゲーミフィケーション）
- 月次経営指標との統合ダッシュボード

## 現在の実装状況（MVP完成済み）

### 実装済み機能一覧

| 機能 | 状態 | 概要 |
|------|------|------|
| 認証 | ✅ | Credentials認証、JWT、ロール別リダイレクト |
| 患者アンケートフロー | ✅ | QR→ウェルカム→回答→サンクス→口コミ導線 |
| キオスクモード | ✅ | iPad受付用。患者属性入力→テンプレート自動選択→自動リセット |
| ダッシュボード（スタッフ） | ✅ | 挨拶、患者満足度向上のヒント、日次目標、ストリーク、マイルストーン、ポジティブコメント |
| ダッシュボード（管理者） | ✅ | 満足度スコア、推移チャート、質問別分析、改善提案、ベンチマーク |
| スタッフ管理 | ✅ | CRUD、QRコード生成・ダウンロード・印刷 |
| 月次レポート | ✅ | 来院数・売上・自費率・Google口コミ入力、8+KPI自動算出 |
| 回答一覧 | ✅ | ページネーション、患者属性表示、フリーテキスト |
| 患者満足度向上のヒント編集 | ✅ | clinic_admin/system_adminがダッシュボードからヒントを編集可能。Clinic.settings JSONBに保存 |
| 設定 | ✅ | クリニック名、管理者パスワード |
| 管理者モード | ✅ | パスワード認証、Cookie、8時間セッション |
| システム管理 | ✅ | 全クリニック一覧、プラットフォーム統計 |
| ランディングページ | ✅ | ヒーロー、特徴、フロー、FAQ、CTA |

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
│   └── api/                       # API Route Handlers
├── components/
│   ├── ui/                        # shadcn/ui コンポーネント
│   ├── layout/                    # サイドバー、ヘッダー、ボトムナビ
│   ├── survey/                    # アンケート関連
│   ├── dashboard/                 # ダッシュボード関連
│   ├── staff/                     # スタッフ管理関連
│   ├── settings/                  # 設定関連
│   └── landing/                   # LP関連
├── lib/
│   ├── prisma.ts                  # Prisma シングルトン
│   ├── utils.ts                   # cn() ヘルパー
│   ├── messages.ts                # 日本語UIテキスト辞書（350+キー）
│   ├── constants.ts               # アプリ定数
│   ├── admin-mode.ts              # 管理者モードCookie制御
│   ├── rate-limit.ts              # IP レート制限
│   ├── ip.ts                      # IP取得・ハッシュ化
│   ├── validations/               # Zod スキーマ
│   └── queries/                   # DB クエリ関数（6モジュール）
├── hooks/                         # カスタムフック
└── types/                         # TypeScript 型定義
```

## DB設計（6テーブル）
- **Clinic**: UUID主キー、settings: JSONB（adminPasswordハッシュ、dailyTipカスタム設定を格納）
- **Staff**: UUID主キー、qrToken (unique UUID) = QRコードURL用
- **User**: email/password認証、role: system_admin / clinic_admin / staff
- **SurveyTemplate**: questions: JSONB（初診/治療中/定期検診の3テンプレート）
- **SurveyResponse**: answers: JSONB、overallScore、freeText、patientAttributes、ipHash
- **MonthlyClinicMetrics**: 月次経営指標（来院数、売上、Google口コミ等）

## デモデータ（seed）
- クリニック: "MIERU デモ歯科クリニック" (slug: demo-dental, パスワード: 1111)
- スタッフ: 田中花子(衛生士), 佐藤太郎(歯科医師), 鈴木美咲(スタッフ)
- テンプレート: 初診(8問), 治療中(6問), 定期検診(6問)
- ユーザー: mail@function-t.com / MUNP1687 (system_admin), clinic@demo.com / clinic123 (clinic_admin)

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

## 管理者モード
- ダッシュボードはデフォルトで「スタッフビュー」（日次目標、ストリーク）
- 管理者パスワードで「管理者ビュー」に切替（分析、スタッフ管理、設定等）
- Cookie制御、8時間でセッション切れ
- デフォルトパスワード: 1111

## コーディング規約
- 言語: TypeScript 厳格モード
- UIテキスト: 全て日本語。src/lib/messages.ts に集約
- API: NextResponse.json() でレスポンス。エラーは { error: "日本語メッセージ" }
- DB: Prisma モデル名は PascalCase、テーブル/カラム名は @@map で snake_case
- コンポーネント: サーバーコンポーネント優先。インタラクティブな場合のみ "use client"
- 認証ガード: 全 API Route で auth() チェック（/api/surveys/submit は除外）

## 先送り機能（MVPに含めない）
- カスタム質問編集UI / メール通知 / Google口コミスクレイピング
- CSV/PDFエクスポート / OAuth認証 / 自動テスト / 料金ページ
- AI分析（実データ蓄積後に検証してから判断）
- 従業員サーベイ（削除済み — コア価値に集中）

## 法令遵守（絶対要件）
- レビューゲーティング禁止: 満足度に関係なく全員に同一画面表示
- 個人情報非収集: IPはSHA-256ハッシュのみ保存
- Googleポリシー準拠: 患者自身の端末から任意投稿
- 「※ご投稿は任意です」の文言を口コミ誘導画面に必ず表示

## 参考URL
- 公式: https://mieru-clinic.com/
- 訴訟勝訴: https://note.com/dentalmania88/n/n1dfe8d9ff1f6
- 口コミ削除解説: https://function-t.com/delete_2025.html
- LUCHT研修: https://function-t.com/9253.html
