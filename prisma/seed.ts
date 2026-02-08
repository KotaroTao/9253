import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

const DEFAULT_QUESTIONS = [
  {
    id: "q1",
    text: "本日の治療の満足度を教えてください",
    type: "rating",
    required: true,
  },
  {
    id: "q2",
    text: "スタッフの対応はいかがでしたか？",
    type: "rating",
    required: true,
  },
  {
    id: "q3",
    text: "当院を知人に薦めたいと思いますか？",
    type: "rating",
    required: true,
  },
]

async function main() {
  console.log("Seeding database...")

  // Create demo clinic
  const clinic = await prisma.clinic.upsert({
    where: { slug: "demo-dental" },
    update: {},
    create: {
      name: "MIERU デモ歯科クリニック",
      slug: "demo-dental",
      enableReviewRequest: true,
      googleReviewUrl: "https://search.google.com/local/writereview?placeid=DEMO",
      settings: {},
    },
  })
  console.log(`Clinic created: ${clinic.name} (${clinic.id})`)

  // Create staff members
  const staffData = [
    { name: "田中 花子", role: "hygienist" },
    { name: "佐藤 太郎", role: "dentist" },
    { name: "鈴木 美咲", role: "staff" },
  ]

  const staffMembers = []
  for (const s of staffData) {
    const staff = await prisma.staff.upsert({
      where: {
        id: undefined as unknown as string,
        qrToken: `demo-token-${s.name}`,
      },
      update: {},
      create: {
        clinicId: clinic.id,
        name: s.name,
        role: s.role,
        qrToken: `demo-token-${s.name.replace(/\s/g, "-")}`,
      },
    })
    staffMembers.push(staff)
    console.log(`Staff created: ${staff.name} (qrToken: ${staff.qrToken})`)
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
  console.log(`System admin created: ${admin.email}`)

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
  console.log(`Clinic admin created: ${clinicAdmin.email}`)

  // Create default survey template
  const template = await prisma.surveyTemplate.create({
    data: {
      clinicId: clinic.id,
      name: "デフォルトアンケート",
      questions: DEFAULT_QUESTIONS,
      isActive: true,
    },
  })
  console.log(`Survey template created: ${template.name} (${template.id})`)

  // Create sample survey responses
  const now = new Date()
  const sampleResponses = []
  for (let i = 0; i < 30; i++) {
    const staff = staffMembers[i % staffMembers.length]
    const daysAgo = Math.floor(Math.random() * 60)
    const respondedAt = new Date(now.getTime() - daysAgo * 86400000)

    const q1Score = Math.random() > 0.2 ? Math.ceil(Math.random() * 2) + 3 : Math.ceil(Math.random() * 3)
    const q2Score = Math.random() > 0.2 ? Math.ceil(Math.random() * 2) + 3 : Math.ceil(Math.random() * 3)
    const q3Score = Math.random() > 0.2 ? Math.ceil(Math.random() * 2) + 3 : Math.ceil(Math.random() * 3)
    const overallScore = (q1Score + q2Score + q3Score) / 3

    const reviewClicked = Math.random() > 0.8

    sampleResponses.push({
      clinicId: clinic.id,
      staffId: staff.id,
      templateId: template.id,
      answers: { q1: q1Score, q2: q2Score, q3: q3Score },
      overallScore,
      freeText: i % 5 === 0 ? "丁寧に対応していただきありがとうございました。" : null,
      reviewRequested: true,
      reviewClicked,
      ipHash: `sample-hash-${i}`,
      respondedAt,
    })
  }

  await prisma.surveyResponse.createMany({ data: sampleResponses })
  console.log(`Sample survey responses created: ${sampleResponses.length} records`)

  console.log("\nSeed completed!")
  console.log("\n--- Login Credentials ---")
  console.log("System Admin: admin@mieru-clinic.com / admin123")
  console.log("Clinic Admin: clinic@demo.com / clinic123")
  console.log(`\nSurvey URL (demo): /s/demo-token-田中-花子`)
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
