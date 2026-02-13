import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

// 3 survey types: first visit, treatment, checkup
const FIRST_VISIT_QUESTIONS = [
  { id: "fv1", text: "医院の見つけやすさ・アクセスは良かったですか？", type: "rating", required: true },
  { id: "fv2", text: "受付の対応はいかがでしたか？", type: "rating", required: true },
  { id: "fv3", text: "初診時の問診・カウンセリングは丁寧でしたか？", type: "rating", required: true },
  { id: "fv4", text: "治療内容の説明は分かりやすかったですか？", type: "rating", required: true },
  { id: "fv5", text: "治療費用の説明は十分でしたか？", type: "rating", required: true },
  { id: "fv6", text: "院内の清潔さ・雰囲気はいかがでしたか？", type: "rating", required: true },
  { id: "fv7", text: "待ち時間は適切でしたか？", type: "rating", required: true },
  { id: "fv8", text: "次回も当院に通院したいと思いますか？", type: "rating", required: true },
]

const TREATMENT_QUESTIONS = [
  { id: "tr1", text: "本日の治療の満足度を教えてください", type: "rating", required: true },
  { id: "tr2", text: "治療内容の説明は分かりやすかったですか？", type: "rating", required: true },
  { id: "tr3", text: "痛みへの配慮は十分でしたか？", type: "rating", required: true },
  { id: "tr4", text: "治療の進捗についての説明は適切でしたか？", type: "rating", required: true },
  { id: "tr5", text: "待ち時間は適切でしたか？", type: "rating", required: true },
  { id: "tr6", text: "スタッフの対応はいかがでしたか？", type: "rating", required: true },
  { id: "tr7", text: "プライバシーへの配慮は十分でしたか？", type: "rating", required: true },
  { id: "tr8", text: "当院での治療を知人に薦めたいと思いますか？", type: "rating", required: true },
]

const CHECKUP_QUESTIONS = [
  { id: "ck1", text: "定期検診の内容に満足されましたか？", type: "rating", required: true },
  { id: "ck2", text: "歯のクリーニングの丁寧さはいかがでしたか？", type: "rating", required: true },
  { id: "ck3", text: "口腔ケアのアドバイスは参考になりましたか？", type: "rating", required: true },
  { id: "ck4", text: "予約の取りやすさはいかがでしたか？", type: "rating", required: true },
  { id: "ck5", text: "待ち時間は適切でしたか？", type: "rating", required: true },
  { id: "ck6", text: "スタッフの対応はいかがでしたか？", type: "rating", required: true },
  { id: "ck7", text: "院内の清潔さ・雰囲気はいかがでしたか？", type: "rating", required: true },
  { id: "ck8", text: "今後も当院で定期検診を続けたいと思いますか？", type: "rating", required: true },
]

const SURVEY_TEMPLATES = [
  { name: "初診", questions: FIRST_VISIT_QUESTIONS },
  { name: "治療中", questions: TREATMENT_QUESTIONS },
  { name: "定期検診", questions: CHECKUP_QUESTIONS },
]

