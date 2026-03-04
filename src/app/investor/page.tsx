import type { Metadata } from "next"
import Link from "next/link"
import {
  GraduationCap,
  Code2,
  Store,
  TrendingUp,
  Users,
  Users2,
  ShieldCheck,
  Crown,
  MessageCircle,
  Trophy,
  Megaphone,
  Zap,
  ArrowRight,
  ChevronRight,
  Stethoscope,
  Layers,
  Globe,
  BarChart3,
  Rocket,
  CheckCircle2,
  Link2,
  Briefcase,
} from "lucide-react"

export const metadata: Metadata = {
  title: "Investor Relations | D-Code Project",
  description:
    "D-Code Project: 歯科医院のデジタル化を支援する3つの事業。研修・API基盤・アプリストアで65,000院の業務改善を実現",
  robots: { index: false, follow: false },
}

/* ================================================================== */
/* Data                                                                */
/* ================================================================== */

const keyMetrics = [
  { value: "65,000", label: "日本の歯科医院数", sub: "コンビニより多い" },
  { value: "97%", label: "IT未活用率", sub: "レセコン以外ほぼ手作業" },
  { value: "¥3.1兆", label: "歯科医療費市場", sub: "2024年度" },
  { value: "0", label: "歯科特化の総合支援", sub: "競合不在" },
]

