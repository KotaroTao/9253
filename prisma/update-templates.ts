/**
 * テンプレート更新スクリプト（非破壊）
 *
 * 既存の回答データを保持したまま、テンプレート名と質問内容を最新に更新する。
 * - "治療中" → "再診" にリネーム
 * - 初診・再診の質問テキストを最新に同期
 *
 * 使い方: npx tsx prisma/update-templates.ts
 */
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

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

async function main() {
  console.log("=== テンプレート更新開始 ===\n")

  // 全クリニックのアクティブなテンプレートを取得
  const allTemplates = await prisma.surveyTemplate.findMany({
    where: { isActive: true },
    include: { clinic: { select: { name: true, slug: true } } },
  })

  let updated = 0

  for (const tmpl of allTemplates) {
    const clinicLabel = `${tmpl.clinic.name} (${tmpl.clinic.slug})`

    // "治療中" → "再診" にリネーム + 質問更新
    if (tmpl.name === "治療中") {
      await prisma.surveyTemplate.update({
        where: { id: tmpl.id },
        data: { name: "再診", questions: TREATMENT_QUESTIONS },
      })
      console.log(`[${clinicLabel}] "治療中" → "再診" にリネーム＆質問更新`)
      updated++
      continue
    }

    // "再診" テンプレートの質問を最新に同期
    if (tmpl.name === "再診") {
      await prisma.surveyTemplate.update({
        where: { id: tmpl.id },
        data: { questions: TREATMENT_QUESTIONS },
      })
      console.log(`[${clinicLabel}] "再診" の質問を更新`)
      updated++
      continue
    }

    // "初診" テンプレートの質問を最新に同期
    if (tmpl.name === "初診") {
      await prisma.surveyTemplate.update({
        where: { id: tmpl.id },
        data: { questions: FIRST_VISIT_QUESTIONS },
      })
      console.log(`[${clinicLabel}] "初診" の質問を更新`)
      updated++
      continue
    }
  }

  console.log(`\n=== 完了: ${updated}件のテンプレートを更新 ===`)
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
