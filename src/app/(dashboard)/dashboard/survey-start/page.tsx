import { redirect } from "next/navigation"

export default function SurveyStartPage() {
  // Survey type selection is now on the dashboard home
  redirect("/dashboard")
}
