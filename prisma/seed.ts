import { PrismaClient } from "@prisma/client"
import type { Prisma } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

// 3 survey types: first visit (8Q), treatment (6Q), checkup (6Q)
// 設問方針: 特定の処置を前提にしない汎用的な設問。どんな診療内容でも回答可能。
const FIRST_VISIT_QUESTIONS = [
  { id: "fv1", text: "医院の第一印象（清潔さ・雰囲気）はいかがでしたか？", type: "rating", required: true },
  { id: "fv2", text: "受付の対応は丁寧でしたか？", type: "rating", required: true },
  { id: "fv3", text: "待ち時間は気にならない程度でしたか？", type: "rating", required: true },
  { id: "fv4", text: "お悩みや症状についてのヒアリングは十分でしたか？", type: "rating", required: true },
  { id: "fv5", text: "今後の方針や内容の説明は分かりやすかったですか？", type: "rating", required: true },
  { id: "fv6", text: "費用に関する説明は十分でしたか？", type: "rating", required: true },
  { id: "fv7", text: "不安や疑問を相談しやすい雰囲気でしたか？", type: "rating", required: true },
  { id: "fv8", text: "今後も当院に通いたいと思いますか？", type: "rating", required: true },
]

const TREATMENT_QUESTIONS = [
  { id: "tr1", text: "本日の診療についての説明は分かりやすかったですか？", type: "rating", required: true },
  { id: "tr2", text: "不安や痛みへの配慮は十分でしたか？", type: "rating", required: true },
  { id: "tr3", text: "質問や相談がしやすい雰囲気でしたか？", type: "rating", required: true },
  { id: "tr4", text: "待ち時間は気にならない程度でしたか？", type: "rating", required: true },
  { id: "tr5", text: "スタッフの対応は丁寧でしたか？", type: "rating", required: true },
  { id: "tr6", text: "通院を続けることに安心感がありますか？", type: "rating", required: true },
]

