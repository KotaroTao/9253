import { Suspense } from "react"
import { VerifyEmailClient } from "@/components/auth/verify-email-client"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { APP_NAME } from "@/lib/constants"

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">{APP_NAME}</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense>
            <VerifyEmailClient />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}
