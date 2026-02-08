import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { messages } from "@/lib/messages"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  if (session.user.role !== "system_admin") {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="border-b bg-card">
        <div className="container flex h-14 items-center justify-between">
          <a href="/admin" className="text-lg font-bold text-primary">
            {messages.admin.navTitle}
          </a>
          <div className="flex items-center gap-4 text-sm">
            <a
              href="/dashboard"
              className="text-muted-foreground hover:text-foreground"
            >
              {messages.nav.dashboard}
            </a>
            <span className="text-muted-foreground">{session.user.name}</span>
          </div>
        </div>
      </header>
      <main className="container py-6">{children}</main>
    </div>
  )
}
