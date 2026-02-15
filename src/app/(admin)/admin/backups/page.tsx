import Link from "next/link"
import { messages } from "@/lib/messages"
import { BackupManager } from "@/components/admin/backup-manager"
import { ArrowLeft } from "lucide-react"

export default function AdminBackupsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin"
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{messages.backup.title}</h1>
          <p className="text-sm text-muted-foreground">
            {messages.backup.description}
          </p>
        </div>
      </div>

      <BackupManager />
    </div>
  )
}
