import { APP_NAME } from "@/lib/constants"
import {
  Eye,
  Repeat2,
  TrendingUp,
  ShieldCheck,
  Zap,
  Tablet,
  BarChart3,
  Target,
  Users,
  Building2,
  Rocket,
  FileBarChart,
  GraduationCap,
  Handshake,
  ArrowRight,
  CheckCircle2,
  Trophy,
  Globe,
  CircleAlert,
  ExternalLink,
} from "lucide-react"
import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "販促戦略 | MIERU Clinic",
  description: "MIERU Clinic Go-to-Market 戦略概要 — 社内・パートナー向け",
  robots: { index: false, follow: false },
}

/* ------------------------------------------------------------------ */
/* Data                                                               */
/* ------------------------------------------------------------------ */

const positioning = {
  category: "患者体験改善プラットフォーム",
  tagline: "口コミツールではない、新しいカテゴリの定義者",
  comparison: [
    { label: "口コミツール", price: "月1-3万円", position: "飽和市場" },
    { label: "MIERU Clinic", price: "月1-4万円", position: "競合ゼロの新カテゴリ" },
    { label: "経営コンサル", price: "月5-30万円", position: "高コスト" },
  ],
}

const painPoints = [
  "患者の本音が見えない（口コミは極端、スタッフ報告はバイアス）",
  "紙アンケートの集計に手間がかかり改善サイクルが回らない",
  "接遇改善や設備投資が経営成果に繋がっているか分からない",
]

const coreValues = [
  {
    icon: Eye,
    title: "可視化する",
    desc: "患者満足度をスコアで定量化。質問別・時間帯別分析で改善ポイントを特定",
  },
  {
    icon: Repeat2,
    title: "習慣化する",
    desc: "ゲーミフィケーション（日次目標・ストリーク・ランク）でスタッフの配布行動を定着",
  },
  {
    icon: TrendingUp,
    title: "経営に接続する",
    desc: "月次レポートで満足度と来院数・売上・自費率の相関を可視化",
  },
]

const differentiators = [
  {
    icon: ShieldCheck,
    title: "コンプライアンス準拠",
    desc: "口コミゲーティング非実施。医療広告ガイドライン・ステマ規制に完全準拠",
    detail: "日本の競合の大半がGoogleポリシー違反のゲーティング（高評価者のみ口コミ誘導）を実施。規制強化の追い風",
  },
  {
    icon: Target,
    title: "患者体験が主軸",
    desc: "日本市場に「患者体験改善プラットフォーム」の競合はゼロ",
    detail: "「口コミを増やす」ではなく「患者が戻ってくる医院になる」という上位の価値を訴求",
  },
  {
    icon: Trophy,
    title: "ゲーミフィケーション",
    desc: "8段階ランク・連続記録・Confetti・ハピネスメーター等の行動変容設計",
    detail: "スタッフの「アンケートを配る」行動を習慣化。数値目標とフィードバックの即時性がカギ",
  },
  {
    icon: Zap,
    title: "即日導入",
    desc: "QRコード/医院端末モードでEHR連携不要。当日から利用開始可能",
    detail: "グローバル競合の多くはEHR/PMS連携が前提。日本のEMR普及率のばらつきに対する大きな優位性",
  },
  {
    icon: FileBarChart,
    title: "経営指標との接続",
    desc: "月1回の入力で8+KPIを自動算出。満足度と売上の相関を可視化",
    detail: "院長の最大関心「これで売上が上がるのか？」に数字で応える。口コミツールにはない価値",
  },
]

const targetSegments = [
  {
    icon: Users,
    label: "メインターゲット",
    title: "オンラインサロン会員",
    desc: "約500名の歯科院長（月額¥3,300）",
    strategy: "パイロット30院無償提供 → 成果発表 → 有料転換",
  },
  {
    icon: Globe,
    label: "セカンダリ",
    title: "サロン外の歯科医院",
    desc: "Web広告・学会発表・紹介経由",
    strategy: "学術エビデンス（RCT論文）で信頼性を担保",
  },
  {
    icon: Building2,
    label: "将来拡大",
    title: "医科・美容・動物病院",
    desc: "歯科で実証後に横展開",
    strategy: "テンプレートのカスタマイズで多科種対応",
  },
]

