import Link from "next/link"
import { cn } from "@/lib/utils"
import { messages } from "@/lib/messages"

interface MetricsTabNavProps {
  active: "summary" | "input"
}

const m = messages.monthlyMetrics

export function MetricsTabNav({ active }: MetricsTabNavProps) {
  const tabs = [
    { key: "summary" as const, label: m.tabSummary, href: "/dashboard/metrics" },
    { key: "input" as const, label: m.tabInput, href: "/dashboard/metrics/input" },
  ]

  return (
    <div className="flex gap-1 rounded-lg bg-muted p-1">
      {tabs.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          className={cn(
            "flex-1 rounded-md px-3 py-1.5 text-center text-sm font-medium transition-colors",
            active === tab.key
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  )
}
