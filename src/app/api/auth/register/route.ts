import { NextRequest } from "next/server"
import { successResponse, errorResponse } from "@/lib/api-helpers"
import { prisma } from "@/lib/prisma"
import { checkRateLimit } from "@/lib/rate-limit"
import { getClientIp } from "@/lib/ip"
import { messages } from "@/lib/messages"
import bcrypt from "bcryptjs"

// 初診・再診テンプレート（admin/clinics/route.ts と同じ設問構成）
const FIRST_VISIT_QUESTIONS = [
  { id: "fv1", text: "医院の第一印象（清潔さ・雰囲気）はいかがでしたか？", type: "rating", required: true },
  { id: "fv2", text: "受付の対応は丁寧でしたか？", type: "rating", required: true },
  { id: "fv3", text: "待ち時間は気にならない程度でしたか？", type: "rating", required: true },
  { id: "fv4", text: "お悩みや症状についてのヒアリングは十分でしたか？", type: "rating", required: true },
  { id: "fv5", text: "今後の方針や内容の説明は分かりやすかったですか？", type: "rating", required: true },
  { id: "fv6", text: "費用に関する説明は十分でしたか？", type: "rating", required: true },
  { id: "fv7", text: "不安や疑問を相談しやすい雰囲気でしたか？", type: "rating", required: true },
  { id: "fv8", text: "当院をご家族・知人にも紹介したいと思いますか？", type: "rating", required: true },
]

const TREATMENT_QUESTIONS = [
  { id: "tr1", text: "本日の診療についての説明は分かりやすかったですか？", type: "rating", required: true },
  { id: "tr2", text: "不安や痛みへの配慮は十分でしたか？", type: "rating", required: true },
  { id: "tr3", text: "質問や相談がしやすい雰囲気でしたか？", type: "rating", required: true },
  { id: "tr4", text: "待ち時間は気にならない程度でしたか？", type: "rating", required: true },
  { id: "tr5", text: "スタッフの対応は丁寧でしたか？", type: "rating", required: true },
  { id: "tr6", text: "当院をご家族・知人にも紹介したいと思いますか？", type: "rating", required: true },
]

const SLUG_RE = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/

/** クリニック名からURL用スラッグを生成 */
function generateSlug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[\s　]+/g, "-")          // 全角・半角スペース → ハイフン
    .replace(/[^a-z0-9-]/g, "")       // 英数字・ハイフン以外を除去
    .replace(/-+/g, "-")              // 連続ハイフンを1つに
    .replace(/^-|-$/g, "")            // 先頭・末尾のハイフン除去
}

/** ユニークなスラッグを確保する（重複時にサフィックス付与） */
async function ensureUniqueSlug(baseSlug: string): Promise<string> {
  // スラッグが空の場合（日本語のみのクリニック名など）はランダム生成
  const slug = baseSlug.length >= 2 ? baseSlug : `clinic-${Date.now().toString(36)}`

  const existing = await prisma.clinic.findUnique({ where: { slug } })
  if (!existing) return slug

  // 重複時はサフィックス付与
  for (let i = 2; i <= 99; i++) {
    const candidate = `${slug}-${i}`
    const exists = await prisma.clinic.findUnique({ where: { slug: candidate } })
    if (!exists) return candidate
  }

  // フォールバック: タイムスタンプ付き
  return `${slug}-${Date.now().toString(36)}`
}

export async function POST(request: NextRequest) {
  // レート制限（IPベース、登録は1日5回まで）
  const ip = getClientIp()
  const { allowed } = checkRateLimit(`register:${ip}`)
  if (!allowed) {
    return errorResponse("登録回数の上限に達しました。しばらく時間をおいてお試しください", 429)
  }

  let body: {
    clinicName?: string
    adminName?: string
    email?: string
    password?: string
    passwordConfirm?: string
    termsAgreed?: boolean
  }
  try {
    body = await request.json()
  } catch {
    return errorResponse(messages.errors.invalidInput, 400)
  }

  const { clinicName, adminName, email, password, passwordConfirm, termsAgreed } = body

  // バリデーション
  if (!clinicName || !clinicName.trim()) {
    return errorResponse(messages.auth.clinicNameRequired, 400)
  }
  if (!adminName || !adminName.trim()) {
    return errorResponse(messages.auth.adminNameRequired, 400)
  }
  if (!email || !email.includes("@")) {
    return errorResponse(messages.auth.emailRequired, 400)
  }
  if (!password || password.length < 6) {
    return errorResponse(messages.auth.passwordRequired, 400)
  }
  if (password !== passwordConfirm) {
    return errorResponse(messages.auth.passwordMismatch, 400)
  }
  if (!termsAgreed) {
    return errorResponse(messages.auth.termsRequired, 400)
  }

  // メール重複チェック
  const existingUser = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
  })
  if (existingUser) {
    return errorResponse(messages.auth.emailAlreadyUsed, 400)
  }

  // スラッグ生成
  const baseSlug = generateSlug(clinicName)
  const slug = await ensureUniqueSlug(baseSlug)

  // 30日間トライアル設定
  const now = new Date()
  const trialEnds = new Date(now)
  trialEnds.setDate(trialEnds.getDate() + 30)

  // トランザクションで Clinic + User + SurveyTemplate を一括作成
  const result = await prisma.$transaction(async (tx) => {
    const clinic = await tx.clinic.create({
      data: {
        name: clinicName.trim(),
        slug,
        settings: {
          plan: "free",
          trialPlan: "standard",
          trialStartedAt: now.toISOString(),
          trialEndsAt: trialEnds.toISOString(),
          trialUsed: true,
        },
      },
    })

    const hashedPassword = await bcrypt.hash(password, 10)
    const user = await tx.user.create({
      data: {
        email: email.trim().toLowerCase(),
        password: hashedPassword,
        name: adminName.trim(),
        role: "clinic_admin",
        clinicId: clinic.id,
      },
    })

    // アンケートテンプレート作成（初診 + 再診）
    await tx.surveyTemplate.createMany({
      data: [
        { clinicId: clinic.id, name: "初診", questions: FIRST_VISIT_QUESTIONS },
        { clinicId: clinic.id, name: "再診", questions: TREATMENT_QUESTIONS },
      ],
    })

    return { clinic, user }
  })

  return successResponse({
    id: result.clinic.id,
    slug: result.clinic.slug,
    email: result.user.email,
  }, 201)
}
