export interface SurveyQuestion {
  id: string
  text: string
  type: "rating" | "text"
  required: boolean
  condition?: {
    chiefComplaint?: string[]
  }
}

export interface SurveyPageData {
  clinicName: string
  clinicSlug: string
  templateId: string
  templateName: string
  questions: SurveyQuestion[]
}

export interface SurveyTemplateInfo {
  id: string
  name: string
  questions: SurveyQuestion[]
}

export interface PatientAttributes {
  visitType: "first_visit" | "revisit"
  insuranceType: "insurance" | "self_pay"
  purpose: string
  ageGroup: string
  gender: string
  // Legacy fields (kept for backward compatibility with old data)
  treatmentType?: "treatment" | "checkup" | "consultation"
  chiefComplaint?: string
}

export interface KioskStaffInfo {
  id: string
  name: string
  role: string
}
