export interface SurveyFormState {
  currentStep: number
  answers: Record<string, number>
  freeText: string
  isSubmitting: boolean
  isComplete: boolean
}

export interface SurveySubmitResult {
  id: string
  reviewRequested: boolean
  googleReviewUrl: string | null
}

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
