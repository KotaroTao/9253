import { NextResponse } from "next/server"
import { parseJSTDate, parseJSTDateEnd, daysBetween } from "@/lib/date-jst"
import type { DateRange, AttributeFilters } from "@/lib/queries/stats"

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

/** URLSearchParamsからfrom/toを解析してDateRangeとeffectiveDaysを返す */
export function parseDateRangeParams(
  params: URLSearchParams,
  maxDays: number = 10950,
): { range: DateRange; days: number } | { error: string } | null {
  const fromStr = params.get("from")
  const toStr = params.get("to")
  if (!fromStr && !toStr) return null
  if (!fromStr || !toStr) return { error: "from と to の両方を指定してください" }
  if (!DATE_RE.test(fromStr) || !DATE_RE.test(toStr)) return { error: "日付はYYYY-MM-DD形式で指定してください" }
  const from = parseJSTDate(fromStr)
  const to = parseJSTDateEnd(toStr)
  if (from >= to) return { error: "from は to より前の日付を指定してください" }
  const days = daysBetween(from, to)
  if (days > maxDays) return { error: "指定期間が長すぎます" }
  return { range: { from, to }, days }
}

const ATTR_KEYS: (keyof AttributeFilters)[] = ["visitType", "insuranceType", "purpose", "ageGroup", "gender"]

/** URLSearchParams から患者属性フィルタをパース。フィルタなしの場合 undefined を返す */
export function parseAttributeFilters(params: URLSearchParams): AttributeFilters | undefined {
  const filters: AttributeFilters = {}
  let hasAny = false
  for (const key of ATTR_KEYS) {
    const val = params.get(key)
    if (val) {
      filters[key] = val
      hasAny = true
    }
  }
  return hasAny ? filters : undefined
}

export function successResponse(data: unknown, status = 200) {
  return NextResponse.json(data, { status })
}

export function errorResponse(
  message: string,
  status: number,
  details?: Record<string, unknown>
) {
  const body: Record<string, unknown> = { error: message }
  if (details) {
    body.details = details
  }
  return NextResponse.json(body, { status })
}
