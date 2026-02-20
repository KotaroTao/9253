"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { messages } from "@/lib/messages"
import { Smartphone, QrCode, ExternalLink, FlaskConical } from "lucide-react"

interface TestSurveyPageProps {
  clinicSlug: string
}

export function TestSurveyPage({ clinicSlug }: TestSurveyPageProps) {
  const kioskTestUrl = `/kiosk/${encodeURIComponent(clinicSlug)}?test=1`
  const patientTestUrl = `/s/${encodeURIComponent(clinicSlug)}?test=1`

  return (
    <div className="space-y-6">
      {/* テストモード注意事項 */}
      <div className="flex items-start gap-3 rounded-xl border-2 border-amber-200 bg-amber-50 p-4">
        <FlaskConical className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
        <div>
          <p className="text-sm font-semibold text-amber-800">{messages.testSurvey.testBadge}</p>
          <p className="text-sm text-amber-700">{messages.testSurvey.description}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* 医院端末テスト */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                <Smartphone className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-base">{messages.testSurvey.clinicDevice}</CardTitle>
                <CardDescription className="text-xs">{messages.testSurvey.clinicDeviceDesc}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <a
              href={kioskTestUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              <ExternalLink className="h-4 w-4" />
              {messages.testSurvey.openInNewTab}
            </a>
          </CardContent>
        </Card>

        {/* 患者端末テスト */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                <QrCode className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-base">{messages.testSurvey.patientDevice}</CardTitle>
                <CardDescription className="text-xs">{messages.testSurvey.patientDeviceDesc}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <a
              href={patientTestUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-green-700"
            >
              <ExternalLink className="h-4 w-4" />
              {messages.testSurvey.openInNewTab}
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
