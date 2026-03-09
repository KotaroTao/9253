import { z } from "zod"
import { messages } from "@/lib/messages"

export const createStaffSchema = z.object({
  name: z.string().min(1, messages.staff.nameRequired).max(50),
  role: z.enum(["staff", "dentist", "hygienist"]),
  // ログイン設定（オプション）
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  userRole: z.enum(["staff", "clinic_admin"]).optional(),
}).refine(
  (data) => {
    // email と password は両方指定するか、両方指定しないか
    if (data.email && !data.password) return false
    if (!data.email && data.password) return false
    return true
  },
  { message: "メールアドレスとパスワードは両方入力してください" }
)

export const updateStaffSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  role: z.enum(["staff", "dentist", "hygienist"]).optional(),
  isActive: z.boolean().optional(),
  // 既存スタッフへのログイン追加（オプション）
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  userRole: z.enum(["staff", "clinic_admin"]).optional(),
  // 既存ログインの管理
  removeLogin: z.boolean().optional(),
  newPassword: z.string().min(6).optional(),
}).refine(
  (data) => {
    if (data.email && !data.password) return false
    if (!data.email && data.password) return false
    return true
  },
  { message: "メールアドレスとパスワードは両方入力してください" }
)

export type CreateStaffInput = z.infer<typeof createStaffSchema>
export type UpdateStaffInput = z.infer<typeof updateStaffSchema>
