import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { updateStaffSchema } from "@/lib/validations/staff"
import { requireAuth, requireRole, isAuthError } from "@/lib/auth-helpers"
import { successResponse, errorResponse } from "@/lib/api-helpers"
import { messages } from "@/lib/messages"
import bcrypt from "bcryptjs"

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await requireAuth()
  if (isAuthError(authResult)) return authResult

  try {
    // Check staff exists and belongs to user's clinic
    const existing = await prisma.staff.findUnique({
      where: { id: params.id },
      select: { clinicId: true, user: { select: { id: true } } },
    })

    if (!existing) {
      return errorResponse(messages.errors.staffNotFound, 404)
    }

    if (
      authResult.user.role === "clinic_admin" &&
      authResult.user.clinicId !== existing.clinicId
    ) {
      return errorResponse(messages.errors.accessDenied, 403)
    }

    const body = await request.json()
    const parsed = updateStaffSchema.safeParse(body)

    if (!parsed.success) {
      return errorResponse(messages.errors.invalidInput, 400)
    }

    const { email, password, userRole, ...staffData } = parsed.data

    // ログイン追加がリクエストされた場合
    if (email && password) {
      // 既にログインが設定されている場合は拒否
      if (existing.user) {
        return errorResponse("このスタッフには既にログインが設定されています", 400)
      }

      // トランザクションでStaff更新 + User作成
      const result = await prisma.$transaction(async (tx) => {
        const existingUser = await tx.user.findUnique({
          where: { email: email.toLowerCase() },
        })
        if (existingUser) {
          throw new Error("EMAIL_DUPLICATE")
        }

        const staff = await tx.staff.update({
          where: { id: params.id },
          data: staffData,
        })

        const hashedPassword = await bcrypt.hash(password, 10)
        await tx.user.create({
          data: {
            email: email.toLowerCase(),
            password: hashedPassword,
            name: staff.name,
            role: userRole ?? "staff",
            clinicId: existing.clinicId!,
            staffId: staff.id,
          },
        })

        return staff
      })

      return successResponse(result)
    }

    const staff = await prisma.staff.update({
      where: { id: params.id },
      data: staffData,
    })

    return successResponse(staff)
  } catch (e) {
    if (e instanceof Error && e.message === "EMAIL_DUPLICATE") {
      return errorResponse(messages.staff.emailDuplicate, 400)
    }
    return errorResponse(messages.errors.staffUpdateFailed, 500)
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await requireRole("clinic_admin", "system_admin")
  if (isAuthError(authResult)) return authResult

  try {
    const existing = await prisma.staff.findUnique({
      where: { id: params.id },
      select: { clinicId: true },
    })

    if (!existing) {
      return errorResponse(messages.errors.staffNotFound, 404)
    }

    if (
      authResult.user.role === "clinic_admin" &&
      authResult.user.clinicId !== existing.clinicId
    ) {
      return errorResponse(messages.errors.accessDenied, 403)
    }

    // アンケート回答データを保護: staffId を null に設定
    // 紐づくUserアカウントも削除
    await prisma.$transaction([
      prisma.surveyResponse.updateMany({
        where: { staffId: params.id },
        data: { staffId: null },
      }),
      prisma.user.deleteMany({
        where: { staffId: params.id },
      }),
      prisma.staff.delete({ where: { id: params.id } }),
    ])

    return successResponse({ deleted: true })
  } catch {
    return errorResponse(messages.errors.staffDeleteFailed, 500)
  }
}
