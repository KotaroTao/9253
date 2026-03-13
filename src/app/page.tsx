import Link from "next/link"
import Image from "next/image"
import type { Metadata } from "next"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { APP_NAME, PLANS, PLAN_ORDER } from "@/lib/constants"
import { messages } from "@/lib/messages"
import { LandingHeader } from "@/components/landing/mobile-nav"
import { FAQSection } from "@/components/landing/faq-section"
import { ScrollAnimationProvider } from "@/components/landing/scroll-animation"
import { CountUp } from "@/components/landing/count-up"
import {
  BarChart3,
  ArrowRight,
  Tablet,
  LineChart,
  Shield,
  Lock,
  CheckCircle2,
  CircleAlert,
  ExternalLink,
  Trophy,
  ClipboardCheck,
  FileBarChart,
  UserPlus,
  Eye,
  Repeat2,
  TrendingUp,
  ShieldCheck,
  EyeOff,
  Zap,
  Building2,
  AlertTriangle,
  Check,
  X,
  Sparkles,
  Star,
  Heart,
  BookOpen,
  Smile,
  TrendingDown,
  Gamepad2,
  Stethoscope,
} from "lucide-react"

export const metadata: Metadata = {
  title: "MIERU Clinic | 歯科医院専用 患者体験改善プラットフォーム",
  description:
    "30秒タブレットアンケートで患者の本音を数値化。集計・分析・レポートを自動化し、効率的に患者体験の改善サイクルを実現。歯科医院専用・基本無料で始められます。",
  keywords: "歯科,患者満足度,アンケート,医院経営,患者体験,MIERU Clinic,歯科経営,自動化,効率化",
  openGraph: {
    title: "MIERU Clinic | 歯科医院専用 患者体験改善プラットフォーム",
    description:
      "30秒タブレットアンケートで患者の本音を数値化。集計・分析を自動化し、効率的に改善サイクルを実現。歯科医院専用・基本無料。",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "MIERU Clinic | 患者体験改善プラットフォーム",
    description:
      "30秒アンケートで患者体験を数値化。集計・分析・レポートを自動化。歯科医院専用・基本無料。",
  },
}

const trustItems = [
  { icon: ShieldCheck, label: messages.landing.trust1 },
  { icon: EyeOff, label: messages.landing.trust2 },
  { icon: Zap, label: messages.landing.trust3 },
  { icon: Building2, label: messages.landing.trust4 },
  { icon: Heart, label: messages.landing.trust5 },
]

const painSolutions = [
  {
    painTitle: messages.landing.pain1Title,
    painDesc: messages.landing.pain1Desc,
    painScenario: messages.landing.pain1Scenario,
    solutionIcon: Eye,
    solutionTitle: messages.landing.solutionValue1Title,
    solutionDesc: messages.landing.solutionValue1Desc,
  },
  {
    painTitle: messages.landing.pain2Title,
    painDesc: messages.landing.pain2Desc,
    painScenario: messages.landing.pain2Scenario,
    solutionIcon: Repeat2,
    solutionTitle: messages.landing.solutionValue2Title,
    solutionDesc: messages.landing.solutionValue2Desc,
  },
  {
    painTitle: messages.landing.pain3Title,
    painDesc: messages.landing.pain3Desc,
    painScenario: messages.landing.pain3Scenario,
    solutionIcon: TrendingUp,
    solutionTitle: messages.landing.solutionValue3Title,
    solutionDesc: messages.landing.solutionValue3Desc,
  },
]

const features = [
  {
    icon: Tablet,
    title: messages.landing.feature1Title,
    description: messages.landing.feature1Desc,
    mock: "survey",
  },
  {
    icon: BarChart3,
    title: messages.landing.feature2Title,
    description: messages.landing.feature2Desc,
    mock: "dashboard",
  },
  {
    icon: Trophy,
    title: messages.landing.feature3Title,
    description: messages.landing.feature3Desc,
    mock: "gamification",
  },
  {
    icon: ClipboardCheck,
    title: messages.landing.feature4Title,
    description: messages.landing.feature4Desc,
    mock: "actions",
  },
  {
    icon: FileBarChart,
    title: messages.landing.feature5Title,
    description: messages.landing.feature5Desc,
    mock: "metrics",
    badge: "Premium",
  },
]

