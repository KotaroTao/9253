import { redirect } from "next/navigation"
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
import { APP_NAME } from "@/lib/constants"
import { messages } from "@/lib/messages"

export default async function RegisterPage() {
  const session = await auth()

  if (session?.user) {
    if (session.user.role === "system_admin") {
      redirect("/admin")
    }
    redirect("/dashboard")
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">{APP_NAME}</CardTitle>
          <CardDescription>{messages.auth.registerSub}</CardDescription>
          <Badge variant="secondary" className="mx-auto mt-2">
            {messages.auth.trialBadge}
          </Badge>
        </CardHeader>
        <CardContent>
          <h2 className="mb-4 text-center text-lg font-semibold">
            {messages.auth.registerTitle}
          </h2>
          <RegisterForm />
        </CardContent>
      </Card>
    </div>
  )
}
