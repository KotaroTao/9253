import { z } from "zod"

export const staffSurveyCreateSchema = z.object({
  title: z.string().min(1, "タイトルを入力してください"),
})

export const staffSurveySubmitSchema = z.object({
  surveyId: z.string().uuid("無効なサーベイIDです"),
  answers: z.record(z.string(), z.number().min(1).max(5)),
  freeText: z.string().max(1000).optional(),
})