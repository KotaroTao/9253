"use client"

import { LogIn } from "lucide-react"

interface OperatorLoginButtonProps {
  clinicId: string
}

export function OperatorLoginButton({ clinicId }: OperatorLoginButtonProps) {
  function handleClick() {
    window.open(
      `/api/admin/operator-login?clinicId=${encodeURIComponent(clinicId)}`,
      "_blank"
    )
  }

  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-1.5 rounded-md border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-medium text-violet-700 transition-colors hover:bg-violet-100 hover:border-violet-300"
    >
      <LogIn className="h-3.5 w-3.5" />
      ログイン
    </button>
  )
}
