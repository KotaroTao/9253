export interface SurveyPageData {
  clinicName: string
  clinicSlug: string
  templateId: string
  templateName: string
  questions: {
    id: string
    text: string
    type: "rating" | "text"
    required: boolean
  }[]
}

export interface SurveyTemplateInfo {
  id: string
  name: string
  questions: SurveyPageData["questions"]
}

export interface PatientAttributes {
  visitType: "first_visit" | "revisit"
  treatmentType: "treatment" | "checkup" | "consultation"
  chiefComplaint: string
  ageGroup: string
  gender: string
}
