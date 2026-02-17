/**
 * 6ヶ月分のリアルなデモアンケートデータを生成するスクリプト
 *
 * 使い方: npx tsx prisma/seed-demo-data.ts
 *
 * - 日曜日は休診（データなし）
 * - 診療時間: 9:00〜18:00
 * - テンプレート比率: 初診20%, 治療中40%, 定期検診40%
 * - 1日あたり 8〜15件
 * - スコアは現実的な分布（平均4.0前後、時間帯・曜日で変動）
 */
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// --- 設問ID定義 ---
const FIRST_VISIT_IDS = ["fv1", "fv2", "fv3", "fv4", "fv5", "fv6", "fv7", "fv8"]
const TREATMENT_IDS = ["tr1", "tr2", "tr3", "tr4", "tr5", "tr6"]
const CHECKUP_IDS = ["ck1", "ck2", "ck3", "ck4", "ck5", "ck6"]

// --- ユーティリティ ---
function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) & 0x7fffffff
    return s / 0x7fffffff
  }
}

function weightedChoice<T>(rng: () => number, items: T[], weights: number[]): T {
  const total = weights.reduce((a, b) => a + b, 0)
  let r = rng() * total
  for (let i = 0; i < items.length; i++) {
    r -= weights[i]
    if (r <= 0) return items[i]
  }
  return items[items.length - 1]
}

// スコア生成: 基本は4-5が多く、低スコアも少しある
// baseQuality (0-1) が高いほどスコアが高い傾向
function generateScore(rng: () => number, baseQuality: number): number {
  const r = rng()
  // baseQuality 0.7 の場合: 5=35%, 4=40%, 3=18%, 2=5%, 1=2%
  const shift = (baseQuality - 0.5) * 0.3
  if (r < 0.02 - shift) return 1
  if (r < 0.07 - shift) return 2
  if (r < 0.25 - shift * 2) return 3
  if (r < 0.65 - shift) return 4
  return 5
}

// フリーテキストのサンプル
const FREE_TEXTS = [
  "丁寧に対応していただきありがとうございました。",
  "説明が分かりやすくて安心しました。",
  "待ち時間が少し長かったです。",
  "スタッフの皆さんが優しくて良かったです。",
  "子どもも怖がらずに治療を受けられました。",
  "クリーニングがとても丁寧でした。",
  "院内がきれいで気持ちよかったです。",
  "次回の治療内容をもう少し詳しく教えてほしかったです。",
  "予約が取りやすくて助かります。",
  "痛みへの配慮がとても嬉しかったです。",
  "治療の説明が専門的で少し難しかったです。",
  "いつもありがとうございます。安心して通えます。",
  "受付の対応がとても丁寧で好印象です。",
  "費用の説明が事前にあって安心しました。",
  null, // フリーテキストなし
]

const COMPLAINTS = ["pain", "filling_crown", "periodontal", "cosmetic", "prevention", "orthodontics", "other"]
const AGE_GROUPS = ["under_20", "20s", "30s", "40s", "50s", "60s_over"]
const GENDERS = ["male", "female", "unspecified"]

