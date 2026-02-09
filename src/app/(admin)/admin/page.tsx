import type { Metadata } from "next"
import { getAllClinics } from "@/lib/queries/clinics"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { messages } from "@/lib/messages"

export const metadata: Metadata = {
  title: "システム管理 | MIERU Clinic",
}

export default async function AdminPage() {
  const [{ clinics, total }, totalResponses] = await Promise.all([
    getAllClinics(),
    prisma.surveyResponse.count(),
  ])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{messages.admin.title}</h1>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {messages.admin.clinicCount}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {messages.admin.totalResponses}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalResponses.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Clinic list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {messages.admin.clinicList}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {clinics.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              {messages.common.noData}
            </p>
          ) : (
            <div className="space-y-3">
              {clinics.map((clinic) => (
                <div
                  key={clinic.id}
                  className="flex items-center justify-between rounded-md border p-4"
                >
                  <div>
                    <h3 className="font-medium">{clinic.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      /{clinic.slug}
                    </p>
                  </div>
                  <div className="flex gap-6 text-right text-sm">
                    <div>
                      <p className="font-medium">{clinic._count.staff}</p>
                      <p className="text-xs text-muted-foreground">{messages.common.staffLabel}</p>
                    </div>
                    <div>
                      <p className="font-medium">
                        {clinic._count.surveyResponses}
                      </p>
                      <p className="text-xs text-muted-foreground">{messages.common.responseCount}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
