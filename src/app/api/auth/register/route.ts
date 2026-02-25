import { NextRequest } from "next/server"
import { successResponse, errorResponse } from "@/lib/api-helpers"
import { prisma } from "@/lib/prisma"
import { checkRateLimit } from "@/lib/rate-limit"
import { getClientIp } from "@/lib/ip"
import { verifyTurnstileToken } from "@/lib/turnstile"
import { sendMail, generateVerificationToken, buildVerificationEmail } from "@/lib/email"
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
    turnstileToken?: string
    plan?: string
  }
  try {
    body = await request.json()
  } catch {
    return errorResponse(messages.errors.invalidInput, 400)
  }

  const { clinicName, adminName, email, password, passwordConfirm, termsAgreed, turnstileToken, plan } = body
  const isSpecialPlan = plan === "special"

  // Turnstile 検証
  const turnstileValid = await verifyTurnstileToken(turnstileToken)
  if (!turnstileValid) {
    return errorResponse("bot検証に失敗しました。ページを再読み込みしてお試しください", 400)
  }

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

  const now = new Date()

  // プラン設定: 特別プランは standard 相当を無料で直接付与、通常は30日トライアル
  const clinicSettings = isSpecialPlan
    ? {
        plan: "special" as const,
        onboardingCompleted: false,
      }
    : {
        plan: "free" as const,
        trialPlan: "standard" as const,
        trialStartedAt: now.toISOString(),
        trialEndsAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        trialUsed: true,
        onboardingCompleted: false,
      }

  // メール認証トークン生成
  const verificationToken = generateVerificationToken()

  // トランザクションで Clinic + User + SurveyTemplate + AdminNotification を一括作成
  const result = await prisma.$transaction(async (tx) => {
    const clinic = await tx.clinic.create({
      data: {
        name: clinicName.trim(),
        slug,
        settings: clinicSettings,
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
        verificationToken,
      },
    })

    // アンケートテンプレート作成（初診 + 再診）
    await tx.surveyTemplate.createMany({
      data: [
        { clinicId: clinic.id, name: "初診", questions: FIRST_VISIT_QUESTIONS },
        { clinicId: clinic.id, name: "再診", questions: TREATMENT_QUESTIONS },
      ],
    })

    // system_admin 通知作成
    await tx.adminNotification.create({
      data: {
        type: "new_registration",
        title: messages.notifications.newRegistration,
        message: messages.notifications.newRegistrationDesc
          .replace("{clinicName}", clinicName.trim())
          .replace("{email}", email.trim().toLowerCase()),
        data: {
          clinicId: clinic.id,
          clinicName: clinicName.trim(),
          slug,
          email: email.trim().toLowerCase(),
          plan: isSpecialPlan ? "special" : "free",
        },
      },
    })

    return { clinic, user }
  })

  // メール認証メール送信（トランザクション外で非同期実行）
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://mieru-clinic.com"
  const verifyUrl = `${appUrl}/verify-email?token=${verificationToken}`
  const { subject, html } = buildVerificationEmail(verifyUrl, clinicName.trim())
  sendMail({ to: email.trim().toLowerCase(), subject, html }).catch((err) => {
    console.error("[register] Failed to send verification email:", err)
  })

  return successResponse({
    id: result.clinic.id,
    slug: result.clinic.slug,
    email: result.user.email,
  }, 201)
}
