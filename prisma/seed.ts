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

      // Generate sample patient attributes
      const visitTypes = ["first_visit", "revisit"] as const
      const treatmentTypes = ["treatment", "checkup", "consultation"] as const
      const complaints = ["pain", "filling_crown", "periodontal", "cosmetic", "prevention", "orthodontics", "other"]
      const ageGroups = ["under_20", "30s", "40s", "50s", "60s_over"]
      const genders = ["male", "female", "unspecified"]

      const patientAttributes = {
        visitType: tmplIndex === 0 ? "first_visit" : "revisit",
        treatmentType: tmplIndex === 2 ? "checkup" : tmplIndex === 1 ? "treatment" : "treatment",
        chiefComplaint: complaints[i % complaints.length],
        ageGroup: ageGroups[i % ageGroups.length],
        gender: genders[i % genders.length],
      }

      sampleResponses.push({
        clinicId: clinic.id,
        templateId: templates[tmplIndex].id,
        answers: scores,
        overallScore,
        freeText: i % 5 === 0 ? "丁寧に対応していただきありがとうございました。" : null,
        patientAttributes,
        ipHash: `sample-hash-${i}`,
        respondedAt,
      })
    }

    await prisma.surveyResponse.createMany({ data: sampleResponses })
    console.log(`Sample responses created: ${sampleResponses.length} records`)
  } else {
    console.log(`Sample responses skipped (${existingCount} already exist)`)
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
