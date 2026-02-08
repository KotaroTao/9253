import { z } from "zod"
import { messages } from "@/lib/messages"

export const loginSchema = z.object({
  email: z.string().email(messages.auth.emailRequired),
  password: z.string().min(6, messages.auth.passwordRequired),
})

export type LoginInput = z.infer<typeof loginSchema>
