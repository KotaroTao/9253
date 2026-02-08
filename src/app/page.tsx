import Link from "next/link"
import { Button } from "@/components/ui/button"
import { APP_NAME, APP_DESCRIPTION } from "@/lib/constants"
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
    title: "30秒アンケート",
    description:
      "QRコードを読み取るだけ。患者さまの負担を最小限に、リアルな声を収集します。",
  },
  {
    icon: BarChart3,
    title: "患者体験の見える化",
    description:
      "満足度スコア、スタッフ別評価、月次推移をダッシュボードで一目で把握できます。",
  },
  {
    icon: Users,
    title: "スタッフ別評価",
    description:
      "スタッフごとの患者満足度を可視化。チーム全体のサービス向上に貢献します。",
  },
  {
    icon: Star,
    title: "Googleレビュー連携",
    description:
      "アンケート完了後、自然な流れでGoogleレビューをご案内。口コミ獲得をサポートします。",
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
              ログイン
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
          医療機関専用の患者体験改善プラットフォーム。
          アンケートで患者体験を可視化し、医院の改善と成長を支援します。
        </p>
        <div className="mt-8 flex gap-4">
          <Link href="/login">
            <Button size="lg">
              はじめる
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="border-t bg-muted/40 py-16">
        <div className="container">
          <h2 className="mb-12 text-center text-2xl font-bold">
            MIERU Clinicの特徴
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
        <h2 className="mb-12 text-center text-2xl font-bold">ご利用の流れ</h2>
        <div className="mx-auto grid max-w-3xl gap-6 sm:grid-cols-3">
          {[
            { step: "1", title: "QRコード配置", desc: "スタッフごとのQRコードを受付や診察室に設置" },
            { step: "2", title: "患者が回答", desc: "スマホで30秒のアンケートに回答" },
            { step: "3", title: "データ分析", desc: "ダッシュボードで満足度をリアルタイム把握" },
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
          <p>&copy; 2025 株式会社ファンクション・ティ. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
