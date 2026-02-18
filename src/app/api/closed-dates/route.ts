import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { updateClinicSettings } from "@/lib/queries/clinics"
import { requireAuth, isAuthError } from "@/lib/auth-helpers"
import { successResponse, errorResponse } from "@/lib/api-helpers"
import { messages } from "@/lib/messages"
import type { ClinicSettings } from "@/types"
import { jstTodayStr, jstDaysAgo, formatDateKeyJST, getDayJST } from "@/lib/date-jst"

/** 日付バリデーション共通処理 */
function validateDate(date: unknown): date is string {
  if (!date || typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return false
  const [y, m, d] = date.split("-").map(Number)
  const parsed = new Date(y, m - 1, d)
  return parsed.getFullYear() === y && parsed.getMonth() === m - 1 && parsed.getDate() === d
}

/** 14日以内かチェック */
function isWithin14Days(date: string): boolean {
  const todayStr = jstTodayStr()
  const fourteenDaysAgoStr = formatDateKeyJST(jstDaysAgo(14))
  return date <= todayStr && date >= fourteenDaysAgoStr
}

/** 定休日の曜日かチェック */
function isRegularClosedDay(date: string, regularClosedDays: number[]): boolean {
  const [y, m, d] = date.split("-").map(Number)
  const dateObj = new Date(Date.UTC(y, m - 1, d))
  return regularClosedDays.includes(getDayJST(dateObj))
}

/**
 * POST /api/closed-dates
 * 営業日→休診日にする
 * - 通常の営業日 → closedDates に追加
 * - 定休日オーバーライド（openDates）中 → openDates から削除（定休日に戻す）
 */
export async function POST(request: NextRequest) {
  const authResult = await requireAuth()
  if (isAuthError(authResult)) return authResult

  const clinicId = authResult.user.clinicId
  if (!clinicId) {
    return errorResponse(messages.errors.clinicNotAssociated, 400)
  }

  try {
    const body = await request.json()
    const { date } = body

    if (!validateDate(date)) {
      return errorResponse(messages.errors.invalidInput, 400)
    }

    if (!isWithin14Days(date)) {
      return errorResponse(messages.errors.invalidInput, 400)
    }

    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
      select: { settings: true },
    })
    const settings = (clinic?.settings ?? {}) as ClinicSettings
    const regularClosedDays = settings.regularClosedDays ?? []

    const patch: Partial<ClinicSettings> = {}

    if (isRegularClosedDay(date, regularClosedDays)) {
      // 定休日をopenDatesでオーバーライド中 → openDatesから削除して定休日に戻す
      const openDates = (settings.openDates ?? []).filter((d) => d !== date)
      patch.openDates = openDates
    } else {
      // 通常の営業日 → closedDatesに追加
      const closedDates = [...(settings.closedDates ?? [])]
      if (!closedDates.includes(date)) {
        closedDates.push(date)
        if (closedDates.length > 365) {
          closedDates.sort()
          closedDates.splice(0, closedDates.length - 365)
        }
      }
      patch.closedDates = closedDates
    }

    await updateClinicSettings(clinicId, patch)

    return successResponse({ success: true })
  } catch {
    return errorResponse(messages.errors.settingsUpdateFailed, 500)
  }
}

/**
 * DELETE /api/closed-dates
 * 休診日→営業日に戻す
 * - 臨時休診日（closedDates） → closedDates から削除
 * - 定休日の曜日 → openDates に追加（定休日オーバーライド）
 */
export async function DELETE(request: NextRequest) {
  const authResult = await requireAuth()
  if (isAuthError(authResult)) return authResult

  const clinicId = authResult.user.clinicId
  if (!clinicId) {
    return errorResponse(messages.errors.clinicNotAssociated, 400)
  }

  try {
    const body = await request.json()
    const { date } = body

    if (!validateDate(date)) {
      return errorResponse(messages.errors.invalidInput, 400)
    }

    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
      select: { settings: true },
    })
    const settings = (clinic?.settings ?? {}) as ClinicSettings
    const regularClosedDays = settings.regularClosedDays ?? []

    const patch: Partial<ClinicSettings> = {}

    // closedDatesに入っている場合は削除
    const closedDates = (settings.closedDates ?? []).filter((d) => d !== date)
    if (closedDates.length !== (settings.closedDates ?? []).length) {
      patch.closedDates = closedDates
    }

    // 定休日の曜日なら openDates に追加（オーバーライド）
    if (isRegularClosedDay(date, regularClosedDays)) {
      const openDates = [...(settings.openDates ?? [])]
      if (!openDates.includes(date)) {
        openDates.push(date)
        if (openDates.length > 365) {
          openDates.sort()
          openDates.splice(0, openDates.length - 365)
        }
      }
      patch.openDates = openDates
    }

    await updateClinicSettings(clinicId, patch)

    return successResponse({ success: true })
  } catch {
    return errorResponse(messages.errors.settingsUpdateFailed, 500)
  }
}
