import { z } from "zod"
import { messages } from "@/lib/messages"

export const patientAttributesSchema = z.object({
  visitType: z.enum(["first_visit", "revisit"]),
  treatmentType: z.enum(["treatment", "checkup", "consultation"]),
  chiefComplaint: z.string().optional(),
  ageGroup: z.string().optional(),
  gender: z.string().optional(),
})

export const surveySubmissionSchema = z.object({
  clinicSlug: z.string().min(1),
  staffId: z.string().uuid().optional(),
  templateId: z.string().uuid(messages.validations.invalidTemplateId),
  answers: z.record(
    z.string(),
    z.union([z.number().min(1).max(5), z.string().max(500)])
  ),
  freeText: z.string().max(500).optional(),
  patientAttributes: patientAttributesSchema.optional(),
  responseDurationMs: z.number().int().min(0).max(600000).optional(),
  deviceUuid: z.string().uuid().optional(),
})

export type SurveySubmissionInput = z.infer<typeof surveySubmissionSchema>
