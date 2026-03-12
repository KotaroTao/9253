/**
 * デモクリニック用データカットオフ設定。
 * デモ歯科クリニック（demo-dental）は 2026/2/22 までのデータのみ表示し、
 * ダッシュボードの「今日」を 2026/2/22 として扱う。
 */

import { prisma } from "@/lib/prisma"
import { parseJSTDate, parseJSTDateEnd } from "@/lib/date-jst"

export const DEMO_CLINIC_SLUG = "demo-dental"

/** デモデータの最終日（JST） */
export const DEMO_DATA_CUTOFF_DATE = "2026-02-22"

/** カットオフ日の JST 00:00（UTC Date） */
export function demoCutoffStartOfDay(): Date {
  return parseJSTDate(DEMO_DATA_CUTOFF_DATE)
}

/** カットオフ日の JST 23:59:59（UTC Date） */
export function demoCutoffEndOfDay(): Date {
  return parseJSTDateEnd(DEMO_DATA_CUTOFF_DATE)
}

/** slug がデモクリニックかどうかを判定 */
export function isDemoClinic(slug: string): boolean {
  return slug === DEMO_CLINIC_SLUG
}

/**
 * clinicId からデモクリニックのカットオフ日（end of day）を返す。
 * デモクリニックでなければ null を返す。
 */
export async function getDemoCutoffForClinic(clinicId: string): Promise<Date | null> {
  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId },
    select: { slug: true },
  })
  if (!clinic || clinic.slug !== DEMO_CLINIC_SLUG) return null
  return demoCutoffEndOfDay()
}
