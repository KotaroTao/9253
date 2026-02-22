import { NextRequest } from "next/server"
import { requireRole, isAuthError } from "@/lib/auth-helpers"
import { successResponse, errorResponse } from "@/lib/api-helpers"
import { prisma } from "@/lib/prisma"
import type { ClinicSettings } from "@/types"

/** GET /api/admin/clinics/[id]/demo-settings — デモ医院の現在設定を取得 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireRole("system_admin")
  if (isAuthError(authResult)) return authResult

  const { id } = await params

  const clinic = await prisma.clinic.findUnique({
    where: { id },
    select: { id: true, name: true, settings: true },
  })
  if (!clinic) {
    return errorResponse("クリニックが見つかりません", 404)
  }

  const settings = (clinic.settings ?? {}) as ClinicSettings
  if (settings.plan !== "demo") {
    return errorResponse("デモプランの医院のみ設定可能です", 400)
  }

  // 獲得済みKawaii Teethを取得
  const collections = await prisma.kawaiiTeethCollection.findMany({
    where: { clinicId: id },
    select: {
      id: true,
      kawaiiTeethId: true,
      kawaiiTeeth: { select: { id: true, name: true, imageData: true } },
    },
  })

  // 全Kawaii Teethを取得（選択肢用）
  const allTeeth = await prisma.kawaiiTeeth.findMany({
    select: { id: true, name: true, imageData: true },
    orderBy: { createdAt: "asc" },
  })

  return successResponse({
    responsesSinceLastAdvisory: settings.responsesSinceLastAdvisory ?? 0,
    advisoryThreshold: settings.advisoryThreshold ?? 30,
    collections: collections.map((c) => ({
      collectionId: c.id,
      teethId: c.kawaiiTeethId,
      name: c.kawaiiTeeth.name,
      imageData: c.kawaiiTeeth.imageData,
    })),
    allTeeth,
  })
}

/** PATCH /api/admin/clinics/[id]/demo-settings — デモ医院の設定を更新 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireRole("system_admin")
  if (isAuthError(authResult)) return authResult

  const { id } = await params

  let body: {
    responsesSinceLastAdvisory?: number
    addTeethIds?: string[]
    removeCollectionIds?: string[]
  }
  try {
    body = await request.json()
  } catch {
    return errorResponse("リクエストが不正です", 400)
  }

  const clinic = await prisma.clinic.findUnique({
    where: { id },
    select: { id: true, settings: true },
  })
  if (!clinic) {
    return errorResponse("クリニックが見つかりません", 404)
  }

  const settings = (clinic.settings ?? {}) as ClinicSettings
  if (settings.plan !== "demo") {
    return errorResponse("デモプランの医院のみ設定可能です", 400)
  }

  // AI分析カウンター更新
  if (body.responsesSinceLastAdvisory != null) {
    const count = Math.max(0, Math.floor(body.responsesSinceLastAdvisory))
    const patch = JSON.stringify({ responsesSinceLastAdvisory: count })
    await prisma.$executeRaw`
      UPDATE clinics SET settings = settings || ${patch}::jsonb
      WHERE id = ${id}::uuid
    `
  }

  // Kawaii Teeth追加
  if (body.addTeethIds && body.addTeethIds.length > 0) {
    await prisma.kawaiiTeethCollection.createMany({
      data: body.addTeethIds.map((teethId) => ({
        clinicId: id,
        kawaiiTeethId: teethId,
      })),
    })
  }

  // Kawaii Teeth削除
  if (body.removeCollectionIds && body.removeCollectionIds.length > 0) {
    await prisma.kawaiiTeethCollection.deleteMany({
      where: {
        id: { in: body.removeCollectionIds },
        clinicId: id,
      },
    })
  }

  return successResponse({ ok: true })
}
