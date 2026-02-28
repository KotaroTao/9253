import Link from "next/link"
import type { Metadata } from "next"
import { Button } from "@/components/ui/button"
import { APP_NAME } from "@/lib/constants"
import { messages } from "@/lib/messages"
import { LandingHeader } from "@/components/landing/mobile-nav"
import { ScrollAnimationProvider } from "@/components/landing/scroll-animation"
import {
  ArrowRight,
  Check,
  CheckCircle2,
  HelpCircle,
  Lightbulb,
  Sparkles,
  Star,
  UserPlus,
  Settings,
  Tablet,
  ClipboardCheck,
  BarChart3,
} from "lucide-react"

export const metadata: Metadata = {
  title: messages.gettingStarted.metaTitle,
  description: messages.gettingStarted.metaDescription,
}

/* ------------------------------------------------------------------ */
/* Step data                                                           */
/* ------------------------------------------------------------------ */

const steps = [
  {
    number: 1,
    icon: UserPlus,
    title: messages.gettingStarted.step1Title,
    desc: messages.gettingStarted.step1Desc,
    details: [
      messages.gettingStarted.step1Detail1,
      messages.gettingStarted.step1Detail2,
      messages.gettingStarted.step1Detail3,
    ],
    mockLabel: messages.gettingStarted.step1MockLabel,
    mock: "register",
    color: "from-blue-500/10 to-blue-600/5",
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-600",
  },
  {
    number: 2,
    icon: Settings,
    title: messages.gettingStarted.step2Title,
    desc: messages.gettingStarted.step2Desc,
    details: [
      messages.gettingStarted.step2Detail1,
      messages.gettingStarted.step2Detail2,
      messages.gettingStarted.step2Detail3,
    ],
    mockLabel: messages.gettingStarted.step2MockLabel,
    mock: "settings",
    color: "from-violet-500/10 to-violet-600/5",
    iconBg: "bg-violet-500/10",
    iconColor: "text-violet-600",
  },
  {
    number: 3,
    icon: Tablet,
    title: messages.gettingStarted.step3Title,
    desc: messages.gettingStarted.step3Desc,
    details: [
      messages.gettingStarted.step3Detail1,
      messages.gettingStarted.step3Detail2,
      messages.gettingStarted.step3Detail3,
    ],
    mockLabel: messages.gettingStarted.step3MockLabel,
    mock: "kiosk",
    color: "from-emerald-500/10 to-emerald-600/5",
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-600",
  },
  {
    number: 4,
    icon: ClipboardCheck,
    title: messages.gettingStarted.step4Title,
    desc: messages.gettingStarted.step4Desc,
    details: [
      messages.gettingStarted.step4Detail1,
      messages.gettingStarted.step4Detail2,
      messages.gettingStarted.step4Detail3,
    ],
    mockLabel: messages.gettingStarted.step4MockLabel,
    mock: "survey",
    color: "from-amber-500/10 to-amber-600/5",
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-600",
  },
  {
    number: 5,
    icon: BarChart3,
    title: messages.gettingStarted.step5Title,
    desc: messages.gettingStarted.step5Desc,
    details: [
      messages.gettingStarted.step5Detail1,
      messages.gettingStarted.step5Detail2,
      messages.gettingStarted.step5Detail3,
    ],
    mockLabel: messages.gettingStarted.step5MockLabel,
    mock: "dashboard",
    color: "from-rose-500/10 to-rose-600/5",
    iconBg: "bg-rose-500/10",
    iconColor: "text-rose-600",
  },
]

const faqs = [
  { q: messages.gettingStarted.faq1Q, a: messages.gettingStarted.faq1A },
  { q: messages.gettingStarted.faq2Q, a: messages.gettingStarted.faq2A },
  { q: messages.gettingStarted.faq3Q, a: messages.gettingStarted.faq3A },
  { q: messages.gettingStarted.faq4Q, a: messages.gettingStarted.faq4A },
]

/* ------------------------------------------------------------------ */
/* Mock UI Components (visual illustrations for each step)             */
/* ------------------------------------------------------------------ */

