import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { getOperatorClinicId } from "@/lib/admin-mode"
import { prisma } from "@/lib/prisma"
import { ROLES } from "@/lib/constants"
import { TestSurveyPage } from "@/components/dashboard/test-survey-page"

export default async function TestPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  const operatorClinicId = session.user.role === ROLES.SYSTEM_ADMIN ? getOperatorClinicId() : null
  const clinicId = operatorClinicId ?? session.user.clinicId
  if (!clinicId) {
    redirect("/login")
  }

  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId },
    select: { slug: true },
  })

  if (!clinic) {
    redirect("/dashboard")
  }

  return <TestSurveyPage clinicSlug={clinic.slug} />
}
