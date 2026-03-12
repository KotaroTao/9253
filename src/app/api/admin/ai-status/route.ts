import { NextRequest } from "next/server"
import { requireRole, isAuthError } from "@/lib/auth-helpers"
import { successResponse, errorResponse, parseJsonBody, isParseError } from "@/lib/api-helpers"
import { checkLLMStatus } from "@/lib/llm-advisory"
import { prisma } from "@/lib/prisma"
import { messages } from "@/lib/messages"
import { z } from "zod"

/**
 * GET /api/admin/ai-status — AI分析の接続状態を確認
 */
export async function GET() {
  const authResult = await requireRole("system_admin")
  if (isAuthError(authResult)) return authResult

  const status = await checkLLMStatus()

  // 直近のAI分析レポート情報を取得
  const [latestReport, totalReports] = await Promise.all([
    prisma.advisoryReport.findFirst({
      orderBy: { generatedAt: "desc" },
      select: { generatedAt: true, clinicId: true, triggerType: true },
    }),
    prisma.advisoryReport.count(),
  ])

  return successResponse({
    ...status,
    latestReport: latestReport
      ? {
          generatedAt: latestReport.generatedAt,
          triggerType: latestReport.triggerType,
        }
      : null,
    totalReports,
  })
}

const updateSchema = z.object({
  apiKey: z.string().min(1),
})

/**
 * POST /api/admin/ai-status — Anthropic APIキーを環境変数として設定
 *
 * NOTE: Cloud Run では環境変数の動的変更は永続化されない。
 * このエンドポイントはプロセス内で process.env を書き換えるだけで、
 * 永続化には Secret Manager 経由のデプロイが必要。
 * ここではランタイム内のテスト・一時設定用途として提供する。
 */
export async function POST(request: NextRequest) {
  const authResult = await requireRole("system_admin")
  if (isAuthError(authResult)) return authResult

  const body = await parseJsonBody(request)
  if (isParseError(body)) return body

  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return errorResponse(messages.apiErrors.invalidRequest, 400)
  }

  // APIキーをランタイムで設定
  process.env.ANTHROPIC_API_KEY = parsed.data.apiKey

  // 設定後に接続テストを実行
  const status = await checkLLMStatus()

  if (!status.connected) {
    // 無効なキーだった場合はロールバック
    delete process.env.ANTHROPIC_API_KEY
    return errorResponse(
      messages.admin.aiStatus.invalidKey,
      400,
      { detail: status.error },
    )
  }

  return successResponse({
    ...status,
    message: messages.admin.aiStatus.keyUpdated,
  })
}
