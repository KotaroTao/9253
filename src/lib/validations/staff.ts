import { z } from "zod"

export const createStaffSchema = z.object({
  name: z.string().min(1, "名前を入力してください").max(50),
  role: z.enum(["staff", "dentist", "hygienist"]),
})

export const updateStaffSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  role: z.enum(["staff", "dentist", "hygienist"]).optional(),
  isActive: z.boolean().optional(),
})

export type CreateStaffInput = z.infer<typeof createStaffSchema>
export type UpdateStaffInput = z.infer<typeof updateStaffSchema>
