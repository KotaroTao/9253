import { z } from "zod"
import { messages } from "@/lib/messages"

export const createStaffSchema = z.object({
  name: z.string().min(1, messages.staff.nameRequired).max(50),
  role: z.enum(["staff", "dentist", "hygienist"]),
})

export const updateStaffSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  role: z.enum(["staff", "dentist", "hygienist"]).optional(),
  isActive: z.boolean().optional(),
})

export type CreateStaffInput = z.infer<typeof createStaffSchema>
export type UpdateStaffInput = z.infer<typeof updateStaffSchema>
