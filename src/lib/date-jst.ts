/**
 * JST (Asia/Tokyo, UTC+9) 日付ヘルパー。
 * Cloud Run (UTC) 環境でJST基準の日付計算を行うために使用。
 * 日本はサマータイム非採用のため、オフセットは常に +9h 固定。
 */

const JST_OFFSET_MS = 9 * 60 * 60 * 1000
const DAY_MS = 24 * 60 * 60 * 1000

/** UTC Date を JST に変換。getUTC*() メソッドでJST値を取得可能。 */
function toJST(date: Date): Date {
  return new Date(date.getTime() + JST_OFFSET_MS)
}

/** 現在のJST年月日を取得 */
export function jstNowParts(): { year: number; month: number; date: number } {
  const jst = toJST(new Date())
  return { year: jst.getUTCFullYear(), month: jst.getUTCMonth() + 1, date: jst.getUTCDate() }
}

/** JST本日 00:00 をUTC Dateとして返す（DBクエリ用） */
export function jstToday(): Date {
  const jst = toJST(new Date())
  return new Date(Date.UTC(jst.getUTCFullYear(), jst.getUTCMonth(), jst.getUTCDate()) - JST_OFFSET_MS)
}

/** JST N日前の 00:00 をUTC Dateとして返す */
export function jstDaysAgo(days: number): Date {
  return new Date(jstToday().getTime() - days * DAY_MS)
}

/** JST N日前の 23:59:59.999 をUTC Dateとして返す */
export function jstEndOfDay(daysAgo: number = 0): Date {
  return new Date(jstDaysAgo(daysAgo).getTime() + DAY_MS - 1)
}

/** JST指定年月の1日 00:00 をUTC Dateとして返す（month は 1-based） */
export function jstStartOfMonth(year: number, month: number): Date {
  return new Date(Date.UTC(year, month - 1, 1) - JST_OFFSET_MS)
}

/** JST指定年月の末日 23:59:59 をUTC Dateとして返す（month は 1-based） */
export function jstEndOfMonth(year: number, month: number): Date {
  return new Date(Date.UTC(year, month, 0, 23, 59, 59) - JST_OFFSET_MS)
}

/** JST Nヶ月前の1日 00:00 をUTC Dateとして返す */
export function jstMonthsAgoStart(months: number): Date {
  const { year, month } = jstNowParts()
  return jstStartOfMonth(year, month - months)
}

/** JST YYYY-MM形式の月キー（monthsAgo=0: 今月） */
export function jstMonthKey(monthsAgo: number = 0): string {
  const { year, month } = jstNowParts()
  const d = new Date(Date.UTC(year, month - 1 - monthsAgo, 1))
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`
}

/** UTC DateをJST YYYY-MM-DD文字列に変換 */
export function formatDateKeyJST(date: Date): string {
  const jst = toJST(date)
  return `${jst.getUTCFullYear()}-${String(jst.getUTCMonth() + 1).padStart(2, "0")}-${String(jst.getUTCDate()).padStart(2, "0")}`
}

/** UTC DateのJST曜日名（日/月/火/水/木/金/土） */
const DAY_NAMES_JA = ["日", "月", "火", "水", "木", "金", "土"]
export function getDayOfWeekJaJST(date: Date): string {
  return DAY_NAMES_JA[toJST(date).getUTCDay()]
}

/** UTC DateのJST曜日番号（0=日〜6=土） */
export function getDayJST(date: Date): number {
  return toJST(date).getUTCDay()
}

/** JST本日のYYYY-MM-DD文字列 */
export function jstTodayStr(): string {
  return formatDateKeyJST(new Date())
}