const CHECKUP_QUESTIONS = [
  { id: "ck1", text: "本日の診療内容についての説明は分かりやすかったですか？", type: "rating", required: true },
  { id: "ck2", text: "丁寧に対応してもらえたと感じましたか？", type: "rating", required: true },
  { id: "ck3", text: "質問や相談がしやすい雰囲気でしたか？", type: "rating", required: true },
  { id: "ck4", text: "待ち時間は気にならない程度でしたか？", type: "rating", required: true },
  { id: "ck5", text: "予約の取りやすさはいかがでしたか？", type: "rating", required: true },
  { id: "ck6", text: "今後も当院に定期的に通いたいと思いますか？", type: "rating", required: true },
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

  // --- 6ヶ月分のリアルなデモアンケートデータを生成 ---
  // 設定: 受付の接遇に問題がある歯科医院（鈴木美咲=受付担当が特に低評価）
  // 患者満足度: 3.5 → 4.2 に半年で徐々に向上（受付研修等の改善アクションと連動）
  // 曜日差: 土曜=大混雑で受付パンク→大幅低下 / 月曜=少ない / 水曜=余裕あり高め
  // 時間帯差: 午前=余裕あり高め / 夕方〜19時=受付疲弊で低い
  // スタッフ差: 田中花子(衛生士)=高評価 / 佐藤太郎(歯科医師)=やや高 / 鈴木美咲(受付)=明確に低評価
  // 営業時間: 9:00〜19:00

  const QUESTION_IDS: Record<string, string[]> = {
    "初診": ["fv1", "fv2", "fv3", "fv4", "fv5", "fv6", "fv7", "fv8"],
    "治療中": ["tr1", "tr2", "tr3", "tr4", "tr5", "tr6"],
    "定期検診": ["ck1", "ck2", "ck3", "ck4", "ck5", "ck6"],
  }

  // 設問ごとのベースライン難易度（低い=患者がスコアを低くつけやすい）
  // ★受付の接遇に問題がある医院: 受付対応・相談しやすさが顕著に低い
  // 一方、衛生士・歯科医師の対応は良好（スタッフ対応・丁寧さは高い）
  const QUESTION_DIFFICULTY: Record<string, number> = {
    fv1: -0.08,  // 第一印象: 受付の雰囲気に引っ張られて低め
    fv2: -0.35,  // 受付対応: ★大きく低い（最大の問題点）
    fv3: -0.20,  // 待ち時間: 低い（不満が出やすい）
    fv4: -0.05,  // ヒアリング: やや低い
    fv5: -0.10,  // 説明: 低め
    fv6: -0.15,  // 費用説明: 低い
    fv7: -0.22,  // 相談しやすさ: ★受付の雰囲気で低い（声をかけづらい）
    fv8: -0.06,  // 通いたい: 受付印象に引っ張られてやや低い
    tr1: -0.08,  // 診療説明: やや低め
    tr2: -0.05,  // 痛み配慮: やや低め
    tr3: -0.15,  // 相談しやすさ: ★受付の雰囲気が影響
    tr4: -0.20,  // 待ち時間: 低い
    tr5: 0.10,   // スタッフ対応: 高い（衛生士・医師は良好）
    tr6: 0.00,   // 安心感: 普通
    ck1: -0.05,  // 説明: やや低め
    ck2: 0.10,   // 丁寧さ: 高い（衛生士は丁寧）
    ck3: -0.12,  // 相談しやすさ: ★受付の雰囲気が影響
    ck4: -0.18,  // 待ち時間: 低い
    ck5: -0.12,  // 予約取りやすさ: 低め
    ck6: 0.03,   // 通いたい: 受付が足を引っ張る
  }

  // 改善アクションによるスコア押し上げ効果（月index → 対象設問 → 加算）
  // 月0=6ヶ月前, 月5=当月。アクション開始月から徐々に効果が出る
  // ★受付マニュアル研修のboostを大きく設定（受付接遇問題の改善が主テーマ）
  const ACTION_EFFECTS: Record<string, { startMonth: number; endMonth: number | null; questions: string[]; boost: number }> = {
    "待ち時間の見える化": { startMonth: 0, endMonth: 2, questions: ["fv3", "tr4", "ck4"], boost: 0.12 },
    "受付マニュアル研修": { startMonth: 1, endMonth: 3, questions: ["fv2", "fv1", "fv7", "tr3", "ck3"], boost: 0.18 },
    "視覚資料での説明導入": { startMonth: 2, endMonth: 4, questions: ["fv5", "fv6", "tr1", "ck1"], boost: 0.10 },
    "接遇マナー研修": { startMonth: 2, endMonth: 4, questions: ["tr5", "ck2", "fv7", "tr3", "ck3", "fv8", "ck6"], boost: 0.08 },
    "予約枠バッファ導入": { startMonth: 4, endMonth: null, questions: ["fv3", "tr4", "ck4", "ck5"], boost: 0.08 },
    "痛み配慮の声かけ徹底": { startMonth: 4, endMonth: null, questions: ["tr2", "fv4", "tr6"], boost: 0.06 },
  }

  // スタッフごとの回答回収傾向
  // 田中花子(衛生士): 最も積極的で接遇も良好 → 高回収率・高評価
  // 佐藤太郎(歯科医師): 治療中心で安定 → 中回収率・やや高評価
  // 鈴木美咲(受付スタッフ): ★受付接遇に問題 → 低回収率・明確に低評価
  const STAFF_WEIGHTS = [
    { staff: staffMembers[0], weight: 45, scoreBonus: 0.08 },   // 田中花子: 高回収率、高評価（接遇良好な衛生士）
    { staff: staffMembers[1], weight: 35, scoreBonus: 0.03 },   // 佐藤太郎: 中回収率、やや高い（信頼される歯科医師）
    { staff: staffMembers[2], weight: 20, scoreBonus: -0.15 },  // 鈴木美咲: ★低回収率、明確に低評価（受付接遇の問題）
  ]

  // 決定的乱数（seedを固定してデータが毎回同じになるように）
  let rngState = 20260217
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

  // スコア生成: baseQuality (0-1) を5段階に変換。3.5→4.2の推移を再現
  // quality≈0.20 → 平均3.5, quality≈0.80 → 平均4.2 となるよう調整
  const generateScore = (baseQuality: number): number => {
    const clamped = Math.max(0.0, Math.min(1.0, baseQuality))
    const r = rng()
    // clamped が高いほど 4, 5 が出やすい。低いと 1, 2, 3 が増える
    const p1 = Math.max(0, 0.06 - clamped * 0.05)        // 1の確率: 6%→1%
    const p2 = Math.max(0, 0.16 - clamped * 0.13)        // 2の確率: 16%→3%
    const p3 = Math.max(0.03, 0.40 - clamped * 0.38)     // 3の確率: 40%→5%
    const p4 = 0.30 + (clamped - 0.5) * 0.12             // 4の確率: 24%→36%
    // 5 = 残り
    if (r < p1) return 1
    if (r < p1 + p2) return 2
    if (r < p1 + p2 + p3) return 3
    if (r < p1 + p2 + p3 + p4) return 4
    return 5
  }

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
    "受付の対応がとても丁寧で好印象です。",
    "費用の説明が事前にあって安心しました。",
    "先生がとても話しやすくてリラックスできました。",
    "写真を使って説明してくれたので分かりやすかったです。",
  ]
  const FREE_TEXTS_NEGATIVE = [
    "待ち時間が少し長かったです。",
    "次回の治療内容をもう少し詳しく教えてほしかったです。",
    "治療の説明が専門的で少し難しかったです。",
    "費用についてもう少し事前に説明がほしかったです。",
    "予約が取りにくいと感じました。",
    "もう少しゆっくり説明してほしかったです。",
  ]
  const COMPLAINTS = ["pain", "filling_crown", "periodontal", "cosmetic", "prevention", "orthodontics", "other"]
  const AGE_GROUPS = ["under_20", "20s", "30s", "40s", "50s", "60s_over"]
  const GENDERS = ["male", "female", "unspecified"]

  const templateConfig = templates.map((t) => ({
    template: t,
    questionIds: QUESTION_IDS[t.name] || [],
    weight: t.name === "初診" ? 20 : 40,
  }))

  // 既存のデモ回答を削除して再投入
  const deleted = await prisma.surveyResponse.deleteMany({
    where: { clinicId: clinic.id },
  })
  if (deleted.count > 0) {
    console.log(`既存回答を削除: ${deleted.count}件`)
  }

  const now = new Date()
  const startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1)
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
    const dayOfWeek = current.getDay()
    if (dayOfWeek === 0) { // 日曜は休診
      current.setDate(current.getDate() + 1)
      continue
    }
    totalDays++

    // 月indexを算出（0=最初の月, 5=6ヶ月目）
    const monthsFromStart = (current.getFullYear() - startDate.getFullYear()) * 12 + (current.getMonth() - startDate.getMonth())
    // 月内の進捗（0.0〜1.0）
    const dayOfMonth = current.getDate()
    const daysInMonth = new Date(current.getFullYear(), current.getMonth() + 1, 0).getDate()
    const monthProgress = dayOfMonth / daysInMonth

    // === 1日あたりの回答数（曜日で大きく変動）===
    // 土曜は来院数が非常に多く受付がパンク状態。月曜は閑散。
    let baseDailyCount: number
    if (dayOfWeek === 6) baseDailyCount = 16 + Math.floor(rng() * 8) // 土曜: 16-23（非常に多い）
    else if (dayOfWeek === 1) baseDailyCount = 4 + Math.floor(rng() * 3) // 月曜: 4-6（少ない）
    else if (dayOfWeek === 3) baseDailyCount = 11 + Math.floor(rng() * 6) // 水曜: 11-16（多め）
    else if (dayOfWeek === 5) baseDailyCount = 9 + Math.floor(rng() * 5) // 金曜: 9-13
    else if (dayOfWeek === 2) baseDailyCount = 6 + Math.floor(rng() * 4) // 火曜: 6-9
    else baseDailyCount = 7 + Math.floor(rng() * 4) // 木曜: 7-10

    // 月が進むと回収率が上がる（スタッフの定着）
    const dailyCount = Math.round(baseDailyCount * (1.0 + monthsFromStart * 0.06))

    // === ベースクオリティ: 3.5→4.2 への推移を制御 ===
    // 新generateScore: quality≈0.20→平均3.5, quality≈0.80→平均4.2
    // 設問難易度の平均が約-0.08、改善アクション効果が月末に+0.08〜0.12を考慮
    // 6ヶ月で 0.28 → 0.74 （差分0.46をS字カーブで）
    const linearProgress = (monthsFromStart + monthProgress) / 6.0  // 0.0〜1.0
    const sCurve = linearProgress * linearProgress * (3 - 2 * linearProgress) // S字カーブ
    const dayBaseQuality = 0.28 + sCurve * 0.46 + (rng() - 0.5) * 0.08

    // === 曜日によるスコア変動（受付の負荷と直結）===
    let dayOfWeekBonus = 0
    if (dayOfWeek === 6) dayOfWeekBonus = -0.12   // 土曜: ★大混雑で受付パンク、大幅低下
    if (dayOfWeek === 1) dayOfWeekBonus = -0.05   // 月曜: 週明けバタバタ
    if (dayOfWeek === 2) dayOfWeekBonus = -0.01   // 火曜: やや低め
    if (dayOfWeek === 3) dayOfWeekBonus = 0.06    // 水曜: 余裕がある日、高め
    if (dayOfWeek === 5) dayOfWeekBonus = 0.02    // 金曜: やや高い

    for (let i = 0; i < dailyCount; i++) {
      const config = weightedChoice(templateConfig, templateConfig.map((c) => c.weight))

      // スタッフ選択（重み付き）
      const staffChoice = weightedChoice(STAFF_WEIGHTS, STAFF_WEIGHTS.map((s) => s.weight))

      // === 時間帯（9:00-19:00営業、11時・14時ピーク、12時谷、19時は少数）===
      const hour = weightedChoice(
        [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19],
        [5, 12, 18, 3, 7, 16, 14, 10, 8, 5, 2]
      )
      const respondedAt = new Date(
        current.getFullYear(), current.getMonth(), current.getDate(),
        hour, Math.floor(rng() * 60), Math.floor(rng() * 60)
      )

      // === 時間帯によるスコア変動（受付の疲弊と直結）===
      let timeBonus = 0
      if (hour >= 9 && hour <= 11) timeBonus = 0.08      // 午前: 高い（受付も余裕あり）
      if (hour === 12) timeBonus = -0.06                   // 昼: 低め（バタバタ）
      if (hour >= 14 && hour <= 15) timeBonus = 0.03      // 午後前半: やや高い
      if (hour === 16) timeBonus = -0.02                   // 夕方入り: やや低い
      if (hour >= 17 && hour <= 18) timeBonus = -0.10     // 夕方: ★低い（受付も疲弊、雑になりがち）
      if (hour >= 19) timeBonus = -0.14                    // 閉院間際: ★非常に低い（早く終わらせたい雰囲気）
      if (dayOfWeek === 6 && hour >= 14) timeBonus -= 0.06 // 土曜午後: ★さらに低下（混雑ピーク）

      const baseForThisResponse = dayBaseQuality + dayOfWeekBonus + timeBonus + staffChoice.scoreBonus

      // === 設問ごとのスコア生成（設問難易度 + 改善アクション効果） ===
      const answers: Record<string, number> = {}
      for (const qId of config.questionIds) {
        let qBase = baseForThisResponse + (QUESTION_DIFFICULTY[qId] || 0)

        // 改善アクション効果を加算
        for (const [, effect] of Object.entries(ACTION_EFFECTS)) {
          if (!effect.questions.includes(qId)) continue
          if (monthsFromStart < effect.startMonth) continue
          // 開始月から徐々に効果UP（最大でboost値）
          const monthsSinceAction = monthsFromStart - effect.startMonth + monthProgress
          const effectStrength = Math.min(1.0, monthsSinceAction / 2.0) // 2ヶ月で最大効果
          qBase += effect.boost * effectStrength
        }

        answers[qId] = generateScore(qBase)
      }
      const scoreValues = Object.values(answers)
      const overallScore = Math.round((scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length) * 100) / 100

      // フリーテキスト: 低スコア時はネガティブ、高スコア時はポジティブが出やすい
      let freeText: string | null = null
      if (rng() < 0.22) {
        if (overallScore <= 3.0 && rng() < 0.6) {
          freeText = FREE_TEXTS_NEGATIVE[Math.floor(rng() * FREE_TEXTS_NEGATIVE.length)]
        } else {
          freeText = FREE_TEXTS_POSITIVE[Math.floor(rng() * FREE_TEXTS_POSITIVE.length)]
        }
      }

      const isFirstVisit = config.template.name === "初診"
      const isCheckup = config.template.name === "定期検診"
      allResponses.push({
        clinicId: clinic.id,
        staffId: staffChoice.staff.id,
        templateId: config.template.id,
        answers,
        overallScore,
        freeText,
        patientAttributes: {
          visitType: isFirstVisit ? "first_visit" : "revisit",
          treatmentType: isCheckup ? "checkup" : "treatment",
          chiefComplaint: COMPLAINTS[Math.floor(rng() * COMPLAINTS.length)],
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
  console.log(`デモ回答作成: ${allResponses.length}件（${totalDays}営業日分）`)
  for (const [name, count] of Object.entries(staffCounts)) {
    console.log(`  ${name}: ${count}件`)
  }

  // 月ごとの平均スコアをログ出力（3.5→4.2推移の確認用）
  for (let m = 0; m <= 5; m++) {
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

  // === 改善アクション履歴（6件: 4完了 + 2実施中） ===
  // 改善アクション開始時・完了時の実際のスコアを算出
  const getScoreAtMonth = (monthIdx: number, questions: string[]): number => {
    const d = new Date(startDate.getFullYear(), startDate.getMonth() + monthIdx, 1)
    const year = d.getFullYear()
    const month = d.getMonth() + 1
    const monthResponses = allResponses.filter(
      (r) => r.respondedAt.getFullYear() === year && r.respondedAt.getMonth() + 1 === month
    )
    if (monthResponses.length === 0) return 3.5
    // 対象設問のスコアだけ集計
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
      description: "待ち時間が発生した際に「あと○分」と具体的な目安を伝える運用を開始。受付にタイマー表示を設置。",
      targetQuestion: "fv3",
      status: "completed",
      startMonthIdx: 0,
      endMonthIdx: 2,
      questions: ["fv3", "tr4", "ck4"],
    },
    {
      title: "受付マニュアルの作成と研修",
      description: "受付時の笑顔・挨拶・名前呼びを統一するマニュアルを作成し、全スタッフで研修を実施。受付対応が最大の課題であったため重点的に取り組み。",
      targetQuestion: "fv2",
      status: "completed",
      startMonthIdx: 1,
      endMonthIdx: 3,
      questions: ["fv2", "fv1", "fv7", "tr3", "ck3"],
    },
    {
      title: "視覚資料を活用した治療説明",
      description: "口腔内カメラの写真やイラスト付き資料を使って、治療内容・費用を視覚的に説明する運用を導入。",
      targetQuestion: "fv5",
      status: "completed",
      startMonthIdx: 2,
      endMonthIdx: 4,
      questions: ["fv5", "fv6", "tr1", "ck1"],
    },
    {
      title: "接遇マナー研修の定期実施",
      description: "月1回の接遇研修を開始。スタッフの声かけ・表情・患者対応のロールプレイングを実施。",
      targetQuestion: "tr5",
      status: "completed",
      startMonthIdx: 2,
      endMonthIdx: 4,
      questions: ["tr5", "ck2", "fv7", "tr3", "ck3"],
    },
    {
      title: "予約枠にバッファを確保",
      description: "急患対応用に1日3枠のバッファを設定。予約患者の待ち時間短縮と予約の取りやすさを改善中。",
      targetQuestion: "ck5",
      status: "active",
      startMonthIdx: 4,
      endMonthIdx: null,
      questions: ["fv3", "tr4", "ck4", "ck5"],
    },
    {
      title: "痛みへの配慮を言語化して伝える",
      description: "治療前に「少しチクッとします」等の予告を徹底。手を挙げたら止めるルールも導入中。",
      targetQuestion: "tr2",
      status: "active",
      startMonthIdx: 4,
      endMonthIdx: null,
      questions: ["tr2", "fv4", "tr6"],
    },
  ]

  // Question ID → text lookup for targetQuestion field
  const questionTextMap = new Map<string, string>()
  for (const q of [...FIRST_VISIT_QUESTIONS, ...TREATMENT_QUESTIONS, ...CHECKUP_QUESTIONS]) {
    questionTextMap.set(q.id, q.text)
  }

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
    console.log(`改善アクション: ${action.title}（${action.status}）開始時 ${baselineScore} → ${resultScore !== null ? `完了時 ${resultScore}` : "実施中"}`)
  }

  // 月次レポート（過去5ヶ月分。当月は未入力=InsightBanner表示用）
  for (let m = 1; m <= 5; m++) {
    const d = new Date(now.getFullYear(), now.getMonth() - m, 1)
    const year = d.getFullYear()
    const month = d.getMonth() + 1
    const monthResponses = allResponses.filter(
      (r) => r.respondedAt.getFullYear() === year && r.respondedAt.getMonth() + 1 === month
    ).length
    const totalVisits = Math.round(monthResponses * (2.5 + rng() * 0.8))
    const totalRevenue = Math.round((350 + rng() * 150) * totalVisits / 10000)
    const selfPayRevenue = Math.round(totalRevenue * (0.15 + rng() * 0.15))
    const googleReviewCount = 40 + m * 2 + Math.floor(rng() * 5)
    const googleReviewRating = Math.round((3.8 + rng() * 0.8) * 10) / 10

    await prisma.monthlyClinicMetrics.upsert({
      where: { clinicId_year_month: { clinicId: clinic.id, year, month } },
      update: { totalVisits, totalRevenue, selfPayRevenue, googleReviewCount, googleReviewRating },
      create: { clinicId: clinic.id, year, month, totalVisits, totalRevenue, selfPayRevenue, googleReviewCount, googleReviewRating },
    })
    console.log(`月次レポート: ${year}-${String(month).padStart(2, "0")} (来院${totalVisits}人, 売上${totalRevenue}万円)`)
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

  // 既存設定がある場合は上書きしない（管理画面で変更した値を保持）
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
    console.log(`Platform tips seeded: ${defaultTips.length} tips (rotation: 1440 min)`)
  } else {
    console.log("Platform tips already exist, skipping (preserving custom settings)")
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
