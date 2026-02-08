import { z } from "zod"

export const updateClinicSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  enableReviewRequest: z.boolean().optional(),
  googleReviewUrl: z.string().url("有効なURLを入力してください").optional().or(z.literal("")),
  googlePlaceId: z.string().optional(),
})

export const createClinicSchema = z.object({
  name: z.string().min(1, "クリニック名を入力してください").max(100),
  slug: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-z0-9-]+$/, "英小文字・数字・ハイフンのみ使用できます"),
  googlePlaceId: z.string().optional(),
  googleReviewUrl: z.string().url().optional().or(z.literal("")),
  adminEmail: z.string().email().optional(),
  adminPassword: z.string().min(6).optional(),
  adminName: z.string().min(1).optional(),
})

export type UpdateClinicInput = z.infer<typeof updateClinicSchema>
export type CreateClinicInput = z.infer<typeof createClinicSchema>
