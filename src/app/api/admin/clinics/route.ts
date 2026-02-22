import { NextRequest } from "next/server"
import { requireRole, isAuthError } from "@/lib/auth-helpers"
import { successResponse, errorResponse } from "@/lib/api-helpers"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

// 初診・再診テンプレート（seed.ts と同じ設問構成）
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

export async function POST(request: NextRequest) {
  const authResult = await requireRole("system_admin")
  if (isAuthError(authResult)) return authResult

  let body: { name?: string; slug?: string; adminEmail?: string; adminPassword?: string; plan?: string }
  try {
    body = await request.json()
  } catch {
    return errorResponse("リクエストが不正です", 400)
  }

  const { name, slug, adminEmail, adminPassword, plan } = body

  // バリデーション
  if (!name || !name.trim()) {
    return errorResponse("クリニック名を入力してください", 400)
  }
  if (!slug || !slug.trim()) {
    return errorResponse("スラッグを入力してください", 400)
  }
  if (slug.length < 2 || slug.length > 50 || !SLUG_RE.test(slug)) {
    return errorResponse("スラッグは英小文字・数字・ハイフン（2〜50文字）で入力してください", 400)
  }
  if (!adminEmail || !adminEmail.includes("@")) {
    return errorResponse("有効なメールアドレスを入力してください", 400)
  }
  if (!adminPassword || adminPassword.length < 6) {
    return errorResponse("パスワードは6文字以上で入力してください", 400)
  }

  // スラッグ重複チェック
  const existingClinic = await prisma.clinic.findUnique({ where: { slug } })
  if (existingClinic) {
    return errorResponse("このスラッグは既に使用されています", 400)
  }

  // メール重複チェック
  const existingUser = await prisma.user.findUnique({ where: { email: adminEmail } })
  if (existingUser) {
    return errorResponse("このメールアドレスは既に使用されています", 400)
  }

  const validPlans = ["free", "starter", "standard", "enterprise"]
  const selectedPlan = plan && validPlans.includes(plan) ? plan : "free"

  // トランザクションで Clinic + User + SurveyTemplate を一括作成
  const result = await prisma.$transaction(async (tx) => {
    const clinic = await tx.clinic.create({
      data: {
        name: name.trim(),
        slug: slug.trim(),
        settings: { plan: selectedPlan },
      },
    })

    const hashedPassword = await bcrypt.hash(adminPassword, 10)
    const user = await tx.user.create({
      data: {
        email: adminEmail.trim().toLowerCase(),
        password: hashedPassword,
        name: `${name.trim()} 管理者`,
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
    name: result.clinic.name,
    slug: result.clinic.slug,
    adminEmail: result.user.email,
    plan: selectedPlan,
  }, 201)
}
