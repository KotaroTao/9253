import type { Metadata } from "next"
import Link from "next/link"
import {
  GraduationCap,
  Code2,
  Store,
  Users2,
  Crown,
  Zap,
  ArrowRight,
  ChevronRight,
  Layers,
  CheckCircle2,
  Link2,
  Lock,
  AlertTriangle,
  Database,
  Scale,
  ShieldCheck,
} from "lucide-react"

export const metadata: Metadata = {
  title: "D-Code Project",
  description:
    "D-Code Project: 歯科医院のデジタル化を支援する3つの事業。研修・API基盤・アプリストアで65,000院の業務改善を実現",
  robots: { index: false, follow: false },
}

/* ================================================================== */
/* Data                                                                */
/* ================================================================== */

const products = [
  {
    id: "academy",
    icon: GraduationCap,
    name: "D-Code Academy",
    tagline: "歯科医院スタッフ向けAI活用研修",
    description:
      "2つのコースで歯科スタッフのAI活用を支援。「Claude Code導入コース」では完全初心者が開発に必要な基礎知識を習得し、Claude Codeでの開発環境を確実に構築。「開発実践コース」では中上級者が業務改善アプリを実際に開発。卒業生は専用コミュニティに参加し、開発相談や他の卒業生が作ったアプリの紹介などが定期的に配信される。講師の田尾耕太郎は、月間500万PV超の歯科相談掲示板システムや、カルテ数15,000超のアライナー矯正専用WEB管理システムなどを構築した実績を持つ。現在はClaude Codeをフル活用し、開発速度10倍、コストを従来の約1/10に削減。本プログラムでは田尾が実際に使っている開発環境を、プログラミング初心者でも使いやすいように改良して提供する。",
    pricing: [
      { plan: "Claude Code導入コース（3時間×4日間）", price: "¥300,000〜400,000/人", note: "完全初心者向け。助成金で75%オフ → 実質¥75,000〜100,000" },
      { plan: "開発実践コース（3時間×4日間）", price: "¥300,000〜400,000/人", note: "中上級者向け。助成金で75%オフ → 実質¥75,000〜100,000" },
    ],
    highlights: [
      "講師は歯科相談掲示板（月間500万PV超）や矯正管理システム（15,000カルテ超）を構築した現役開発者",
      "Claude Code活用で開発速度10倍、コスト約1/10",
      "人材開発支援助成金で最大75%補助",
      "卒業生専用コミュニティで継続サポート",
    ],
    color: "from-blue-500 to-cyan-400",
  },
  {
    id: "hub",
    icon: Link2,
    name: "D-Code Hub",
    tagline: "各社レセコンのAPIを簡単に使える共通基盤",
    description:
      "歯科医院で使われている各社のレセコン（電子カルテ）のデータを、統一されたAPIで簡単に利用できる仕組みを提供。アプリ開発者はレセコンごとの違いを気にせず、患者情報や予約データを活用したアプリを作れるようになる。",
    pricing: [
      { plan: "基本料", price: "¥30,000/月", note: "2万円分のAPI利用料込み" },
      { plan: "API利用料", price: "¥3〜5/回", note: "レセコンAPIを1回呼び出すごとに発生" },
    ],
    highlights: [
      "各社レセコンとの連携を一本化",
      "API利用料はレセコン会社と折半（収益を共有）",
      "アプリ開発のハードルを大幅に引き下げ",
    ],
    color: "from-violet-500 to-purple-400",
  },
  {
    id: "store",
    icon: Store,
    name: "D-Code Store",
    tagline: "歯科医院向けアプリの販売ストア",
    description:
      "D-Code Academyの卒業生や外部の開発者が作ったアプリを、全国の歯科医院に販売できるマーケットプレイス。品質審査を通過したアプリだけが並ぶので、歯科医院は安心して導入できる。",
    pricing: [
      { plan: "販売手数料", price: "30%", note: "アプリが売れた際に発生" },
      { plan: "製品化コンサルティング", price: "¥500,000〜", note: "アプリの品質向上・販売準備を支援" },
    ],
    highlights: [
      "アプリが増えるほどストアの価値が向上",
      "開発者コミュニティによる継続的なアプリ供給",
      "医療安全審査で品質を担保",
    ],
    color: "from-emerald-500 to-teal-400",
  },
]

