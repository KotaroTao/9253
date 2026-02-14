import Link from "next/link"
import { messages } from "@/lib/messages"
import { TipManager } from "@/components/admin/tip-manager"
import { ArrowLeft } from "lucide-react"

export default function AdminTipsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin"
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold">{messages.tipManager.title}</h1>
      </div>

      <TipManager />
    </div>
  )
}
