import { z } from "zod"

export const staffSurveyCreateSchema = z.object({
  title: z.string().min(1, "タイトルを入力してください"),
})

export const staffSurveySubmitSchema = z.object({
  surveyId: z.string().uuid("無効なサーベイIDです"),
  answers: z.record(z.string(), z.number().min(1).max(5)),
  freeText: z.string().max(1000).optional(),
})

export const monthlyMetricsSchema = z.object({
  year: z.number().int().min(2020).max(2100),
  month: z.number().int().min(1).max(12),
  newPatientCount: z.number().int().min(0).nullable().optional(),
  maintenanceTransitionCount: z.number().int().min(0).nullable().optional(),
  selfPayProposalCount: z.number().int().min(0).nullable().optional(),
  selfPayConversionCount: z.number().int().min(0).nullable().optional(),
})

export const tallySchema = z.object({
  staffToken: z.string().min(1, "スタッフトークンが必要です"),
  type: z.enum([
    "new_patient",
    "maintenance_transition",
    "self_pay_proposal",
    "self_pay_conversion",
  ]),
  delta: z.number().int().min(-1).max(1),
})
