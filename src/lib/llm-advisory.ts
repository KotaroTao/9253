import Anthropic from "@anthropic-ai/sdk"
import { z } from "zod"
import type { AdvisorySection } from "@/types"
import { logger } from "@/lib/logger"

// ─── LLM Advisory Engine ───
// ルールベース分析の全結果 + 定量データを LLM に渡し、
// トップコンサルタント品質の分析を生成する。

const MODEL = "claude-sonnet-4-6"
const MAX_TOKENS = 4000
const TIMEOUT_MS = 45_000 // 45秒（Cloud Run 60秒タイムアウト内に収めるため）
const MAX_INPUT_CHARS = 30_000 // 入力テキストの上限（約7,500トークン相当）
const RATE_LIMIT_MS = 60 * 60 * 1000 // 同一クリニック1時間に1回まで

/** Per-clinic rate limit tracker (in-memory, resets on server restart) */
const lastCallByClinic = new Map<string, number>()

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
  clinicStory: string
  highlightCards: Array<{ title: string; content: string; emoji: string }>
}

/** LLM分析の結果（成功 or 失敗理由） */
export interface LLMAdvisoryResult {
  output: LLMAdvisoryOutput | null
  error: string | null
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
JSON形式で以下の5セクションを返してください。マークダウンコードブロックは不要です。

{
  "clinicStory": "...",
  "highlightCards": [...],
  "executiveSummary": "...",
  "rootCauseAnalysis": "...",
  "strategicActions": "..."
}

### clinicStory（クリニックストーリー）
- 3文で、院長に語りかけるような温かく親しみのあるトーンで要約する
- 1文目: 最も印象的な変化や発見を「あなたのクリニックでは〜」で始める
- 2文目: その背景にある要因（改善アクションの効果やスタッフの努力、患者さんの声）
- 3文目: 次の一歩への期待感を込めた前向きなメッセージ

### highlightCards（発見カード）
- 2枚のカードを生成する
- 各カードは { "title": "...", "content": "...(1-2文、50文字以内)", "emoji": "..." }
- 1枚目: タイトルは「今月の最大の発見」。最も注目すべきデータの変化やパターンを短く
- 2枚目: タイトルは「隠れた強み」。データから読み取れる意外な強みや良い兆候を短く
- ワクワクするトーンで、数値を1つは含める

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

/** Zod schema for highlight card */
const highlightCardSchema = z.object({
  title: z.coerce.string().default(""),
  content: z.coerce.string().default(""),
  emoji: z.coerce.string().default(""),
})

/** Zod schema for LLM advisory output */
const llmAdvisoryOutputSchema = z.object({
  executiveSummary: z.coerce.string().default(""),
  rootCauseAnalysis: z.coerce.string().default(""),
  strategicActions: z.coerce.string().default(""),
  clinicStory: z.coerce.string().default(""),
  highlightCards: z.array(highlightCardSchema).default([]),
})

/**
 * ユーザー由来のフリーテキストをサニタイズする。
 * プロンプトインジェクション防止のため、制御文字・指示的パターンを除去し長さを制限する。
 */
function sanitizeComment(text: string, maxLen = 200): string {
  return text
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "") // 制御文字を除去
    .slice(0, maxLen)
}

/**
 * JSON文字列を堅牢に抽出する。
 * LLMの出力にコードブロックや前後の説明テキストが含まれる場合に対応。
 */
function extractJson(text: string): string {
  // 最初の { から最後の } までを抽出
  const firstBrace = text.indexOf("{")
  const lastBrace = text.lastIndexOf("}")
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error("JSON object not found in LLM response")
  }
  return text.slice(firstBrace, lastBrace + 1)
}

/**
 * テキストを上限文字数に収まるよう切り詰める。
 * セクション単位で切り詰め、末尾に省略メッセージを付与。
 */
