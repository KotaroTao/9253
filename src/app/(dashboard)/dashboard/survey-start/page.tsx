import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { messages } from "@/lib/messages"

export default async function SurveyStartPage() {
  const session = await auth()

  if (!session?.user?.clinicId) {
    redirect("/login")
  }

  const clinicId = session.user.clinicId

  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId },
    include: {
      surveyTemplates: {
        where: { isActive: true },
        take: 1,
        orderBy: { createdAt: "desc" },
      },
    },
  })

  if (!clinic) {
    redirect("/login")
  }

  const template = clinic.surveyTemplates[0]

  if (!template) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border bg-card p-8 text-center">
          <p className="text-muted-foreground">
            {messages.nav.noTemplate}
          </p>
        </div>
      </div>
    )
  }

  // Directly redirect to kiosk with clinic slug (no staff selection)
  redirect(`/kiosk/${encodeURIComponent(clinic.slug)}`)
}
