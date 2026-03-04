import type { Metadata } from "next"
import Link from "next/link"
import {
  GraduationCap,
  Code2,
  Store,
  Building2,
  TrendingUp,
  Users,
  ShieldCheck,
  Zap,
  ArrowRight,
  ChevronRight,
  Stethoscope,
  Layers,
  Globe,
  Target,
  BarChart3,
  Rocket,
  CheckCircle2,
} from "lucide-react"

export const metadata: Metadata = {
  title: "Investor Relations | D-Code — 歯科DXプラットフォーム",
  description:
    "D-Code: 歯科医療DXプラットフォーム事業。AIプログラミング研修×SaaS×マーケットプレイスで歯科業界のデジタル変革を実現",
  robots: { index: false, follow: false },
}

/* ================================================================== */
/* Data                                                                */
/* ================================================================== */

const keyMetrics = [
  { value: "68,000", label: "日本の歯科医院数", sub: "コンビニより多い" },
  { value: "97%", label: "IT未活用率", sub: "レセコン以外ほぼ手作業" },
  { value: "¥3.1兆", label: "歯科医療費市場", sub: "2024年度" },
  { value: "0", label: "歯科特化DXプラットフォーム", sub: "競合不在" },
]

const products = [
  {
    id: "training",
    icon: GraduationCap,
    name: "D-Code Academy",
    tagline: "歯科医師が、自分でアプリを作れるようになる",
    description:
      "AI（Claude Code）を活用し、プログラミング未経験の歯科医師がたった4日間で業務改善アプリを開発。歯科医師だからこそ分かる「現場の課題」を、自ら解決する力を身につける。",
    pricing: [
      { plan: "プレミアム（対面4日間）", price: "¥400,000/人", note: "助成金75%適用で実質¥100,000" },
      { plan: "オンライン集中（2日間）", price: "¥150,000/人", note: "地方からも参加可能" },
      { plan: "セルフラーニング", price: "¥9,800/月", note: "録画+課題+コミュニティ" },
      { plan: "マスタープログラム（法人）", price: "¥3,000,000/年", note: "5院以上チェーン向け年間DXパートナー" },
    ],
    highlights: [
      "歯科医師が教える唯一のAI開発研修",
      "人材開発支援助成金で最大75%補助",
      "研修後はD-Codeコミュニティに接続",
    ],
    color: "from-blue-500 to-cyan-400",
  },
  {
    id: "platform",
    icon: Code2,
    name: "D-Code Platform",
    tagline: "歯科業界のAPI基盤",
    description:
      "レセコン（電子カルテ）連携APIを提供し、歯科医院の業務データを活用したアプリ開発を可能にする。開発者向けAPIからノーコードテンプレートまで、3層構造で全歯科医院をカバー。",
    pricing: [
      { plan: "Templates（ノーコード）", price: "¥9,800〜30,000/月", note: "設定だけで使える業務アプリ" },
      { plan: "Apps（SaaS）", price: "¥10,000〜50,000/月", note: "高機能な業務支援ツール" },
      { plan: "API（開発者向け）", price: "¥30,000/月+従量", note: "レセコン連携API" },
    ],
    highlights: [
      "レセコン会社とのOEM提携で一括導入",
      "歯科ディーラー経由の販売チャネル",
      "月額課金のリカーリング収益",
    ],
    color: "from-violet-500 to-purple-400",
  },
  {
    id: "store",
    icon: Store,
    name: "D-Code Store",
    tagline: "歯科業界のApp Store",
    description:
      "研修修了者や外部開発者が作ったアプリを、全国の歯科医院に販売できるマーケットプレイス。3段階の品質審査制度で医療現場での安全性を担保。",
    pricing: [
      { plan: "自社アプリ", price: "利益率90%以上", note: "Claude Codeで高速自社開発" },
      { plan: "パートナーアプリ", price: "手数料30%", note: "開発者コミュニティからの出品" },
      { plan: "エンタープライズ", price: "¥1,000,000〜/件", note: "大手チェーン向けカスタム" },
    ],
    highlights: [
      "Tier 1〜3の医療安全審査制度",
      "開発者エコシステムによるネットワーク効果",
      "アプリ数が増えるほどプラットフォーム価値が向上",
    ],
    color: "from-emerald-500 to-teal-400",
  },
  {
    id: "enterprise",
    icon: Building2,
    name: "D-Code Enterprise",
    tagline: "歯科チェーンのDX基盤",
    description:
      "5院以上の歯科チェーン・グループ向けの統合DXソリューション。年間パートナー契約で、研修→開発→運用まで一気通貫で支援。レセコンOEM提携により大規模導入を実現。",
    pricing: [
      { plan: "マスタープログラム", price: "¥3,000,000/年", note: "月次訪問+Slack常駐+アプリ開発込み" },
      { plan: "レセコンOEM", price: "レベニューシェア", note: "レセコン会社経由のバンドル販売" },
      { plan: "ディーラー経由", price: "¥20,000〜/月/院", note: "既存流通網を活用" },
    ],
    highlights: [
      "レセコン大手1社提携で数千院にリーチ",
      "ディーラー経由で営業コストを最小化",
      "導入院数に比例するネットワーク効果",
    ],
    color: "from-amber-500 to-orange-400",
  },
]

