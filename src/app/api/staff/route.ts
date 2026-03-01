import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { createStaffSchema } from "@/lib/validations/staff"
import { requireRole, isAuthError } from "@/lib/auth-helpers"
import { successResponse, errorResponse } from "@/lib/api-helpers"
import { messages } from "@/lib/messages"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  const authResult = await requireRole("clinic_admin", "system_admin")
  if (isAuthError(authResult)) return authResult

  const clinicId = authResult.user.clinicId
  if (!clinicId) {
    return errorResponse(messages.common.error, 400)
  }

  try {
    const body = await request.json()
    const parsed = createStaffSchema.safeParse(body)

    if (!parsed.success) {
      const firstError = parsed.error.errors[0]
      return errorResponse(firstError?.message || messages.common.error, 400)
    }

    const { name, role, email, password, userRole } = parsed.data

    // トランザクションで重複チェック + Staff + User を一括作成
    const result = await prisma.$transaction(async (tx) => {
      // メールアドレスの重複チェック（トランザクション内で実行）
      if (email) {
        const existingUser = await tx.user.findUnique({
          where: { email: email.toLowerCase() },
        })
        if (existingUser) {
          throw new Error("EMAIL_DUPLICATE")
        }
      }

      const staff = await tx.staff.create({
        data: {
          clinicId,
          name,
          role,
        },
      })

      let user = null
      if (email && password) {
        const hashedPassword = await bcrypt.hash(password, 10)
        user = await tx.user.create({
          data: {
            email: email.toLowerCase(),
            password: hashedPassword,
            name,
            role: userRole ?? "staff",
            clinicId,
            staffId: staff.id,
          },
        })
      }

      return { staff, user }
    })

    return successResponse({
      ...result.staff,
      hasLogin: !!result.user,
      userEmail: result.user?.email,
    }, 201)
  } catch (e) {
    if (e instanceof Error && e.message === "EMAIL_DUPLICATE") {
      return errorResponse(messages.staff.emailDuplicate, 400)
    }
    return errorResponse(messages.common.error, 500)
  }
}
