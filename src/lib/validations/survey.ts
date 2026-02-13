import { z } from "zod"
import { messages } from "@/lib/messages"

export const surveySubmissionSchema = z.object({
  clinicSlug: z.string().min(1),
  templateId: z.string().uuid(messages.validations.invalidTemplateId),
  answers: z.record(
    z.string(),
    z.union([z.number().min(1).max(5), z.string().max(500)])
  ),
  freeText: z.string().max(500).optional(),
})

export type SurveySubmissionInput = z.infer<typeof surveySubmissionSchema>
