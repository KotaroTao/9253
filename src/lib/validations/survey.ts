import { z } from "zod"
import { messages } from "@/lib/messages"

export const patientAttributesSchema = z.object({
  visitType: z.enum(["first_visit", "revisit"]),
  insuranceType: z.enum(["insurance", "self_pay"]).optional(),
  purpose: z.enum([
    // Insurance purposes (8)
    "cavity_treatment", "periodontal", "prosthetic_insurance", "denture_insurance",
    "checkup_insurance", "extraction_surgery", "emergency", "other_insurance",
    // Self-pay purposes (10)
    "cavity_treatment_self", "periodontal_self", "prosthetic_self_pay", "denture_self_pay",
    "self_pay_cleaning", "implant", "wire_orthodontics", "aligner", "whitening", "other_self_pay",
    // Legacy values (backward compatibility)
    "root_canal", "precision_root_canal",
    "treatment", "checkup", "denture", "orthodontics", "cosmetic", "preventive",
  ]).optional(),
  ageGroup: z.string().optional(),
  gender: z.string().optional(),
  // Legacy fields (accepted for backward compatibility)
  treatmentType: z.enum(["treatment", "checkup", "consultation"]).optional(),
  chiefComplaint: z.string().optional(),
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
  isTest: z.boolean().optional(),
})

export type SurveySubmissionInput = z.infer<typeof surveySubmissionSchema>
