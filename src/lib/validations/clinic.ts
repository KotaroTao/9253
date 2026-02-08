import { z } from "zod"
import { messages } from "@/lib/messages"

export const updateClinicSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  enableReviewRequest: z.boolean().optional(),
  googleReviewUrl: z.string().url(messages.validations.validUrl).optional().or(z.literal("")),
  googlePlaceId: z.string().optional(),
})

export const createClinicSchema = z.object({
  name: z.string().min(1, messages.validations.clinicNameRequired).max(100),
  slug: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-z0-9-]+$/, messages.validations.slugFormat),
  googlePlaceId: z.string().optional(),
  googleReviewUrl: z.string().url().optional().or(z.literal("")),
  adminEmail: z.string().email().optional(),
  adminPassword: z.string().min(6).optional(),
  adminName: z.string().min(1).optional(),
})

export type UpdateClinicInput = z.infer<typeof updateClinicSchema>
export type CreateClinicInput = z.infer<typeof createClinicSchema>
