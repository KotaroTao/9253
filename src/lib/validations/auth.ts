import { z } from "zod"
import { messages } from "@/lib/messages"

export const loginSchema = z.object({
  email: z.string().email(messages.auth.emailRequired),
  password: z.string().min(6, messages.auth.passwordRequired),
})

export type LoginInput = z.infer<typeof loginSchema>

export const registerSchema = z.object({
  clinicName: z.string().min(1, messages.auth.clinicNameRequired).max(100),
  adminName: z.string().min(1, messages.auth.adminNameRequired).max(100),
  email: z.string().email(messages.auth.emailRequired),
  password: z.string().min(6, messages.auth.passwordRequired),
  passwordConfirm: z.string().min(6, messages.auth.passwordRequired),
  termsAgreed: z.literal(true, {
    errorMap: () => ({ message: messages.auth.termsRequired }),
  }),
}).refine((data) => data.password === data.passwordConfirm, {
  message: messages.auth.passwordMismatch,
  path: ["passwordConfirm"],
})

export type RegisterInput = z.infer<typeof registerSchema>

export const forgotPasswordSchema = z.object({
  email: z.string().email(messages.auth.emailRequired),
})

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(6, messages.auth.passwordRequired),
  passwordConfirm: z.string().min(6, messages.auth.passwordRequired),
}).refine((data) => data.password === data.passwordConfirm, {
  message: messages.auth.passwordMismatch,
  path: ["passwordConfirm"],
})

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