const plans = [
  {
    name: "ライト",
    price: "9,800",
    target: "小規模個人医院",
    staff: "最大3名",
    features: ["QRコード/医院端末", "基本ダッシュボード", "月次サマリー"],
    highlight: false,
  },
  {
    name: "スタンダード",
    price: "19,800",
    target: "中規模医院",
    staff: "最大10名",
    features: [
      "全分析機能",
      "InsightCards",
      "改善アクション管理",
      "月次PDF生成",
      "コンプライアンス証明",
    ],
    highlight: true,
  },
  {
    name: "プレミアム",
    price: "39,800",
    target: "多拠点・法人",
    staff: "無制限",
    features: [
      "スタンダード全機能",
      "ベンチマーク比較",
      "ROIダッシュボード",
      "Google口コミ自動連携",
      "専任サポート",
    ],
    highlight: false,
  },
]

const channels = [
  {
    icon: Users,
    channel: "オンラインサロン",
    action: "パイロット30院 → 成果発表 → 有料転換",
    priority: "最優先",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: GraduationCap,
    channel: "学会発表",
    action: "日本歯科医療管理学会・日本医療情報学会",
    priority: "高",
    color: "bg-emerald-100 text-emerald-700",
  },
  {
    icon: FileBarChart,
    channel: "RCT論文",
    action: "30院RCTで学術エビデンスを確立",
    priority: "高（中長期）",
    color: "bg-emerald-100 text-emerald-700",
  },
  {
    icon: Rocket,
    channel: "コンテンツ",
    action: "ステマ規制記事・改善事例の発信",
    priority: "中",
    color: "bg-amber-100 text-amber-700",
  },
  {
    icon: Handshake,
    channel: "紹介プログラム",
    action: "既存ユーザーからの口コミ・紹介",
    priority: "中",
    color: "bg-amber-100 text-amber-700",
  },
]

const revenueTargets = [
  {
    year: "1年目",
    month: "12ヶ月目",
    clinics: 48,
    mrr: "¥71万",
    arr: "¥850万",
    breakdown: "ライト30 + スタンダード15 + プレミアム3",
  },
  {
    year: "2年目",
    month: "24ヶ月目",
    clinics: 140,
    mrr: "¥217万",
    arr: "¥2,600万",
    breakdown: "ライト80 + スタンダード50 + プレミアム10",
  },
]

const timeline = [
  { phase: "Phase 1", period: "月1-3", title: "サロン内パイロット", desc: "30院無償導入・データ蓄積・改善事例作成" },
  { phase: "Phase 2", period: "月4-6", title: "有料転換・初期販売", desc: "パイロット成果発表・価格プラン公開・初期有料顧客獲得" },
  { phase: "Phase 3", period: "月7-12", title: "外部拡大", desc: "学会発表・コンテンツマーケティング・紹介プログラム開始" },
  { phase: "Phase 4", period: "月13-18", title: "エビデンス確立", desc: "RCT論文投稿・ベンチマーク機能有効化・多科種展開準備" },
]

const competitors = [
  { name: "口コミPLUS", type: "口コミ獲得", compliance: false, analysis: false, staffTracking: false, price: "¥1万/月" },
  { name: "Hero Innovation", type: "口コミ獲得", compliance: false, analysis: false, staffTracking: false, price: "非公開" },
  { name: "Gyro-n キキコミ", type: "口コミ獲得", compliance: true, analysis: false, staffTracking: false, price: "非公開" },
  { name: "MIERU Clinic", type: "患者体験改善", compliance: true, analysis: true, staffTracking: true, price: "¥1-4万/月" },
]

/* ------------------------------------------------------------------ */
/* Page Component                                                     */
/* ------------------------------------------------------------------ */

