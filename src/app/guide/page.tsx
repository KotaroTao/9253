import type { Metadata } from "next"
import { APP_NAME } from "@/lib/constants"
import {
  Tablet,
  BarChart3,
  Users,
  Settings,
  Target,
  FileBarChart,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Crown,
  Wrench,
  ShieldCheck,
  Sparkles,
  Trophy,
  Flame,
} from "lucide-react"

export const metadata: Metadata = {
  title: `使い方ガイド | ${APP_NAME}`,
  robots: "noindex, nofollow",
}

function SectionTitle({ id, number, title, icon: Icon }: {
  id: string
  number: number
  title: string
  icon: React.ComponentType<{ className?: string }>
}) {
  return (
    <div id={id} className="scroll-mt-20 pt-8 first:pt-0">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <h2 className="text-xl font-bold sm:text-2xl">
          <span className="text-primary mr-2">{number}.</span>{title}
        </h2>
      </div>
    </div>
  )
}

function StepCard({ step, title, children }: {
  step: number
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="flex gap-4 rounded-lg border bg-card p-4">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
        {step}
      </div>
      <div>
        <h4 className="font-semibold mb-1">{title}</h4>
        <p className="text-sm text-muted-foreground leading-relaxed">{children}</p>
      </div>
    </div>
  )
}

function TipBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 my-4">
      <AlertCircle className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
      <p className="text-sm text-amber-800 leading-relaxed">{children}</p>
    </div>
  )
}

const tocItems = [
  { id: "overview", label: "サービス概要" },
  { id: "survey", label: "アンケートの実施" },
  { id: "dashboard-admin", label: "ダッシュボード" },
  { id: "analytics", label: "満足度レポート" },
  { id: "actions", label: "改善アクション" },
  { id: "metrics", label: "経営レポート" },
  { id: "staff", label: "スタッフ管理" },
  { id: "settings", label: "設定" },
  { id: "faq", label: "よくある質問" },
  { id: "troubleshooting", label: "困ったときは" },
]