const revenueData = {
  year1: {
    total: "1.4",
    profit: "0.7",
    margin: "50%",
    items: [
      { name: "研修事業（Academy）", amount: 7500, pct: 54 },
      { name: "製品化コンサル（Store）", amount: 1500, pct: 11 },
      { name: "アプリ販売（Store）", amount: 5000, pct: 35 },
    ],
  },
  year2: {
    total: "4.5",
    profit: "2.0",
    margin: "44%",
    items: [
      { name: "研修事業（Academy）", amount: 15000, pct: 33 },
      { name: "アプリ販売・レベシェア（Store）", amount: 15000, pct: 33 },
      { name: "API基盤（Hub）", amount: 10000, pct: 22 },
      { name: "コンサル・その他", amount: 5000, pct: 12 },
    ],
  },
  year3: {
    total: "12.0",
    profit: "8.0",
    margin: "67%",
    items: [
      { name: "研修事業（Academy）", amount: 25000, pct: 21 },
      { name: "アプリ販売・レベシェア（Store）", amount: 35000, pct: 29 },
      { name: "API基盤（Hub）", amount: 40000, pct: 33 },
      { name: "コンサル・医科展開", amount: 20000, pct: 17 },
    ],
  },
}

const milestones = [
  { month: "M1-3", title: "Academy最速立ち上げ", items: ["研修カリキュラム完成", "Academy受講者募集開始", "認定講師2名育成"] },
  { month: "M4-6", title: "Academy本格稼働", items: ["Academy受講者100名達成", "Store製品化コンサル案件獲得", "Store初期アプリ販売開始"] },
  { month: "M7-12", title: "Store拡大", items: ["Academy受講者200名・売上7,500万達成", "Storeアプリ販売5,000万達成", "レベニューシェア型案件の拡大"] },
  { month: "Y2", title: "Hub参入・全国展開", items: ["Academy・Storeの実績をもとにレセコン会社へAPI開放交渉", "D-Code Hub テスト運用開始", "講師5名・全国3都市で研修展開"] },
  { month: "Y3", title: "売上12億円", items: ["Hub本格稼働・レセコン連携拡大", "Store年間売上3.5億円", "医科への展開開始"] },
]


/* ================================================================== */
/* Component                                                           */
/* ================================================================== */

