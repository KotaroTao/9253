import Link from "next/link"
import { Button } from "@/components/ui/button"
import { APP_NAME, APP_DESCRIPTION } from "@/lib/constants"
import { messages } from "@/lib/messages"
import {
  ClipboardList,
  BarChart3,
  Users,
  Star,
  ArrowRight,
} from "lucide-react"

const features = [
  {
    icon: ClipboardList,
    title: messages.landing.feature1Title,
    description: messages.landing.feature1Desc,
  },
  {
    icon: BarChart3,
    title: messages.landing.feature2Title,
    description: messages.landing.feature2Desc,
  },
  {
    icon: Users,
    title: messages.landing.feature3Title,
    description: messages.landing.feature3Desc,
  },
  {
    icon: Star,
    title: messages.landing.feature4Title,
    description: messages.landing.feature4Desc,
  },
]

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="container flex h-14 items-center justify-between">
          <span className="text-lg font-bold text-primary">{APP_NAME}</span>
          <Link href="/login">
            <Button variant="outline" size="sm">
              {messages.landing.login}
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="container flex flex-col items-center py-20 text-center">
        <h1 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
          {APP_DESCRIPTION}
        </h1>
        <p className="mt-6 max-w-xl text-lg text-muted-foreground">
          {messages.landing.heroDescription}
        </p>
        <div className="mt-8 flex gap-4">
          <Link href="/login">
            <Button size="lg">
              {messages.landing.getStarted}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="border-t bg-muted/40 py-16">
        <div className="container">
          <h2 className="mb-12 text-center text-2xl font-bold">
            {messages.landing.featuresTitle}
          </h2>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div key={feature.title} className="rounded-lg border bg-card p-6">
                <feature.icon className="mb-4 h-8 w-8 text-primary" />
                <h3 className="mb-2 font-semibold">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Flow */}
      <section className="container py-16">
        <h2 className="mb-12 text-center text-2xl font-bold">{messages.landing.flowTitle}</h2>
        <div className="mx-auto grid max-w-3xl gap-6 sm:grid-cols-3">
          {[
            { step: "1", title: messages.landing.flow1Title, desc: messages.landing.flow1Desc },
            { step: "2", title: messages.landing.flow2Title, desc: messages.landing.flow2Desc },
            { step: "3", title: messages.landing.flow3Title, desc: messages.landing.flow3Desc },
          ].map((item) => (
            <div key={item.step} className="text-center">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                {item.step}
              </div>
              <h3 className="mb-1 font-semibold">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t py-8">
        <div className="container text-center text-sm text-muted-foreground">
          <p>{messages.landing.copyright}</p>
        </div>
      </footer>
    </div>
  )
}