const products = [
  {
    id: "academy",
    icon: GraduationCap,
    name: "D-Code Academy",
    tagline: "歯科医院スタッフ向けAI活用研修",
    description:
      "AI（Claude Code）を活用し、プログラミング未経験の歯科医院スタッフがたった4日間で業務改善アプリを開発。歯科の現場を知るからこそ分かる「本当の課題」を、自分たちの手で解決する力を身につける実践型の研修プログラム。",
    pricing: [
      { plan: "研修プログラム（3時間×4日間）", price: "¥300,000〜400,000/人", note: "助成金で75%オフ → 実質¥75,000〜100,000" },
    ],
    highlights: [
      "歯科医師が教える唯一のAI開発研修",
      "人材開発支援助成金で最大75%補助",
      "院長は監督者として無料参加OK",
      "卒業後はD-Code Academy専用グループに参加可能",
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
      { plan: "API利用料", price: "¥5/回", note: "レセコンAPIを1回呼び出すごとに発生" },
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
    total: "1.0",
    profit: "0.5",
    margin: "50%",
    items: [
      { name: "研修事業（Academy）", amount: 6000, pct: 60 },
      { name: "API基盤（Hub）", amount: 1000, pct: 10 },
      { name: "アプリストア（Store）", amount: 500, pct: 5 },
      { name: "コンサル・その他", amount: 2500, pct: 25 },
    ],
  },
  year2: {
    total: "3.5",
    profit: "1.5",
    margin: "43%",
    items: [
      { name: "研修事業（Academy）", amount: 14000, pct: 40 },
      { name: "API基盤（Hub）", amount: 8400, pct: 24 },
      { name: "アプリストア（Store）", amount: 7000, pct: 20 },
      { name: "コンサル・その他", amount: 5600, pct: 16 },
    ],
  },
  year3: {
    total: "10.0",
    profit: "7.0",
    margin: "70%",
    items: [
      { name: "研修事業（Academy）", amount: 25000, pct: 25 },
      { name: "API基盤（Hub）", amount: 35000, pct: 35 },
      { name: "アプリストア（Store）", amount: 20000, pct: 20 },
      { name: "コンサル・医科展開", amount: 20000, pct: 20 },
    ],
  },
}

const whyUs = [
  {
    icon: Stethoscope,
    title: "歯科医師が創業",
    desc: "創業者自身が歯科医師。臨床経験に基づく深い業界理解と、現場の課題を知り尽くしたサービス設計。「外から見た歯科DX」ではなく「中から変える歯科DX」。",
  },
  {
    icon: Layers,
    title: "3事業の好循環",
    desc: "研修が開発者を生み、開発者がアプリを生み、アプリが医院を集め、医院が新たな研修受講者を生む。一方通行ではない、自然に成長する循環構造。",
  },
  {
    icon: ShieldCheck,
    title: "自社サービスの開発・運用実績",
    desc: "患者体験改善プラットフォーム「MIERU Clinic」や、QRコード活用の「QRくるくる診断DX」を自社で開発・運用中。歯科向けサービスの開発ノウハウを蓄積済み。",
  },
  {
    icon: Globe,
    title: "歯科から医療全体への展開",
    desc: "歯科（65,000院）で仕組みを確立した後、医科（102,000院）→ 介護（40,000施設）→ 薬局（60,000店）へ展開可能。サービスの構造は業種を問わず応用できる。",
  },
]

const milestones = [
  { month: "M1-3", title: "基盤づくり", items: ["研修カリキュラム完成", "D-Code Hub 試作版の開発", "レセコン会社1社と連携交渉"] },
  { month: "M4-6", title: "研修スタート", items: ["対面研修の開始", "受講者50名達成", "D-Code Hub テスト運用"] },
  { month: "M7-12", title: "事業拡大", items: ["D-Code Hub 50院導入", "D-Code Store オープン", "認定講師3名育成"] },
  { month: "Y2", title: "全国展開", items: ["講師5名・全国3都市で研修", "Hub 400院導入", "レセコン会社との正式提携"] },
  { month: "Y3", title: "売上10億円", items: ["講師10名・全国5都市", "Hub 1,500院導入", "医科への展開開始"] },
]

const competitiveEdges = [
  { label: "汎用AI研修", weakness: "歯科の課題を知らない", dcode: "歯科医師が教える" },
  { label: "歯科コンサル", weakness: "高額・担当者次第", dcode: "ITで仕組み化・低コスト" },
  { label: "レセコン会社", weakness: "自社開発のみで閉鎖的", dcode: "APIを開放し誰でも開発可能" },
]

const trackRecord = [
  {
    name: "MIERU Clinic",
    description: "歯科医院向け患者体験改善プラットフォーム。匿名アンケートで患者満足度を「見える化」し、改善アクションの効果測定まで一気通貫で支援。",
    url: "https://mieru-clinic.com",
  },
  {
    name: "QRくるくる診断DX",
    description: "QRコードを活用した歯科医院の業務効率化ツール。受付や問診のデジタル化により、スタッフの手作業を大幅に削減。",
  },
]

/* ================================================================== */
/* Component                                                           */
/* ================================================================== */

export default function InvestorPage() {
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
          <div className="absolute inset-0 bg-gradient-to-b from-blue-600/5 via-transparent to-transparent" />
          <div className="max-w-7xl mx-auto px-6 relative">
            <div className="max-w-4xl">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-500/20 bg-blue-500/5 text-blue-400 text-sm mb-8">
                <Rocket className="w-3.5 h-3.5" />
                Pre-Seed / Seed Round
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] mb-6">
                歯科業界に
                <br />
                <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
                  デジタル革命
                </span>
                を。
              </h1>
              <p className="text-lg sm:text-xl text-gray-400 leading-relaxed max-w-2xl mb-10">
                AI研修で歯科医院スタッフを開発者に変え、
                <br className="hidden sm:block" />
                API基盤とアプリストアで65,000院のデジタル化を支援する。
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="#products"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-violet-600 text-white font-medium hover:opacity-90 transition-opacity"
                >
                  事業の詳細
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="#financials"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-white/10 text-gray-300 hover:bg-white/5 transition-colors"
                >
                  売上見込み
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* Key Metrics                                                  */}
        {/* ============================================================ */}
        <section className="py-16 border-y border-white/5">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {keyMetrics.map((m) => (
                <div key={m.label} className="text-center">
                  <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent mb-2">
                    {m.value}
                  </div>
                  <div className="text-sm text-gray-300 font-medium">{m.label}</div>
                  <div className="text-xs text-gray-500 mt-1">{m.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* Core Strategy — Most Important                               */}
        {/* ============================================================ */}
        <section className="relative py-20 sm:py-24 overflow-hidden">
          {/* Glow background */}
          <div className="absolute inset-0 bg-gradient-to-b from-amber-600/5 via-orange-600/5 to-transparent pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-amber-500/5 rounded-full blur-[100px] pointer-events-none" />

          <div className="max-w-7xl mx-auto px-6 relative">
            {/* Label */}
            <div className="flex justify-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 border-amber-500/30 bg-amber-500/10 text-amber-400 text-sm font-semibold">
                <Crown className="w-4 h-4" />
                D-Code Projectの最重要戦略
              </div>
            </div>

            <div className="max-w-4xl mx-auto text-center mb-12">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.2] mb-6">
                日本最大の
                <br className="sm:hidden" />
                <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-red-400 bg-clip-text text-transparent">
                  医療版AI開発者コミュニティ
                </span>
                <br />
                を最速で作る。
              </h2>
              <p className="text-lg text-gray-400 leading-relaxed max-w-3xl mx-auto">
                このコミュニティの規模と熱量こそが、レセコン会社各社に
                <span className="text-amber-400 font-semibold">「APIを開放しなければ取り残される」</span>
                と思わせる最大の交渉カードになる。
              </p>
            </div>

            {/* Strategy Flow */}
            <div className="max-w-4xl mx-auto mb-12">
              <div className="grid sm:grid-cols-3 gap-4">
                {[
                  {
                    step: "STEP 1",
                    icon: Users2,
                    title: "コミュニティを作る",
                    desc: "Academy卒業生を核に、歯科×AIの開発者コミュニティを急速に拡大。日本中の「自分で作りたい」歯科医院スタッフが集まる場を作る。",
                    color: "border-amber-500/30 bg-amber-500/10",
                    iconColor: "text-amber-400",
                  },
                  {
                    step: "STEP 2",
                    icon: Megaphone,
                    title: "交渉力を持つ",
                    desc: "「数千人の開発者がAPIを待っている」という事実が、レセコン各社への最強の交渉材料に。APIを開放した会社から順に連携開始。",
                    color: "border-orange-500/30 bg-orange-500/10",
                    iconColor: "text-orange-400",
                  },
                  {
                    step: "STEP 3",
                    icon: Zap,
                    title: "一気に展開する",
                    desc: "API連携が実現すれば、コミュニティの開発者がアプリを量産。Hub + Store の売上が爆発的に伸び、事業全体が加速する。",
                    color: "border-red-500/30 bg-red-500/10",
                    iconColor: "text-red-400",
                  },
                ].map((item) => (
                  <div key={item.step} className={`rounded-xl border ${item.color} p-6 relative`}>
                    <div className="text-xs font-mono font-bold text-gray-500 mb-3">{item.step}</div>
                    <div className={`w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center mb-4`}>
                      <item.icon className={`w-5 h-5 ${item.iconColor}`} />
                    </div>
                    <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                    <p className="text-sm text-gray-400 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>

              {/* Arrow connectors (desktop) */}
              <div className="hidden sm:flex justify-center items-center gap-2 mt-6 text-gray-600">
                <span className="text-xs">コミュニティ拡大</span>
                <ArrowRight className="w-4 h-4 text-amber-500" />
                <span className="text-xs">交渉力UP</span>
                <ArrowRight className="w-4 h-4 text-orange-500" />
                <span className="text-xs">事業爆発</span>
              </div>
            </div>

            {/* How to build the community */}
            <div className="max-w-4xl mx-auto">
              <h3 className="text-xl font-bold text-center mb-8">
                コミュニティを
                <span className="text-amber-400">最速で</span>
                拡大するための施策
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  {
                    icon: GraduationCap,
                    title: "Academy卒業生を核にする",
                    desc: "研修で成功体験を得た受講者が、最も熱量の高いコミュニティメンバーになる。卒業生専用グループで継続的につながり、互いに刺激し合う環境を作る。",
                  },
                  {
                    icon: Trophy,
                    title: "ハッカソン・開発コンテスト",
                    desc: "「歯科業務改善アプリコンテスト」を定期開催。優秀作品はD-Code Storeで販売。開発意欲を刺激し、コミュニティの活性化と外部への認知拡大を同時に実現。",
                  },
                  {
                    icon: MessageCircle,
                    title: "オンラインコミュニティ運営",
                    desc: "Slack/Discordで常時つながる場を提供。質問・相談・成果共有を通じて「一人じゃない」安心感を醸成。月次のオンライン勉強会でスキルアップも継続支援。",
                  },
                  {
                    icon: Megaphone,
                    title: "SNS・メディア発信",
                    desc: "卒業生の成功事例をYouTube・SNSで発信。「プログラミング未経験の歯科衛生士がアプリを作った」というストーリーは強力な集客コンテンツになる。",
                  },
                ].map((item) => (
                  <div key={item.title} className="flex gap-4 rounded-xl border border-white/5 bg-white/[0.02] p-5">
                    <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm mb-1">{item.title}</h4>
                      <p className="text-xs text-gray-400 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Key insight callout */}
              <div className="mt-8 rounded-xl border-2 border-amber-500/20 bg-gradient-to-r from-amber-500/5 to-orange-500/5 p-6 text-center">
                <p className="text-sm text-gray-300 leading-relaxed">
                  <span className="text-amber-400 font-bold">なぜコミュニティが先か？</span>
                  <br className="sm:hidden" />
                  <span className="hidden sm:inline"> — </span>
                  レセコン会社は「需要がある」と確信しなければAPIを開放しない。
                  <br />
                  先にコミュニティを作り、
                  <span className="text-white font-semibold">「これだけの開発者がAPIを求めている」</span>
                  という既成事実を作ることで、交渉の主導権を握る。
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* Market Problem                                               */}
        {/* ============================================================ */}
        <section className="py-20 sm:py-24">
          <div className="max-w-7xl mx-auto px-6">
            <div className="max-w-3xl mx-auto text-center mb-16">
              <h2 className="text-2xl sm:text-3xl font-bold mb-4">
                歯科業界は
                <span className="text-red-400">20年前のまま</span>
                止まっている
              </h2>
              <p className="text-gray-400 leading-relaxed">
                レセコン（電子カルテ）以外のIT化はほぼゼロ。予約管理は紙と電話、患者情報の共有はカルテの手渡し、経営分析は院長の勘。65,000院がデジタル化を待っている。
              </p>
            </div>
            <div className="grid sm:grid-cols-3 gap-6">
              {[
                { stat: "83%", desc: "紙ベースの予約管理を続けている歯科医院の割合" },
                { stat: "92%", desc: "データに基づく経営判断ができていない院長の割合" },
                { stat: "¥0", desc: "歯科に特化したデジタル化支援サービスへの投資額（国内）" },
              ].map((item) => (
                <div
                  key={item.desc}
                  className="rounded-xl border border-white/5 bg-white/[0.02] p-6 text-center"
                >
                  <div className="text-3xl font-bold text-red-400 mb-3">{item.stat}</div>
                  <p className="text-sm text-gray-400">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* Solution Overview                                            */}
        {/* ============================================================ */}
        <section className="py-20 sm:py-24 border-t border-white/5">
          <div className="max-w-7xl mx-auto px-6">
            <div className="max-w-3xl mx-auto text-center mb-16">
              <h2 className="text-2xl sm:text-3xl font-bold mb-4">
                3つの事業が
                <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
                  互いに強め合う
                </span>
                仕組み
              </h2>
              <p className="text-gray-400">
                研修が開発者を育て、開発者がアプリを作り、アプリが医院を集め、医院が新たな研修受講者を生む。自然に成長していく循環構造。
              </p>
            </div>

            {/* Flywheel Diagram */}
            <div className="max-w-2xl mx-auto mb-20">
              <div className="relative rounded-2xl border border-white/5 bg-white/[0.02] p-8 sm:p-12">
                <div className="grid grid-cols-3 gap-6 sm:gap-8">
                  {[
                    { icon: GraduationCap, label: "Academy", sub: "研修でスタッフを育成", color: "text-blue-400 border-blue-500/20 bg-blue-500/5" },
                    { icon: Link2, label: "Hub", sub: "APIでデータ連携", color: "text-violet-400 border-violet-500/20 bg-violet-500/5" },
                    { icon: Store, label: "Store", sub: "アプリを販売", color: "text-emerald-400 border-emerald-500/20 bg-emerald-500/5" },
                  ].map((item) => (
                    <div key={item.label} className={`flex flex-col items-center text-center p-4 sm:p-6 rounded-xl border ${item.color}`}>
                      <item.icon className="w-8 h-8 mb-3" />
                      <div className="font-semibold text-sm mb-1">{item.label}</div>
                      <div className="text-xs text-gray-400">{item.sub}</div>
                    </div>
                  ))}
                </div>
                {/* Connecting arrows */}
                <div className="flex justify-center mt-6">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <ArrowRight className="w-4 h-4 text-blue-400" />
                    <span>研修 → 開発者 → アプリ → 医院 → 研修...</span>
                    <ArrowRight className="w-4 h-4 text-emerald-400" />
                  </div>
                </div>
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
        {/* Track Record                                                 */}
        {/* ============================================================ */}
        <section className="py-20 sm:py-24 border-t border-white/5">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold mb-4">
                <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
                  自社開発
                </span>
                の実績
              </h2>
              <p className="text-gray-400">歯科業界向けサービスの開発・運用ノウハウを蓄積済み</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
              {trackRecord.map((item) => (
                <div
                  key={item.name}
                  className="rounded-xl border border-white/5 bg-white/[0.02] p-6 sm:p-8 hover:border-white/10 transition-colors"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <Briefcase className="w-5 h-5 text-blue-400" />
                    </div>
                    <h3 className="text-lg font-semibold">{item.name}</h3>
                  </div>
                  <p className="text-sm text-gray-400 leading-relaxed">{item.description}</p>
                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 mt-4 transition-colors"
                    >
                      サイトを見る <ArrowRight className="w-3 h-3" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* Why Us                                                       */}
        {/* ============================================================ */}
        <section className="py-20 sm:py-24 border-t border-white/5">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-2xl sm:text-3xl font-bold mb-4">
                なぜ
                <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
                  私たちが
                </span>
                やるのか
              </h2>
              <p className="text-gray-400 max-w-2xl mx-auto">
                歯科のデジタル化は「外からIT企業が持ち込むもの」ではない。業界の内側から、現場を知る者が変える必要がある。
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-6">
              {whyUs.map((item) => (
                <div
                  key={item.title}
                  className="rounded-xl border border-white/5 bg-white/[0.02] p-6 sm:p-8 hover:border-white/10 transition-colors"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <item.icon className="w-5 h-5 text-blue-400" />
                    </div>
                    <h3 className="text-lg font-semibold">{item.title}</h3>
                  </div>
                  <p className="text-sm text-gray-400 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* Competitive Advantage                                        */}
        {/* ============================================================ */}
        <section className="py-20 sm:py-24 border-t border-white/5">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold mb-4">他社との違い</h2>
              <p className="text-gray-400">既存のどのサービスとも異なる立ち位置</p>
            </div>
            <div className="max-w-3xl mx-auto">
              <div className="rounded-xl border border-white/5 overflow-hidden">
                <div className="grid grid-cols-3 gap-0 text-sm font-semibold bg-white/[0.03] border-b border-white/5">
                  <div className="p-4 text-gray-400">既存サービス</div>
                  <div className="p-4 text-gray-400 border-l border-white/5">課題</div>
                  <div className="p-4 text-blue-400 border-l border-white/5">D-Code</div>
                </div>
                {competitiveEdges.map((row) => (
                  <div key={row.label} className="grid grid-cols-3 gap-0 text-sm border-b border-white/5 last:border-0">
                    <div className="p-4 text-gray-300 font-medium">{row.label}</div>
                    <div className="p-4 text-gray-500 border-l border-white/5">{row.weakness}</div>
                    <div className="p-4 text-gray-200 border-l border-white/5">{row.dcode}</div>
                  </div>
                ))}
              </div>
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
              <p className="text-sm text-gray-400 mb-6">Hub・Storeの月額収益が3年目で事業の柱に成長</p>
              <div className="space-y-4">
                {[
                  { label: "1年目末", monthly: "235万円", yearly: "0.28億円", width: 3 },
                  { label: "2年目末", monthly: "2,770万円", yearly: "3.32億円", width: 37 },
                  { label: "3年目末", monthly: "7,520万円", yearly: "9.02億円", width: 100 },
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
                  3年目末の年間売上 ¥9.02億 × 評価倍率 10〜20倍 =
                </p>
                <p className="text-2xl font-bold mt-2 bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
                  想定企業価値 ¥90〜180億
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
        {/* Market Size Expansion                                        */}
        {/* ============================================================ */}
        <section className="py-20 sm:py-24 border-t border-white/5">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold mb-4">将来の市場規模</h2>
              <p className="text-gray-400">歯科で確立した仕組みを医療・介護・薬局へ展開</p>
            </div>
            <div className="max-w-3xl mx-auto">
              <div className="space-y-4">
                {[
                  { market: "歯科（1年目〜）", count: "65,000院", size: "245億円", width: 25, color: "from-blue-500 to-blue-400", active: true },
                  { market: "医科（3年目〜）", count: "102,000院", size: "367億円", width: 38, color: "from-violet-500 to-violet-400", active: false },
                  { market: "介護（4年目〜）", count: "40,000施設", size: "144億円", width: 15, color: "from-emerald-500 to-emerald-400", active: false },
                  { market: "薬局（4年目〜）", count: "60,000店", size: "216億円", width: 22, color: "from-amber-500 to-amber-400", active: false },
                ].map((m) => (
                  <div key={m.market} className={`rounded-xl border p-5 ${m.active ? 'border-blue-500/20 bg-blue-500/5' : 'border-white/5 bg-white/[0.02]'}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <span className="font-medium text-sm">{m.market}</span>
                        <span className="text-xs text-gray-500 ml-2">{m.count}</span>
                      </div>
                      <span className="text-sm font-semibold bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
                        {m.size}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${m.color} ${!m.active ? 'opacity-30' : ''}`}
                        style={{ width: `${m.width}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-center mt-8 p-4 rounded-xl border border-white/5 bg-white/[0.02]">
                <span className="text-sm text-gray-400">合計市場規模:</span>
                <span className="text-2xl font-bold ml-3 bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
                  ¥972億
                </span>
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
                D-Code Projectは、その最初の一歩を踏み出しています。
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
