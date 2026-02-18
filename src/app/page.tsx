import Link from "next/link"
import { Button } from "@/components/ui/button"
import { APP_NAME } from "@/lib/constants"
import { messages } from "@/lib/messages"
import { LandingHeader } from "@/components/landing/mobile-nav"
import { FAQSection } from "@/components/landing/faq-section"
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
  Search,
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
} from "lucide-react"

const trustItems = [
  { icon: ShieldCheck, label: messages.landing.trust1 },
  { icon: EyeOff, label: messages.landing.trust2 },
  { icon: Zap, label: messages.landing.trust3 },
  { icon: Building2, label: messages.landing.trust4 },
]

const painPoints = [
  {
    title: messages.landing.pain1Title,
    desc: messages.landing.pain1Desc,
  },
  {
    title: messages.landing.pain2Title,
    desc: messages.landing.pain2Desc,
  },
  {
    title: messages.landing.pain3Title,
    desc: messages.landing.pain3Desc,
  },
]

const solutionValues = [
  {
    icon: Eye,
    title: messages.landing.solutionValue1Title,
    desc: messages.landing.solutionValue1Desc,
  },
  {
    icon: Repeat2,
    title: messages.landing.solutionValue2Title,
    desc: messages.landing.solutionValue2Desc,
  },
  {
    icon: TrendingUp,
    title: messages.landing.solutionValue3Title,
    desc: messages.landing.solutionValue3Desc,
  },
]

