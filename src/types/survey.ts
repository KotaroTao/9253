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
