import { z } from "zod"

export const surveySubmissionSchema = z.object({
  staffToken: z.string().min(1, "スタッフトークンが必要です"),
  templateId: z.string().uuid("無効なテンプレートIDです"),
  answers: z.record(
    z.string(),
    z.union([z.number().min(1).max(5), z.string().max(500)])
  ),
  freeText: z.string().max(500).optional(),
})

export type SurveySubmissionInput = z.infer<typeof surveySubmissionSchema>
