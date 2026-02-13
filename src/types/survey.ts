export interface SurveyPageData {
  staffName: string
  clinicName: string
  templateId: string
  questions: {
    id: string
    text: string
    type: "rating" | "text"
    required: boolean
  }[]
  qrToken: string
}
