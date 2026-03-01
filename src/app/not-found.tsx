import Link from "next/link"
import { messages } from "@/lib/messages"

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-muted-foreground/30">404</h1>
        <h2 className="mt-4 text-lg font-semibold">
          {messages.errorPage.notFoundTitle}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {messages.errorPage.notFoundDescription}
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          {messages.errorPage.backToHome}
        </Link>
      </div>
    </div>
  )
}
