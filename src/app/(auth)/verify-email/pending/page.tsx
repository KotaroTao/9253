import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { VerifyEmailPendingClient } from "@/components/auth/verify-email-pending-client"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { APP_NAME } from "@/lib/constants"

export default async function VerifyEmailPendingPage() {
  const session = await auth()

  // 未ログインならログインページへ
  if (!session?.user) {
    redirect("/login")
  }

  // 既に認証済みならダッシュボードへ
  if (session.user.isEmailVerified) {
    redirect("/dashboard")
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">{APP_NAME}</CardTitle>
        </CardHeader>
        <CardContent>
          <VerifyEmailPendingClient email={session.user.email ?? ""} />
        </CardContent>
      </Card>
    </div>
  )
}
