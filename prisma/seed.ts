import { PrismaClient } from "@prisma/client"
import type { Prisma } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

// 2 survey types: first visit (8Q), return visit (6Q)
// 設問方針: 特定の処置を前提にしない汎用的な設問。どんな診療内容でも回答可能。
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

const SURVEY_TEMPLATES = [
  { name: "初診", questions: FIRST_VISIT_QUESTIONS },
  { name: "再診", questions: TREATMENT_QUESTIONS },
]

async function main() {
  console.log("Seeding database...")

  // Create demo clinic with default admin password "1111"
  const defaultAdminPasswordHash = await bcrypt.hash("1111", 10)
  const clinic = await prisma.clinic.upsert({
    where: { slug: "demo-dental" },
    update: {
      settings: { adminPassword: defaultAdminPasswordHash },
      unitCount: 5,
    },
    create: {
      name: "MIERU デモ歯科クリニック",
      slug: "demo-dental",
      settings: { adminPassword: defaultAdminPasswordHash },
      unitCount: 5,
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

  // Create system admin user (delete old admin if exists)
  await prisma.user.deleteMany({
    where: {
      role: "system_admin",
      email: { not: "mail@function-t.com" },
    },
  })
  const adminPassword = await bcrypt.hash("MUNP1687", 10)
  const admin = await prisma.user.upsert({
    where: { email: "mail@function-t.com" },
    update: { password: adminPassword },
    create: {
      email: "mail@function-t.com",
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

  // Create authorized devices for kiosk demo
  const deviceData = [
    { deviceUuid: "d0000000-0000-4000-8000-000000000001", name: "受付iPad 1号" },
    { deviceUuid: "d0000000-0000-4000-8000-000000000002", name: "待合室タブレット" },
  ]
  for (const d of deviceData) {
    await prisma.authorizedDevice.upsert({
      where: { deviceUuid: d.deviceUuid },
      update: { name: d.name, isAuthorized: true },
      create: {
        clinicId: clinic.id,
        deviceUuid: d.deviceUuid,
        name: d.name,
        isAuthorized: true,
      },
    })
    console.log(`AuthorizedDevice: ${d.name} (${d.deviceUuid})`)
  }

  // Create or update 2 survey templates (初診・再診)
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

  // Deactivate old templates that don't match the 2 types
  await prisma.surveyTemplate.updateMany({
    where: {
      clinicId: clinic.id,
      id: { notIn: templates.map((t) => t.id) },
    },
    data: { isActive: false },
  })

  // =========================================================================
  // 1年分のリアルなデモアンケートデータを生成
  // =========================================================================
  // ストーリー:
  //   受付対応と待ち時間に大きな課題があった歯科医院が、
  //   1年間の改善アクションにより患者満足度 3.5 → 4.6 に向上。
  //   鈴木美咲(受付)がiPadで約60%のアンケートを回収。
  //   土曜日や午後の忙しい時間帯に満足度が低下する傾向あり。
  // 営業: 月〜土（日曜休診）、9:00〜19:00

  const QUESTION_IDS: Record<string, string[]> = {
    "初診": ["fv1", "fv2", "fv3", "fv4", "fv5", "fv6", "fv7", "fv8"],
    "再診": ["tr1", "tr2", "tr3", "tr4", "tr5", "tr6"],
  }

  // 設問ごとのベースライン難易度（低い=スコアが低くなりやすい）
  // ★受付対応(fv2)と待ち時間(fv3,tr4)が最大の課題
  const QUESTION_DIFFICULTY: Record<string, number> = {
    fv1: -0.10,  // 第一印象: 受付の雰囲気に引っ張られて低め
    fv2: -0.30,  // 受付対応: ★最大の問題点
    fv3: -0.22,  // 待ち時間: ★大きな問題点
    fv4: -0.05,  // ヒアリング: やや低い
    fv5: -0.10,  // 説明: 低め
    fv6: -0.15,  // 費用説明: 低い
    fv7: -0.18,  // 相談しやすさ: 受付の雰囲気が影響
    fv8: -0.10,  // 紹介意向: 受付印象に引っ張られる
    tr1: -0.08,  // 診療説明: やや低め
    tr2: -0.05,  // 痛み配慮: やや低め
    tr3: -0.12,  // 相談しやすさ: 受付の雰囲気が影響
    tr4: -0.22,  // 待ち時間: ★大きな問題点
    tr5: 0.10,   // スタッフ対応: 高い（衛生士・医師は良好）
    tr6: -0.05,  // 紹介意向: やや厳しめ
  }

  // 改善アクションによるスコア押し上げ効果
  // 月index: 0=12ヶ月前, 11=先月。startMonthから2ヶ月で最大効果
  const ACTION_EFFECTS: Record<string, { startMonth: number; endMonth: number | null; questions: string[]; boost: number }> = {
    "待ち時間の見える化": { startMonth: 0, endMonth: 3, questions: ["fv3", "tr4"], boost: 0.12 },
    "受付マニュアル研修": { startMonth: 1, endMonth: 5, questions: ["fv2", "fv1", "fv7", "tr3"], boost: 0.20 },
    "受付環境改善": { startMonth: 2, endMonth: 5, questions: ["fv1", "fv2"], boost: 0.12 },
    "視覚資料での説明導入": { startMonth: 4, endMonth: 7, questions: ["fv5", "fv6", "tr1"], boost: 0.10 },
    "接遇マナー研修": { startMonth: 5, endMonth: 8, questions: ["tr5", "fv7", "tr3", "fv8", "tr6"], boost: 0.08 },
    "予約枠バッファ導入": { startMonth: 7, endMonth: 10, questions: ["fv3", "tr4"], boost: 0.10 },
    "痛み配慮の声かけ徹底": { startMonth: 9, endMonth: null, questions: ["tr2", "fv4"], boost: 0.08 },
    "フォローアップ体制強化": { startMonth: 10, endMonth: null, questions: ["tr6", "fv8"], boost: 0.06 },
  }

  // スタッフごとの回答回収傾向
  // 鈴木美咲(受付): iPadで最も多く回収（約60%）
  // 田中花子(衛生士): クリーニング後に回収（約30%）
  // 佐藤太郎(歯科医師): 治療後に時々（約10%）
  const STAFF_WEIGHTS = [
    { staff: staffMembers[0], weight: 30, scoreBonus: 0.05 },   // 田中花子: 接遇良好な衛生士
    { staff: staffMembers[1], weight: 10, scoreBonus: 0.03 },   // 佐藤太郎: 信頼される歯科医師
    { staff: staffMembers[2], weight: 60, scoreBonus: 0.00 },   // 鈴木美咲: 受付スタッフ（ニュートラル）
  ]

  // 決定的乱数
  let rngState = 20250220
  const rng = () => {
    rngState = (rngState * 1664525 + 1013904223) & 0x7fffffff
    return rngState / 0x7fffffff
  }

  const weightedChoice = <T>(items: T[], weights: number[]): T => {
    const total = weights.reduce((a, b) => a + b, 0)
    let r = rng() * total
    for (let i = 0; i < items.length; i++) {
      r -= weights[i]
      if (r <= 0) return items[i]
    }
    return items[items.length - 1]
  }

  // スコア生成: quality (0-1) を5段階に変換
  // quality≈0.22 → 平均3.5, quality≈0.90 → 平均4.6
  const generateScore = (baseQuality: number): number => {
    const q = Math.max(0.0, Math.min(1.0, baseQuality))
    const r = rng()
    const p1 = Math.max(0, 0.05 * (1 - q))
    const p2 = Math.max(0, 0.13 - q * 0.13)
    const p3 = Math.max(0.02, 0.33 - q * 0.33)
    const p4 = 0.32 + (0.5 - q) * 0.08
    if (r < p1) return 1
    if (r < p1 + p2) return 2
    if (r < p1 + p2 + p3) return 3
    if (r < p1 + p2 + p3 + p4) return 4
    return 5
  }

  // フリーテキスト（前半=受付・待ち時間の不満中心、後半=改善認知あり）
  const FREE_TEXTS_NEGATIVE_RECEPTION = [
    "受付の方の対応がやや事務的に感じました。",
    "受付が混雑していて声をかけづらかったです。",
    "受付での説明が早口で聞き取りにくかったです。",
    "受付の方がバタバタしていて少し不安になりました。",
  ]
  const FREE_TEXTS_NEGATIVE_WAIT = [
    "待ち時間が長く、目安も分からなくて不安でした。",
    "予約時間を過ぎても呼ばれず心配になりました。",
    "待合室で長時間待ちましたが声かけがなかったです。",
    "待ち時間が少し長かったです。",
  ]
  const FREE_TEXTS_NEGATIVE_OTHER = [
    "治療の説明が専門的で少し難しかったです。",
    "費用についてもう少し事前に説明がほしかったです。",
    "次回の治療内容をもう少し詳しく教えてほしかったです。",
    "もう少しゆっくり説明してほしかったです。",
  ]
  const FREE_TEXTS_POSITIVE = [
    "丁寧に対応していただきありがとうございました。",
    "説明が分かりやすくて安心しました。",
    "スタッフの皆さんが優しくて良かったです。",
    "子どもも怖がらずに治療を受けられました。",
    "クリーニングがとても丁寧でした。",
    "院内がきれいで気持ちよかったです。",
    "予約が取りやすくて助かります。",
    "痛みへの配慮がとても嬉しかったです。",
    "いつもありがとうございます。安心して通えます。",
    "費用の説明が事前にあって安心しました。",
    "先生がとても話しやすくてリラックスできました。",
  ]
  const FREE_TEXTS_POSITIVE_IMPROVED = [
    "以前より受付の対応がとても丁寧になりましたね。",
    "待ち時間の目安を教えてくれて助かりました。",
    "受付がスムーズになって気持ちよく来院できます。",
    "写真を使った説明がとても分かりやすかったです。",
    "予約通りに呼ばれて待ち時間がなく快適でした。",
    "受付の方の笑顔が素敵で安心しました。",
  ]

  // Purpose values matching constants.ts INSURANCE_PURPOSES / SELF_PAY_PURPOSES
  const INSURANCE_PURPOSE_VALUES = [
    "cavity_treatment", "periodontal", "prosthetic_insurance", "denture_insurance",
    "checkup_insurance", "extraction_surgery", "emergency", "other_insurance",
  ]
  const INSURANCE_PURPOSE_WEIGHTS = [20, 18, 12, 5, 25, 8, 5, 7]
  const SELF_PAY_PURPOSE_VALUES = [
    "cavity_treatment_self", "periodontal_self", "prosthetic_self_pay", "denture_self_pay",
    "self_pay_cleaning", "implant", "wire_orthodontics", "aligner", "whitening", "other_self_pay",
  ]
  const SELF_PAY_PURPOSE_WEIGHTS = [8, 8, 15, 5, 20, 15, 8, 10, 8, 3]
  // Seed complaint weights for PX-Value (keyed by purpose value)
  const PURPOSE_SCORE_WEIGHTS: Record<string, number> = {
    emergency: 1.2, checkup_insurance: 0.85, self_pay_cleaning: 0.85,
    implant: 1.1, wire_orthodontics: 1.05,
  }
  const AGE_GROUPS = ["under_20", "20s", "30s", "40s", "50s", "60s_over"]
  const GENDERS = ["male", "female", "unspecified"]

  const templateConfig = templates.map((t) => ({
    template: t,
    questionIds: QUESTION_IDS[t.name] || [],
    weight: t.name === "初診" ? 25 : 75,
  }))

  // 既存のデモ回答を削除して再投入
  const deleted = await prisma.surveyResponse.deleteMany({
    where: { clinicId: clinic.id },
  })
  if (deleted.count > 0) {
    console.log(`既存回答を削除: ${deleted.count}件`)
  }

  const now = new Date()
  const startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1) // 12ヶ月前の1日

  // Device types for seed: 70% patient_url, 20% kiosk_authorized, 10% kiosk_unauthorized
  const DEVICE_TYPES = ["patient_url", "kiosk_authorized", "kiosk_unauthorized"] as const
  const DEVICE_TYPE_WEIGHTS = [70, 20, 10]
  const SEED_DEVICE_WEIGHTS: Record<string, number> = { patient_url: 1.5, kiosk_authorized: 1.0, kiosk_unauthorized: 0.8 }
  // PURPOSE_SCORE_WEIGHTS is defined above alongside purpose arrays

  const allResponses: Array<{
    clinicId: string
    staffId: string
    templateId: string
    answers: Record<string, number>
    overallScore: number
    weightedScore: number
    trustFactor: number
    responseDurationMs: number
    isVerified: boolean
    deviceType: string
    freeText: string | null
    patientAttributes: Record<string, string>
    ipHash: string
    respondedAt: Date
  }> = []

  let totalDays = 0
  const current = new Date(startDate)
  while (current <= now) {
    const dayOfWeek = current.getDay()
    if (dayOfWeek === 0) { // 日曜は休診
      current.setDate(current.getDate() + 1)
      continue
    }
    totalDays++

    // 月index（0=最初の月, 11=12ヶ月目）
    const monthsFromStart = (current.getFullYear() - startDate.getFullYear()) * 12 + (current.getMonth() - startDate.getMonth())
    const dayOfMonth = current.getDate()
    const daysInMonth = new Date(current.getFullYear(), current.getMonth() + 1, 0).getDate()
    const monthProgress = dayOfMonth / daysInMonth

    // === 1日あたりの回答数（曜日・月で変動） ===
    // 初期: 平均4件/日 → 12ヶ月後: 平均8件/日（回収率向上）
    let baseDailyCount: number
    if (dayOfWeek === 6) baseDailyCount = 7 + Math.floor(rng() * 5)       // 土曜: 7-11（最も多い）
    else if (dayOfWeek === 1) baseDailyCount = 2 + Math.floor(rng() * 2)  // 月曜: 2-3（少ない）
    else if (dayOfWeek === 3) baseDailyCount = 4 + Math.floor(rng() * 4)  // 水曜: 4-7（多め）
    else if (dayOfWeek === 5) baseDailyCount = 3 + Math.floor(rng() * 4)  // 金曜: 3-6
    else if (dayOfWeek === 2) baseDailyCount = 2 + Math.floor(rng() * 3)  // 火曜: 2-4
    else baseDailyCount = 3 + Math.floor(rng() * 3)                        // 木曜: 3-5

    // 月が進むと回収率UP
    const dailyCount = Math.max(1, Math.round(baseDailyCount * (1.0 + monthsFromStart * 0.07)))

    // === ベースクオリティ: S字カーブで 0.22→0.90 に推移 ===
    // generateScore: quality≈0.22→平均3.5, quality≈0.90→平均4.6
    const linearProgress = (monthsFromStart + monthProgress) / 12.0
    const sCurve = linearProgress * linearProgress * (3 - 2 * linearProgress)
    const dayBaseQuality = 0.22 + sCurve * 0.68 + (rng() - 0.5) * 0.06

    // === 曜日によるスコア変動 ===
    let dayOfWeekBonus = 0
    if (dayOfWeek === 6) dayOfWeekBonus = -0.12   // 土曜: 大混雑で受付パンク
    if (dayOfWeek === 1) dayOfWeekBonus = -0.04   // 月曜: 週明けバタバタ
    if (dayOfWeek === 2) dayOfWeekBonus = -0.01   // 火曜: やや低め
    if (dayOfWeek === 3) dayOfWeekBonus = 0.06    // 水曜: 余裕あり
    if (dayOfWeek === 5) dayOfWeekBonus = 0.02    // 金曜: やや高い

    for (let i = 0; i < dailyCount; i++) {
      const config = weightedChoice(templateConfig, templateConfig.map((c) => c.weight))
      const staffChoice = weightedChoice(STAFF_WEIGHTS, STAFF_WEIGHTS.map((s) => s.weight))

      // === 時間帯（9:00-19:00営業） ===
      const hour = weightedChoice(
        [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19],
        [5, 12, 18, 3, 7, 16, 14, 10, 8, 5, 2]
      )
      const respondedAt = new Date(Date.UTC(
        current.getFullYear(), current.getMonth(), current.getDate(),
        hour - 9, Math.floor(rng() * 60), Math.floor(rng() * 60)
      ))

      // === 時間帯によるスコア変動 ===
      let timeBonus = 0
      if (hour >= 9 && hour <= 11) timeBonus = 0.06       // 午前: 余裕あり
      if (hour === 12) timeBonus = -0.05                    // 昼: バタバタ
      if (hour >= 14 && hour <= 15) timeBonus = 0.02       // 午後前半: やや高い
      if (hour === 16) timeBonus = -0.02                    // 夕方入り
      if (hour >= 17 && hour <= 18) timeBonus = -0.08      // 夕方: 受付疲弊
      if (hour >= 19) timeBonus = -0.12                     // 閉院間際
      if (dayOfWeek === 6 && hour >= 14) timeBonus -= 0.05 // 土曜午後: さらに低下

      const baseForThisResponse = dayBaseQuality + dayOfWeekBonus + timeBonus + staffChoice.scoreBonus

      // === 設問ごとのスコア生成 ===
      const answers: Record<string, number> = {}
      for (const qId of config.questionIds) {
        let qBase = baseForThisResponse + (QUESTION_DIFFICULTY[qId] || 0)

        // 改善アクション効果を加算
        for (const [, effect] of Object.entries(ACTION_EFFECTS)) {
          if (!effect.questions.includes(qId)) continue
          if (monthsFromStart < effect.startMonth) continue
          const monthsSinceAction = monthsFromStart - effect.startMonth + monthProgress
          const effectStrength = Math.min(1.0, monthsSinceAction / 2.0) // 2ヶ月で最大効果
          qBase += effect.boost * effectStrength
        }

        answers[qId] = generateScore(qBase)
      }
      const scoreValues = Object.values(answers)
      const overallScore = Math.round((scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length) * 100) / 100

      // フリーテキスト: 前半はネガティブ（受付・待ち時間中心）、後半はポジティブ（改善認知）
      let freeText: string | null = null
      if (rng() < 0.20) {
        const monthRatio = monthsFromStart / 11
        if (overallScore <= 3.0) {
          // 低スコア → ネガティブ
          const negType = rng()
          if (negType < 0.35) {
            freeText = FREE_TEXTS_NEGATIVE_RECEPTION[Math.floor(rng() * FREE_TEXTS_NEGATIVE_RECEPTION.length)]
          } else if (negType < 0.65) {
            freeText = FREE_TEXTS_NEGATIVE_WAIT[Math.floor(rng() * FREE_TEXTS_NEGATIVE_WAIT.length)]
          } else {
            freeText = FREE_TEXTS_NEGATIVE_OTHER[Math.floor(rng() * FREE_TEXTS_NEGATIVE_OTHER.length)]
          }
        } else if (monthRatio > 0.5 && rng() < 0.3) {
          // 後半で改善を実感するコメント
          freeText = FREE_TEXTS_POSITIVE_IMPROVED[Math.floor(rng() * FREE_TEXTS_POSITIVE_IMPROVED.length)]
        } else {
          freeText = FREE_TEXTS_POSITIVE[Math.floor(rng() * FREE_TEXTS_POSITIVE.length)]
        }
      }

      const isFirstVisit = config.template.name === "初診"
      const isSelfPay = rng() < (0.14 + monthsFromStart * 0.005)
      const purpose = isSelfPay
        ? weightedChoice([...SELF_PAY_PURPOSE_VALUES], SELF_PAY_PURPOSE_WEIGHTS)
        : weightedChoice([...INSURANCE_PURPOSE_VALUES], INSURANCE_PURPOSE_WEIGHTS)

      // PX-Value fields
      const deviceType = weightedChoice([...DEVICE_TYPES], DEVICE_TYPE_WEIGHTS)
      const deviceWeight = SEED_DEVICE_WEIGHTS[deviceType] ?? 1.0
      const purposeWeight = PURPOSE_SCORE_WEIGHTS[purpose] ?? 1.0
      const weightedScore = Math.round(overallScore * deviceWeight * purposeWeight * 100) / 100

      // Response duration: normal 25-120s, ~5% speed trap failures
      const isSpeedTrapFail = rng() < 0.05
      const questionCount = config.questionIds.length
      const responseDurationMs = isSpeedTrapFail
        ? Math.floor(rng() * questionCount * 1500)
        : Math.floor((25000 + rng() * 95000))

      let trustFactor = 1.0
      if (isSpeedTrapFail) trustFactor -= 0.3
      if (rng() < 0.03) trustFactor -= 0.25
      if (rng() < 0.02) trustFactor -= 0.20
      trustFactor = Math.round(Math.max(0, trustFactor) * 100) / 100
      const isVerified = trustFactor >= 0.7

      allResponses.push({
        clinicId: clinic.id,
        staffId: staffChoice.staff.id,
        templateId: config.template.id,
        answers,
        overallScore,
        weightedScore,
        trustFactor,
        responseDurationMs,
        isVerified,
        deviceType,
        freeText,
        patientAttributes: {
          visitType: isFirstVisit ? "first_visit" : "revisit",
          insuranceType: isSelfPay ? "self_pay" : "insurance",
          purpose,
          ageGroup: weightedChoice(AGE_GROUPS, [8, 12, 18, 22, 25, 15]),
          gender: weightedChoice(GENDERS, [45, 50, 5]),
        },
        ipHash: `demo-${respondedAt.getTime()}-${i}`,
        respondedAt,
      })
    }
    current.setDate(current.getDate() + 1)
  }

  // バッチ挿入（500件ずつ）
  const BATCH_SIZE = 500
  for (let i = 0; i < allResponses.length; i += BATCH_SIZE) {
    await prisma.surveyResponse.createMany({ data: allResponses.slice(i, i + BATCH_SIZE) })
  }

  // スタッフごとの回答数を集計してログ出力
  const staffCounts: Record<string, number> = {}
  for (const r of allResponses) {
    const staffName = staffMembers.find((s) => s.id === r.staffId)?.name || "unknown"
    staffCounts[staffName] = (staffCounts[staffName] || 0) + 1
  }
  console.log(`\nデモ回答作成: ${allResponses.length}件（${totalDays}営業日分）`)
  for (const [name, count] of Object.entries(staffCounts)) {
    const pct = Math.round(count / allResponses.length * 100)
    console.log(`  ${name}: ${count}件（${pct}%）`)
  }

  // 月ごとの平均スコアをログ出力
  console.log(`\n月別平均スコア推移:`)
  for (let m = 0; m <= 12; m++) {
    const d = new Date(startDate.getFullYear(), startDate.getMonth() + m, 1)
    const year = d.getFullYear()
    const month = d.getMonth() + 1
    const monthResponses = allResponses.filter(
      (r) => r.respondedAt.getFullYear() === year && r.respondedAt.getMonth() + 1 === month
    )
    if (monthResponses.length > 0) {
      const avg = monthResponses.reduce((a, b) => a + b.overallScore, 0) / monthResponses.length
      console.log(`  ${year}-${String(month).padStart(2, "0")}: 平均 ${avg.toFixed(2)}（${monthResponses.length}件）`)
    }
  }

  // PX-Value stats
  const verifiedCount = allResponses.filter((r) => r.isVerified).length
  const unverifiedCount = allResponses.length - verifiedCount
  const avgTrust = Math.round((allResponses.reduce((a, b) => a + b.trustFactor, 0) / allResponses.length) * 100) / 100
  const deviceCounts: Record<string, number> = {}
  for (const r of allResponses) {
    deviceCounts[r.deviceType] = (deviceCounts[r.deviceType] || 0) + 1
  }
  console.log(`\nPX-Value stats:`)
  console.log(`  Verified: ${verifiedCount} / Unverified: ${unverifiedCount} (${Math.round((verifiedCount / allResponses.length) * 100)}%)`)
  console.log(`  Average trust factor: ${avgTrust}`)
  for (const [dt, cnt] of Object.entries(deviceCounts)) {
    console.log(`  ${dt}: ${cnt}件`)
  }

  // =========================================================================
  // 改善アクション履歴（8件: 6完了 + 2実施中）
  // =========================================================================
  const getScoreAtMonth = (monthIdx: number, questions: string[]): number => {
    const d = new Date(startDate.getFullYear(), startDate.getMonth() + monthIdx, 1)
    const year = d.getFullYear()
    const month = d.getMonth() + 1
    const monthResponses = allResponses.filter(
      (r) => r.respondedAt.getFullYear() === year && r.respondedAt.getMonth() + 1 === month
    )
    if (monthResponses.length === 0) return 3.5
    let total = 0, count = 0
    for (const r of monthResponses) {
      for (const qId of questions) {
        const score = (r.answers as Record<string, number>)[qId]
        if (score !== undefined) { total += score; count++ }
      }
    }
    return count > 0 ? Math.round((total / count) * 100) / 100 : 3.5
  }

  // 既存の改善アクションとログを削除
  await prisma.improvementActionLog.deleteMany({
    where: { improvementAction: { clinicId: clinic.id } },
  })
  await prisma.improvementAction.deleteMany({ where: { clinicId: clinic.id } })

  const improvementActions = [
    {
      title: "待ち時間の見える化と声がけ",
      description: "待ち時間が発生した際に「あと○分」と具体的な目安を伝える運用を開始。受付にタイマー表示を設置し、15分以上の待ちが発生した場合は必ず一声かける体制に。",
      targetQuestion: "fv3",
      status: "completed",
      startMonthIdx: 0,
      endMonthIdx: 3,
      questions: ["fv3", "tr4"],
    },
    {
      title: "受付マニュアルの作成と研修",
      description: "受付時の笑顔・挨拶・名前呼びを統一するマニュアルを作成。全スタッフで月2回のロールプレイング研修を実施。アンケートで最も課題だった受付対応の改善に重点的に取り組んだ。",
      targetQuestion: "fv2",
      status: "completed",
      startMonthIdx: 1,
      endMonthIdx: 5,
      questions: ["fv2", "fv1", "fv7", "tr3"],
    },
    {
      title: "受付環境の改善（動線・表示見直し）",
      description: "受付カウンターの配置を見直し、患者動線を改善。案内表示を大きく分かりやすくし、初めての患者が迷わない環境を整備。受付の混雑感を軽減。",
      targetQuestion: "fv1",
      status: "completed",
      startMonthIdx: 2,
      endMonthIdx: 5,
      questions: ["fv1", "fv2"],
    },
    {
      title: "視覚資料を活用した治療説明",
      description: "口腔内カメラの写真やイラスト付き資料を使って、治療内容・費用を視覚的に説明する運用を導入。患者の理解度と納得感の向上を目指す。",
      targetQuestion: "fv5",
      status: "completed",
      startMonthIdx: 4,
      endMonthIdx: 7,
      questions: ["fv5", "fv6", "tr1"],
    },
    {
      title: "接遇マナー研修の定期実施",
      description: "月1回の接遇研修を開始。スタッフの声かけ・表情・患者対応のロールプレイングを実施。外部講師による特別研修も四半期ごとに実施。",
      targetQuestion: "tr5",
      status: "completed",
      startMonthIdx: 5,
      endMonthIdx: 8,
      questions: ["tr5", "fv7", "tr3", "fv8", "tr6"],
    },
    {
      title: "予約枠にバッファを確保",
      description: "急患対応用に1日3枠のバッファを設定。特に土曜日は2枠追加で確保し、予約患者の待ち時間短縮と混雑緩和を実現。",
      targetQuestion: "fv3",
      status: "completed",
      startMonthIdx: 7,
      endMonthIdx: 10,
      questions: ["fv3", "tr4"],
    },
    {
      title: "痛みへの配慮を言語化して伝える",
      description: "治療前に「少しチクッとします」等の予告を徹底。手を挙げたら止めるルールを全チェアに掲示し、患者の安心感を向上中。",
      targetQuestion: "tr2",
      status: "active",
      startMonthIdx: 9,
      endMonthIdx: null,
      questions: ["tr2", "fv4"],
    },
    {
      title: "フォローアップ体制の強化",
      description: "抜歯等の処置後に翌日の電話フォローを開始。次回予約時に治療内容の説明を添えて、キャンセル率の低下と紹介意向の向上を目指す。",
      targetQuestion: "tr6",
      status: "active",
      startMonthIdx: 10,
      endMonthIdx: null,
      questions: ["tr6", "fv8"],
    },
  ]

  const questionTextMap = new Map<string, string>()
  for (const q of [...FIRST_VISIT_QUESTIONS, ...TREATMENT_QUESTIONS]) {
    questionTextMap.set(q.id, q.text)
  }

  console.log(`\n改善アクション:`)
  for (const action of improvementActions) {
    const startedAt = new Date(startDate.getFullYear(), startDate.getMonth() + action.startMonthIdx, 10 + Math.floor(rng() * 10))
    const completedAt = action.endMonthIdx !== null
      ? new Date(startDate.getFullYear(), startDate.getMonth() + action.endMonthIdx, 15 + Math.floor(rng() * 10))
      : null

    const baselineScore = getScoreAtMonth(action.startMonthIdx, action.questions)
    const resultScore = action.status === "completed" && action.endMonthIdx !== null
      ? getScoreAtMonth(action.endMonthIdx, action.questions)
      : null

    await prisma.improvementAction.create({
      data: {
        clinicId: clinic.id,
        title: action.title,
        description: action.description,
        targetQuestion: questionTextMap.get(action.targetQuestion) ?? action.targetQuestion,
        targetQuestionId: action.targetQuestion,
        baselineScore,
        resultScore,
        status: action.status,
        startedAt,
        completedAt,
      },
    })
    console.log(`  ${action.title}（${action.status}）${baselineScore.toFixed(2)} → ${resultScore !== null ? resultScore.toFixed(2) : "実施中"}`)
  }

  // =========================================================================
  // 月次経営レポート（12ヶ月分。当月は未入力=InsightBanner表示用）
  // =========================================================================
  // 1年前: 実人数約300人(初診30,再診270), 売上330万, 自費率30%, キャンセル率10%
  // 現在:  売上約425万, 全体的に改善
  // 季節変動: 8月(お盆)・12月(年末)=低め、3-4月・10月=高め

  await prisma.monthlyClinicMetrics.deleteMany({ where: { clinicId: clinic.id } })

  const SEASONAL_FACTORS: Record<number, number> = {
    1: 0.95, 2: 0.98, 3: 1.03, 4: 1.03, 5: 1.01, 6: 1.00,
    7: 1.00, 8: 0.90, 9: 1.02, 10: 1.04, 11: 1.01, 12: 0.93,
  }

  console.log(`\n月次経営レポート:`)
  for (let m = 1; m <= 12; m++) {
    const d = new Date(now.getFullYear(), now.getMonth() - m, 1)
    const year = d.getFullYear()
    const month = d.getMonth() + 1
    const seasonal = SEASONAL_FACTORS[month] ?? 1.0

    // progress: 0（12ヶ月前）→ 1（先月）
    const progress = (12 - m) / 11

    // 患者数: 300→355、季節変動あり
    const basePatients = 295 + Math.round(60 * progress)
    const totalPatients = Math.round(basePatients * seasonal + (rng() - 0.5) * 15)

    // 初診比率: 10%→12%（口コミ効果で増加）
    const firstVisitRatio = 0.10 + 0.02 * progress
    const firstVisitCount = Math.max(1, Math.round(totalPatients * firstVisitRatio + (rng() - 0.5) * 4))
    const revisitCount = totalPatients - firstVisitCount

    // 自費率（金額）: 30%→35%
    const selfPayRatio = 0.29 + 0.06 * progress + (rng() - 0.5) * 0.02

    // 売上: 325→425万、季節変動あり
    const baseRevenue = 325 + Math.round(100 * progress)
    const totalRevenue = Math.max(80, Math.round(baseRevenue * seasonal + (rng() - 0.5) * 13))
    const selfPayRevenue = Math.round(totalRevenue * selfPayRatio)
    const insuranceRevenue = totalRevenue - selfPayRevenue

    // キャンセル率: 10%→5%
    const cancelRate = 0.105 - 0.055 * progress + (rng() - 0.5) * 0.01
    const cancellationCount = Math.max(0, Math.round(totalPatients * cancelRate))

    await prisma.monthlyClinicMetrics.upsert({
      where: { clinicId_year_month: { clinicId: clinic.id, year, month } },
      update: { firstVisitCount, revisitCount, totalRevenue, insuranceRevenue, selfPayRevenue, cancellationCount },
      create: { clinicId: clinic.id, year, month, firstVisitCount, revisitCount, totalRevenue, insuranceRevenue, selfPayRevenue, cancellationCount },
    })
    console.log(`  ${year}-${String(month).padStart(2, "0")}: 実人数${totalPatients}人（初診${firstVisitCount}/再診${revisitCount}）売上${totalRevenue}万円 自費率${Math.round(selfPayRatio * 100)}% キャンセル${cancellationCount}件(${Math.round(cancelRate * 100)}%)`)
  }

  // Seed default patient tips to PlatformSetting
  const defaultTips = [
    { category: "接遇", title: "名前で呼びかける", content: "「次の方どうぞ」ではなく「○○さん、お待たせしました」と名前で呼ぶだけで、患者の安心感と信頼感が大きく向上します。" },
    { category: "コミュニケーション", title: "治療前の「今日やること」宣言", content: "チェアに座った直後、「今日は○○をしますね、約○分です」と伝えるだけで、患者の不安が軽減し満足度が上がります。" },
    { category: "不安軽減", title: "痛みの事前告知", content: "「少しチクッとしますよ」と事前に伝えるだけで、同じ痛みでも患者が感じるストレスは大幅に下がります。予告なしの痛みが最も不満につながります。" },
    { category: "院内環境", title: "待合室の温度チェック", content: "季節の変わり目は特に、待合室の温度を朝・昼に確認しましょう。寒すぎ・暑すぎは滞在中ずっと続く不快感となり、全体の印象を下げます。" },
    { category: "待ち時間", title: "遅延時は「あと何分」を伝える", content: "待ち時間が発生した際、「あと10分ほどお待ちください」と具体的な目安を伝えるだけで、患者のストレスは大幅に緩和されます。" },
    { category: "チーム連携", title: "申し送りの徹底", content: "「前回の治療内容を別のスタッフにまた説明させられた」は不満の定番です。カルテのメモ欄を活用し、誰が対応しても把握できる状態を作りましょう。" },
    { category: "初診対応", title: "初診時の院内ツアー", content: "初めて来院した患者に、お手洗いの場所やアンケートの流れを30秒で案内するだけで「丁寧な医院」という第一印象を作れます。" },
    { category: "治療説明", title: "鏡やカメラで「見せる」説明", content: "口腔内写真や手鏡で患部を見せながら説明すると、患者の理解度と納得感が格段に上がります。「見える化」は信頼構築の最短ルートです。" },
    { category: "接遇", title: "お見送りの一言", content: "治療後、受付で「お大事になさってください」に加えて「次回は○日ですね」と確認の声かけをすると、患者は大切にされていると感じます。" },
    { category: "不安軽減", title: "手を挙げたら止める約束", content: "治療前に「辛い時は左手を挙げてくださいね、すぐ止めます」と伝えましょう。実際に手を挙げなくても、コントロール感があるだけで不安は和らぎます。" },
    { category: "コミュニケーション", title: "専門用語を言い換える", content: "「抜髄」→「神経の治療」、「印象」→「型取り」など、患者が理解できる言葉に置き換えるだけで、説明の満足度は大きく変わります。" },
    { category: "院内環境", title: "BGMの音量を意識する", content: "待合室のBGMは「会話の邪魔にならない程度」が適切です。無音は緊張感を高め、大きすぎる音は不快感につながります。定期的に待合室で確認しましょう。" },
    { category: "フォローアップ", title: "抜歯後の翌日電話", content: "抜歯や外科処置の翌日に「その後いかがですか？」と一本電話を入れるだけで、患者の信頼度は飛躍的に高まります。数分の手間が口コミにもつながります。" },
    { category: "予防指導", title: "「褒める」ブラッシング指導", content: "磨き残しの指摘だけでなく、「ここはよく磨けていますね」と褒めるポイントを先に伝えましょう。患者のモチベーションが上がり、継続来院につながります。" },
    { category: "待ち時間", title: "待ち時間の有効活用", content: "待合室にデジタルサイネージや掲示物で季節の口腔ケア情報を掲示すると、待ち時間が「学びの時間」に変わり、体感待ち時間が短くなります。" },
    { category: "治療説明", title: "選択肢を提示する", content: "「この治療法しかありません」ではなく、複数の選択肢とそれぞれのメリット・デメリットを説明しましょう。患者が自分で選べることが満足度を高めます。" },
    { category: "接遇", title: "目線を合わせて話す", content: "チェアに座った患者に立ったまま話すと威圧感を与えます。しゃがむか座って目線を合わせるだけで、患者は「対等に扱われている」と感じます。" },
    { category: "小児対応", title: "子どもには器具を見せてから", content: "小児患者には「Tell-Show-Do」法が有効です。まず説明し、器具を見せ、触らせてから使う。この手順で恐怖心が大幅に軽減され、保護者の満足度も上がります。" },
    { category: "チーム連携", title: "患者の前でスタッフを褒める", content: "「○○さん（衛生士）はクリーニングがとても丁寧ですよ」と患者の前でスタッフを紹介すると、チームの信頼感が患者に伝わり安心感を生みます。" },
    { category: "高齢者対応", title: "ゆっくり・はっきり・繰り返す", content: "高齢の患者への説明は、ゆっくり話す・口を大きく開けて話す・要点を繰り返す、の3点を意識しましょう。「聞こえなかった」が不満の大きな原因です。" },
    { category: "コミュニケーション", title: "治療中の声かけ", content: "治療中の沈黙は患者の不安を増幅させます。「順調ですよ」「あと少しです」など、30秒に1回程度の短い声かけが安心感を生みます。" },
    { category: "フォローアップ", title: "次回予約の理由を説明する", content: "「次は2週間後に来てください」だけでなく「今日詰めた仮の蓋を外して本番の詰め物を入れます」と理由を伝えると、キャンセル率が下がります。" },
    { category: "院内環境", title: "スリッパの清潔感", content: "スリッパの汚れや劣化は患者が最初に気づく衛生面のサインです。定期的な交換・消毒を徹底し、清潔感を保ちましょう。第一印象は足元から始まります。" },
    { category: "不安軽減", title: "治療後の「まとめ」を伝える", content: "治療後に「今日は○○をしました。次回は○○です。痛みが出たら○○してください」と3点で伝えると、患者の不安が解消され安心して帰宅できます。" },
    { category: "予防指導", title: "生活習慣に寄り添うアドバイス", content: "「甘いものを食べないで」より「食べた後に水を飲むだけでも違います」のように、実行可能なアドバイスの方が患者に響き、信頼関係が深まります。" },
    { category: "接遇", title: "受付の第一声を統一する", content: "来院時の第一声が「こんにちは、○○歯科です」と統一されているだけで、医院全体の印象が格段に良くなります。朝礼で確認する習慣をつけましょう。" },
    { category: "治療説明", title: "費用の説明はオープンに", content: "自費治療の費用は患者から聞かれる前に提示しましょう。「後から高額請求された」という不信感は、事前説明で完全に防げます。" },
    { category: "チーム連携", title: "担当衛生士制のメリット", content: "毎回同じ衛生士が担当すると、患者は「自分のことを覚えてくれている」と感じます。可能な範囲で担当制を導入すると、継続来院率が向上します。" },
    { category: "コミュニケーション", title: "前回の会話を覚えておく", content: "「お孫さんの運動会はいかがでしたか？」のように前回の雑談を覚えていると、患者は特別感を感じます。カルテにメモするだけで実践できます。" },
    { category: "待ち時間", title: "予約枠にバッファを持たせる", content: "急患対応用に1日2〜3枠のバッファを確保すると、予約患者の待ち時間が減ります。待ち時間の長さは満足度を下げる最大の要因の一つです。" },
  ]

  const existingTipSetting = await prisma.platformSetting.findUnique({
    where: { key: "patientTips" },
  })
  if (!existingTipSetting) {
    const tipSettingValue = { tips: defaultTips, rotationMinutes: 1440 }
    await prisma.platformSetting.create({
      data: {
        key: "patientTips",
        value: tipSettingValue as unknown as Prisma.InputJsonValue,
      },
    })
    console.log(`\nPlatform tips seeded: ${defaultTips.length} tips (rotation: 1440 min)`)
  } else {
    console.log("\nPlatform tips already exist, skipping (preserving custom settings)")
  }

  console.log("\nSeed completed!")
  console.log("\n--- Login Credentials ---")
  console.log("System Admin: mail@function-t.com / MUNP1687")
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