function RegisterMock() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <div className="h-6 w-6 rounded-lg bg-primary/20" />
        <span className="text-[11px] font-bold text-foreground/80">MIERU Clinic</span>
      </div>
      <div className="space-y-2.5">
        <div>
          <p className="text-[9px] text-muted-foreground mb-1">クリニック名</p>
          <div className="flex items-center rounded-md border bg-white px-2.5 py-1.5">
            <span className="text-[10px] text-foreground/70">みえる歯科クリニック</span>
          </div>
        </div>
        <div>
          <p className="text-[9px] text-muted-foreground mb-1">メールアドレス</p>
          <div className="flex items-center rounded-md border bg-white px-2.5 py-1.5">
            <span className="text-[10px] text-foreground/70">clinic@example.com</span>
          </div>
        </div>
        <div>
          <p className="text-[9px] text-muted-foreground mb-1">パスワード</p>
          <div className="flex items-center rounded-md border bg-white px-2.5 py-1.5">
            <span className="text-[10px] text-foreground/40">********</span>
          </div>
        </div>
      </div>
      <div className="rounded-md bg-primary px-3 py-1.5 text-center">
        <span className="text-[10px] font-medium text-white">無料で登録する</span>
      </div>
      <p className="text-center text-[8px] text-muted-foreground">クレジットカード不要</p>
    </div>
  )
}

function SettingsMock() {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-bold text-foreground/80">初期設定</span>
        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[8px] font-medium text-emerald-700">ステップ 2/3</span>
      </div>
      <div>
        <p className="text-[9px] text-muted-foreground mb-1">定休日</p>
        <div className="flex gap-1">
          {["月", "火", "水", "木", "金", "土", "日"].map((day, i) => (
            <div
              key={day}
              className={`flex h-6 w-6 items-center justify-center rounded-md text-[9px] font-medium ${
                i === 3 || i === 6
                  ? "bg-primary text-white"
                  : "border bg-white text-foreground/60"
              }`}
            >
              {day}
            </div>
          ))}
        </div>
      </div>
      <div>
        <p className="text-[9px] text-muted-foreground mb-1">スタッフ登録</p>
        <div className="space-y-1">
          {["田中 花子", "佐藤 太郎"].map((name) => (
            <div key={name} className="flex items-center gap-2 rounded-md border bg-white px-2 py-1">
              <div className="h-4 w-4 rounded-full bg-primary/20" />
              <span className="text-[10px]">{name}</span>
              <CheckCircle2 className="ml-auto h-3 w-3 text-emerald-500" />
            </div>
          ))}
        </div>
      </div>
      <div>
        <p className="text-[9px] text-muted-foreground mb-1">完了後の表示</p>
        <div className="flex items-center gap-2 rounded-md border border-primary/30 bg-primary/5 px-2 py-1.5">
          <div className="h-3 w-3 rounded-full border-2 border-primary bg-primary" />
          <span className="text-[10px]">アンケートのみで終了</span>
        </div>
      </div>
    </div>
  )
}

function KioskMock() {
  return (
    <div className="space-y-3">
      <div className="rounded-lg border-2 border-dashed border-primary/30 bg-primary/[0.02] p-3 text-center">
        <Tablet className="mx-auto mb-1.5 h-8 w-8 text-primary/40" />
        <p className="text-[10px] font-medium text-foreground/70">iPadのブラウザで</p>
        <div className="mt-1 rounded-md bg-muted px-2 py-1">
          <p className="text-[9px] font-mono text-primary">mieru-clinic.com/kiosk/demo</p>
        </div>
      </div>
      <div className="flex items-center gap-3 rounded-lg bg-emerald-50 p-2.5">
        <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
        <div>
          <p className="text-[10px] font-medium text-emerald-700">アプリ不要</p>
          <p className="text-[9px] text-emerald-600">ブラウザで即アクセス</p>
        </div>
      </div>
      <div className="flex items-center gap-3 rounded-lg bg-blue-50 p-2.5">
        <Sparkles className="h-5 w-5 shrink-0 text-blue-500" />
        <div>
          <p className="text-[10px] font-medium text-blue-700">ホーム画面に追加</p>
          <p className="text-[9px] text-blue-600">アプリのように使えます</p>
        </div>
      </div>
    </div>
  )
}