const revenueData = {
  year1: {
    total: "1.03",
    profit: "0.55",
    margin: "53%",
    items: [
      { name: "研修事業", amount: 5964, pct: 58 },
      { name: "D-Code Platform", amount: 1015, pct: 10 },
      { name: "法人・コンサル", amount: 2930, pct: 28 },
      { name: "Store・その他", amount: 440, pct: 4 },
    ],
  },
  year2: {
    total: "3.5",
    profit: "1.5",
    margin: "43%",
    items: [
      { name: "研修事業", amount: 16800, pct: 48 },
      { name: "D-Code Platform", amount: 8400, pct: 24 },
      { name: "法人・コンサル", amount: 6300, pct: 18 },
      { name: "Store・その他", amount: 3500, pct: 10 },
    ],
  },
  year3: {
    total: "10.0",
    profit: "7.0",
    margin: "70%",
    items: [
      { name: "研修事業", amount: 28000, pct: 28 },
      { name: "D-Code Platform", amount: 37000, pct: 37 },
      { name: "法人・コンサル", amount: 13000, pct: 13 },
      { name: "Store・その他", amount: 10800, pct: 11 },
      { name: "医科展開", amount: 11200, pct: 11 },
    ],
  },
}

const whyUs = [
  {
    icon: Stethoscope,
    title: "歯科医師が創業",
    desc: "創業者自身が歯科医師。臨床経験に基づく深い業界理解と、現場の課題を知り尽くしたプロダクト設計。「外から見た歯科DX」ではなく「中から変える歯科DX」。",
  },
  {
    icon: Layers,
    title: "エコシステム設計",
    desc: "研修→開発→販売→導入の全レイヤーを自社で構築。研修が開発者を生み、開発者がアプリを生み、アプリが医院を集め、医院が研修受講者を生む循環構造。",
  },
  {
    icon: ShieldCheck,
    title: "MIERU Clinicの実績",
    desc: "自社プロダクト「MIERU Clinic」（患者体験改善プラットフォーム）を開発・運用中。歯科SaaSの開発・運用ノウハウを保有。D-Code Storeの最初の出品アプリにもなる。",
  },
  {
    icon: Globe,
    title: "TAM 972億円への展開",
    desc: "歯科（68,000院）で型を確立後、医科（102,000院）→介護（40,000施設）→薬局（60,000店）へ横展開。プラットフォーム構造は業種を問わず適用可能。",
  },
]

const milestones = [
  { month: "M1-3", title: "基盤構築", items: ["カリキュラム完成", "テンプレート10本開発", "レセコン1社交渉"] },
  { month: "M4-6", title: "研修開始", items: ["対面+オンライン開始", "D-Code Templates α版", "受講者50名達成"] },
  { month: "M7-12", title: "拡大", items: ["D-Code 50院契約", "認定講師3名育成", "レセコンAPI実証"] },
  { month: "Y2", title: "成長", items: ["講師5名・全国3都市", "D-Code 400院", "レセコンOEM契約"] },
  { month: "Y3", title: "10億円", items: ["講師10名・全国5都市", "D-Code 1,500院", "医科展開開始"] },
]