const flowSteps = [
  {
    icon: UserPlus,
    title: messages.landing.flow1Title,
    desc: messages.landing.flow1Desc,
  },
  {
    icon: Tablet,
    title: messages.landing.flow2Title,
    desc: messages.landing.flow2Desc,
  },
  {
    icon: LineChart,
    title: messages.landing.flow3Title,
    desc: messages.landing.flow3Desc,
  },
]

const complianceItems = [
  {
    icon: Shield,
    title: messages.landing.compliance1Title,
    desc: messages.landing.compliance1Desc,
  },
  {
    icon: Lock,
    title: messages.landing.compliance2Title,
    desc: messages.landing.compliance2Desc,
  },
  {
    icon: CheckCircle2,
    title: messages.landing.compliance3Title,
    desc: messages.landing.compliance3Desc,
  },
]

// Comparison table data
const comparisonRows = [
  {
    label: "医療広告ガイドライン準拠",
    mieru: { text: "完全準拠", status: "good" as const },
    aiReview: { text: "違反リスクあり", status: "bad" as const },
    form: { text: "問題なし", status: "good" as const },
  },
  {
    label: "患者の本音の収集",
    mieru: { text: "診療直後30秒", status: "good" as const },
    aiReview: { text: "AI生成（実際の声でない）", status: "bad" as const },
    form: { text: "集計手動", status: "neutral" as const },
  },
  {
    label: "リアルタイム分析",
    mieru: { text: "自動", status: "good" as const },
    aiReview: { text: "なし", status: "bad" as const },
    form: { text: "手動", status: "bad" as const },
  },
  {
    label: "経営指標との連携",
    mieru: { text: "来院数・売上相関", status: "good" as const },
    aiReview: { text: "なし", status: "bad" as const },
    form: { text: "なし", status: "bad" as const },
  },
  {
    label: "スタッフ習慣化",
    mieru: { text: "ゲーミフィケーション", status: "good" as const },
    aiReview: { text: "なし", status: "bad" as const },
    form: { text: "なし", status: "bad" as const },
  },
  {
    label: "個人情報収集",
    mieru: { text: "非収集", status: "good" as const },
    aiReview: { text: "要確認", status: "neutral" as const },
    form: { text: "設計依存", status: "neutral" as const },
  },
  {
    label: "料金",
    mieru: { text: "基本無料", status: "good" as const },
    aiReview: { text: "有料", status: "neutral" as const },
    form: { text: "無料（分析別途）", status: "neutral" as const },
  },
]

function ComparisonStatusIcon({ status }: { status: "good" | "bad" | "neutral" }) {
  if (status === "good") return <Check className="inline h-4 w-4 text-emerald-600" />
  if (status === "bad") return <X className="inline h-4 w-4 text-red-500" />
  return <span className="inline-block h-4 w-4 text-center text-amber-500">△</span>
}

