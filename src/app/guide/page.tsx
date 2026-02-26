import type { Metadata } from "next"
import { APP_NAME } from "@/lib/constants"
import {
  Tablet,
  BarChart3,
  Users,
  Settings,
  Target,
  Brain,
  FileBarChart,
  Smartphone,
  ArrowRight,
  Star,
  MessageSquare,
  Trophy,
  Flame,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Lock,
  Wrench,
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
  { id: "dashboard-staff", label: "スタッフダッシュボード" },
  { id: "dashboard-admin", label: "管理者ダッシュボード" },
  { id: "analytics", label: "満足度レポート" },
  { id: "actions", label: "改善アクション" },
  { id: "advisory", label: "AI分析レポート" },
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
                このガイドでは、MIERU PX の基本的な使い方を医院スタッフ向けにわかりやすく説明します。
                日々のアンケート運用からダッシュボードの見方、改善アクションの使い方まで、
                順を追ってご案内します。
              </p>
            </div>

            {/* 1. サービス概要 */}
            <section>
              <SectionTitle id="overview" number={1} title="サービス概要" icon={BarChart3} />
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  MIERU PX は、歯科医院専用の患者満足度向上プラットフォームです。
                  患者さまにタブレットでアンケートに回答いただき、その結果をリアルタイムで分析・可視化します。
                </p>
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    { icon: Tablet, title: "30秒アンケート", desc: "タブレットで簡単回答" },
                    { icon: BarChart3, title: "自動分析", desc: "回答データをリアルタイム集計" },
                    { icon: Target, title: "改善サイクル", desc: "データに基づく改善を実行" },
                  ].map((item, i) => (
                    <div key={i} className="rounded-lg border bg-card p-4 text-center">
                      <item.icon className="mx-auto h-8 w-8 text-primary mb-2" />
                      <p className="text-sm font-semibold">{item.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* 2. アンケートの実施 */}
            <section>
              <SectionTitle id="survey" number={2} title="アンケートの実施" icon={Tablet} />
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  アンケートは「医院端末モード」で実施します。受付のタブレット（iPad等）で
                  患者さまに回答いただきます。
                </p>

                <h3 className="text-base font-semibold mt-6 mb-3">医院端末でのアンケート手順</h3>
                <div className="space-y-3">
                  <StepCard step={1} title="アンケート画面を開く">
                    ダッシュボードのサイドバーにある「アンケート（医院端末）」ボタンをタップするか、
                    ブックマークしたアンケートURLを開きます。
                  </StepCard>
                  <StepCard step={2} title="患者属性を入力">
                    来院種別（初診/再診）、診療区分（保険/自費）、診療内容、年代、性別を選択します。
                    来院種別に応じたアンケートテンプレートが自動で選ばれます。
                  </StepCard>
                  <StepCard step={3} title="患者さまに端末を渡す">
                    「アンケートを始める」ボタンが表示されたら、患者さまにタブレットを渡します。
                  </StepCard>
                  <StepCard step={4} title="患者さまが回答">
                    各質問に5段階（星）で評価いただきます。最後にフリーテキスト欄（任意）もあります。
                    約30秒で完了します。
                  </StepCard>
                  <StepCard step={5} title="自動リセット">
                    回答完了後、サンクスページと歯の豆知識が表示されます。
                    一定時間後に自動的に次の患者さまの入力画面に戻ります。
                  </StepCard>
                </div>

                <TipBox>
                  担当スタッフが選択されている場合、そのスタッフの回答数としてカウントされます。
                  スタッフリーダーボードに反映されるので、スタッフ選択をお忘れなく。
                </TipBox>
              </div>
            </section>

            {/* 3. スタッフダッシュボード */}
            <section>
              <SectionTitle id="dashboard-staff" number={3} title="スタッフダッシュボード" icon={Trophy} />
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  ダッシュボードのホーム画面では、今日の実績やモチベーションを高めるゲーミフィケーション要素が表示されます。
                </p>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border bg-card p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Star className="h-4 w-4 text-amber-500" />
                      <h4 className="text-sm font-semibold">ハピネスメーター</h4>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      今日の平均スコアを絵文字で表示。一目で患者さまの満足度がわかります。
                    </p>
                  </div>
                  <div className="rounded-lg border bg-card p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="h-4 w-4 text-blue-500" />
                      <h4 className="text-sm font-semibold">日次目標</h4>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      1日のアンケート目標件数。達成するとConfettiアニメーションで祝福されます。
                    </p>
                  </div>
                  <div className="rounded-lg border bg-card p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Flame className="h-4 w-4 text-orange-500" />
                      <h4 className="text-sm font-semibold">連続ストリーク</h4>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      目標を連続達成した日数。休診日は自動スキップされます。3日/7日/14日/30日/60日/90日でバッジ獲得。
                    </p>
                  </div>
                  <div className="rounded-lg border bg-card p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Trophy className="h-4 w-4 text-purple-500" />
                      <h4 className="text-sm font-semibold">ランクシステム</h4>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      通算回答数に応じた8段階ランク（ルーキー→レジェンド）。積み重ねが可視化されます。
                    </p>
                  </div>
                </div>

                <div className="rounded-lg border bg-card p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="h-4 w-4 text-emerald-500" />
                    <h4 className="text-sm font-semibold">患者の声</h4>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    フリーテキストで寄せられた患者さまの声が表示されます。良いフィードバックはモチベーションに、
                    改善点は具体的なアクションのヒントになります。
                  </p>
                </div>
              </div>
            </section>

            {/* 4. 管理者ダッシュボード */}
            <section>
              <SectionTitle id="dashboard-admin" number={4} title="管理者ダッシュボード" icon={BarChart3} />
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  管理者（clinic_admin）がアクセスできる追加機能です。サイドバーから各ページに移動できます。
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="pb-2 font-medium">メニュー</th>
                        <th className="pb-2 font-medium">内容</th>
                      </tr>
                    </thead>
                    <tbody className="text-muted-foreground">
                      <tr className="border-b">
                        <td className="py-2 font-medium text-foreground">満足度レポート</td>
                        <td className="py-2">期間別・属性別のスコア分析、日次トレンド、ヒートマップ</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 font-medium text-foreground">経営レポート</td>
                        <td className="py-2">来院数・売上・自費率からKPIを自動算出</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 font-medium text-foreground">AI分析</td>
                        <td className="py-2">回答データに基づくAIによる自動分析・改善提案</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 font-medium text-foreground">改善アクション</td>
                        <td className="py-2">分析に基づく改善施策の登録・進捗管理</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 font-medium text-foreground">スタッフ管理</td>
                        <td className="py-2">スタッフの追加・編集・有効/無効切替</td>
                      </tr>
                      <tr>
                        <td className="py-2 font-medium text-foreground">設定</td>
                        <td className="py-2">クリニック名、営業日、定休日、アンケート完了後の設定</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* 5. 満足度レポート */}
            <section>
              <SectionTitle id="analytics" number={5} title="満足度レポート" icon={BarChart3} />
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  患者満足度を多角的に分析できるレポート画面です。
                </p>

                <h3 className="text-base font-semibold">使える分析機能</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {[
                    "期間セレクタ: 7日/30日/90日/180日/365日、またはカスタム日付範囲",
                    "患者属性フィルタ: 来院種別・診療区分・診療内容・年代・性別の5軸",
                    "テンプレート別スコア: 初診/再診ごとの加重平均スコアと前期比較",
                    "日次トレンド: 回答数と平均スコアの推移グラフ",
                    "質問別分析: 設問ごとの平均スコアを一覧表示",
                    "満足度ヒートマップ: 曜日×時間帯のスコア分布",
                    "スタッフリーダーボード: 月次/通算の回答数ランキング",
                  ].map((text, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{text}</span>
                    </li>
                  ))}
                </ul>
                <TipBox>
                  患者属性フィルタは医院端末モードで回答されたアンケートのみが対象です。
                  属性データが記録されていない回答はフィルタ適用外となります。
                </TipBox>
              </div>
            </section>

            {/* 6. 改善アクション */}
            <section>
              <SectionTitle id="actions" number={6} title="改善アクション" icon={Target} />
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  分析結果をもとに、具体的な改善施策を登録・管理できます。
                </p>

                <h3 className="text-base font-semibold mt-4 mb-3">改善アクションの流れ</h3>
                <div className="space-y-3">
                  <StepCard step={1} title="アクションを作成">
                    「新規アクション」からタイトル・説明・対象質問を入力して作成します。
                    カテゴリ別の提案テンプレートも利用できます。
                  </StepCard>
                  <StepCard step={2} title="ベースラインスコアを確認">
                    作成時点の対象質問スコアがベースラインとして自動記録されます。
                  </StepCard>
                  <StepCard step={3} title="実施・記録">
                    アクション実施後、実施ログを記録していきます。
                    「こんなことをやった」「患者の反応」などをメモできます。
                  </StepCard>
                  <StepCard step={4} title="効果測定">
                    一定期間後にスコアの変化を確認。ベースラインと比較して効果を検証します。
                  </StepCard>
                </div>
              </div>
            </section>

            {/* 7. AI分析レポート */}
            <section>
              <SectionTitle id="advisory" number={7} title="AI分析レポート" icon={Brain} />
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  一定数の回答が蓄積されると、AIが自動的にデータを分析し、強み・改善点・推奨アクションを提案します。
                </p>
                <div className="rounded-lg border bg-card p-4">
                  <h4 className="text-sm font-semibold mb-2">レポートに含まれる内容</h4>
                  <ul className="space-y-1.5 text-xs text-muted-foreground">
                    {[
                      "総合評価と満足度トレンド",
                      "強み（高スコア質問の分析）",
                      "改善ポイント（低スコア質問の分析）",
                      "具体的な推奨アクション",
                      "患者セグメント分析",
                      "時間帯・曜日パターン",
                    ].map((text, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <ArrowRight className="h-3 w-3 shrink-0 text-primary" />
                        <span>{text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <TipBox>
                  ダッシュボードのプログレスバーで「次のAI分析まであと何件」が確認できます。
                  アンケート回答を積み重ねることで新しいレポートが生成されます。
                </TipBox>
              </div>
            </section>

            {/* 8. 経営レポート */}
            <section>
              <SectionTitle id="metrics" number={8} title="経営レポート" icon={FileBarChart} />
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  月次の来院数・売上・自費率を入力することで、患者満足度と経営指標の相関を分析できます。
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
                <p className="text-sm text-muted-foreground leading-relaxed">
                  入力データから「患者単価」「満足度→来院数相関」などのKPIが自動算出されます。
                  レポートタブでは期間別のトレンドグラフも確認できます。
                </p>

                <h3 className="text-base font-semibold mt-6 mb-3 flex items-center gap-2">
                  <Lock className="h-4 w-4 text-violet-500" />
                  PINロック機能
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  経営レポートは機密性の高いデータを含むため、4桁のPINで保護できます。
                  1つのアカウントを医院全体で共有している場合でも、院長のみが経営データを閲覧可能になります。
                </p>
                <div className="space-y-3">
                  <StepCard step={1} title="PINを設定する">
                    設定ページの「経営レポートのPINロック」から4桁の数字を設定します。
                    初回は誰でも設定でき、変更・解除には現在のPINが必要です。
                  </StepCard>
                  <StepCard step={2} title="経営レポートにアクセス">
                    PIN設定後、経営レポートを開くとPIN入力画面が表示されます。
                    正しいPINを入力するとそのタブ内では再入力不要です。
                  </StepCard>
                </div>
                <TipBox>
                  PINを忘れた場合は、MIERU PX運営にお問い合わせください。管理者がリセットできます。
                </TipBox>
              </div>
            </section>

            {/* 10. スタッフ管理 */}
            <section>
              <SectionTitle id="staff" number={9} title="スタッフ管理" icon={Users} />
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  スタッフの登録・編集・有効/無効の切替ができます。
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>スタッフを追加すると、アンケート時の担当者選択に表示されます</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>スタッフを「無効」にすると、担当者選択から非表示になります（データは保持）</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>スタッフリーダーボードで月次/通算の回答数ランキングが確認できます</span>
                  </li>
                </ul>
              </div>
            </section>

            {/* 10. 設定 */}
            <section>
              <SectionTitle id="settings" number={10} title="設定" icon={Settings} />
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  クリニックの基本設定を管理できます。
                </p>
                <div className="space-y-2">
                  {[
                    { title: "クリニック名", desc: "ダッシュボードやアンケートに表示される名前" },
                    { title: "診療科目", desc: "一般・矯正・小児・審美・口腔外科から選択。ベンチマーク基準に使用" },
                    { title: "営業日数/週・定休日", desc: "ストリーク計算や日次目標の算出に使用" },
                    { title: "アンケート完了後", desc: "「アンケートのみ終了」または「LINE誘導」の2択。医院HPリンクも独立設定可能" },
                    { title: "経営レポートPINロック", desc: "4桁PINで経営レポートを保護。1アカウント共有でも院長のみ閲覧可能" },
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
              </div>
            </section>

            {/* 11. FAQ */}
            <section>
              <SectionTitle id="faq" number={11} title="よくある質問" icon={HelpCircle} />
              <div className="space-y-4">
                {[
                  {
                    q: "患者さまの個人情報は収集されますか？",
                    a: "いいえ。MIERU PX は個人を特定する情報を一切収集しません。IPアドレスもハッシュ化して保存しており、個人の特定はできない設計です。",
                  },
                  {
                    q: "アンケートは何件まで実施できますか？",
                    a: "ご利用プランにより異なります。フリープランは月50件まで、スタンダード以上は無制限です。",
                  },
                  {
                    q: "日次目標の件数はどう決まりますか？",
                    a: "前月の来院数（経営レポートの入力値）と診療日数から自動算出されます。目標を連続7日達成/未達成で目標レベルが自動調整されます。",
                  },
                  {
                    q: "休診日にストリークは途切れますか？",
                    a: "いいえ。設定で登録された定休日・臨時休診日はストリーク計算から自動スキップされます。",
                  },
                  {
                    q: "テストでアンケートを試したい場合は？",
                    a: "管理者メニューの「テスト」ページから、医院端末モードでテスト回答できます。テスト回答はDB保存されず集計に含まれません。",
                  },
                  {
                    q: "データはどのくらい保持されますか？",
                    a: "プランにより異なります。フリープラン3ヶ月、スターター12ヶ月、スタンダード以上は無制限です。",
                  },
                  {
                    q: "経営レポートのPINを忘れた場合は？",
                    a: "MIERU PX運営（管理者）にお問い合わせください。システム管理者がPINをリセットできます。リセット後、設定ページから新しいPINを設定してください。",
                  },
                  {
                    q: "複数のスタッフで1つのアカウントを共有していますが問題ありませんか？",
                    a: "問題ありません。MIERU PXは1クリニック＝1アカウントの運用を想定しています。経営データなど院長のみが見たい情報は、経営レポートのPINロック機能で保護できます。",
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

            {/* 13. 困ったときは */}
            <section>
              <SectionTitle id="troubleshooting" number={12} title="困ったときは" icon={Wrench} />
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
                      "アンケートURLが正しいか確認してください（/kiosk/クリニックスラッグ）",
                    ],
                  },
                  {
                    problem: "ダッシュボードにログインできない",
                    solutions: [
                      "メールアドレスとパスワードが正しいか確認してください",
                      "Caps Lockがオフになっているか確認してください",
                      "それでもログインできない場合は管理者にパスワードリセットを依頼してください",
                    ],
                  },
                  {
                    problem: "日次目標が「10件」のまま変わらない",
                    solutions: [
                      "経営レポートのデータ入力ページで前月の来院数を入力してください",
                      "来院数（初診数＋再診数）が入力されると、翌日から自動算出された目標に切り替わります",
                    ],
                  },
                  {
                    problem: "経営レポートが開けない（PINを求められる）",
                    solutions: [
                      "院長（管理者）が設定した4桁のPINを入力してください",
                      "PINを忘れた場合はMIERU PX運営にお問い合わせください",
                    ],
                  },
                  {
                    problem: "アンケート回答数がカウントされない",
                    solutions: [
                      "テストモード（?test=1）で回答していないか確認してください。テスト回答は集計に含まれません",
                      "アンケートの最後まで回答が完了しているか確認してください",
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

            {/* Footer note */}
            <div className="rounded-lg border bg-muted/30 p-5 text-center">
              <p className="text-sm text-muted-foreground">
                ご不明な点がございましたら、管理者にお問い合わせください。
              </p>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
