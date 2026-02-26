import Link from "next/link"
import { Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { APP_NAME } from "@/lib/constants"
import { messages } from "@/lib/messages"

export default function VerifyEmailSentPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">{APP_NAME}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
              <Mail className="h-8 w-8 text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold">{messages.auth.verifyEmailSent}</h2>
            <p className="text-sm text-muted-foreground">{messages.auth.verifyEmailSentDesc}</p>
            <p className="text-xs text-muted-foreground">{messages.auth.checkSpamFolder}</p>
            <Button asChild variant="outline" className="mt-4">
              <Link href="/login">{messages.auth.login}</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