export default function GuidePage() {
  return (
    <div className="min-h-screen bg-muted/20">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b bg-card/95 backdrop-blur">
        <div className="container flex h-14 items-center gap-3">
          <span className="text-lg font-bold text-primary">{APP_NAME}</span>
          <span className="text-sm text-muted-foreground">使い方ガイド</span>
        </div>
      </header>

      <div className="container py-8">
        <div className="mx-auto max-w-4xl lg:grid lg:max-w-6xl lg:grid-cols-[220px_1fr] lg:gap-10">
          {/* TOC Sidebar (desktop) */}
          <aside className="hidden lg:block">
            <nav className="sticky top-20 space-y-0.5">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">目次</p>
              {tocItems.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="block rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </aside>

          {/* Main content */}
          <main className="min-w-0 space-y-10">
            {/* Hero */}
            <div className="rounded-2xl border bg-card p-6 sm:p-8">
              <h1 className="text-2xl font-bold sm:text-3xl">{APP_NAME} 使い方ガイド</h1>
              <p className="mt-3 text-muted-foreground leading-relaxed">
                このガイドでは、{APP_NAME} の基本的な使い方を医院スタッフ向けにわかりやすく説明します。
                日々のアンケート運用からダッシュボードの見方、改善アクションの使い方まで、順を追ってご案内します。
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  <Tablet className="h-3 w-3" />患者体験の見える化
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  <BarChart3 className="h-3 w-3" />データで経営改善
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  <ShieldCheck className="h-3 w-3" />匿名・個人情報非収集
                </span>
              </div>
            </div>

            {/* 1. サービス概要 */}
            <section>
              <SectionTitle id="overview" number={1} title="サービス概要" icon={BarChart3} />
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {APP_NAME} は、歯科医院専用の<strong>患者満足度向上プラットフォーム</strong>です。
                  患者さまにタブレット（iPad等）でアンケートに回答いただき、その結果をリアルタイムで分析・可視化します。
                  集めたデータは「患者体験の改善」に直接つながる形で表示され、医院の日々の気づきと経営判断をサポートします。
                </p>
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    { icon: Tablet, title: "約3分アンケート", desc: "タブレットで患者さまが簡単回答" },
                    { icon: BarChart3, title: "自動分析", desc: "スコア・属性別・トレンドをリアルタイム集計" },
                    { icon: Target, title: "改善サイクル", desc: "データに基づく具体的な改善を実行" },
                  ].map((item, i) => (
                    <div key={i} className="rounded-lg border bg-card p-4 text-center">
                      <item.icon className="mx-auto h-8 w-8 text-primary mb-2" />
                      <p className="text-sm font-semibold">{item.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                    </div>
                  ))}
                </div>
                <TipBox>
                  {APP_NAME} は<strong>患者体験改善ツール</strong>であり、口コミ獲得を目的としたサービスではありません。
                  アンケートはすべて匿名・任意で、個人を特定する情報は収集しません。IPアドレスもハッシュ化して記録されます。
                </TipBox>
              </div>
            </section>

            {/* 2. アンケートの実施 */}
            <section>
              <SectionTitle id="survey" number={2} title="アンケートの実施" icon={Tablet} />
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  医院のタブレット（iPad等）で患者さまに回答いただきます。
                </p>

                <h3 className="text-base font-semibold mt-6 mb-3">医院端末でのアンケート手順</h3>
                <div className="space-y-3">
                  <StepCard step={1} title="アンケート画面を開く">
                    ダッシュボードまたはサイドバーにある「アンケート（医院端末）」ボタンをタップして、アンケートURLを開きます。
                  </StepCard>
                  <StepCard step={2} title="患者属性を入力">
                    来院種別（初診/再診）、診療区分（保険/自費）、診療内容、年代、性別を選択します。
                    来院種別に応じたアンケートテンプレートが自動で選ばれます。
                  </StepCard>
                  <StepCard step={3} title="患者さまに端末を渡す">
                    「アンケートを始める」ボタンを押してアンケート画面が表示されたら、患者さまにタブレットを渡します。
                  </StepCard>
                  <StepCard step={4} title="患者さまが回答">
                    各質問に5段階（星）で評価いただきます。最後にフリーテキスト欄（任意）もあります。
                    設問数にもよりますが、通常3分程度で回答が完了します。
                  </StepCard>
                  <StepCard step={5} title="回答完了">
                    回答完了後、サンクスページと歯の豆知識が表示されます。
                    医院LINEを登録している場合は、友達追加QRコードが表示されます（任意）。
                  </StepCard>
                </div>

                <TipBox>
                  アンケートのお願いは会計時に、「会計をお待ちの間に、アンケートのご協力をお願いします」とタブレットをお渡しするのがスムーズです。
                  アンケートお願いする際のコツは、「すべての患者様に（アンケートを）お願いするのが当たり前」というスタンスで臨むことです。
                </TipBox>

                <TipBox>
                  担当スタッフが選択されている場合、そのスタッフの回答数としてカウントされます。
                  スタッフリーダーボードに反映されるので、スタッフ選択をお忘れなく。
                </TipBox>
              </div>
            </section>

            {/* 3. ダッシュボード */}
            <section>
              <SectionTitle id="dashboard-admin" number={3} title="ダッシュボード" icon={BarChart3} />
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  ログイン後のダッシュボードは、<strong>ホーム画面</strong>と、オーナー権限でのみアクセスできる<strong>各種メニュー</strong>で構成されます。
                </p>

                <h3 className="text-base font-semibold mt-4">ホーム画面（全員共通）</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  オーナー・スタッフのどちらでログインしても最初に表示される画面です。
                  スタッフ権限のアカウントでは、このホーム画面のみが閲覧可能となります。
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border bg-card p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="h-4 w-4 text-amber-500" />
                      <h4 className="text-sm font-semibold">ハピネスメーター</h4>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      今日の平均スコアを絵文字で可視化。一目で患者さまの満足度がわかります。
                    </p>
                  </div>
                  <div className="rounded-lg border bg-card p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="h-4 w-4 text-blue-500" />
                      <h4 className="text-sm font-semibold">日次目標</h4>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      1日のアンケート目標件数。達成時はConfettiアニメーションで祝福されます。
                    </p>
                  </div>
                  <div className="rounded-lg border bg-card p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Flame className="h-4 w-4 text-orange-500" />
                      <h4 className="text-sm font-semibold">連続ストリーク</h4>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      目標を連続達成した日数。定休日は自動スキップ。3日/7日/14日/30日/60日/90日でバッジ獲得。
                    </p>
                  </div>
                  <div className="rounded-lg border bg-card p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Trophy className="h-4 w-4 text-purple-500" />
                      <h4 className="text-sm font-semibold">ランクシステム</h4>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      通算回答数に応じた8段階ランク（ルーキー→ブロンズ→シルバー→…→レジェンド）。
                    </p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  さらに、<strong>患者の声</strong>（フリーテキスト回答）や<strong>スタッフリーダーボード</strong>（回答数ランキング）もホーム画面から確認できます。
                </p>

                <h3 className="text-base font-semibold mt-6">サイドバーメニュー（オーナー限定）</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  オーナー権限でログインすると、サイドバーから以下の機能にアクセスできます。
                  一部の機能はスタンダードプラン以上でのみご利用いただけます。
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="pb-2 font-medium">メニュー</th>
                        <th className="pb-2 font-medium">内容</th>
                        <th className="pb-2 font-medium">必要プラン</th>
                      </tr>
                    </thead>
                    <tbody className="text-muted-foreground">
                      <tr className="border-b">
                        <td className="py-2 font-medium text-foreground">満足度レポート</td>
                        <td className="py-2">期間別・属性別のスコア分析、日次トレンド、ヒートマップ</td>
                        <td className="py-2 whitespace-nowrap"><span className="rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-700">スタンダード</span></td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 font-medium text-foreground">経営レポート</td>
                        <td className="py-2">来院数・売上・自費率からKPIを自動算出</td>
                        <td className="py-2 whitespace-nowrap"><span className="rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-700">スタンダード</span></td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 font-medium text-foreground">改善アクション</td>
                        <td className="py-2">分析に基づく改善施策の登録・進捗管理</td>
                        <td className="py-2 whitespace-nowrap"><span className="rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-700">スタンダード</span></td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 font-medium text-foreground">スタッフ管理</td>
                        <td className="py-2">スタッフの追加・編集・有効/無効切替、ログインアカウント発行</td>
                        <td className="py-2 whitespace-nowrap"><span className="rounded bg-green-100 px-2 py-0.5 text-xs text-green-700">フリー〜</span></td>
                      </tr>
                      <tr>
                        <td className="py-2 font-medium text-foreground">設定</td>
                        <td className="py-2">クリニック名、診療科目、定休日、アンケート完了後の誘導設定</td>
                        <td className="py-2 whitespace-nowrap"><span className="rounded bg-green-100 px-2 py-0.5 text-xs text-green-700">フリー〜</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <TipBox>
                  フリープランでは「スタンダード」バッジの機能はロック表示となります。サイドバーに鍵アイコンが表示された場合は、
                  スタンダードプランへのアップグレードが必要です。
                </TipBox>
              </div>
            </section>

            {/* 4. 満足度レポート */}
            <section>
              <SectionTitle id="analytics" number={4} title="満足度レポート" icon={BarChart3} />
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  患者満足度を多角的に分析できるレポート画面です。
                  <span className="ml-1 inline-flex items-center rounded bg-blue-100 px-1.5 py-0.5 text-xs text-blue-700">スタンダードプラン以上</span>
                </p>

                <h3 className="text-base font-semibold">使える分析機能</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {[
                    "期間セレクタ: 7日/30日/90日/180日/365日、またはカスタム日付範囲",
                    "患者属性フィルタ: 来院種別・診療区分・診療内容・年代・性別の5軸",
                    "テンプレート別スコア: 初診/再診ごとの加重平均スコアと前期比較（増減率を自動計算）",
                    "日次トレンド: 回答数と平均スコアの推移グラフ",
                    "質問別分析: 設問ごとの平均スコアを一覧表示",
                    "満足度ヒートマップ: 曜日×時間帯のスコア分布",
                    "スタッフリーダーボード: 月次/通算の回答数ランキング",
                    "アンケート個別閲覧: 1件ずつ全回答内容（スコア・フリーテキスト）を確認可能",
                  ].map((text, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{text}</span>
                    </li>
                  ))}
                </ul>

                <h3 className="text-base font-semibold mt-4">前期比較の見方</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  選択した期間（例: 直近30日）と、その1つ前の同じ長さの期間（例: その前の30日）を自動で比較します。
                  スコアの増減と回答数の変化が同時に表示されるので、施策の効果を数値で確認できます。
                </p>

                <TipBox>
                  患者属性フィルタは医院端末モードで回答されたアンケートのみが対象です。
                  属性データが記録されていない回答はフィルタ適用外となります。
                </TipBox>
              </div>
            </section>

            {/* 5. 改善アクション */}
            <section>
              <SectionTitle id="actions" number={5} title="改善アクション" icon={Target} />
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  分析結果をもとに、具体的な改善施策を登録・管理できます。
                  <span className="ml-1 inline-flex items-center rounded bg-blue-100 px-1.5 py-0.5 text-xs text-blue-700">スタンダードプラン以上</span>
                </p>

                <h3 className="text-base font-semibold mt-4 mb-3">改善アクションの流れ</h3>
                <div className="space-y-3">
                  <StepCard step={1} title="アクションを作成">
                    「新規アクション」からタイトル・説明・対象質問を入力して作成します。
                    「接遇」「待ち時間」「説明の分かりやすさ」などカテゴリ別の提案テンプレートから選ぶこともできます。
                  </StepCard>
                  <StepCard step={2} title="ベースラインスコアを確認">
                    作成時点の対象質問スコアがベースラインとして自動記録されます。
                  </StepCard>
                  <StepCard step={3} title="実施・記録">
                    アクション実施後、実施ログを記録していきます。
                    「こんなことをやった」「患者の反応」などを日付付きでメモできます。
                  </StepCard>
                  <StepCard step={4} title="効果測定">
                    一定期間後にスコアの変化を確認。ベースラインと比較して効果を検証します。
                    効果があれば継続、なければ別のアプローチに切り替えます。
                  </StepCard>
                </div>
                <TipBox>
                  改善アクションは「PDCAサイクル」を見える化する機能です。登録しただけで終わらせず、
                  週1回のミーティングで進捗を確認する運用が効果的です。
                </TipBox>
              </div>
            </section>

            {/* 6. 経営レポート */}
            <section>
              <SectionTitle id="metrics" number={6} title="経営レポート" icon={FileBarChart} />
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  月次の来院数・売上・自費率を入力することで、患者満足度と経営指標の相関を分析できます。
                  <span className="ml-1 inline-flex items-center rounded bg-blue-100 px-1.5 py-0.5 text-xs text-blue-700">スタンダードプラン以上</span>
                  <span className="ml-1 inline-flex items-center rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-700">オーナー限定</span>
                </p>
                <h3 className="text-base font-semibold mb-3">入力項目</h3>
                <div className="grid gap-2 sm:grid-cols-2">
                  {[
                    { label: "初診数", desc: "月間の新規患者数" },
                    { label: "再診数", desc: "月間の再診患者数" },
                    { label: "売上", desc: "月間総売上（万円）" },
                    { label: "自費率", desc: "自費診療の割合（%）" },
                  ].map((item, i) => (
                    <div key={i} className="rounded-md border bg-muted/30 p-3">
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                  ))}
                </div>
                <h3 className="text-base font-semibold mt-4 mb-3">自動算出される主なKPI</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {[
                    "患者単価（月次売上 ÷ 総来院数）",
                    "初診・再診比率",
                    "自費率の推移",
                    "満足度スコアと来院数の相関",
                    "前月比の増減（売上・来院数）",
                  ].map((text, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{text}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  レポートタブでは期間別のトレンドグラフも確認でき、過去のデータを振り返ることができます。
                </p>

                <h3 className="text-base font-semibold mt-6 mb-3 flex items-center gap-2">
                  <Crown className="h-4 w-4 text-amber-500" />
                  閲覧権限（オーナー限定）
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  経営レポートは機密性の高いデータを含むため、<strong>クリニックのオーナーアカウントのみが閲覧可能</strong>です。
                  同じ医院のスタッフ権限のログインアカウントでは経営レポートにアクセスできません。
                  これにより、1つのダッシュボードを複数のスタッフで利用する場合でも、院長（オーナー）のみが経営データを確認できます。
                </p>
                <div className="rounded-lg border bg-muted/30 p-4">
                  <h4 className="text-sm font-semibold mb-2">権限の仕組み</h4>
                  <ul className="space-y-1.5 text-xs text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <Crown className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                      <span><strong className="text-foreground">オーナー</strong>：経営レポート・設定・スタッフ管理を含むすべての機能にアクセス可能</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Users className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-500" />
                      <span><strong className="text-foreground">スタッフ</strong>：ダッシュボードのホーム画面（日次実績・ゲーミフィケーション）のみ閲覧可能</span>
                    </li>
                  </ul>
                </div>
                <TipBox>
                  オーナー権限の付与・変更は、スタッフ管理画面から行えます。旧バージョンにあった「4桁PINロック」機能は廃止され、
                  アカウント単位のロール（オーナー／スタッフ）で権限を分離する仕組みに変わりました。
                </TipBox>
              </div>
            </section>

            {/* 7. スタッフ管理 */}
            <section>
              <SectionTitle id="staff" number={7} title="スタッフ管理" icon={Users} />
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  スタッフの登録・編集・有効/無効の切替と、スタッフ個人ログインの発行ができます。
                </p>

                <h3 className="text-base font-semibold">基本操作</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>スタッフを追加すると、アンケート時の担当者選択に表示されます</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>スタッフを「無効」にすると、担当者選択から非表示になります（過去の回答データは保持）</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>スタッフリーダーボードで月次/通算の回答数ランキングが確認できます</span>
                  </li>
                </ul>

                <h3 className="text-base font-semibold mt-6">ログインアカウントの発行</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  スタッフ登録時に「ログインを有効化」することで、そのスタッフ用のメールアドレス＋パスワードを発行できます。
                  発行時に、以下2つの権限のどちらかを選択します。
                </p>
                <div className="space-y-2">
                  <div className="flex items-start gap-3 rounded-md border bg-card p-3">
                    <Crown className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                    <div>
                      <p className="text-sm font-medium">オーナー（clinic_admin）</p>
                      <p className="text-xs text-muted-foreground">
                        ダッシュボードの全機能にアクセス可能。経営レポート・設定・スタッフ管理を含みます。
                        院長・医院の管理者に割り当てます。
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-md border bg-card p-3">
                    <Users className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium">スタッフ（staff）</p>
                      <p className="text-xs text-muted-foreground">
                        ダッシュボードのホーム画面（日次実績・ゲーミフィケーション・患者の声）のみ閲覧可能。
                        経営レポート・設定・スタッフ管理にはアクセスできません。
                      </p>
                    </div>
                  </div>
                </div>

                <h3 className="text-base font-semibold mt-6">パスワードリセット</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  スタッフの編集画面から、オーナーが各スタッフのパスワードを再設定できます。
                  スタッフがパスワードを忘れた場合は、オーナーに依頼してください。
                </p>

                <TipBox>
                  「オーナー」「スタッフ」の権限はカード上にバッジで表示されます（👑オーナー / 🔑スタッフ）。
                  経営データを守るため、スタッフ個人のログインは「スタッフ」権限で発行することを推奨します。
                </TipBox>
              </div>
            </section>

            {/* 8. 設定 */}
            <section>
              <SectionTitle id="settings" number={8} title="設定" icon={Settings} />
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  クリニックの基本設定を管理できます。設定ページはオーナー権限でのみアクセスできます。
                </p>
                <div className="space-y-2">
                  {[
                    { title: "クリニック名", desc: "ダッシュボードやアンケートに表示される名前" },
                    { title: "診療科目", desc: "一般・矯正・小児・審美・口腔外科から選択。ベンチマーク基準や目標設定に使用されます" },
                    { title: "定休日（曜日指定）", desc: "毎週の定休曜日を登録。ストリーク計算や日次目標の算出から自動除外されます" },
                    { title: "アンケート完了後の誘導", desc: "「アンケートのみ終了」または「LINE友だち追加」の2択。LINE誘導を選ぶとサンクス画面にQRコードが表示されます" },
                    { title: "LINE公式アカウントURL", desc: "アンケート完了後に表示するLINE友だち追加リンク（任意）" },
                    { title: "医院ホームページURL", desc: "アンケート完了後に表示する医院HPリンク（任意）。LINE誘導の有無とは独立して設定可能" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3 rounded-md border bg-card p-3">
                      <Settings className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{item.title}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <TipBox>
                  旧バージョンにあった「経営レポートのPINロック」設定は廃止されました。
                  現在はスタッフ管理からアカウント単位で権限を切り替える方式となっています。
                </TipBox>
              </div>
            </section>

            {/* 9. FAQ */}
            <section>
              <SectionTitle id="faq" number={9} title="よくある質問" icon={HelpCircle} />
              <div className="space-y-4">
                {[
                  {
                    q: "患者さまの個人情報は収集されますか？",
                    a: "いいえ。MIERU Clinic は個人を特定する情報を一切収集しません。IPアドレスもハッシュ化して保存しており、個人の特定はできない設計です。",
                  },
                  {
                    q: "アンケートは何件まで実施できますか？",
                    a: "ご利用プランにより異なります。フリープランは月100件まで、スタンダードプラン以上は無制限です。",
                  },
                  {
                    q: "プランの違いは何ですか？",
                    a: "フリープラン（¥0）: 月100件・スタッフ1名・データ保持3ヶ月・基本ダッシュボードのみ。スタンダードプラン（¥19,800/月）: 回答無制限・スタッフ10名・満足度/経営レポート・改善アクション・LINE誘導・データ保持無制限。エンタープライズプラン（¥39,800/月〜）: 複数院の法人横断ダッシュボード・スタッフ無制限。",
                  },
                  {
                    q: "日次目標の件数はどう決まりますか？",
                    a: "前月の来院数（経営レポートの入力値）と診療日数から自動算出されます。前月データがない場合は過去30営業日の平均回答数が使われ、それもなければ1日10件のフォールバック値になります。目標を連続7日達成/未達成で目標レベル（乗数 0.3/0.4/0.5）が自動調整されます。",
                  },
                  {
                    q: "休診日にストリークは途切れますか？",
                    a: "いいえ。設定で登録された定休日（毎週の曜日指定）はストリーク計算から自動スキップされます。",
                  },
                  {
                    q: "テストでアンケートを試したい場合は？",
                    a: "アンケートURLの末尾に「?test=1」を付けてアクセスすることで、テストモードで回答できます。テストモードの回答はDBには保存されず、集計にも含まれません。",
                  },
                  {
                    q: "データはどのくらい保持されますか？",
                    a: "プランにより異なります。フリープランは3ヶ月、スタンダードプラン以上は無制限で保持されます。",
                  },
                  {
                    q: "サイドバーに鍵マークが付いたメニューがあります",
                    a: "その機能はスタンダードプラン以上でのみご利用いただけます。フリープランではロック表示となり、アップグレード案内が表示されます。",
                  },
                  {
                    q: "経営レポートが見られないスタッフがいます",
                    a: "経営レポートはオーナー権限のアカウントのみ閲覧可能です。スタッフ権限のアカウントではアクセスできません。これは旧バージョンの4桁PINロックに代わる権限管理です。必要に応じて、スタッフ管理画面からオーナー権限のアカウントを発行してください。",
                  },
                  {
                    q: "複数のスタッフで1つのアカウントを共有していますが問題ありませんか？",
                    a: "可能ですが推奨しません。現在はスタッフごとに個別ログインを発行できます。オーナー／スタッフの権限を使い分けることで、院長のみが経営データを閲覧し、スタッフはホーム画面（実績・ゲーミフィケーション）のみを見る運用ができます。",
                  },
                  {
                    q: "オーナー権限とスタッフ権限は何が違いますか？",
                    a: "オーナーは全機能（満足度レポート・経営レポート・改善アクション・スタッフ管理・設定）にアクセスできます。スタッフはダッシュボードのホーム画面のみ閲覧可能で、経営データや設定には一切アクセスできません。",
                  },
                  {
                    q: "スタッフのパスワードを忘れてしまいました",
                    a: "オーナー権限のアカウントからスタッフ管理画面を開き、該当スタッフの編集から新しいパスワードに再設定できます。",
                  },
                  {
                    q: "スマートフォンからもダッシュボードは見られますか？",
                    a: "はい。ダッシュボードはレスポンシブ対応しており、スマートフォンやタブレットからもご利用いただけます。",
                  },
                ].map((item, i) => (
                  <div key={i} className="rounded-lg border bg-card p-4">
                    <h4 className="flex items-start gap-2 text-sm font-semibold">
                      <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      {item.q}
                    </h4>
                    <p className="mt-2 pl-6 text-sm text-muted-foreground leading-relaxed">{item.a}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* 10. 困ったときは */}
            <section>
              <SectionTitle id="troubleshooting" number={10} title="困ったときは" icon={Wrench} />
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  よくあるトラブルと対処法をまとめています。
                </p>

                {[
                  {
                    problem: "アンケート画面が表示されない",
                    solutions: [
                      "インターネット接続を確認してください",
                      "ブラウザのキャッシュをクリアしてページを再読み込みしてください",
                      "アンケートURLが正しいか確認してください（/kiosk/[クリニックスラッグ]）",
                    ],
                  },
                  {
                    problem: "ダッシュボードにログインできない",
                    solutions: [
                      "メールアドレスとパスワードが正しいか確認してください",
                      "Caps Lockがオフになっているか確認してください",
                      "スタッフ個人ログインの場合は、オーナー権限のアカウントからスタッフ管理画面でパスワードを再設定してもらってください",
                    ],
                  },
                  {
                    problem: "経営レポート・設定・スタッフ管理のメニューが表示されない",
                    solutions: [
                      "ログイン中のアカウントが「スタッフ権限」になっている可能性があります。スタッフ権限ではホーム画面のみ閲覧可能です",
                      "経営レポートや設定にアクセスするには「オーナー権限」のアカウントでログインする必要があります",
                      "権限の変更が必要な場合は、現在のオーナーにスタッフ管理画面から権限を変更してもらってください",
                    ],
                  },
                  {
                    problem: "日次目標の件数がいつまでも変わらない",
                    solutions: [
                      "経営レポートのデータ入力ページで前月の来院数（初診数＋再診数）を入力してください",
                      "入力されると、翌日から自動算出された目標に切り替わります",
                      "経営レポートはオーナー権限のアカウントのみアクセス可能です",
                    ],
                  },
                  {
                    problem: "アンケート回答数がカウントされない",
                    solutions: [
                      "テストモード（?test=1 が付いたURL）で回答していないか確認してください。テスト回答は集計に含まれません",
                      "アンケートの最後（サンクス画面）まで回答が完了しているか確認してください",
                    ],
                  },
                  {
                    problem: "アンケート完了後にLINE友だち追加QRが表示されない",
                    solutions: [
                      "設定ページで「アンケート完了後の誘導」を「LINE友だち追加」に設定しているか確認してください",
                      "LINE公式アカウントのURLが正しく入力されているか確認してください",
                    ],
                  },
                  {
                    problem: "サイドバーのメニューに鍵マーク（ロック表示）が出ている",
                    solutions: [
                      "その機能はスタンダードプラン以上で利用可能です。フリープランではロック表示となります",
                      "メニューをクリックするとアップグレード案内画面が表示されます",
                      "プランの変更・契約については MIERU Clinic 運営までお問い合わせください",
                    ],
                  },
                  {
                    problem: "フリープランで月100件の上限に達した",
                    solutions: [
                      "フリープランは月100件までアンケート回答を受け付けられます",
                      "上限に達すると翌月1日にリセットされます",
                      "上限なしで利用したい場合はスタンダードプラン以上へのアップグレードをご検討ください",
                    ],
                  },
                ].map((item, i) => (
                  <div key={i} className="rounded-lg border bg-card p-4">
                    <h4 className="flex items-start gap-2 text-sm font-semibold">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />
                      {item.problem}
                    </h4>
                    <ul className="mt-2 space-y-1 pl-6">
                      {item.solutions.map((sol, j) => (
                        <li key={j} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <ArrowRight className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                          <span>{sol}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>

            {/* Privacy & Footer note */}
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-5">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-emerald-900">プライバシー・法令遵守について</h3>
                  <ul className="text-xs text-emerald-800 space-y-0.5">
                    <li>・{APP_NAME} は患者さまの氏名・連絡先など個人を特定する情報を一切収集しません</li>
                    <li>・IPアドレスはSHA-256でハッシュ化して記録され、個人の特定はできません</li>
                    <li>・アンケートはすべて匿名・任意での回答です</li>
                    <li>・医療広告ガイドラインに準拠した運用を行っています</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="rounded-lg border bg-muted/30 p-5 text-center">
              <p className="text-sm text-muted-foreground">
                ご不明な点がございましたら、医院のオーナー、または {APP_NAME} 運営までお問い合わせください。
              </p>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
