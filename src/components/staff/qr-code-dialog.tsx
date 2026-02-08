"use client"

import { QRCode } from "react-qrcode-logo"
import { Button } from "@/components/ui/button"
import { messages } from "@/lib/messages"
import { STAFF_ROLE_LABELS } from "@/lib/constants"
import type { StaffWithStats } from "@/types"

interface QrCodeDialogProps {
  staff: StaffWithStats
  onClose: () => void
}

export function QrCodeDialog({ staff, onClose }: QrCodeDialogProps) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.mieru-clinic.com"
  const surveyUrl = `${appUrl}/s/${staff.qrToken}`

  function handleDownload() {
    const canvas = document.querySelector("#qr-code canvas") as HTMLCanvasElement
    if (!canvas) return
    const link = document.createElement("a")
    link.download = `qr-${staff.name}.png`
    link.href = canvas.toDataURL("image/png")
    link.click()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-sm rounded-lg border bg-card p-6 shadow-lg">
        <h2 className="mb-2 text-center text-lg font-semibold">
          {messages.staff.qrCode}
        </h2>
        <p className="mb-4 text-center text-sm text-muted-foreground">
          {staff.name}（{STAFF_ROLE_LABELS[staff.role] ?? staff.role}）
        </p>

        <div id="qr-code" className="flex justify-center">
          <QRCode
            value={surveyUrl}
            size={200}
            qrStyle="dots"
            eyeRadius={5}
            fgColor="#1e40af"
          />
        </div>

        <p className="mt-3 break-all text-center text-xs text-muted-foreground">
          {surveyUrl}
        </p>

        <div className="mt-4 flex justify-center gap-2">
          <Button variant="outline" size="sm" onClick={handleDownload}>
            {messages.staff.download}
          </Button>
          <Button variant="outline" size="sm" onClick={onClose}>
            {messages.common.close}
          </Button>
        </div>
      </div>
    </div>
  )
}
