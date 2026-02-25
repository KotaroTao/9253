import { redirect } from "next/navigation"
import type { Metadata } from "next"
import { auth } from "@/auth"
import { RegisterForm } from "@/components/auth/register-form"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { APP_NAME, PLANS } from "@/lib/constants"
import { messages } from "@/lib/messages"
import { Check } from "lucide-react"

export const metadata: Metadata = {
  title: `特別プラン登録 | ${APP_NAME}`,
  robots: "noindex, nofollow",
}

export default async function SpecialRegisterPage() {
  const session = await auth()

  if (session?.user) {
    if (session.user.role === "system_admin") {
      redirect("/admin")
    }
    redirect("/dashboard")
  }

  const specialPlan = PLANS.special

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">{APP_NAME}</CardTitle>
          <CardDescription>{messages.auth.specialPlanSub}</CardDescription>
          <Badge className="mx-auto mt-2 bg-primary">
            {messages.auth.specialPlanBadge}
          </Badge>
        </CardHeader>
        <CardContent>
          {/* 特別プランの機能一覧 */}
          <div className="mb-6 rounded-lg border bg-muted/30 p-4">
            <p className="mb-3 text-sm font-semibold">{specialPlan.name}に含まれる機能</p>
            <ul className="space-y-1.5">
              {specialPlan.features.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
          <h2 className="mb-4 text-center text-lg font-semibold">
            {messages.auth.registerTitle}
          </h2>
          <RegisterForm plan="special" />
        </CardContent>
      </Card>
    </div>
  )
}
