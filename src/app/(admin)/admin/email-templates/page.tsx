import Link from "next/link"
import { messages } from "@/lib/messages"
import { EmailTemplateManager } from "@/components/admin/email-template-manager"
import { ArrowLeft } from "lucide-react"

export default function AdminEmailTemplatesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin"
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold">{messages.emailTemplates.title}</h1>
      </div>

      <EmailTemplateManager />
    </div>
  )
}
