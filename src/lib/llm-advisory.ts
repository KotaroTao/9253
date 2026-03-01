import Anthropic from "@anthropic-ai/sdk"
import type { AdvisorySection } from "@/types"

// ─── LLM Advisory Engine ───
// ルールベース分析の全結果 + 定量データを LLM に渡し、
// トップコンサルタント品質の分析を生成する。

const MODEL = "claude-sonnet-4-6"
const MAX_TOKENS = 4000

export interface LLMAdvisoryInput {
  /** 基本スコア */
  averageScore: number
  prevAverageScore: number | null
  totalResponses: number
  /** ルールベース分析の全セクション（title + content） */
  ruleBasedSections: Array<{ title: string; content: string; type: string }>
  /** 質問別スコア（テンプレート名 → 質問リスト） */
  questionBreakdown: Array<{
    templateName: string
    questions: Array<{ text: string; avgScore: number; prevAvgScore: number | null; count: number }>
  }>
  /** ヒートマップ上の低スコアスロット */
  lowScoreSlots: Array<{ dayOfWeek: string; hour: string; avgScore: number }>
  /** 改善アクション（実施中） */
  activeActions: Array<{
    title: string
    targetQuestion: string | null
    baselineScore: number | null
    currentScore: number | null
    elapsedDays: number
  }>
  /** 月次経営データ概要 */
  monthlyMetricsSummary: string | null
  /** セグメント別の顕著な差 */
  segmentGaps: Array<{ segment: string; avgScore: number; gap: number }>
  /** フリーテキストのネガティブコメント（最大10件） */
  negativeComments: string[]
  /** フリーテキストのポジティブコメント（最大5件） */
  positiveComments: string[]
}

interface LLMAdvisoryOutput {
  executiveSummary: string
  rootCauseAnalysis: string
  strategicActions: string
}

const SYSTEM_PROMPT = `あなたは歯科医院経営に精通したトップコンサルタントです。
20年以上の歯科コンサルティング経験を持ち、延べ500院以上の改善実績があります。

## あなたの分析スタイル
- データの表面的な記述ではなく、**因果関係の推論**と**具体的な打ち手**を示す
- 複数のデータポイントを**クロスリファレンス**して根本原因を特定する
- 推奨アクションには「何を」「どのように」「いつまでに」「期待効果」を含める
- 院長が朝礼で即座にスタッフに伝えられるレベルの具体性で書く
- 改善の優先順位は「患者体験への影響度 × 実行の容易さ」で判断する

## 出力形式
JSON形式で以下の3セクションを返してください。マークダウンコードブロックは不要です。

{
  "executiveSummary": "...",
  "rootCauseAnalysis": "...",
  "strategicActions": "..."
}

### executiveSummary（エグゼクティブサマリー）
- 3〜5文で経営者向けの要約を書く
- 最も重要な発見 → 最大のリスク → 最優先アクションの順
- 数値を必ず含める

### rootCauseAnalysis（根本原因分析）
- 表面的な問題から根本原因への因果チェーンを示す
- 複数のシグナルを結びつける（例: ヒートマップの低スコア時間帯 + 初診/再診差 + コメント傾向 → 原因の推定）
- 各行を「- 」で始める箇条書き
- 因果関係は「→」で繋ぐ

### strategicActions（戦略的推奨アクション）
- 優先度順に3〜5個
- 各アクションのフォーマット:
  【優先度X】タイトル
  具体策: ○○を△△に変更する
  期待効果: スコアが□□pt改善（根拠: 他の分析データから）
  測定方法: 1ヶ月後に○○のスコアを確認
- 改善アクション管理で追跡可能な粒度で書く`

/**
 * LLM を使ってコンサルタント品質の分析を生成する。
 * ANTHROPIC_API_KEY が未設定の場合は null を返す（ルールベースにフォールバック）。
 */