async function main() {
  console.log("Seeding database...")

  // Create demo clinic with default admin password "1111"
  const defaultAdminPasswordHash = await bcrypt.hash("1111", 10)
  const clinic = await prisma.clinic.upsert({
    where: { slug: "demo-dental" },
    update: {
      settings: { adminPassword: defaultAdminPasswordHash },
    },
    create: {
      name: "MIERU デモ歯科クリニック",
      slug: "demo-dental",
      settings: { adminPassword: defaultAdminPasswordHash },
    },
  })
  console.log(`Clinic: ${clinic.name} (${clinic.id})`)

  // Create staff members (upsert by qrToken)
  const staffData = [
    { name: "田中 花子", role: "hygienist", qrToken: "demo-token-田中-花子" },
    { name: "佐藤 太郎", role: "dentist", qrToken: "demo-token-佐藤-太郎" },
    { name: "鈴木 美咲", role: "staff", qrToken: "demo-token-鈴木-美咲" },
  ]

  const staffMembers = []
  for (const s of staffData) {
    const staff = await prisma.staff.upsert({
      where: { qrToken: s.qrToken },
      update: {},
      create: {
        clinicId: clinic.id,
        name: s.name,
        role: s.role,
        qrToken: s.qrToken,
      },
    })
    staffMembers.push(staff)
    console.log(`Staff: ${staff.name} (qrToken: ${staff.qrToken})`)
  }

  // Create system admin user
  const adminPassword = await bcrypt.hash("admin123", 10)
  const admin = await prisma.user.upsert({
    where: { email: "admin@mieru-clinic.com" },
    update: {},
    create: {
      email: "admin@mieru-clinic.com",
      password: adminPassword,
      name: "システム管理者",
      role: "system_admin",
    },
  })
  console.log(`System admin: ${admin.email}`)

  // Create clinic admin user
  const clinicPassword = await bcrypt.hash("clinic123", 10)
  const clinicAdmin = await prisma.user.upsert({
    where: { email: "clinic@demo.com" },
    update: {},
    create: {
      email: "clinic@demo.com",
      password: clinicPassword,
      name: "院長（デモ）",
      role: "clinic_admin",
      clinicId: clinic.id,
    },
  })
  console.log(`Clinic admin: ${clinicAdmin.email}`)

  // Create or update 3 survey templates (初診・治療中・定期検診)
  const templates = []
  for (const tmpl of SURVEY_TEMPLATES) {
    const existing = await prisma.surveyTemplate.findFirst({
      where: { clinicId: clinic.id, name: tmpl.name },
    })
    let template
    if (existing) {
      template = await prisma.surveyTemplate.update({
        where: { id: existing.id },
        data: { questions: tmpl.questions, isActive: true },
      })
    } else {
      template = await prisma.surveyTemplate.create({
        data: {
          clinicId: clinic.id,
          name: tmpl.name,
          questions: tmpl.questions,
          isActive: true,
        },
      })
    }
    templates.push(template)
    console.log(`Template: ${template.name} (${template.id})`)
  }

  // Deactivate old templates that don't match the 3 types
  await prisma.surveyTemplate.updateMany({
    where: {
      clinicId: clinic.id,
      id: { notIn: templates.map((t) => t.id) },
    },
    data: { isActive: false },
  })

  const template = templates[0]

  // Create sample survey responses (skip if responses already exist)
  const existingCount = await prisma.surveyResponse.count({
    where: { clinicId: clinic.id },
  })

  if (existingCount === 0) {
    const now = new Date()
    const sampleResponses = []
    for (let i = 0; i < 30; i++) {
      const daysAgo = Math.floor(Math.random() * 60)
      const respondedAt = new Date(now.getTime() - daysAgo * 86400000)

      const scores: Record<string, number> = {}
      // Use template from round-robin across 3 templates
      const tmplIndex = i % templates.length
      const tmplQuestions = SURVEY_TEMPLATES[tmplIndex].questions
      for (const q of tmplQuestions) {
        scores[q.id] = Math.random() > 0.2 ? Math.ceil(Math.random() * 2) + 3 : Math.ceil(Math.random() * 3)
      }
      const scoreValues = Object.values(scores)
      const overallScore = scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length

      sampleResponses.push({
        clinicId: clinic.id,
        staffId: staffMembers[i % staffMembers.length].id,
        templateId: templates[tmplIndex].id,
        answers: scores,
        overallScore,
        freeText: i % 5 === 0 ? "丁寧に対応していただきありがとうございました。" : null,
        ipHash: `sample-hash-${i}`,
        respondedAt,
      })
    }

    await prisma.surveyResponse.createMany({ data: sampleResponses })
    console.log(`Sample responses created: ${sampleResponses.length} records`)
  } else {
    console.log(`Sample responses skipped (${existingCount} already exist)`)
  }

  console.log("\nSeed completed!")
  console.log("\n--- Login Credentials ---")
  console.log("System Admin: admin@mieru-clinic.com / admin123")
  console.log("Clinic Admin: clinic@demo.com / clinic123")
  console.log(`\nSurvey URL (demo): /s/demo-dental`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