const competitiveEdges = [
  { label: "汎用AI研修", weakness: "歯科の課題を知らない", dcode: "歯科医師が教える" },
  { label: "歯科コンサル", weakness: "高額・属人的", dcode: "SaaSで標準化・低コスト" },
  { label: "レセコン会社", weakness: "自社開発のみ", dcode: "エコシステムで無限拡張" },
  { label: "口コミツール", weakness: "法令リスク", dcode: "コンプライアンス完全準拠" },
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
              D-Code
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
                AI研修で歯科医師を開発者に変え、
                <br className="hidden sm:block" />
                SaaS基盤で68,000院のDXインフラを構築する。
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="#products"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-violet-600 text-white font-medium hover:opacity-90 transition-opacity"
                >
                  プロダクト詳細
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="#financials"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-white/10 text-gray-300 hover:bg-white/5 transition-colors"
                >
                  収益シミュレーション
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
                レセコン（電子カルテ）以外のIT化はほぼゼロ。予約管理は紙と電話、患者情報の共有はカルテの手渡し、経営分析は院長の勘。68,000院がデジタル化を待っている。
              </p>
            </div>
            <div className="grid sm:grid-cols-3 gap-6">
              {[
                { stat: "83%", desc: "紙ベースの予約管理を続けている歯科医院の割合" },
                { stat: "92%", desc: "データに基づく経営判断ができていない院長の割合" },
                { stat: "¥0", desc: "歯科特化のDXプラットフォームへの投資額（国内市場）" },
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
                4つの事業が
                <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
                  相互に強化し合う
                </span>
                エコシステム
              </h2>
              <p className="text-gray-400">
                研修が開発者を生み、開発者がアプリを生み、アプリが医院を集め、医院が新たな研修受講者を生む。一方通行ではない、自己強化型の循環構造。
              </p>
            </div>

            {/* Flywheel Diagram */}
            <div className="max-w-2xl mx-auto mb-20">
              <div className="relative rounded-2xl border border-white/5 bg-white/[0.02] p-8 sm:p-12">
                <div className="grid grid-cols-2 gap-6 sm:gap-8">
                  {[
                    { icon: GraduationCap, label: "Academy", sub: "研修で開発者を育成", color: "text-blue-400 border-blue-500/20 bg-blue-500/5" },
                    { icon: Code2, label: "Platform", sub: "APIとツールを提供", color: "text-violet-400 border-violet-500/20 bg-violet-500/5" },
                    { icon: Store, label: "Store", sub: "アプリを販売", color: "text-emerald-400 border-emerald-500/20 bg-emerald-500/5" },
                    { icon: Building2, label: "Enterprise", sub: "大規模に導入", color: "text-amber-400 border-amber-500/20 bg-amber-500/5" },
                  ].map((item) => (
                    <div key={item.label} className={`flex flex-col items-center text-center p-4 sm:p-6 rounded-xl border ${item.color}`}>
                      <item.icon className="w-8 h-8 mb-3" />
                      <div className="font-semibold text-sm mb-1">{item.label}</div>
                      <div className="text-xs text-gray-400">{item.sub}</div>
                    </div>
                  ))}
                </div>
                {/* Connecting arrows */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full border border-white/10 bg-[#0a0a0f] flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 animate-pulse" />
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
              <h2 className="text-2xl sm:text-3xl font-bold mb-4">プロダクトラインナップ</h2>
              <p className="text-gray-400">4つのプロダクトが1つのプラットフォームを構成</p>
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
                            {idx === 0 ? "入口" : idx === 1 ? "基盤" : idx === 2 ? "拡張" : "拡大"}
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
                      <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Pricing</h4>
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
                      <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Key Points</h4>
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
                歯科DXは「外からIT企業が持ち込むもの」ではない。業界の内側から、現場を知る者が変革する必要がある。
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
              <h2 className="text-2xl sm:text-3xl font-bold mb-4">競合優位性</h2>
              <p className="text-gray-400">既存プレーヤーのいずれとも異なるポジション</p>
            </div>
            <div className="max-w-3xl mx-auto">
              <div className="rounded-xl border border-white/5 overflow-hidden">
                <div className="grid grid-cols-3 gap-0 text-sm font-semibold bg-white/[0.03] border-b border-white/5">
                  <div className="p-4 text-gray-400">既存プレーヤー</div>
                  <div className="p-4 text-gray-400 border-l border-white/5">限界</div>
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
              <h2 className="text-2xl sm:text-3xl font-bold mb-4">収益シミュレーション</h2>
              <p className="text-gray-400">3年でARR 10億円のプラットフォーム事業を構築</p>
            </div>

            {/* Summary Cards */}
            <div className="grid sm:grid-cols-3 gap-6 mb-12">
              {[
                { year: "Year 1", ...revenueData.year1 },
                { year: "Year 2", ...revenueData.year2 },
                { year: "Year 3", ...revenueData.year3 },
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
                    営業利益 ¥{y.profit}億（{y.margin}）
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

            {/* MRR Growth */}
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-6 sm:p-8 max-w-3xl mx-auto">
              <h3 className="text-lg font-semibold mb-2">D-Code MRR（月次リカーリング収益）推移</h3>
              <p className="text-sm text-gray-400 mb-6">プラットフォーム収益がYear 3で事業の主軸に</p>
              <div className="space-y-4">
                {[
                  { label: "Year 1末", mrr: "235万円", arr: "0.28億円", width: 3 },
                  { label: "Year 2末", mrr: "2,770万円", arr: "3.32億円", width: 37 },
                  { label: "Year 3末", mrr: "7,520万円", arr: "9.02億円", width: 100 },
                ].map((row) => (
                  <div key={row.label}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-gray-400">{row.label}</span>
                      <span className="text-gray-300">
                        MRR {row.mrr}
                        <span className="text-gray-500 ml-2">(ARR {row.arr})</span>
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
                  Year 3末 ARR ¥9.02億 × マルチプル 10〜20x =
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
        {/* TAM Expansion                                                */}
        {/* ============================================================ */}
        <section className="py-20 sm:py-24 border-t border-white/5">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold mb-4">市場拡大ポテンシャル</h2>
              <p className="text-gray-400">歯科で確立した型を医療・介護・薬局へ横展開</p>
            </div>
            <div className="max-w-3xl mx-auto">
              <div className="space-y-4">
                {[
                  { market: "歯科（Year 1〜）", count: "68,000院", tam: "245億円", width: 25, color: "from-blue-500 to-blue-400", active: true },
                  { market: "医科（Year 3〜）", count: "102,000院", tam: "367億円", width: 38, color: "from-violet-500 to-violet-400", active: false },
                  { market: "介護（Year 4〜）", count: "40,000施設", tam: "144億円", width: 15, color: "from-emerald-500 to-emerald-400", active: false },
                  { market: "薬局（Year 4〜）", count: "60,000店", tam: "216億円", width: 22, color: "from-amber-500 to-amber-400", active: false },
                ].map((m) => (
                  <div key={m.market} className={`rounded-xl border p-5 ${m.active ? 'border-blue-500/20 bg-blue-500/5' : 'border-white/5 bg-white/[0.02]'}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <span className="font-medium text-sm">{m.market}</span>
                        <span className="text-xs text-gray-500 ml-2">{m.count}</span>
                      </div>
                      <span className="text-sm font-semibold bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
                        TAM {m.tam}
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
                <span className="text-sm text-gray-400">合計TAM:</span>
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
                歯科DXの未来を、一緒に作りませんか。
              </h2>
              <p className="text-gray-400 mb-8 leading-relaxed">
                68,000院の歯科医院が変われば、日本の医療が変わる。
                <br />
                D-Codeは、その最初の一歩を踏み出しています。
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
            D-Code by 株式会社ファンクション・ティ
          </div>
          <div className="text-xs text-gray-600">
            &copy; {new Date().getFullYear()} Function-T Inc. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