export default function StrategyPage() {
  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      {/* ===== Header ===== */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container flex h-14 items-center justify-between">
          <span className="text-lg font-bold text-gradient">{APP_NAME}</span>
          <span className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
            社内・パートナー向け資料
          </span>
        </div>
      </header>

      {/* ===== Hero ===== */}
      <section className="hero-gradient py-16 lg:py-24">
        <div className="container max-w-4xl text-center">
          <p className="mb-4 text-sm font-medium uppercase tracking-wider text-primary">
            Go-to-Market Strategy
          </p>
          <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
            <span className="text-gradient">MIERU Clinic</span>
            <br />
            販促戦略概要
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            歯科医院専用 患者満足度向上プラットフォーム。
            口コミツールではない新カテゴリの定義者として、
            日本の歯科医院68,000院への展開を目指す。
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
            <span>株式会社ファンクション・ティ</span>
            <span>|</span>
            <span>2026年2月</span>
            <span>|</span>
            <span>Confidential</span>
          </div>
        </div>
      </section>

      {/* ===== 解決する課題 ===== */}
      <section className="border-t py-14 lg:py-20">
        <div className="container max-w-4xl">
          <SectionTitle number="01" title="解決する課題" />
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {painPoints.map((pain, i) => (
              <div key={i} className="rounded-xl border border-orange-200/60 bg-orange-50/50 p-5">
                <CircleAlert className="mb-3 h-5 w-5 text-orange-500" />
                <p className="text-sm leading-relaxed text-foreground/80">{pain}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 提供価値 ===== */}
      <section className="border-t bg-muted/30 py-14 lg:py-20">
        <div className="container max-w-4xl">
          <SectionTitle number="02" title="MIERUが提供する3つの価値" />
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {coreValues.map((val, i) => (
              <div key={i} className="rounded-2xl border bg-card p-6">
                <div className="mb-4 inline-flex rounded-xl bg-primary/10 p-3">
                  <val.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">{val.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{val.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== ポジショニング ===== */}
      <section className="border-t py-14 lg:py-20">
        <div className="container max-w-4xl">
          <SectionTitle number="03" title="市場ポジショニング" />
          <div className="mt-8 rounded-2xl border bg-card p-6 sm:p-8">
            <div className="mb-6 text-center">
              <p className="text-sm text-muted-foreground">カテゴリ</p>
              <p className="mt-1 text-xl font-bold text-gradient">{positioning.category}</p>
              <p className="mt-2 text-sm text-muted-foreground">{positioning.tagline}</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {positioning.comparison.map((item, i) => (
                <div
                  key={i}
                  className={`rounded-xl border p-4 text-center ${
                    i === 1 ? "border-primary/30 bg-primary/5" : ""
                  }`}
                >
                  <p className="text-sm font-semibold">{item.label}</p>
                  <p className="mt-1 text-lg font-bold">{item.price}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{item.position}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== 競合比較 ===== */}
      <section className="border-t bg-muted/30 py-14 lg:py-20">
        <div className="container max-w-4xl">
          <SectionTitle number="04" title="競合比較マトリクス" />
          <div className="mt-8 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-3 pr-4 font-semibold">ツール</th>
                  <th className="pb-3 pr-4 font-semibold">主軸</th>
                  <th className="pb-3 pr-4 font-semibold text-center">コンプライアンス</th>
                  <th className="pb-3 pr-4 font-semibold text-center">満足度分析</th>
                  <th className="pb-3 pr-4 font-semibold text-center">スタッフ追跡</th>
                  <th className="pb-3 font-semibold">価格帯</th>
                </tr>
              </thead>
              <tbody>
                {competitors.map((c, i) => (
                  <tr
                    key={i}
                    className={`border-b ${c.name === "MIERU Clinic" ? "bg-primary/5 font-medium" : ""}`}
                  >
                    <td className="py-3 pr-4">{c.name}</td>
                    <td className="py-3 pr-4 text-muted-foreground">{c.type}</td>
                    <td className="py-3 pr-4 text-center">{c.compliance ? <Check /> : <Cross />}</td>
                    <td className="py-3 pr-4 text-center">{c.analysis ? <Check /> : <Cross />}</td>
                    <td className="py-3 pr-4 text-center">{c.staffTracking ? <Check /> : <Cross />}</td>
                    <td className="py-3">{c.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            ※ コンプライアンス = Googleポリシー・ステマ規制に準拠（ゲーティング非実施）
          </p>
        </div>
      </section>

      {/* ===== 5つの差別化 ===== */}
      <section className="border-t py-14 lg:py-20">
        <div className="container max-w-4xl">
          <SectionTitle number="05" title="5つの競合優位性" />
          <div className="mt-8 space-y-4">
            {differentiators.map((d, i) => (
              <div key={i} className="card-hover rounded-2xl border bg-card p-5 sm:p-6">
                <div className="flex items-start gap-4">
                  <div className="shrink-0 rounded-xl bg-primary/10 p-3">
                    <d.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold">{d.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{d.desc}</p>
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground/80">{d.detail}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== ターゲット ===== */}
      <section className="border-t bg-muted/30 py-14 lg:py-20">
        <div className="container max-w-4xl">
          <SectionTitle number="06" title="ターゲットセグメント" />
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {targetSegments.map((seg, i) => (
              <div key={i} className="rounded-2xl border bg-card p-6">
                <div className="mb-3 inline-flex rounded-lg bg-primary/10 p-2">
                  <seg.icon className="h-5 w-5 text-primary" />
                </div>
                <p className="text-xs font-medium uppercase tracking-wider text-primary">{seg.label}</p>
                <h3 className="mt-1 text-lg font-semibold">{seg.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{seg.desc}</p>
                <div className="mt-4 flex items-start gap-2 rounded-lg bg-muted/50 p-3">
                  <ArrowRight className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                  <p className="text-xs leading-relaxed text-muted-foreground">{seg.strategy}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 価格体系 ===== */}
      <section className="border-t py-14 lg:py-20">
        <div className="container max-w-4xl">
          <SectionTitle number="07" title="価格体系" />
          <p className="mt-2 text-sm text-muted-foreground">年間契約: 2ヶ月無料（17%割引）/ 無料トライアル: 30日間・カード不要</p>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {plans.map((plan, i) => (
              <div
                key={i}
                className={`relative rounded-2xl border p-6 ${
                  plan.highlight
                    ? "border-primary/40 bg-primary/[0.02] shadow-lg shadow-primary/10"
                    : "bg-card"
                }`}
              >
                {plan.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-medium text-primary-foreground">
                    推奨
                  </span>
                )}
                <h3 className="text-lg font-bold">{plan.name}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{plan.target} / {plan.staff}</p>
                <div className="my-4">
                  <span className="text-3xl font-bold">¥{plan.price}</span>
                  <span className="text-sm text-muted-foreground">/月（税抜）</span>
                </div>
                <ul className="space-y-2">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-xl bg-muted/40 p-4 text-center text-sm text-muted-foreground">
            <strong>価格設計の考え方:</strong> 「口コミツールの2倍、経営コンサルの1/10」の隙間を狙う。スタッフ1人あたり月¥2,000の「研修投資」として訴求
          </div>
        </div>
      </section>

      {/* ===== GTMチャネル ===== */}
      <section className="border-t bg-muted/30 py-14 lg:py-20">
        <div className="container max-w-4xl">
          <SectionTitle number="08" title="販促チャネル" />
          <div className="mt-8 space-y-3">
            {channels.map((ch, i) => (
              <div key={i} className="flex items-center gap-4 rounded-xl border bg-card p-4">
                <div className="shrink-0 rounded-lg bg-primary/10 p-2.5">
                  <ch.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{ch.channel}</h3>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${ch.color}`}>
                      {ch.priority}
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground">{ch.action}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 収益目標 ===== */}
      <section className="border-t py-14 lg:py-20">
        <div className="container max-w-4xl">
          <SectionTitle number="09" title="収益目標" />
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            {revenueTargets.map((r, i) => (
              <div key={i} className="rounded-2xl border bg-card p-6">
                <p className="text-sm font-medium text-primary">{r.year}（{r.month}時点）</p>
                <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold">{r.clinics}</p>
                    <p className="text-xs text-muted-foreground">契約院数</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{r.mrr}</p>
                    <p className="text-xs text-muted-foreground">MRR</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gradient">{r.arr}</p>
                    <p className="text-xs text-muted-foreground">ARR</p>
                  </div>
                </div>
                <p className="mt-4 text-xs text-muted-foreground">{r.breakdown}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== タイムライン ===== */}
      <section className="border-t bg-muted/30 py-14 lg:py-20">
        <div className="container max-w-4xl">
          <SectionTitle number="10" title="実行タイムライン（18ヶ月）" />
          <div className="mt-8 space-y-4">
            {timeline.map((t, i) => (
              <div key={i} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {i + 1}
                  </div>
                  {i < timeline.length - 1 && (
                    <div className="mt-1 h-full w-px bg-primary/20" />
                  )}
                </div>
                <div className="pb-6">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      {t.period}
                    </span>
                    <h3 className="font-semibold">{t.title}</h3>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{t.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== エビデンス戦略 ===== */}
      <section className="border-t py-14 lg:py-20">
        <div className="container max-w-4xl">
          <SectionTitle number="11" title="学術エビデンス構築" />
          <div className="mt-8 rounded-2xl border bg-card p-6 sm:p-8">
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <h3 className="mb-3 font-semibold">RCT研究計画</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    <span>待機リスト対照クラスターRCT（30院）</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    <span>介入6ヶ月間・CONSORT 2010準拠</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    <span>UMIN-CTR事前登録・倫理審査</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    <span>COI透明性確保（独立した解析者）</span>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="mb-3 font-semibold">投稿先候補</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>1. JMIR (IF ~7.0) — デジタルヘルス最高峰</li>
                  <li>2. BMC Oral Health (IF ~4.0) — 歯科OA</li>
                  <li>3. International Dental Journal (IF ~3.5)</li>
                  <li>4. 日本歯科医療管理学会雑誌</li>
                </ul>
                <Link
                  href="/research-protocol"
                  className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
                >
                  <ExternalLink className="h-3 w-3" />
                  研究計画書（全20章）を見る
                </Link>
              </div>
            </div>
            {/* 3チャネル募集 */}
            <div className="mt-6 rounded-xl border border-primary/10 bg-primary/[0.02] p-5">
              <h3 className="mb-3 font-semibold">3チャネル募集戦略（母数7,500名）</h3>
              <div className="grid gap-3 text-sm sm:grid-cols-3">
                <div className="rounded-lg bg-card p-3">
                  <p className="font-medium">サロン</p>
                  <p className="text-xs text-muted-foreground">500名 → 50-75院応募</p>
                  <p className="mt-1 text-xs text-primary">主力・脱落率低</p>
                </div>
                <div className="rounded-lg bg-card p-3">
                  <p className="font-medium">LINE</p>
                  <p className="text-xs text-muted-foreground">2,000名 → 60-100院応募</p>
                  <p className="mt-1 text-xs text-primary">層別の穴埋め</p>
                </div>
                <div className="rounded-lg bg-card p-3">
                  <p className="font-medium">SNS</p>
                  <p className="text-xs text-muted-foreground">5,000名 → 50-100院応募</p>
                  <p className="mt-1 text-xs text-primary">多様性・外的妥当性</p>
                </div>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                選外の応募院（推定130-245院）→ 有料版リリース時の優先案内リスト
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Key Message ===== */}
      <section className="border-t">
        <div className="landing-gradient py-16 lg:py-24">
          <div className="container max-w-3xl text-center">
            <Tablet className="mx-auto mb-6 h-12 w-12 text-primary/60" />
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              口コミツールではない。
              <br />
              <span className="text-gradient">患者体験改善プラットフォーム。</span>
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-muted-foreground">
              飽和した口コミツール市場から離脱し、
              競合ゼロの新カテゴリを定義する。
              歯科医院の患者満足度を可視化し、
              データに基づく改善サイクルで経営成果につなげる。
            </p>
            <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-5 py-2 text-sm font-medium text-primary">
              <BarChart3 className="h-4 w-4" />
              mieru-clinic.com
            </div>
          </div>
        </div>
      </section>

      {/* ===== Footer ===== */}
      <footer className="border-t py-8">
        <div className="container text-center text-xs text-muted-foreground">
          <p>
            CONFIDENTIAL — 本資料は社内および提携パートナー向けです。無断転載・配布を禁じます。
          </p>
          <p className="mt-2">
            &copy; 2025-2026 株式会社ファンクション・ティ. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Sub Components                                                     */
/* ------------------------------------------------------------------ */

function SectionTitle({ number, title }: { number: string; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
        {number}
      </span>
      <h2 className="text-xl font-bold tracking-tight sm:text-2xl">{title}</h2>
    </div>
  )
}

function Check() {
  return <span className="inline-block h-4 w-4 rounded-full bg-emerald-100 text-center text-xs leading-4 text-emerald-600">&#10003;</span>
}

function Cross() {
  return <span className="inline-block h-4 w-4 rounded-full bg-red-100 text-center text-xs leading-4 text-red-500">&times;</span>
}
