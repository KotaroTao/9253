import Link from "next/link"
import { messages } from "@/lib/messages"
import { PlatformActionsManager } from "@/components/admin/platform-actions-manager"
import { ArrowLeft } from "lucide-react"

export default function AdminImprovementActionsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin"
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold">{messages.platformActions.manage}</h1>
      </div>

      <PlatformActionsManager />
    </div>
  )
}
