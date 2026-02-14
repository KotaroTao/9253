import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { LoginTabs } from "@/components/auth/login-tabs"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { APP_NAME, APP_DESCRIPTION } from "@/lib/constants"
import { messages } from "@/lib/messages"

export default async function LoginPage() {
  const session = await auth()

  if (session?.user) {
    if (session.user.role === "system_admin") {
      redirect("/admin")
    }
    redirect("/dashboard")
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">{APP_NAME}</CardTitle>
          <CardDescription>{APP_DESCRIPTION}</CardDescription>
        </CardHeader>
        <CardContent>
          <h2 className="mb-4 text-center text-lg font-semibold">
            {messages.auth.login}
          </h2>
          <LoginTabs />
        </CardContent>
      </Card>
    </div>
  )
}