async function main() {
  console.log("=== デモデータ生成開始 ===")

  // デモクリニックとテンプレート・スタッフを取得
  const clinic = await prisma.clinic.findUnique({ where: { slug: "demo-dental" } })
  if (!clinic) {
    console.error("デモクリニックが見つかりません。先に npx prisma db seed を実行してください。")
    process.exit(1)
  }

  const templates = await prisma.surveyTemplate.findMany({
    where: { clinicId: clinic.id, isActive: true },
    orderBy: { name: "asc" },
  })
  if (templates.length < 3) {
    console.error("テンプレートが3つ未満です。先に npx prisma db seed を実行してください。")
    process.exit(1)
  }

  const staffMembers = await prisma.staff.findMany({
    where: { clinicId: clinic.id, isActive: true },
  })
  if (staffMembers.length === 0) {
    console.error("スタッフがいません。先に npx prisma db seed を実行してください。")
    process.exit(1)
  }

  // テンプレートを名前で特定
  const firstVisitTmpl = templates.find((t) => t.name === "初診")!
  const treatmentTmpl = templates.find((t) => t.name === "治療中")!
  const checkupTmpl = templates.find((t) => t.name === "定期検診")!

  const templateConfig = [
    { template: firstVisitTmpl, questionIds: FIRST_VISIT_IDS, weight: 20 },
    { template: treatmentTmpl, questionIds: TREATMENT_IDS, weight: 40 },
    { template: checkupTmpl, questionIds: CHECKUP_IDS, weight: 40 },
  ]

  // 既存のデモ回答を削除
  const deleted = await prisma.surveyResponse.deleteMany({
    where: { clinicId: clinic.id },
  })
  console.log(`既存回答を削除: ${deleted.count}件`)

  // 6ヶ月前の1日から今日まで
  const now = new Date()
  const startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1)
  const rng = seededRandom(20260217)

  const allResponses: Array<{
    clinicId: string
    staffId: string
    templateId: string
    answers: Record<string, number>
    overallScore: number
    freeText: string | null
    patientAttributes: Record<string, string>
    ipHash: string
    respondedAt: Date
  }> = []

  let totalDays = 0
  const current = new Date(startDate)

  while (current <= now) {
    const dayOfWeek = current.getDay() // 0=Sun

    // 日曜日は休診
    if (dayOfWeek === 0) {
      current.setDate(current.getDate() + 1)
      continue
    }

    totalDays++

    // 1日あたりの回答数: 曜日で変動（土曜は多め、月曜は少なめ）
    let baseDailyCount: number
    if (dayOfWeek === 6) {
      baseDailyCount = 12 + Math.floor(rng() * 6) // 土曜: 12-17
    } else if (dayOfWeek === 1) {
      baseDailyCount = 6 + Math.floor(rng() * 5) // 月曜: 6-10
    } else {
      baseDailyCount = 8 + Math.floor(rng() * 7) // 火-金: 8-14
    }

    // 月ごとのトレンド: 直近に向かって微増（導入が定着）
    const monthsFromStart = (current.getFullYear() - startDate.getFullYear()) * 12 + (current.getMonth() - startDate.getMonth())
    const trendMultiplier = 1.0 + monthsFromStart * 0.05
    const dailyCount = Math.round(baseDailyCount * trendMultiplier)

    // 日ごとのベース品質（0.5〜0.8）: 徐々に改善
    const dayBaseQuality = 0.55 + monthsFromStart * 0.03 + (rng() - 0.5) * 0.1

    for (let i = 0; i < dailyCount; i++) {
      // テンプレート選択（初診20%, 治療中40%, 定期検診40%）
      const config = weightedChoice(
        rng,
        templateConfig,
        templateConfig.map((c) => c.weight)
      )

      // スタッフ選択（ランダム）
      const staff = staffMembers[Math.floor(rng() * staffMembers.length)]

      // 時間帯: 9〜18時（午前に集中、昼休みに谷、午後にも山）
      const hour = weightedChoice(
        rng,
        [9, 10, 11, 12, 13, 14, 15, 16, 17, 18],
        [8, 15, 18, 5, 10, 16, 14, 12, 8, 4] // 11時ピーク、12時谷、14時ピーク
      )
      const minute = Math.floor(rng() * 60)

      const respondedAt = new Date(
        current.getFullYear(),
        current.getMonth(),
        current.getDate(),
        hour,
        minute,
        Math.floor(rng() * 60)
      )

      // 時間帯による品質変動（午前が高め、夕方は疲労で少し低下）
      let timeQuality = dayBaseQuality
      if (hour <= 11) timeQuality += 0.05
      if (hour >= 17) timeQuality -= 0.05
      // 土曜午後は混雑で待ち時間が長い傾向
      if (dayOfWeek === 6 && hour >= 14) timeQuality -= 0.03

      // 各質問のスコアを生成
      const answers: Record<string, number> = {}
      for (const qId of config.questionIds) {
        // 待ち時間の質問は他よりやや低め
        const isWaitQuestion = qId === "fv3" || qId === "tr4" || qId === "ck4"
        const qQuality = isWaitQuestion ? timeQuality - 0.1 : timeQuality
        answers[qId] = generateScore(rng, Math.max(0.1, Math.min(0.95, qQuality)))
      }

      const scoreValues = Object.values(answers)
      const overallScore = Math.round((scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length) * 100) / 100

      // フリーテキスト（約25%の確率）
      let freeText: string | null = null
      if (rng() < 0.25) {
        freeText = FREE_TEXTS[Math.floor(rng() * FREE_TEXTS.length)]
      }

      // 患者属性
      const isFirstVisit = config.template.id === firstVisitTmpl.id
      const isCheckup = config.template.id === checkupTmpl.id
      const patientAttributes = {
        visitType: isFirstVisit ? "first_visit" : "revisit",
        treatmentType: isCheckup ? "checkup" : "treatment",
        chiefComplaint: COMPLAINTS[Math.floor(rng() * COMPLAINTS.length)],
        ageGroup: weightedChoice(rng, AGE_GROUPS, [8, 12, 18, 22, 25, 15]),
        gender: weightedChoice(rng, GENDERS, [45, 50, 5]),
      }

      allResponses.push({
        clinicId: clinic.id,
        staffId: staff.id,
        templateId: config.template.id,
        answers,
        overallScore,
        freeText,
        patientAttributes,
        ipHash: `demo-${respondedAt.getTime()}-${i}`,
        respondedAt,
      })
    }

    current.setDate(current.getDate() + 1)
  }

  // バッチ挿入（500件ずつ）
  const BATCH_SIZE = 500
  for (let i = 0; i < allResponses.length; i += BATCH_SIZE) {
    const batch = allResponses.slice(i, i + BATCH_SIZE)
    await prisma.surveyResponse.createMany({ data: batch })
    console.log(`  挿入: ${Math.min(i + BATCH_SIZE, allResponses.length)} / ${allResponses.length}`)
  }

  // 月次レポートも生成（過去6ヶ月分）
  for (let m = 0; m < 6; m++) {
    const d = new Date(now.getFullYear(), now.getMonth() - m, 1)
    const year = d.getFullYear()
    const month = d.getMonth() + 1

    // 月ごとの来院数（回答数 × 2.5〜3倍 = 回答率30-40%想定）
    const monthResponses = allResponses.filter(
      (r) => r.respondedAt.getFullYear() === year && r.respondedAt.getMonth() + 1 === month
    ).length
    const totalVisits = Math.round(monthResponses * (2.5 + rng() * 0.8))
    const totalRevenue = Math.round((350 + rng() * 150) * totalVisits / 10000) // 万円単位
    const selfPayRevenue = Math.round(totalRevenue * (0.15 + rng() * 0.15))
    const googleReviewCount = 40 + m * 2 + Math.floor(rng() * 5)
    const googleReviewRating = Math.round((3.8 + rng() * 0.8) * 10) / 10

    // 当月はスキップ（未入力状態にする → InsightBannerが出る）
    if (m === 0) continue

    await prisma.monthlyClinicMetrics.upsert({
      where: { clinicId_year_month: { clinicId: clinic.id, year, month } },
      update: { totalVisits, totalRevenue, selfPayRevenue, googleReviewCount, googleReviewRating },
      create: { clinicId: clinic.id, year, month, totalVisits, totalRevenue, selfPayRevenue, googleReviewCount, googleReviewRating },
    })
    console.log(`  月次レポート: ${year}-${String(month).padStart(2, "0")} (来院${totalVisits}人, 売上${totalRevenue}万円)`)
  }

  console.log(`\n=== 完了 ===`)
  console.log(`営業日数: ${totalDays}日`)
  console.log(`アンケート回答数: ${allResponses.length}件`)
  console.log(`月次レポート: 5ヶ月分（当月は未入力）`)
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
