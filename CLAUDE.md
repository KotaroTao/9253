# MIERU Clinic - プロジェクトルール

## プロジェクト概要
- **サービス名**: MIERU Clinic（ミエル クリニック）
- **目的**: 医療機関専用 患者体験改善プラットフォーム
- **開発主体**: 株式会社ファンクション・ティ
- **ドメイン**: mieru-clinic.com（取得済み）
- **ブランチ**: `claude/mieru-clinic-redesign-hQ8z6`

## ポジショニング（重要）
- **主軸は「患者体験改善」**であり、口コミ獲得ツールではない
- KPI: 患者満足度スコア（primary）、レビュークリック率（secondary）
- LPやUI上で口コミ数をメイン指標にしない
- 数値は保守的に: アンケート協力率30-40%、レビュークリック率15-20%

## 技術スタック
- **フレームワーク**: Next.js 14+ (App Router) + TypeScript
- **UI**: Tailwind CSS + shadcn/ui
- **ORM**: Prisma + PostgreSQL
- **認証**: Auth.js v5 (Credentials Provider, JWT)
- **バリデーション**: Zod
- **チャート**: Recharts
- **QRコード**: react-qrcode-logo

## ディレクトリ構成
```
src/
├── app/
│   ├── (auth)/login/          # ログイン画面
│   ├── (survey)/s/[token]/    # 患者向けアンケート（認証不要）
│   ├── (dashboard)/dashboard/ # 医院管理者ダッシュボード
│   ├── (admin)/admin/         # システム管理者画面
│   └── api/                   # API Route Handlers
├── components/
│   ├── ui/                    # shadcn/ui コンポーネント
│   ├── layout/                # サイドバー、ヘッダー
│   ├── survey/                # アンケート関連
│   ├── dashboard/             # ダッシュボード関連
│   ├── staff/                 # スタッフ管理関連
│   └── landing/               # LP関連
├── lib/
│   ├── prisma.ts              # Prisma シングルトン
│   ├── utils.ts               # cn() ヘルパー
│   ├── messages.ts            # 日本語UIテキスト辞書
│   ├── constants.ts           # アプリ定数
│   ├── rate-limit.ts          # IP レート制限
│   ├── ip.ts                  # IP取得・ハッシュ化
│   ├── validations/           # Zod スキーマ
│   └── queries/               # DB クエリ関数
├── hooks/                     # カスタムフック
└── types/                     # TypeScript 型定義
```

## DB設計（5テーブル）
- **Clinic**: UUID主キー、settings: JSONB、enableReviewRequest
- **Staff**: UUID主キー、qrToken (unique UUID) = QRコードURL用
- **User**: email/password認証、role: system_admin / clinic_admin / staff
- **SurveyTemplate**: questions: JSONB（質問定義を柔軟に変更可能）
- **SurveyResponse**: answers: JSONB、overallScore (非正規化Float)、ipHash

## QRコードURL
```
https://app.mieru-clinic.com/s/{qrToken}
```
- ラミネートカード（物理固定）なのでURLは静的
- タイムスタンプ不使用（旧仕様の矛盾を修正）
- レート制限 + IPハッシュで防御

## ロール
| ロール | アクセス範囲 |
|--------|-------------|
| system_admin | /admin/* 全クリニック管理 |
| clinic_admin | /dashboard/* 自クリニックのみ |
| staff | MVP では未実装（将来対応） |

## コーディング規約
- 言語: TypeScript 厳格モード
- UIテキスト: 全て日本語。src/lib/messages.ts に集約
- API: NextResponse.json() でレスポンス。エラーは { error: "日本語メッセージ" }
- DB: Prisma モデル名は PascalCase、テーブル/カラム名は @@map で snake_case
- コンポーネント: サーバーコンポーネント優先。インタラクティブな場合のみ "use client"
- 認証ガード: 全 API Route で auth() チェック（/api/surveys/submit と /api/reviews/click は除外）

## 実装フェーズ
- Phase 0: スキャフォールド ✅
- Phase 1A: DB + ORM ✅
- Phase 1B: 認証
- Phase 1C: アンケートフロー（コア機能）
- Phase 1D: ダッシュボード
- Phase 1E: スタッフ管理
- Phase 1F: 設定
- Phase 1G: ランディングページ
- Phase 1H: システム管理
- Phase 1Z: ポリッシュ

## 先送り機能（MVPに含めない）
- カスタム質問編集UI / メール通知 / Google口コミスクレイピング
- CSV/PDFエクスポート / OAuth認証 / 自動テスト / 料金ページ / AI分析

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
