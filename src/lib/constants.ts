export const APP_NAME = "MIERU Clinic"
export const APP_DESCRIPTION = "患者体験の見える化"

export const ROLES = {
  SYSTEM_ADMIN: "system_admin",
  CLINIC_ADMIN: "clinic_admin",
  STAFF: "staff",
} as const

export const STAFF_ROLES = {
  DENTIST: "dentist",
  HYGIENIST: "hygienist",
  STAFF: "staff",
} as const

export const STAFF_ROLE_LABELS: Record<string, string> = {
  dentist: "歯科医師",
  hygienist: "歯科衛生士",
  staff: "スタッフ",
}

export const SURVEY_QUESTION_TYPES = {
  RATING: "rating",
  TEXT: "text",
} as const

export const DEFAULTS = {
  ITEMS_PER_PAGE: 20,
  CHART_MONTHS: 6,
  MAX_FREE_TEXT_LENGTH: 500,
  MIN_STAR_RATING: 1,
  MAX_STAR_RATING: 5,
} as const