export default function DCodePage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-gray-100">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-violet-600/5 rounded-full blur-[120px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center">
              <Code2 className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight">
              D-Code Project
            </span>
            <span className="text-xs text-gray-500 border border-gray-700 rounded px-2 py-0.5 ml-2">
              CONFIDENTIAL
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-1 text-sm text-gray-400">
            <span>by 株式会社ファンクション・ティ</span>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        {/* ============================================================ */}
        {/* Hero                                                         */}
        {/* ============================================================ */}
        <section className="relative pt-20 pb-24 sm:pt-28 sm:pb-32 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-600/8 via-violet-600/5 to-transparent" />
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />
          <div className="max-w-7xl mx-auto px-6 relative">
            <div className="max-w-5xl mx-auto text-center">
              {/* Project name — large & prominent */}
              <div className="mb-6">
                <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black tracking-tight leading-none">
                  <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
                    D-Code
                  </span>
                  {" "}
                  <span className="text-white">Project</span>
                </h1>
              </div>

              <p className="text-xl sm:text-2xl font-semibold text-gray-200 mb-4">
                歯科業界にデジタル革命を。
              </p>
              <p className="text-base sm:text-lg text-gray-400 leading-relaxed max-w-2xl mx-auto mb-10">
                AI研修で歯科医院スタッフを開発者に変え、
                <br className="hidden sm:block" />
                API基盤とアプリストアで65,000院のデジタル化を支援する。
              </p>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* Three Pillars — D-Code Projectの3つの柱                      */}
        {/* ============================================================ */}
        <section className="relative py-20 sm:py-28 overflow-hidden">
          {/* Glow background */}
          <div className="absolute inset-0 bg-gradient-to-b from-amber-600/5 via-blue-600/5 to-transparent pointer-events-none" />
          <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-1/3 right-1/4 w-[500px] h-[500px] bg-violet-500/5 rounded-full blur-[120px] pointer-events-none" />

          <div className="max-w-7xl mx-auto px-6 relative">
            {/* Label */}
            <div className="flex justify-center mb-8">
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border-2 border-amber-500/30 bg-amber-500/10 text-amber-400 text-sm font-bold">
                <Crown className="w-4 h-4" />
                D-Code Projectの3つの柱
              </div>
            </div>

            <div className="max-w-4xl mx-auto text-center mb-16">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.2] mb-6">
                <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-emerald-400 bg-clip-text text-transparent">
                  育てる・つなぐ・届ける
                </span>
                <br />
                の循環で歯科を変える。
              </h2>
              <p className="text-lg text-gray-400 leading-relaxed max-w-3xl mx-auto">
                3つの柱が互いに補完し合い、
                <span className="text-white font-semibold">単独では生まれない価値</span>
                を生む。
                <br className="hidden sm:block" />
                この循環構造こそが、D-Code Projectの最大の競争優位性。
              </p>
            </div>

            {/* ── Three Pillar Cards ── */}
            <div className="grid lg:grid-cols-3 gap-6 mb-16">
              {/* Pillar 1: Academy */}
              <div className="group relative rounded-2xl border-2 border-blue-500/20 bg-gradient-to-b from-blue-500/10 to-blue-500/[0.02] p-8 hover:border-blue-500/40 transition-all duration-300">
                <div className="absolute top-4 right-4 text-xs font-mono font-bold text-blue-400/50">PILLAR 1</div>
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center mb-6 shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform duration-300">
                  <GraduationCap className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">D-Code Academy</h3>
                <p className="text-sm font-semibold text-blue-400 mb-4">
                  日本最大の医療版AI開発者コミュニティ
                </p>
                <p className="text-sm text-gray-400 leading-relaxed mb-6">
                  初心者向け「導入コース」と中上級者向け「開発実践コース」の2本立て。卒業生は専用コミュニティで開発相談やアプリ紹介を受けられ、この規模がレセコン会社への交渉カードになる。
                </p>
                <div className="space-y-2">
                  {[
                    "講師は大規模歯科システム構築の実績を持つ現役開発者",
                    "Claude Codeで開発速度10倍、コスト約1/10",
                    "助成金で最大75%補助",
                  ].map((h) => (
                    <div key={h} className="flex items-center gap-2 text-xs text-gray-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                      {h}
                    </div>
                  ))}
                </div>
                {/* Role tag */}
                <div className="mt-6 pt-4 border-t border-blue-500/10">
                  <div className="text-xs text-gray-500">
                    <span className="text-blue-400 font-semibold">役割:</span> 開発者を育て、コミュニティの規模と熱量を作る
                  </div>
                </div>
              </div>

              {/* Pillar 2: Hub */}
              <div className="group relative rounded-2xl border-2 border-violet-500/20 bg-gradient-to-b from-violet-500/10 to-violet-500/[0.02] p-8 hover:border-violet-500/40 transition-all duration-300">
                <div className="absolute top-4 right-4 text-xs font-mono font-bold text-violet-400/50">PILLAR 2</div>
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-500 to-purple-400 flex items-center justify-center mb-6 shadow-lg shadow-violet-500/20 group-hover:scale-110 transition-transform duration-300">
                  <Link2 className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">D-Code Hub</h3>
                <p className="text-sm font-semibold text-violet-400 mb-4">
                  各社レセコンのAPIを簡単に使える共通基盤
                </p>
                <p className="text-sm text-gray-400 leading-relaxed mb-6">
                  バラバラなレセコン各社のデータ仕様を統一API化。開発者はHub経由で1つのAPIを覚えるだけで、どのレセコンとも連携できる。
                </p>
                <div className="space-y-2">
                  {[
                    "各社レセコンを共通API化",
                    "D-Codeコミュニティ限定アクセス",
                    "月額課金で安定収益",
                  ].map((h) => (
                    <div key={h} className="flex items-center gap-2 text-xs text-gray-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
                      {h}
                    </div>
                  ))}
                </div>
                {/* Role tag */}
                <div className="mt-6 pt-4 border-t border-violet-500/10">
                  <div className="text-xs text-gray-500">
                    <span className="text-violet-400 font-semibold">役割:</span> データ連携を実現し、アプリ開発を可能にする
                  </div>
                </div>
              </div>

              {/* Pillar 3: Store */}
              <div className="group relative rounded-2xl border-2 border-emerald-500/20 bg-gradient-to-b from-emerald-500/10 to-emerald-500/[0.02] p-8 hover:border-emerald-500/40 transition-all duration-300">
                <div className="absolute top-4 right-4 text-xs font-mono font-bold text-emerald-400/50">PILLAR 3</div>
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-green-400 flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform duration-300">
                  <Store className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">D-Code Store</h3>
                <p className="text-sm font-semibold text-emerald-400 mb-4">
                  歯科版Apple Store
                </p>
                <p className="text-sm text-gray-400 leading-relaxed mb-6">
                  Academy卒業生やサードパーティ開発者が作ったアプリを、全国の歯科医院がワンクリックで導入。レビュー・課金・アップデートをプラットフォームが一括管理。
                </p>
                <div className="space-y-2">
                  {[
                    "ワンクリックで導入・課金",
                    "開発者は販売に集中できる",
                    "レビューで品質を担保",
                  ].map((h) => (
                    <div key={h} className="flex items-center gap-2 text-xs text-gray-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                      {h}
                    </div>
                  ))}
                </div>
                {/* Role tag */}
                <div className="mt-6 pt-4 border-t border-emerald-500/10">
                  <div className="text-xs text-gray-500">
                    <span className="text-emerald-400 font-semibold">役割:</span> アプリを全国に届け、収益を生む
                  </div>
                </div>
              </div>
            </div>

            {/* ── Complementary Relationship Diagram ── */}
            <div className="max-w-4xl mx-auto mb-16">
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 sm:p-12">
                <h3 className="text-lg font-bold text-center text-white mb-2">3つの柱の補完関係</h3>
                <p className="text-sm text-gray-500 text-center mb-10">それぞれが互いを強め合い、単独では作れない価値を生む循環構造</p>

                {/* Triangle Diagram */}
                <div className="relative max-w-lg mx-auto">
                  {/* Top node: Academy */}
                  <div className="flex justify-center mb-4">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20 mb-3">
                        <GraduationCap className="w-8 h-8 text-white" />
                      </div>
                      <span className="text-sm font-bold text-blue-400">Academy</span>
                      <span className="text-xs text-gray-500">開発者を育てる</span>
                    </div>
                  </div>

                  {/* Connection arrows: Academy → Hub, Academy → Store */}
                  <div className="flex justify-center gap-20 sm:gap-32 mb-2">
                    <div className="flex flex-col items-center text-center">
                      <div className="text-xs text-blue-400/70 mb-1">卒業生が</div>
                      <div className="w-px h-6 bg-gradient-to-b from-blue-400/50 to-violet-400/50" />
                      <div className="text-xs text-violet-400/70 mt-1">APIを活用</div>
                    </div>
                    <div className="flex flex-col items-center text-center">
                      <div className="text-xs text-blue-400/70 mb-1">卒業生が</div>
                      <div className="w-px h-6 bg-gradient-to-b from-blue-400/50 to-emerald-400/50" />
                      <div className="text-xs text-emerald-400/70 mt-1">アプリを出品</div>
                    </div>
                  </div>

                  {/* Bottom nodes: Hub & Store */}
                  <div className="flex justify-between items-start px-4 sm:px-8">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-violet-500 to-purple-400 flex items-center justify-center shadow-lg shadow-violet-500/20 mb-3">
                        <Link2 className="w-8 h-8 text-white" />
                      </div>
                      <span className="text-sm font-bold text-violet-400">Hub</span>
                      <span className="text-xs text-gray-500">データをつなぐ</span>
                    </div>

                    {/* Horizontal connection: Hub ↔ Store */}
                    <div className="flex items-center gap-2 mt-6">
                      <div className="h-px w-8 sm:w-16 bg-gradient-to-r from-violet-400/50 to-transparent" />
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] text-gray-500 whitespace-nowrap">APIを提供</span>
                        <ArrowRight className="w-4 h-4 text-gray-600 my-0.5" />
                        <span className="text-[10px] text-gray-500 whitespace-nowrap">需要をフィードバック</span>
                      </div>
                      <div className="h-px w-8 sm:w-16 bg-gradient-to-r from-transparent to-emerald-400/50" />
                    </div>

                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-emerald-500 to-green-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-3">
                        <Store className="w-8 h-8 text-white" />
                      </div>
                      <span className="text-sm font-bold text-emerald-400">Store</span>
                      <span className="text-xs text-gray-500">アプリを届ける</span>
                    </div>
                  </div>
                </div>

                {/* Circular Flow Description */}
                <div className="mt-10 grid sm:grid-cols-3 gap-4">
                  {[
                    {
                      from: "Academy",
                      to: "Hub / Store",
                      desc: "研修で育った開発者がHub APIを使いアプリを開発、Storeで販売",
                      arrow: "from-blue-400 to-violet-400",
                    },
                    {
                      from: "Hub",
                      to: "Store / Academy",
                      desc: "APIでデータ連携を実現し高度なアプリを可能に。API需要がコミュニティ拡大を牽引",
                      arrow: "from-violet-400 to-emerald-400",
                    },
                    {
                      from: "Store",
                      to: "Academy / Hub",
                      desc: "アプリ販売の成功事例が新たな受講者を呼び、利用医院数がAPI連携の交渉力に",
                      arrow: "from-emerald-400 to-blue-400",
                    },
                  ].map((flow) => (
                    <div key={flow.from} className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs font-bold bg-gradient-to-r ${flow.arrow} bg-clip-text text-transparent`}>
                          {flow.from} → {flow.to}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 leading-relaxed">{flow.desc}</p>
                    </div>
                  ))}
                </div>

                {/* Key insight */}
                <div className="mt-8 rounded-xl border-2 border-amber-500/20 bg-gradient-to-r from-amber-500/5 to-orange-500/5 p-5 text-center">
                  <p className="text-sm text-gray-300 leading-relaxed">
                    <span className="text-amber-400 font-bold">なぜ3つが揃う必要があるのか？</span>
                    <br className="sm:hidden" />
                    <span className="hidden sm:inline"> — </span>
                    Academyだけでは開発者が作ったアプリを活かせない。Hubだけでは使う人がいない。Storeだけではアプリが集まらない。
                    <br />
                    <span className="text-white font-semibold">3つが揃って初めて「育てる→つなぐ→届ける」の好循環が生まれる。</span>
                  </p>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* ============================================================ */}
        {/* The Biggest Wall — レセコンAPI開放                            */}
        {/* ============================================================ */}
        <section className="relative py-16 sm:py-20 border-t border-amber-500/20 overflow-hidden">
          {/* Background glow */}
          <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 via-amber-500/10 to-transparent pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative max-w-4xl mx-auto px-6 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 mb-6">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold tracking-wider text-amber-400 uppercase">D-Code Project の核心</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-6 leading-tight">
              医療AI開発の最大の壁
              <br />
              <span className="text-amber-400">レセコン会社がAPIを開放しない</span>
            </h2>
            <p className="text-lg sm:text-xl text-gray-300 leading-relaxed max-w-2xl mx-auto mb-8">
              歯科のデジタル化を阻む最大のボトルネック。
              <br className="hidden sm:block" />
              この壁を突破することが、D-Code Projectの最も大きな目標である。
            </p>
            <div className="inline-flex items-center gap-2 text-sm text-amber-400/80">
              <ChevronRight className="w-4 h-4" />
              <span>なぜ開放されないのか、どう突破するのか — 詳しくは以下で解説</span>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* Why レセコン Won't Open APIs                                 */}
        {/* ============================================================ */}
        <section className="py-20 sm:py-24 border-t border-white/5">
          <div className="max-w-7xl mx-auto px-6">
            <div className="max-w-3xl mx-auto text-center mb-16">
              <h2 className="text-2xl sm:text-3xl font-bold mb-4">
                なぜレセコン会社は
                <span className="text-amber-400">APIを開放しない</span>
                のか
              </h2>
              <p className="text-gray-400 leading-relaxed">
                歯科のデジタル化が進まない最大のボトルネックは、レセコン（電子カルテ）ベンダーがAPIを出さないこと。これは怠慢ではなく、合理的な経営判断の結果である。
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {[
                {
                  icon: Lock,
                  title: "ロックイン戦略",
                  desc: "データ移行コストが極めて高く、API開放は乗り換え障壁を下げてしまう。「うちでしか使えない」状態が最大の防御壁。",
                  color: "text-red-400",
                },
                {
                  icon: Layers,
                  title: "周辺ビジネスの侵食",
                  desc: "予約管理・会計連携など周辺機能を自社で囲い込み追加課金。API開放でサードパーティに代替されるリスク。",
                  color: "text-orange-400",
                },
                {
                  icon: Database,
                  title: "20〜30年前の技術的負債",
                  desc: "Windows専用・独自DBのモノリシック設計。そもそもAPI化できる内部構造になっていない。",
                  color: "text-yellow-400",
                },
                {
                  icon: ShieldCheck,
                  title: "責任・セキュリティ回避",
                  desc: "医療データの外部連携は個人情報保護法・3省2ガイドラインへの準拠コスト増。障害時の責任問題も曖昧に。",
                  color: "text-blue-400",
                },
                {
                  icon: Scale,
                  title: "市場がAPIを求めていなかった",
                  desc: "歯科医院にAPI有無で選ぶリテラシーがなく、ディーラー営業が主流。APIを出しても売上が増えない。",
                  color: "text-violet-400",
                },
                {
                  icon: AlertTriangle,
                  title: "競合への情報流出",
                  desc: "API仕様 ≒ 内部データ構造の公開。寡占市場で数社が互いを警戒し、情報を出したくない。",
                  color: "text-pink-400",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-xl border border-white/5 bg-white/[0.02] p-6"
                >
                  <item.icon className={`w-6 h-6 ${item.color} mb-4`} />
                  <h3 className="text-base font-semibold text-white mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>

            {/* The core problem for AI developers */}
            <div className="max-w-3xl mx-auto rounded-xl border-2 border-red-500/20 bg-red-500/5 p-8 mb-8">
              <h3 className="text-lg font-bold text-red-400 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                医療AI開発の最大のハードル
              </h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                歯科AI開発で最も価値のあるデータはレセコン（電子カルテ）の中にある。しかし、レセコンAPIとの連携は
                <span className="text-white font-semibold">個人や単独の医院が実現することはまず不可能</span>
                。ベンダーには開放する経済的メリットがなく、個別交渉では門前払いされる。これが歯科AI開発の最大のボトルネックであり、同時に
                <span className="text-amber-400 font-semibold">最大の参入障壁</span>
                になる。
              </p>
            </div>

            {/* D-Code's approach callout */}
            <div className="max-w-3xl mx-auto rounded-xl border border-amber-500/20 bg-amber-500/5 p-8">
              <h3 className="text-lg font-bold text-amber-400 mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5" />
                D-Code Projectの戦略：Academy → Store → Hub
              </h3>
              <p className="text-gray-300 text-sm leading-relaxed mb-4">
                レセコン会社にとってAPI開放は「コストは確実、リターンは不確実」。彼らが動くのは、連携しないことが失注理由になる市場環境が整ったとき。
                <span className="text-white font-semibold">まずAcademyで歯科AI人材を育成し、Storeでアプリの実績を積み上げる。この2つの実績をもとにレセコン会社へAPI開放を交渉する</span>
                ことで、この構造を突破する。
              </p>

              {/* The "only path" callout */}
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-5">
                <p className="text-sm text-gray-200 leading-relaxed text-center">
                  <span className="text-amber-400 font-bold text-base">AI開発者にとって、D-Codeは唯一の道になる</span>
                  <br />
                  <span className="text-gray-400 mt-2 inline-block">
                    レセコンAPIが開放されたとき、それを利用できるのはD-Code Hub経由のみ。
                    AI開発者がレセコンデータを活用した歯科アプリを作りたければ、D-Codeコミュニティに参加するしかない。
                    この構造こそが、プラットフォームの最大の競争優位性となる。
                  </span>
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* Products Detail                                              */}
        {/* ============================================================ */}
        <section id="products" className="py-20 sm:py-24 border-t border-white/5">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-2xl sm:text-3xl font-bold mb-4">事業ラインナップ</h2>
              <p className="text-gray-400">3つの事業で歯科医院のデジタル化を総合的に支援</p>
            </div>

            <div className="space-y-12">
              {products.map((product, idx) => (
                <div
                  key={product.id}
                  className="rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden"
                >
                  {/* Product Header */}
                  <div className={`p-6 sm:p-8 bg-gradient-to-r ${product.color} bg-opacity-5`}
                    style={{ background: `linear-gradient(135deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 100%)` }}
                  >
                    <div className="flex items-start gap-4 mb-6">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${product.color} flex items-center justify-center flex-shrink-0`}>
                        <product.icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-xl sm:text-2xl font-bold">{product.name}</h3>
                          <span className="text-xs px-2 py-0.5 rounded-full border border-white/10 text-gray-400">
                            {idx === 0 ? "人材育成" : idx === 1 ? "データ基盤" : "販売"}
                          </span>
                        </div>
                        <p className="text-gray-400">{product.tagline}</p>
                      </div>
                    </div>
                    <p className="text-gray-300 leading-relaxed max-w-3xl">
                      {product.description}
                    </p>
                  </div>

                  {/* Pricing + Highlights */}
                  <div className="grid lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-white/5">
                    {/* Pricing */}
                    <div className="lg:col-span-2 p-6 sm:p-8">
                      <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">料金体系</h4>
                      <div className="space-y-3">
                        {product.pricing.map((p) => (
                          <div key={p.plan} className="flex items-start justify-between gap-4 py-2 border-b border-white/5 last:border-0">
                            <div>
                              <div className="font-medium text-sm">{p.plan}</div>
                              <div className="text-xs text-gray-500 mt-0.5">{p.note}</div>
                            </div>
                            <div className="text-sm font-semibold text-right whitespace-nowrap bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
                              {p.price}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Highlights */}
                    <div className="p-6 sm:p-8">
                      <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">ポイント</h4>
                      <ul className="space-y-3">
                        {product.highlights.map((h) => (
                          <li key={h} className="flex items-start gap-2 text-sm text-gray-300">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                            {h}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* Financial Projections                                        */}
        {/* ============================================================ */}
        <section id="financials" className="py-20 sm:py-24 border-t border-white/5">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-2xl sm:text-3xl font-bold mb-4">売上見込み</h2>
              <p className="text-gray-400">3年で年間売上10億円の事業を目指す</p>
            </div>

            {/* Summary Cards */}
            <div className="grid sm:grid-cols-3 gap-6 mb-12">
              {[
                { year: "1年目", ...revenueData.year1 },
                { year: "2年目", ...revenueData.year2 },
                { year: "3年目", ...revenueData.year3 },
              ].map((y) => (
                <div
                  key={y.year}
                  className="rounded-xl border border-white/5 bg-white/[0.02] p-6 sm:p-8"
                >
                  <div className="text-sm text-gray-500 mb-2">{y.year}</div>
                  <div className="text-3xl sm:text-4xl font-bold mb-1">
                    <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
                      ¥{y.total}億
                    </span>
                  </div>
                  <div className="text-sm text-gray-400 mb-6">
                    営業利益 ¥{y.profit}億（利益率 {y.margin}）
                  </div>

                  {/* Revenue Bars */}
                  <div className="space-y-3">
                    {y.items.map((item) => (
                      <div key={item.name}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-400">{item.name}</span>
                          <span className="text-gray-300">{item.pct}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500"
                            style={{ width: `${item.pct}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Monthly Revenue Growth */}
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-6 sm:p-8 max-w-3xl mx-auto">
              <h3 className="text-lg font-semibold mb-2">月額売上の成長イメージ</h3>
              <p className="text-sm text-gray-400 mb-6">Academy起点でStoreを拡大し、3年目にHub収益が本格化</p>
              <div className="space-y-4">
                {[
                  { label: "1年目末", monthly: "1,170万円", yearly: "1.4億円", width: 12 },
                  { label: "2年目末", monthly: "3,750万円", yearly: "4.5億円", width: 38 },
                  { label: "3年目末", monthly: "10,000万円", yearly: "12.0億円", width: 100 },
                ].map((row) => (
                  <div key={row.label}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-gray-400">{row.label}</span>
                      <span className="text-gray-300">
                        月額 {row.monthly}
                        <span className="text-gray-500 ml-2">（年間 {row.yearly}）</span>
                      </span>
                    </div>
                    <div className="h-3 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all"
                        style={{ width: `${row.width}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-6 border-t border-white/5 text-center">
                <p className="text-sm text-gray-400">
                  3年目末の年間売上 ¥12.0億 × 評価倍率 10〜20倍 =
                </p>
                <p className="text-2xl font-bold mt-2 bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
                  想定企業価値 120〜240億円
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* Milestones                                                   */}
        {/* ============================================================ */}
        <section className="py-20 sm:py-24 border-t border-white/5">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-2xl sm:text-3xl font-bold mb-4">ロードマップ</h2>
            </div>
            <div className="max-w-4xl mx-auto">
              <div className="relative">
                {/* Vertical line */}
                <div className="absolute left-4 sm:left-6 top-0 bottom-0 w-px bg-gradient-to-b from-blue-500/50 via-violet-500/50 to-transparent" />

                <div className="space-y-8">
                  {milestones.map((ms, idx) => (
                    <div key={ms.month} className="relative flex gap-6 sm:gap-8">
                      <div className="relative flex-shrink-0 w-8 sm:w-12 flex items-start justify-center pt-1">
                        <div className={`w-3 h-3 rounded-full ${idx === milestones.length - 1 ? 'bg-gradient-to-r from-blue-400 to-violet-400 ring-4 ring-violet-500/20' : 'bg-white/20 ring-2 ring-white/10'}`} />
                      </div>
                      <div className="pb-8">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-xs font-mono px-2 py-0.5 rounded bg-white/5 text-gray-400">
                            {ms.month}
                          </span>
                          <h3 className="font-semibold">{ms.title}</h3>
                        </div>
                        <ul className="space-y-1">
                          {ms.items.map((item) => (
                            <li key={item} className="text-sm text-gray-400 flex items-center gap-2">
                              <ChevronRight className="w-3 h-3 text-gray-600" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* CTA                                                          */}
        {/* ============================================================ */}
        <section className="py-20 sm:py-24 border-t border-white/5">
          <div className="max-w-7xl mx-auto px-6">
            <div className="max-w-2xl mx-auto text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center mx-auto mb-8">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-4">
                歯科のデジタル化を、一緒に実現しませんか。
              </h2>
              <p className="text-gray-400 mb-8 leading-relaxed">
                65,000院の歯科医院が変われば、日本の医療が変わる。
                <br />
                D-Code Projectは、その変化を最加速します。
              </p>
              <div className="inline-flex flex-col items-center gap-4">
                <div className="text-sm text-gray-500">
                  Contact: info@function-t.com
                </div>
                <div className="text-xs text-gray-600">
                  本資料は機密情報です。第三者への共有はご遠慮ください。
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <div className="w-5 h-5 rounded bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center">
              <Code2 className="w-3 h-3 text-white" />
            </div>
            D-Code Project by 株式会社ファンクション・ティ
          </div>
          <div className="text-xs text-gray-600">
            &copy; {new Date().getFullYear()} Function-T Inc. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