function SurveyMock() {
  return (
    <div className="space-y-3">
      <div className="mb-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold text-foreground/80">アンケート</span>
          <span className="text-[9px] text-muted-foreground">質問 3/6</span>
        </div>
        <div className="h-1.5 rounded-full bg-muted">
          <div className="h-full w-1/2 rounded-full bg-primary" />
        </div>
      </div>
      <div className="space-y-2.5">
        {[
          { q: "スタッフの対応", score: 5 },
          { q: "待ち時間", score: 4 },
          { q: "治療の説明", score: 0 },
        ].map((item, i) => (
          <div key={i}>
            <p className="text-[10px] font-medium text-foreground/80 mb-1">{item.q}</p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`h-5 w-5 ${
                    s <= item.score
                      ? "fill-amber-400 text-amber-400"
                      : "text-muted-foreground/30"
                  }`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      <p className="text-center text-[8px] text-muted-foreground">約30秒で完了</p>
    </div>
  )
}

function DashboardMock() {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-foreground/80">ダッシュボード</span>
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[8px] font-medium text-amber-700">ゴールド</span>
      </div>
      {/* Score + Streak */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg border bg-white p-2 text-center">
          <p className="text-lg font-bold text-primary">4.6</p>
          <p className="text-[8px] text-muted-foreground">満足度スコア</p>
        </div>
        <div className="rounded-lg border bg-white p-2 text-center">
          <p className="text-lg font-bold text-orange-500">14日</p>
          <p className="text-[8px] text-muted-foreground">連続ストリーク</p>
        </div>
      </div>
      {/* Chart */}
      <div className="rounded-lg border bg-white p-2">
        <p className="text-[9px] text-muted-foreground mb-1">今週の実績</p>
        <div className="flex items-end gap-1 h-10">
          {[45, 60, 75, 50, 80, 65, 0].map((h, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
              <div
                className={`w-full rounded-sm ${i === 6 ? "bg-muted" : "bg-primary/50"}`}
                style={{ height: `${Math.max(h, 4)}%` }}
              />
              <span className="text-[7px] text-muted-foreground">
                {["月", "火", "水", "木", "金", "土", "日"][i]}
              </span>
            </div>
          ))}
        </div>
      </div>
      {/* AI Insight */}
      <div className="rounded-lg bg-blue-50 p-2">
        <p className="text-[9px] font-medium text-blue-700 mb-0.5">AI分析</p>
        <p className="text-[8px] text-blue-600">「待ち時間」のスコアが3.9 → 改善アクション推奨</p>
      </div>
    </div>
  )
}

const mockComponents: Record<string, () => JSX.Element> = {
  register: RegisterMock,
  settings: SettingsMock,
  kiosk: KioskMock,
  survey: SurveyMock,
  dashboard: DashboardMock,
}

/* ------------------------------------------------------------------ */
/* Page Component                                                      */
/* ------------------------------------------------------------------ */

export default function GettingStartedPage() {
  return (
    <ScrollAnimationProvider>
      <div className="flex min-h-screen flex-col">
        <LandingHeader />

        {/* ===== Hero ===== */}
        <section className="hero-gradient relative overflow-hidden">
          <div className="container relative z-10 py-16 lg:py-24">
            <div className="mx-auto max-w-3xl text-center">
              <span className="animate-fade-in-up mb-6 inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary">
                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                {messages.gettingStarted.heroBadge}
              </span>
              <h1 className="animate-fade-in-up-delay-1">
                <span className="block text-2xl font-extrabold tracking-tight sm:text-3xl lg:text-4xl">
                  {messages.gettingStarted.heroTitle}
                </span>
                <span className="mt-2 block text-2xl font-extrabold tracking-tight text-primary sm:text-3xl lg:text-4xl">
                  {messages.gettingStarted.heroTitleAccent}
                </span>
              </h1>
              <p className="animate-fade-in-up-delay-2 mx-auto mt-6 max-w-xl whitespace-pre-line text-base leading-relaxed text-muted-foreground sm:text-lg">
                {messages.gettingStarted.heroSub}
              </p>

              {/* Progress indicator */}
              <div className="animate-fade-in-up-delay-3 mx-auto mt-10 flex max-w-md items-center justify-between">
                {steps.map((step, i) => (
                  <div key={step.number} className="flex items-center">
                    <div className="flex flex-col items-center">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-full ${step.iconBg}`}>
                        <step.icon className={`h-5 w-5 ${step.iconColor}`} />
                      </div>
                      <span className="mt-1 text-[10px] font-medium text-muted-foreground hidden sm:block">
                        STEP {step.number}
                      </span>
                    </div>
                    {i < steps.length - 1 && (
                      <div className="mx-1.5 h-px w-6 bg-border sm:mx-2 sm:w-10" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Decorative */}
          <div className="pointer-events-none absolute -right-40 -top-40 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
        </section>

        {/* ===== Steps ===== */}
        {steps.map((step, i) => {
          const MockComponent = mockComponents[step.mock]
          const isEven = i % 2 === 1
          return (
            <section
              key={step.number}
              className={`py-16 lg:py-24 ${isEven ? "bg-muted/30" : ""}`}
            >
              <div className="container">
                <div className={`mx-auto grid max-w-5xl items-center gap-10 lg:grid-cols-2 lg:gap-16 ${
                  isEven ? "lg:[direction:rtl]" : ""
                }`}>
                  {/* Text content */}
                  <div className={`animate-on-scroll ${isEven ? "lg:[direction:ltr]" : ""}`}>
                    {/* Step badge */}
                    <div className="mb-4 flex items-center gap-3">
                      <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${step.iconBg}`}>
                        <step.icon className={`h-5 w-5 ${step.iconColor}`} />
                      </span>
                      <span className="text-sm font-semibold text-muted-foreground">
                        STEP {step.number}
                      </span>
                    </div>

                    <h2 className="text-xl font-bold tracking-tight sm:text-2xl lg:text-3xl">
                      {step.title}
                    </h2>
                    <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                      {step.desc}
                    </p>

                    {/* Detail checklist */}
                    <ul className="mt-6 space-y-3">
                      {step.details.map((detail, j) => (
                        <li key={j} className="flex items-start gap-3">
                          <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${step.iconBg}`}>
                            <Check className={`h-3 w-3 ${step.iconColor}`} />
                          </div>
                          <span className="text-sm text-foreground/80">{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Mock visual */}
                  <div className={`animate-on-scroll ${isEven ? "lg:[direction:ltr]" : ""}`}>
                    <div className={`rounded-2xl bg-gradient-to-br ${step.color} p-1`}>
                      <div className="rounded-xl border bg-card p-1">
                        {/* Mock browser chrome */}
                        <div className="flex items-center gap-1.5 border-b bg-muted/40 px-3 py-2 rounded-t-lg">
                          <div className="flex gap-1">
                            <div className="h-2 w-2 rounded-full bg-red-300" />
                            <div className="h-2 w-2 rounded-full bg-amber-300" />
                            <div className="h-2 w-2 rounded-full bg-emerald-300" />
                          </div>
                          <div className="mx-2 flex-1 rounded-md bg-white/80 px-2 py-0.5">
                            <p className="text-[8px] text-muted-foreground text-center">mieru-clinic.com</p>
                          </div>
                        </div>
                        {/* Mock content */}
                        <div className="p-4 sm:p-5">
                          <MockComponent />
                        </div>
                      </div>
                    </div>
                    {/* Label */}
                    <p className="mt-3 text-center text-xs text-muted-foreground">
                      {step.mockLabel}
                    </p>
                  </div>
                </div>
              </div>
            </section>
          )
        })}

        {/* ===== Tip Box ===== */}
        <section className="py-12">
          <div className="container">
            <div className="mx-auto max-w-3xl animate-on-scroll">
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 sm:p-8">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100">
                    <Lightbulb className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-amber-900">
                      {messages.gettingStarted.tipTitle}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-amber-800">
                      {messages.gettingStarted.tipDesc}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== FAQ ===== */}
        <section className="border-t bg-muted/30 py-16 lg:py-24">
          <div className="container">
            <div className="mx-auto max-w-3xl">
              <h2 className="mb-10 text-center text-2xl font-bold tracking-tight sm:text-3xl animate-on-scroll">
                {messages.gettingStarted.faqTitle}
              </h2>
              <div className="space-y-4 animate-on-scroll">
                {faqs.map((faq, i) => (
                  <div key={i} className="rounded-xl border bg-card p-5">
                    <h4 className="flex items-start gap-2.5 font-semibold">
                      <HelpCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                      {faq.q}
                    </h4>
                    <p className="mt-2.5 pl-[30px] text-sm leading-relaxed text-muted-foreground">
                      {faq.a}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ===== CTA ===== */}
        <section className="border-t">
          <div className="landing-gradient-dark py-16 lg:py-24">
            <div className="container max-w-3xl text-center animate-on-scroll">
              <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                {messages.gettingStarted.ctaTitle}
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-white/70">
                {messages.gettingStarted.ctaSub}
              </p>
              <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <Button asChild size="lg" variant="secondary" className="h-14 px-10 text-base shadow-lg">
                  <Link href="/register">
                    {messages.gettingStarted.ctaButton}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-white/60">
                <span className="flex items-center gap-1.5">
                  <Check className="h-4 w-4" />
                  {messages.gettingStarted.ctaNote1}
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="h-4 w-4" />
                  {messages.gettingStarted.ctaNote2}
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="h-4 w-4" />
                  {messages.gettingStarted.ctaNote3}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ===== Footer ===== */}
        <footer className="border-t bg-foreground/[0.02] py-10">
          <div className="container text-center">
            <span className="text-lg font-bold text-gradient">{APP_NAME}</span>
            <p className="mt-2 text-sm text-muted-foreground">
              歯科医院専用 患者満足度向上プラットフォーム
            </p>
            <div className="mt-4 text-xs text-muted-foreground">
              {messages.landing.copyright}
            </div>
          </div>
        </footer>
      </div>
    </ScrollAnimationProvider>
  )
}