// Feature mock components
function SurveyMock() {
  return (
    <div className="rounded-xl border bg-muted/30 p-3">
      <div className="space-y-2">
        {["スタッフの対応", "待ち時間", "治療の説明"].map((q, i) => (
          <div key={i} className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">{q}</span>
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`h-3 w-3 ${s <= 4 - i * 0.5 + 1 ? "fill-amber-400 text-amber-400" : "text-muted"}`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function DashboardMock() {
  return (
    <div className="rounded-xl border bg-muted/30 p-3">
      <div className="flex items-end gap-1 h-12">
        {[35, 42, 38, 55, 60, 72, 80].map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-sm bg-primary/50"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
        <span>月</span><span>火</span><span>水</span><span>木</span><span>金</span><span>土</span><span>日</span>
      </div>
    </div>
  )
}

function GamificationMock() {
  return (
    <div className="rounded-xl border bg-muted/30 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium">🦷 Kawaii Teeth</span>
        <span className="text-[10px] text-emerald-600">⚡ ゴールド</span>
      </div>
      <div className="h-2 rounded-full bg-muted">
        <div className="h-full w-[83%] rounded-full bg-pink-400" />
      </div>
      <p className="text-[9px] text-muted-foreground">25/30 件 — 次の Kawaii Teeth まで</p>
    </div>
  )
}

function ActionsMock() {
  return (
    <div className="rounded-xl border bg-muted/30 p-3 space-y-1.5">
      {[
        { name: "接遇マナー研修", before: "4.1", after: "4.53", delta: "+0.4" },
        { name: "視覚資料活用", before: "3.89", after: "4.29", delta: "+0.4" },
      ].map((a, i) => (
        <div key={i} className="flex items-center justify-between">
          <span className="text-[9px] truncate max-w-[100px]">{a.name}</span>
          <div className="flex items-center gap-1">
            <span className="text-[9px] text-muted-foreground">{a.before}</span>
            <span className="text-[9px]">→</span>
            <span className="text-[9px] font-bold text-primary">{a.after}</span>
            <span className="text-[8px] rounded bg-green-100 px-1 text-green-700">▲{a.delta}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

function MetricsMock() {
  return (
    <div className="rounded-xl border bg-muted/30 p-3">
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: "来院数", value: "336人" },
          { label: "売上", value: "399万" },
          { label: "自費率", value: "34.3%" },
          { label: "患者単価", value: "1.2万" },
        ].map((m, i) => (
          <div key={i} className="text-center">
            <p className="text-[9px] text-muted-foreground">{m.label}</p>
            <p className="text-xs font-bold">{m.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

const featureMocks: Record<string, () => JSX.Element> = {
  survey: SurveyMock,
  dashboard: DashboardMock,
  gamification: GamificationMock,
  actions: ActionsMock,
  metrics: MetricsMock,
}

export default function HomePage() {
  return (
    <ScrollAnimationProvider>
      <div className="flex min-h-screen flex-col">
        <LandingHeader />

        {/* ===== Hero ===== */}
        <section className="hero-gradient relative overflow-hidden">
          <div className="container relative z-10 py-20 lg:py-32">
            <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
              {/* Left column */}
              <div>
                <span className="animate-fade-in-up mb-6 inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary">
                  <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                  {messages.landing.heroBadge}
                </span>
                <h1 className="animate-fade-in-up-delay-1">
                  <span className="flex flex-col gap-1 sm:gap-2">
                    <span className="text-xl font-extrabold tracking-tight text-primary sm:text-3xl lg:text-4xl">
                      {messages.landing.heroHeadlineLeft}
                    </span>
                    <span className="text-xl font-extrabold tracking-tight sm:text-3xl lg:text-4xl">
                      {messages.landing.heroHeadlineRight}
                    </span>
                  </span>
                </h1>
                <p className="animate-fade-in-up-delay-2 mt-6 max-w-lg whitespace-pre-line text-base leading-relaxed text-muted-foreground sm:text-lg">
                  {messages.landing.heroSub}
                </p>
                <div className="animate-fade-in-up-delay-3 mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4">
                  <Button asChild size="lg" className="h-13 px-8 text-base shadow-lg shadow-primary/25">
                    <Link href="/register">
                      {messages.landing.heroCta}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="h-13 px-8 text-base">
                    <a href="#features">
                      {messages.landing.heroCtaSub}
                    </a>
                  </Button>
                </div>
                <p className="animate-fade-in-up-delay-3 mt-5 text-xs text-muted-foreground">
                  {messages.landing.heroSocialProof}
                </p>
              </div>

              {/* Right column — 3-layer dashboard mock */}
              <div className="relative mx-auto w-full max-w-lg lg:mx-0">
                {/* Card 1 (back): Metrics */}
                <div className="hero-card-1 absolute -left-4 -top-4 z-10 w-[70%] rotate-[-3deg]">
                  <div className="rounded-2xl border bg-card/90 p-4 shadow-xl backdrop-blur">
                    <p className="text-[10px] font-medium text-muted-foreground mb-2">📊 経営レポート</p>
                    <div className="flex items-end gap-1 h-16">
                      {[45, 52, 48, 60, 65, 72].map((h, i) => (
                        <div key={i} className="flex-1 rounded-sm bg-emerald-400/50" style={{ height: `${h}%` }} />
                      ))}
                    </div>
                    <p className="mt-1 text-[9px] text-muted-foreground">来院数推移（6ヶ月）</p>
                  </div>
                </div>

                {/* Card 2 (middle): Satisfaction report */}
                <div className="hero-card-2 absolute -right-2 top-8 z-20 w-[65%] rotate-[2deg]">
                  <div className="rounded-2xl border bg-card/90 p-4 shadow-xl backdrop-blur">
                    <p className="text-[10px] font-medium text-muted-foreground mb-2">📈 満足度レポート</p>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-primary">4.6</span>
                      <span className="text-xs text-emerald-600">↑ 0.3</span>
                    </div>
                    <div className="mt-2 flex items-end gap-0.5 h-10">
                      {[60, 65, 58, 70, 75, 80, 85].map((h, i) => (
                        <div key={i} className="flex-1 rounded-sm bg-primary/40" style={{ height: `${h}%` }} />
                      ))}
                    </div>
                    <p className="mt-1 text-[9px] text-muted-foreground">直近30日 222件</p>
                  </div>
                </div>

                {/* Card 3 (front): Gamification & Kawaii Teeth */}
                <div className="hero-card-3 relative z-30 mt-20 ml-4">
                  <div className="rounded-2xl border bg-card p-5 shadow-2xl">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-purple-500">🏆</span>
                      <span className="text-sm font-bold">ゲーミフィケーション</span>
                    </div>
                    <div className="space-y-2">
                      <div className="rounded-xl bg-purple-50 p-3">
                        <p className="text-[10px] font-semibold text-purple-700 mb-1">⚡ ランクシステム</p>
                        <p className="text-[10px] text-purple-600">
                          現在ゴールドランク！プラチナまであと12件
                        </p>
                      </div>
                      <div className="rounded-xl bg-pink-50 p-3">
                        <p className="text-[10px] font-semibold text-pink-700 mb-1">🦷 Kawaii Teeth</p>
                        <p className="text-[10px] text-pink-600">
                          アンケート30件ごとにキャラクターを獲得！コレクション 5/12体
                        </p>
                      </div>
                      <div className="rounded-xl bg-blue-50 p-3">
                        <p className="text-[10px] font-semibold text-blue-700 mb-1">📊 質問別スコア</p>
                        <p className="text-[10px] text-blue-600">
                          「スタッフの対応」(4.7)、「治療説明」(4.5) が高評価
                        </p>
                      </div>
                      <div className="rounded-xl bg-green-50 p-3">
                        <p className="text-[10px] font-semibold text-green-700 mb-1">🎯 改善アクション</p>
                        <p className="text-[10px] text-green-600">
                          「費用説明の改善」実施中。ベースライン 3.9 → 現在 4.2
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Decorative elements */}
          <div className="pointer-events-none absolute -right-40 -top-40 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
        </section>

        {/* ===== Trust Bar ===== */}
        <section className="border-y bg-muted/20 py-6">
          <div className="container">
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
              {trustItems.map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <item.icon className="h-4 w-4 shrink-0 text-primary/60" />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== Pain → Solution (統合) ===== */}
        <section id="pain" className="py-20 lg:py-28">
          <div className="container max-w-4xl">
            <div className="mb-14 text-center animate-on-scroll">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {messages.landing.painTitle}
              </h2>
            </div>
            <div className="space-y-5 animate-on-scroll">
              {painSolutions.map((item, i) => (
                <div
                  key={i}
                  className="grid gap-0 overflow-hidden rounded-xl border sm:grid-cols-2"
                >
                  {/* Pain (left) */}
                  <div className="border-b bg-orange-50/50 p-6 sm:border-b-0 sm:border-r">
                    <div className="mb-2 flex items-center gap-2">
                      <CircleAlert className="h-5 w-5 shrink-0 text-orange-500" />
                      <h3 className="font-semibold text-foreground">{item.painTitle}</h3>
                    </div>
                    <p className="text-sm leading-relaxed text-foreground/70">
                      {item.painDesc}
                    </p>
                    <p className="mt-2 text-xs italic text-orange-600/80">
                      {item.painScenario}
                    </p>
                  </div>
                  {/* Solution (right) */}
                  <div className="bg-primary/[0.03] p-6">
                    <div className="mb-2 flex items-center gap-2">
                      <div className="inline-flex rounded-lg bg-primary/10 p-1.5">
                        <item.solutionIcon className="h-4 w-4 text-primary" />
                      </div>
                      <h3 className="font-semibold text-primary">{item.solutionTitle}</h3>
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {item.solutionDesc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            {/* Warning about AI review tools */}
            <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-5 animate-on-scroll">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                <p className="whitespace-pre-line text-sm leading-relaxed text-amber-800">
                  {messages.landing.painWarning}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ===== Founder Story ===== */}
        <section className="founder-gradient py-20 lg:py-28">
          <div className="container">
            <div className="mx-auto max-w-4xl animate-on-scroll">
              <div className="grid items-center gap-10 lg:grid-cols-[1fr,auto]">
                {/* Left: Text */}
                <div>
                  <span className="mb-4 inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary">
                    {messages.landing.founderBadge}
                  </span>
                  <h2 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
                    {messages.landing.founderTitle}
                  </h2>
                  <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
                    <p>{messages.landing.founderBody1}</p>
                    <p className="font-medium text-foreground/80">
                      {messages.landing.founderBody2}
                    </p>
                    <p>{messages.landing.founderBody3}</p>
                  </div>
                  <div className="mt-8 border-t pt-6">
                    <p className="text-base font-semibold">{messages.landing.founderName}</p>
                    <p className="text-sm text-muted-foreground">{messages.landing.founderRole}</p>
                  </div>
                </div>
                {/* Right: Photo */}
                <div className="mx-auto lg:mx-0">
                  <div className="relative aspect-[4/5] w-64 overflow-hidden rounded-2xl bg-muted shadow-lg">
                    {/* Fallback placeholder (shown when image not available) */}
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10">
                      <span className="text-6xl text-primary/20">👨‍⚕️</span>
                    </div>
                    {/* Actual photo overlays placeholder */}
                    <Image
                      src="/founder-photo.jpg"
                      alt={messages.landing.founderCaption}
                      fill
                      className="relative z-10 object-cover"
                      sizes="256px"
                      priority={false}
                    />
                  </div>
                  <p className="mt-3 text-center text-xs text-muted-foreground">
                    {messages.landing.founderCaption}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== Features ===== */}
        <section id="features" className="py-20 lg:py-28">
          <div className="container">
            <div className="mx-auto mb-14 max-w-2xl text-center animate-on-scroll">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {messages.landing.featuresTitle}
              </h2>
            </div>
            <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3 animate-on-scroll">
              {features.map((feature, i) => {
                const MockComponent = featureMocks[feature.mock]
                return (
                  <div
                    key={i}
                    className="hover-lift rounded-2xl border bg-card p-7"
                  >
                    <div className="mb-4 flex items-center gap-2">
                      <div className="inline-flex rounded-xl bg-primary/10 p-3">
                        <feature.icon className="h-6 w-6 text-primary" />
                      </div>
                      {feature.badge && (
                        <Badge
                          variant={feature.badge === "Premium" ? "default" : "secondary"}
                          className={feature.badge === "Premium" ? "bg-amber-500 hover:bg-amber-600 text-white" : ""}
                        >
                          {feature.badge}
                        </Badge>
                      )}
                    </div>
                    <h3 className="mb-2.5 text-lg font-semibold">
                      {feature.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {feature.description}
                    </p>
                    {MockComponent && (
                      <div className="mt-4">
                        <MockComponent />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* ===== Competitor Comparison ===== */}
        <section className="border-t bg-muted/30 py-20 lg:py-28">
          <div className="container">
            <div className="mx-auto mb-14 max-w-2xl text-center animate-on-scroll">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {messages.landing.comparisonTitle}
              </h2>
              <p className="mt-3 text-muted-foreground">
                {messages.landing.comparisonSub}
              </p>
            </div>
            <div className="mx-auto max-w-4xl animate-on-scroll">
              <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5">
                <p className="flex items-center gap-2 text-xs text-amber-800">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  {messages.landing.comparisonNote}
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="py-3 pr-4 text-left font-medium text-muted-foreground">機能・観点</th>
                      <th className="py-3 px-4 text-center font-bold text-primary bg-primary/5 rounded-t-lg min-w-[140px]">MIERU Clinic</th>
                      <th className="py-3 px-4 text-center font-medium text-muted-foreground min-w-[140px]">AI口コミ生成ツール</th>
                      <th className="py-3 pl-4 text-center font-medium text-muted-foreground min-w-[140px]">Googleフォーム/紙</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonRows.map((row, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="py-3 pr-4 text-left text-muted-foreground">{row.label}</td>
                        <td className="py-3 px-4 text-center bg-primary/5">
                          <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
                            <ComparisonStatusIcon status={row.mieru.status} />
                            {row.mieru.text}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                            <ComparisonStatusIcon status={row.aiReview.status} />
                            {row.aiReview.text}
                          </span>
                        </td>
                        <td className="py-3 pl-4 text-center">
                          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                            <ComparisonStatusIcon status={row.form.status} />
                            {row.form.text}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* ===== Flow ===== */}
        <section id="flow" className="py-20 lg:py-28">
          <div className="container">
            <div className="mx-auto mb-14 max-w-2xl text-center animate-on-scroll">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {messages.landing.flowTitle}
              </h2>
            </div>
            <div className="mx-auto grid max-w-4xl gap-8 sm:grid-cols-3 animate-on-scroll">
              {flowSteps.map((item, i) => (
                <div key={i} className="relative text-center">
                  {/* Connector line (desktop only) */}
                  {i < flowSteps.length - 1 && (
                    <div className="absolute left-[calc(50%+40px)] right-[calc(-50%+40px)] top-10 hidden border-t-2 border-dashed border-primary/20 sm:block" />
                  )}
                  <div className="relative mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
                    <item.icon className="h-8 w-8 text-primary" />
                    <span className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                      {i + 1}
                    </span>
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">{item.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
            <p className="mx-auto mt-8 max-w-2xl text-center text-sm text-muted-foreground animate-on-scroll">
              {messages.landing.flowNote}
            </p>
          </div>
        </section>

        {/* ===== Results ===== */}
        <section id="results" className="border-t bg-muted/30 py-20 lg:py-28">
          <div className="container">
            <div className="mx-auto mb-14 max-w-2xl text-center animate-on-scroll">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {messages.landing.resultsTitle}
              </h2>
            </div>
            <div className="mx-auto grid max-w-4xl gap-6 sm:grid-cols-2 lg:grid-cols-4 animate-on-scroll">
              <div className="hover-lift rounded-2xl border bg-card p-8 text-center">
                <p className="text-gradient text-4xl font-bold tracking-tight">
                  <CountUp end={40} prefix="" suffix="%" />
                </p>
                <p className="mt-2 text-base font-semibold">{messages.landing.result1Label}</p>
                <p className="mt-2 text-sm text-muted-foreground">{messages.landing.result1Desc}</p>
              </div>
              <div className="hover-lift rounded-2xl border bg-card p-8 text-center">
                <p className="text-gradient text-4xl font-bold tracking-tight">
                  <CountUp end={30} prefix="≈" suffix="秒" />
                </p>
                <p className="mt-2 text-base font-semibold">{messages.landing.result2Label}</p>
                <p className="mt-2 text-sm text-muted-foreground">{messages.landing.result2Desc}</p>
              </div>
              <div className="hover-lift rounded-2xl border bg-card p-8 text-center">
                <p className="text-gradient text-4xl font-bold tracking-tight">
                  <CountUp end={8} suffix="+" />
                </p>
                <p className="mt-2 text-base font-semibold">{messages.landing.result3Label}</p>
                <p className="mt-2 text-sm text-muted-foreground">{messages.landing.result3Desc}</p>
              </div>
              <div className="hover-lift rounded-2xl border bg-card p-8 text-center">
                <p className="text-gradient text-4xl font-bold tracking-tight">
                  0<span className="text-2xl">円</span>
                </p>
                <p className="mt-2 text-base font-semibold">{messages.landing.result4Label}</p>
                <p className="mt-2 text-sm text-muted-foreground">{messages.landing.result4Desc}</p>
              </div>
            </div>
          </div>
        </section>

        {/* ===== Evidence ===== */}
        <section id="evidence" className="border-t py-20 lg:py-28">
          <div className="container">
            <div className="mx-auto mb-14 max-w-2xl text-center animate-on-scroll">
              <div className="mb-4 inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary">
                <BookOpen className="mr-1.5 h-3.5 w-3.5" />
                査読付き学術研究に基づく
              </div>
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {messages.landing.evidenceTitle}
              </h2>
              <p className="mt-4 text-muted-foreground">
                {messages.landing.evidenceSub}
              </p>
            </div>
            <div className="mx-auto grid max-w-5xl gap-5 sm:grid-cols-2 lg:grid-cols-3 animate-on-scroll">
              {([
                {
                  icon: TrendingUp,
                  iconBg: "bg-emerald-100",
                  iconColor: "text-emerald-600",
                  value: messages.landing.evidence1Value,
                  valueColor: "text-emerald-600",
                  label: messages.landing.evidence1Label,
                  desc: messages.landing.evidence1Desc,
                  source: messages.landing.evidence1Source,
                },
                {
                  icon: Tablet,
                  iconBg: "bg-blue-100",
                  iconColor: "text-blue-600",
                  value: messages.landing.evidence2Value,
                  valueColor: "text-blue-600",
                  label: messages.landing.evidence2Label,
                  desc: messages.landing.evidence2Desc,
                  source: messages.landing.evidence2Source,
                },
                {
                  icon: Smile,
                  iconBg: "bg-violet-100",
                  iconColor: "text-violet-600",
                  value: messages.landing.evidence3Value,
                  valueColor: "text-violet-600",
                  label: messages.landing.evidence3Label,
                  desc: messages.landing.evidence3Desc,
                  source: messages.landing.evidence3Source,
                },
                {
                  icon: TrendingDown,
                  iconBg: "bg-rose-100",
                  iconColor: "text-rose-600",
                  value: messages.landing.evidence4Value,
                  valueColor: "text-rose-600",
                  label: messages.landing.evidence4Label,
                  desc: messages.landing.evidence4Desc,
                  source: messages.landing.evidence4Source,
                },
                {
                  icon: Gamepad2,
                  iconBg: "bg-amber-100",
                  iconColor: "text-amber-600",
                  value: messages.landing.evidence5Value,
                  valueColor: "text-amber-600",
                  label: messages.landing.evidence5Label,
                  desc: messages.landing.evidence5Desc,
                  source: messages.landing.evidence5Source,
                },
                {
                  icon: Stethoscope,
                  iconBg: "bg-teal-100",
                  iconColor: "text-teal-600",
                  value: messages.landing.evidence6Value,
                  valueColor: "text-teal-600",
                  label: messages.landing.evidence6Label,
                  desc: messages.landing.evidence6Desc,
                  source: messages.landing.evidence6Source,
                },
              ] as const).map((item, i) => (
                <div
                  key={i}
                  className="hover-lift rounded-2xl border bg-card p-6"
                >
                  <div className="mb-4 flex items-center gap-3">
                    <div className={`inline-flex rounded-xl p-2.5 ${item.iconBg}`}>
                      <item.icon className={`h-5 w-5 ${item.iconColor}`} />
                    </div>
                    <span className={`text-3xl font-bold tracking-tight ${item.valueColor}`}>
                      {item.value}
                    </span>
                  </div>
                  <p className="mb-2 text-sm font-semibold">{item.label}</p>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {item.desc}
                  </p>
                  <p className="mt-3 text-[11px] text-muted-foreground/60">
                    {item.source}
                  </p>
                </div>
              ))}
            </div>
            <p className="mx-auto mt-8 max-w-3xl text-center text-xs text-muted-foreground/50 animate-on-scroll">
              {messages.landing.evidenceNote}
            </p>
          </div>
        </section>

        {/* ===== Compliance ===== */}
        <section className="border-t bg-muted/30 py-20 lg:py-28">
          <div className="container">
            <div className="mx-auto mb-14 max-w-2xl text-center animate-on-scroll">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {messages.landing.complianceTitle}
              </h2>
            </div>
            <div className="mx-auto grid max-w-4xl gap-6 sm:grid-cols-3 animate-on-scroll">
              {complianceItems.map((item, i) => (
                <div key={i} className="rounded-2xl border bg-card p-7">
                  <div className="mb-4 inline-flex rounded-xl bg-emerald-100 p-3">
                    <item.icon className="h-6 w-6 text-emerald-600" />
                  </div>
                  <h3 className="mb-2.5 font-semibold">{item.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== Pricing ===== */}
        <section id="pricing" className="py-20 lg:py-28">
          <div className="container">
            <div className="mx-auto mb-4 max-w-2xl text-center animate-on-scroll">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {messages.landing.pricingTitle}
              </h2>
            </div>
            <p className="mx-auto mb-14 max-w-lg text-center text-sm text-muted-foreground animate-on-scroll">
              {messages.landing.pricingSubtitle}
            </p>
            <div className="mx-auto grid max-w-5xl gap-5 sm:grid-cols-2 lg:grid-cols-3 animate-on-scroll">
              {PLAN_ORDER.map((tier) => {
                const plan = PLANS[tier]
                const isHighlighted = plan.highlighted
                const ctaLabels: Record<string, string> = {
                  free: messages.landing.pricingFreeCta,
                  standard: messages.landing.pricingStandardCta,
                  enterprise: messages.landing.pricingEnterpriseCta,
                }
                const ctaHrefs: Record<string, string> = {
                  free: "/register",
                  standard: "/register",
                  enterprise: "#cta",
                }
                return (
                  <div
                    key={tier}
                    className={`relative flex flex-col rounded-2xl bg-card p-7 ${
                      isHighlighted
                        ? "border-2 border-primary shadow-lg ring-1 ring-primary/20"
                        : "border"
                    }`}
                  >
                    {isHighlighted && (
                      <Badge className="absolute -top-3 left-6 bg-primary">
                        {messages.landing.pricingRecommended}
                      </Badge>
                    )}
                    <h3 className="text-lg font-bold">{plan.name}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">{plan.description}</p>
                    <div className="mt-4">
                      <span className={`text-3xl font-bold ${isHighlighted ? "text-primary" : ""}`}>
                        {plan.priceLabel}
                      </span>
                      <span className="ml-1 text-sm text-muted-foreground">{plan.priceNote}</span>
                    </div>
                    <ul className="mt-6 flex-1 space-y-2.5">
                      {plan.features.map((f, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <Check className={`mt-0.5 h-4 w-4 shrink-0 ${isHighlighted ? "text-primary" : "text-emerald-600"}`} />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                    {tier === "free" ? (
                      <Button asChild size="lg" className={`mt-8 w-full ${isHighlighted ? "shadow-lg shadow-primary/25" : ""}`}>
                        <Link href={ctaHrefs[tier]}>
                          {ctaLabels[tier]}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    ) : tier === "standard" ? (
                      <Button asChild size="lg" className="mt-8 w-full shadow-lg shadow-primary/25">
                        <a href={ctaHrefs[tier]}>
                          {ctaLabels[tier]}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </a>
                      </Button>
                    ) : (
                      <Button asChild variant="outline" size="lg" className="mt-8 w-full">
                        <a href={ctaHrefs[tier]}>
                          {ctaLabels[tier]}
                        </a>
                      </Button>
                    )}
                    {tier === "free" && (
                      <p className="mt-3 text-center text-xs text-muted-foreground">
                        {messages.landing.pricingFreeNote}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* ===== FAQ ===== */}
        <FAQSection />

        {/* ===== CTA ===== */}
        <section id="cta" className="border-t">
          <div className="landing-gradient-dark py-20 lg:py-28">
            <div className="container max-w-3xl text-center animate-on-scroll">
              <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                {messages.landing.ctaTitle}
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-white/70">
                {messages.landing.ctaSub}
              </p>
              <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <Button asChild size="lg" variant="secondary" className="h-14 px-10 text-base shadow-lg">
                  <Link href="/register">
                    {messages.landing.ctaButton}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-white/60">
                <span className="flex items-center gap-1.5">
                  <Check className="h-4 w-4" />
                  {messages.landing.ctaNote1}
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="h-4 w-4" />
                  {messages.landing.ctaNote2}
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="h-4 w-4" />
                  {messages.landing.ctaNote3}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ===== Footer ===== */}
        <footer className="border-t bg-foreground/[0.02] py-12">
          <div className="container">
            <div className="flex flex-col items-center gap-8 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <span className="text-lg font-bold text-gradient">
                  {APP_NAME}
                </span>
                <p className="mt-2 text-sm text-muted-foreground">
                  歯科医院専用 患者体験改善プラットフォーム
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm text-muted-foreground">
                <a
                  href={messages.landing.companyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
                >
                  {messages.landing.footerCompany}
                  <ExternalLink className="h-3 w-3" />
                </a>
                <a href="#features" className="transition-colors hover:text-foreground">
                  {messages.landing.footerService}
                </a>
                <Link href="/getting-started" className="transition-colors hover:text-foreground">
                  {messages.landing.footerGettingStarted}
                </Link>
                <a href="#cta" className="transition-colors hover:text-foreground">
                  {messages.landing.footerContact}
                </a>
              </div>
            </div>
            <div className="mt-8 border-t pt-6 text-center text-xs text-muted-foreground">
              <p>{messages.landing.copyright}</p>
            </div>
          </div>
        </footer>
      </div>
    </ScrollAnimationProvider>
  )
}
