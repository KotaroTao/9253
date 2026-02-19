import { z } from "zod"
import { messages } from "@/lib/messages"

export const patientAttributesSchema = z.object({
  visitType: z.enum(["first_visit", "revisit"]),
  insuranceType: z.enum(["insurance", "self_pay"]).optional(),
  purpose: z.enum([
    // New values (insurance 8 + self-pay 8)
    "cavity_treatment", "prosthetic_insurance", "periodontal", "checkup_insurance",
    "denture_insurance", "extraction_surgery", "root_canal", "emergency",
    "prosthetic_self_pay", "implant", "denture_self_pay", "wire_orthodontics",
    "aligner", "whitening", "self_pay_cleaning", "precision_root_canal",
    // Legacy values (backward compatibility)
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
})

export type SurveySubmissionInput = z.infer<typeof surveySubmissionSchema>
