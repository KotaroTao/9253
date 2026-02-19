"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, TrendingUp, Plus } from "lucide-react"
import Link from "next/link"
import type { TemplateQuestionScores } from "@/lib/queries/stats"
import { formatPeriodLabel } from "@/components/dashboard/analytics-charts"

interface QuestionBreakdownProps {
  data: TemplateQuestionScores[]
  selectedPeriod?: number
}

const SCORE_THRESHOLD = 4.0

// 設問IDに対応する改善アドバイスマップ
const ADVICE_MAP: Record<string, string> = {
  // 初診
  fv1: "院内の清掃頻度の見直しや、待合室の雰囲気づくり（照明・BGM・掲示物）を改善しましょう",
  fv2: "受付スタッフの声かけや笑顔を意識したロールプレイング研修を実施しましょう",
  fv3: "予約枠の見直しや、待ち時間の目安を事前にお伝えする仕組みを導入しましょう",
  fv4: "問診票の内容を見直し、患者さまの不安に寄り添うヒアリングの流れを整備しましょう",
  fv5: "治療方針の説明にイラストや模型を活用し、患者さまの理解度を確認する習慣をつけましょう",
  fv6: "費用の概算を事前に提示し、自費と保険の違いを分かりやすく説明する資料を用意しましょう",
  fv7: "「何かご不明な点はありますか？」と声かけするタイミングをチーム内で統一しましょう",
  fv8: "紹介したいと思える体験づくりのため、初診時の総合的な満足度を高めるフォローを強化しましょう",
  // 再診
  tr1: "治療前に「本日はこのような流れで進めます」と簡潔に説明する習慣を徹底しましょう",
  tr2: "治療中の声かけ（「痛みがあれば手を挙げてください」等）を標準化しましょう",
  tr3: "治療後に「気になることはありませんか？」と確認し、質問しやすい雰囲気を作りましょう",
  tr4: "予約枠の見直しや、遅延時の声かけルールをチーム内で統一しましょう",
  tr5: "スタッフ間の連携や、患者さまへの挨拶・声かけの基本を見直しましょう",
  tr6: "治療の進捗や残り回数の目安を毎回お伝えし、ゴールが見える安心感を提供しましょう",
}

// テンプレートごとの色
const TEMPLATE_COLORS: Record<string, { bar: string; low: string; bg: string }> = {
  "初診": { bar: "hsl(221, 83%, 53%)", low: "hsl(0, 84%, 60%)", bg: "from-blue-50/50 to-white" },
  "再診": { bar: "hsl(142, 71%, 45%)", low: "hsl(0, 84%, 60%)", bg: "from-emerald-50/50 to-white" },
}

function shortenLabel(text: string): string {
  // Remove trailing question marks and common suffixes for brevity
  return text
    .replace(/はいかがでしたか？$/, "")
    .replace(/と思いますか？$/, "")
    .replace(/でしたか？$/, "")
    .replace(/ですか？$/, "")
    .replace(/ましたか？$/, "")
    .replace(/ありますか？$/, "")
    .replace(/？$/, "")
}

// Custom tooltip component
function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: { fullText: string; avgScore: number; count: number } }> }) {
  if (!active || !payload?.length) return null
  const data = payload[0].payload
  return (
    <div className="rounded-lg border bg-white p-3 shadow-md">
      <p className="mb-1 text-xs font-medium text-gray-900">{data.fullText}</p>
      <p className="text-sm">
        平均スコア: <span className="font-bold">{data.avgScore.toFixed(2)}</span> / 5.0
      </p>
      <p className="text-xs text-muted-foreground">{data.count}件の回答</p>
    </div>
  )
}

export function QuestionBreakdown({ data, selectedPeriod }: QuestionBreakdownProps) {
  const periodLabel = selectedPeriod
    ? formatPeriodLabel(selectedPeriod)
    : null
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">設問別スコア</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="py-8 text-center text-sm text-muted-foreground">
            データがありません
          </p>
        </CardContent>
      </Card>
    )
  }

  // Collect all low-scoring questions across all templates
  const lowScoreItems: Array<{ templateName: string; questionId: string; text: string; avgScore: number }> = []
  for (const template of data) {
    for (const q of template.questions) {
      if (q.avgScore > 0 && q.avgScore < SCORE_THRESHOLD) {
        lowScoreItems.push({
          templateName: template.templateName,
          questionId: q.questionId,
          text: q.text,
          avgScore: q.avgScore,
        })
      }
    }
  }
  lowScoreItems.sort((a, b) => a.avgScore - b.avgScore)

  return (
    <div className="space-y-6">
      {/* Charts per template */}
      {data.map((template) => {
        const colors = TEMPLATE_COLORS[template.templateName] ?? TEMPLATE_COLORS["初診"]
        const chartData = template.questions.map((q) => ({
          label: shortenLabel(q.text),
          fullText: q.text,
          avgScore: q.avgScore,
          count: q.count,
          questionId: q.questionId,
        }))

        return (
          <Card key={template.templateName}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <span>{template.templateName}</span>
                <span className="text-xs font-normal text-muted-foreground">
                  （{periodLabel ? `直近${periodLabel} / ` : ""}{template.responseCount}件の回答）
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={template.questions.length * 52 + 20}>
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ top: 0, right: 20, bottom: 0, left: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} fontSize={12} />
                  <YAxis
                    type="category"
                    dataKey="label"
                    width={260}
                    fontSize={11}
                    tick={{ fill: "#666" }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine x={SCORE_THRESHOLD} stroke="#f59e0b" strokeDasharray="4 4" strokeWidth={1.5} />
                  <Bar dataKey="avgScore" radius={[0, 4, 4, 0]} barSize={24}>
                    {chartData.map((entry) => (
                      <Cell
                        key={entry.questionId}
                        fill={entry.avgScore < SCORE_THRESHOLD ? colors.low : colors.bar}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )
      })}

      {/* Improvement advice section */}
      {lowScoreItems.length > 0 ? (
        <Card className="border-amber-200 bg-gradient-to-r from-amber-50/50 to-white">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base text-amber-800">
              <AlertTriangle className="h-5 w-5" />
              改善ポイント
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {lowScoreItems.map((item) => (
                <div
                  key={`${item.templateName}-${item.questionId}`}
                  className="rounded-lg border border-amber-100 bg-white p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="shrink-0 rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-700">
                          {item.templateName}
                        </span>
                        <span className="text-sm font-medium text-gray-900 truncate">
                          {item.text}
                        </span>
                      </div>
                      {ADVICE_MAP[item.questionId] && (
                        <p className="mt-1.5 text-xs leading-relaxed text-gray-600">
                          {ADVICE_MAP[item.questionId]}
                        </p>
                      )}
                      <Link
                        href={`/dashboard/actions?question=${item.questionId}`}
                        className="mt-2 inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 hover:bg-amber-100 transition-colors"
                      >
                        <Plus className="h-3 w-3" />
                        改善アクションを追加
                      </Link>
                    </div>
                    <span className="shrink-0 rounded-full bg-red-50 px-2 py-0.5 text-sm font-bold text-red-600">
                      {item.avgScore.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        data.some((t) => t.responseCount > 0) && (
          <Card className="border-green-200 bg-gradient-to-r from-green-50/50 to-white">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base text-green-800">
                <TrendingUp className="h-5 w-5" />
                すべての項目が良好です
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-green-700">
                全設問の平均スコアが{SCORE_THRESHOLD}以上です。引き続き高い水準を維持しましょう。
              </p>
            </CardContent>
          </Card>
        )
      )}
    </div>
  )
}