export async function generateLLMAdvisory(
  input: LLMAdvisoryInput
): Promise<LLMAdvisoryOutput | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return null

  const client = new Anthropic({ apiKey })

  // ルールベース分析の要約を構築
  const ruleSummary = input.ruleBasedSections
    .map((s) => `【${s.title}】\n${s.content}`)
    .join("\n\n---\n\n")

  // 質問別スコアの要約
  const questionSummary = input.questionBreakdown
    .map((t) => {
      const qs = t.questions
        .map((q) => {
          const delta = q.prevAvgScore != null ? ` (前月比${q.avgScore - q.prevAvgScore >= 0 ? "+" : ""}${(q.avgScore - q.prevAvgScore).toFixed(2)})` : ""
          return `  ${q.text}: ${q.avgScore.toFixed(2)}点${delta} [n=${q.count}]`
        })
        .join("\n")
      return `[${t.templateName}]\n${qs}`
    })
    .join("\n\n")

  // ヒートマップの低スコアスロット
  const heatmapSummary = input.lowScoreSlots.length > 0
    ? input.lowScoreSlots.map((s) => `${s.dayOfWeek} ${s.hour}: ${s.avgScore.toFixed(2)}点`).join("\n")
    : "低スコアスロットなし"

  // 改善アクション
  const actionsSummary = input.activeActions.length > 0
    ? input.activeActions.map((a) => {
        const scoreInfo = a.baselineScore != null && a.currentScore != null
          ? `開始時${a.baselineScore.toFixed(2)} → 現在${a.currentScore.toFixed(2)} (${a.elapsedDays}日経過)`
          : `${a.elapsedDays}日経過`
        return `- ${a.title} [対象: ${a.targetQuestion ?? "未指定"}] ${scoreInfo}`
      }).join("\n")
    : "実施中の改善アクションなし"

  // セグメント差
  const segmentSummary = input.segmentGaps.length > 0
    ? input.segmentGaps.map((s) => `${s.segment}: ${s.avgScore.toFixed(2)}点 (全体比${s.gap >= 0 ? "+" : ""}${s.gap.toFixed(2)})`).join("\n")
    : "顕著なセグメント差なし"

  // コメント
  const negComments = input.negativeComments.length > 0
    ? input.negativeComments.map((c) => `- 「${c}`).join("\n")
    : "なし"
  const posComments = input.positiveComments.length > 0
    ? input.positiveComments.map((c) => `- 「${c}`).join("\n")
    : "なし"

  const userMessage = `以下のデータに基づいて、歯科医院の経営改善分析を行ってください。

## 基本データ
- 総合満足度: ${input.averageScore.toFixed(2)}点${input.prevAverageScore != null ? ` (前月: ${input.prevAverageScore.toFixed(2)}点)` : ""}
- 直近30日の回答数: ${input.totalResponses}件

## 質問別スコア
${questionSummary}

## ルールベース分析（既存の17エンジンの出力）
${ruleSummary}

## ヒートマップ低スコアスロット（曜日×時間帯）
${heatmapSummary}

## 実施中の改善アクション
${actionsSummary}

## 経営指標
${input.monthlyMetricsSummary ?? "経営データ未入力"}

## 患者セグメント別の差
${segmentSummary}

## ネガティブコメント（直近、最大10件）
${negComments}

## ポジティブコメント（直近、最大5件）
${posComments}`

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    })

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")

    // JSON パース（コードブロックに包まれている場合も対応）
    const jsonStr = text.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "").trim()
    const parsed = JSON.parse(jsonStr) as LLMAdvisoryOutput

    return {
      executiveSummary: parsed.executiveSummary || "",
      rootCauseAnalysis: parsed.rootCauseAnalysis || "",
      strategicActions: parsed.strategicActions || "",
    }
  } catch (e) {
    console.error("[LLM Advisory] Failed:", e)
    return null
  }
}

/**
 * LLM分析結果を AdvisorySection[] に変換する
 */
export function llmOutputToSections(output: LLMAdvisoryOutput): AdvisorySection[] {
  const sections: AdvisorySection[] = []

  if (output.executiveSummary) {
    sections.push({
      title: "エグゼクティブサマリー",
      content: output.executiveSummary,
      type: "executive_summary",
    })
  }

  if (output.rootCauseAnalysis) {
    sections.push({
      title: "根本原因分析",
      content: output.rootCauseAnalysis,
      type: "root_cause",
    })
  }

  if (output.strategicActions) {
    sections.push({
      title: "戦略的推奨アクション",
      content: output.strategicActions,
      type: "strategic_actions",
    })
  }

  return sections
}