const features = [
  {
    icon: Tablet,
    title: messages.landing.feature1Title,
    description: messages.landing.feature1Desc,
  },
  {
    icon: BarChart3,
    title: messages.landing.feature2Title,
    description: messages.landing.feature2Desc,
  },
  {
    icon: Search,
    title: messages.landing.feature3Title,
    description: messages.landing.feature3Desc,
  },
  {
    icon: Trophy,
    title: messages.landing.feature4Title,
    description: messages.landing.feature4Desc,
  },
  {
    icon: ClipboardCheck,
    title: messages.landing.feature5Title,
    description: messages.landing.feature5Desc,
  },
  {
    icon: FileBarChart,
    title: messages.landing.feature6Title,
    description: messages.landing.feature6Desc,
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

const results = [
  {
    value: messages.landing.result1Value,
    label: messages.landing.result1Label,
    desc: messages.landing.result1Desc,
  },
  {
    value: messages.landing.result2Value,
    label: messages.landing.result2Label,
    desc: messages.landing.result2Desc,
  },
  {
    value: messages.landing.result3Value,
    label: messages.landing.result3Label,
    desc: messages.landing.result3Desc,
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

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <LandingHeader />

      {/* ===== Hero ===== */}
      <section className="hero-gradient relative overflow-hidden">
        <div className="container relative z-10 flex flex-col items-center py-20 text-center lg:py-32">
          <span className="animate-fade-in-up mb-6 inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary">
            {messages.landing.heroBadge}
          </span>
          <h1 className="animate-fade-in-up-delay-1 max-w-3xl whitespace-pre-line text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            {messages.landing.heroHeadline}
          </h1>
          <p className="animate-fade-in-up-delay-2 mt-6 max-w-2xl whitespace-pre-line text-base leading-relaxed text-muted-foreground sm:text-lg">
            {messages.landing.heroSub}
          </p>
          <div className="animate-fade-in-up-delay-3 mt-10 flex flex-col gap-3 sm:flex-row sm:gap-4">
            <Button asChild size="lg" className="h-12 px-8 text-base shadow-lg shadow-primary/25">
              <a href="#cta">
                {messages.landing.heroCta}
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-12 px-8 text-base">
              <a href="#features">
                {messages.landing.heroCtaSub}
              </a>
            </Button>
          </div>

          {/* Hero Visual — Dashboard Mock */}
          <div className="animate-fade-in-up-delay-3 mt-14 w-full max-w-3xl">
            <div className="rounded-2xl border bg-card/80 p-5 shadow-2xl shadow-primary/10 backdrop-blur sm:p-6">
              <div className="grid grid-cols-3 gap-3 sm:gap-4">
                <div className="rounded-xl bg-primary/5 p-3 sm:p-4">
                  <p className="text-[10px] text-muted-foreground sm:text-xs">患者満足度</p>
                  <p className="mt-1 text-2xl font-bold text-primary sm:text-3xl">4.2</p>
                  <p className="mt-1 text-[10px] text-emerald-600 sm:text-xs">↑ 0.3 前月比</p>
                </div>
                <div className="rounded-xl bg-primary/5 p-3 sm:p-4">
                  <p className="text-[10px] text-muted-foreground sm:text-xs">今月の回答</p>
                  <p className="mt-1 text-2xl font-bold sm:text-3xl">128</p>
                  <p className="mt-1 text-[10px] text-muted-foreground sm:text-xs">件</p>
                </div>
                <div className="rounded-xl bg-primary/5 p-3 sm:p-4">
                  <p className="text-[10px] text-muted-foreground sm:text-xs">トレンド</p>
                  <div className="mt-2 flex h-10 items-end gap-1">
                    {[35, 42, 38, 55, 60, 72, 80].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-sm bg-primary/40"
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-4 space-y-2.5">
                {[
                  { label: "スタッフの対応", score: 4.5, pct: 90 },
                  { label: "待ち時間", score: 3.6, pct: 72 },
                  { label: "治療の説明", score: 4.1, pct: 82 },
                ].map((q, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="w-24 truncate text-xs text-muted-foreground">{q.label}</span>
                    <div className="h-2 flex-1 rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary/60"
                        style={{ width: `${q.pct}%` }}
                      />
                    </div>
                    <span className="w-8 text-right text-xs font-medium">{q.score}</span>
                  </div>
                ))}
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

      {/* ===== Pain Points ===== */}
      <section id="pain" className="py-20 lg:py-28">
        <div className="container max-w-4xl">
          <div className="mb-14 text-center">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {messages.landing.painTitle}
            </h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            {painPoints.map((pain, i) => (
              <div
                key={i}
                className="rounded-xl border border-orange-200/60 bg-orange-50/50 p-6"
              >
                <div className="mb-3 flex items-center gap-2">
                  <CircleAlert className="h-5 w-5 shrink-0 text-orange-500" />
                  <h3 className="font-semibold text-foreground">{pain.title}</h3>
                </div>
                <p className="text-sm leading-relaxed text-foreground/70">
                  {pain.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Solution Overview ===== */}
      <section className="border-t bg-muted/30 py-20 lg:py-28">
        <div className="container max-w-4xl">
          <div className="mb-12 text-center">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {messages.landing.solutionTitle}
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              {messages.landing.solutionDesc}
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            {solutionValues.map((val, i) => (
              <div key={i} className="rounded-2xl border bg-card p-7">
                <div className="mb-4 inline-flex rounded-xl bg-primary/10 p-3">
                  <val.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">{val.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {val.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Features ===== */}
      <section id="features" className="py-20 lg:py-28">
        <div className="container">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {messages.landing.featuresTitle}
            </h2>
          </div>
          <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => (
              <div
                key={i}
                className="card-hover rounded-2xl border bg-card p-7"
              >
                <div className="mb-4 inline-flex rounded-xl bg-primary/10 p-3">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2.5 text-lg font-semibold">
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Flow ===== */}
      <section id="flow" className="border-t bg-muted/30 py-20 lg:py-28">
        <div className="container">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {messages.landing.flowTitle}
            </h2>
          </div>
          <div className="mx-auto grid max-w-4xl gap-8 sm:grid-cols-3">
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
        </div>
      </section>

      {/* ===== Results ===== */}
      <section id="results" className="py-20 lg:py-28">
        <div className="container">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {messages.landing.resultsTitle}
            </h2>
          </div>
          <div className="mx-auto grid max-w-4xl gap-6 sm:grid-cols-3">
            {results.map((r, i) => (
              <div
                key={i}
                className="card-hover rounded-2xl border bg-card p-8 text-center"
              >
                <p className="text-gradient text-4xl font-bold tracking-tight">
                  {r.value}
                </p>
                <p className="mt-2 text-base font-semibold">{r.label}</p>
                <p className="mt-2 text-sm text-muted-foreground">{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Compliance ===== */}
      <section className="border-t bg-muted/30 py-20 lg:py-28">
        <div className="container">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {messages.landing.complianceTitle}
            </h2>
          </div>
          <div className="mx-auto grid max-w-4xl gap-6 sm:grid-cols-3">
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

      {/* ===== FAQ ===== */}
      <FAQSection />

      {/* ===== CTA ===== */}
      <section id="cta" className="border-t">
        <div className="landing-gradient py-20 lg:py-28">
          <div className="container max-w-3xl text-center">
            <h2 className="whitespace-pre-line text-2xl font-bold tracking-tight sm:text-3xl">
              {messages.landing.ctaTitle}
            </h2>
            <p className="mx-auto mt-5 max-w-xl whitespace-pre-line text-muted-foreground">
              {messages.landing.ctaSub}
            </p>
            <div className="mt-10 flex flex-col items-center gap-4">
              <Button asChild size="lg" className="h-14 px-10 text-base shadow-lg shadow-primary/25">
                <Link href="/login">
                  {messages.landing.ctaButton}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <p className="text-sm text-muted-foreground">
                {messages.landing.ctaNote}
              </p>
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
                {messages.landing.heroBadge}
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
  )
}