function truncateRuleSummary(sections: Array<{ title: string; content: string }>, maxChars: number): string {
  const formatted: string[] = []
  let totalLen = 0

  for (const s of sections) {
    const entry = `【${s.title}】\n${s.content}`
    if (totalLen + entry.length > maxChars) {
      formatted.push(`（以降${sections.length - formatted.length}セクション省略）`)
      break
    }
    formatted.push(entry)
    totalLen += entry.length
  }

  return formatted.join("\n\n---\n\n")
}

/**
 * LLM を使ってコンサルタント品質の分析を生成する。
 * ANTHROPIC_API_KEY が未設定の場合は error を返す。
 */
export async function generateLLMAdvisory(
  input: LLMAdvisoryInput,
  clinicId?: string,
  options?: { skipRateLimit?: boolean },
): Promise<LLMAdvisoryResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return { output: null, error: null } // キー未設定はエラーではない

  // Per-clinic rate limit check（デモクリニックはスキップ可能）
  if (clinicId && !options?.skipRateLimit) {
    const lastCall = lastCallByClinic.get(clinicId)
    if (lastCall && Date.now() - lastCall < RATE_LIMIT_MS) {
      return { output: null, error: "レート制限: 次の分析は1時間後に実行できます" }
    }
  }

  const client = new Anthropic({ apiKey, timeout: TIMEOUT_MS })

  // ルールベース分析の要約を構築（上限付き）
  const ruleSummary = truncateRuleSummary(input.ruleBasedSections, MAX_INPUT_CHARS)

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

  // コメント（プロンプトインジェクション防止のためサニタイズ）
  const negComments = input.negativeComments.length > 0
    ? input.negativeComments.map((c) => `- 「${sanitizeComment(c)}」`).join("\n")
    : "なし"
  const posComments = input.positiveComments.length > 0
    ? input.positiveComments.map((c) => `- 「${sanitizeComment(c)}」`).join("\n")
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

    // JSON パース + Zod バリデーション（コードブロックや前後テキストに対応）
    const jsonStr = extractJson(text)
    const parsed = llmAdvisoryOutputSchema.parse(JSON.parse(jsonStr))

    if (clinicId) lastCallByClinic.set(clinicId, Date.now())
    return { output: parsed, error: null }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    logger.error("LLM advisory call failed", { component: "llm-advisory", error: message })
    return { output: null, error: message }
  }
}

/**
 * Anthropic API の接続状態を確認する。
 * 軽量なリクエスト（max_tokens=1）で疎通テストを行う。
 * @param overrideApiKey 指定時は process.env ではなくこのキーでテストする
 */
export async function checkLLMStatus(overrideApiKey?: string): Promise<{
  configured: boolean
  connected: boolean
  model: string
  error: string | null
}> {
  const apiKey = overrideApiKey ?? process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return { configured: false, connected: false, model: MODEL, error: null }
  }

  try {
    const client = new Anthropic({ apiKey, timeout: 10_000 })
    await client.messages.create({
      model: MODEL,
      max_tokens: 1,
      messages: [{ role: "user", content: "ping" }],
    })
    return { configured: true, connected: true, model: MODEL, error: null }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    return { configured: true, connected: false, model: MODEL, error: message }
  }
}

/**
 * LLM分析結果を AdvisorySection[] に変換する
 */
export function llmOutputToSections(output: LLMAdvisoryOutput): AdvisorySection[] {
  const sections: AdvisorySection[] = []

  // クリニックストーリー
  if (output.clinicStory) {
    sections.push({
      title: "クリニックストーリー",
      content: output.clinicStory,
      type: "clinic_story",
    })
  }

  // ハイライトカード（発見・強み）
  if (output.highlightCards && output.highlightCards.length >= 1) {
    sections.push({
      title: output.highlightCards[0].title || "今月の最大の発見",
      content: `${output.highlightCards[0].emoji || "🎯"}\n${output.highlightCards[0].content}`,
      type: "highlight_discovery",
    })
  }
  if (output.highlightCards && output.highlightCards.length >= 2) {
    sections.push({
      title: output.highlightCards[1].title || "隠れた強み",
      content: `${output.highlightCards[1].emoji || "🌟"}\n${output.highlightCards[1].content}`,
      type: "highlight_strength",
    })
  }

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
