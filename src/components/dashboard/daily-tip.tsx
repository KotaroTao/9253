import { getTodayTip } from "@/lib/patient-tips"
import { Lightbulb } from "lucide-react"

export function DailyTip() {
  const tip = getTodayTip()

  return (
    <div className="rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50/80 to-white px-5 py-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
          <Lightbulb className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold text-amber-700">
              今日のワンポイント
            </p>
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-600">
              {tip.category}
            </span>
          </div>
          <p className="mt-1 text-sm font-bold text-gray-900">{tip.title}</p>
          <p className="mt-0.5 text-sm leading-relaxed text-gray-600">
            {tip.content}
          </p>
        </div>
      </div>
    </div>
  )
}
