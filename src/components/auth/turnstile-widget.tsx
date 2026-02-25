"use client"

import { useEffect, useRef, useCallback } from "react"

interface TurnstileWidgetProps {
  onVerify: (token: string) => void
}

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: Record<string, unknown>) => string
      reset: (widgetId: string) => void
    }
    onTurnstileLoad?: () => void
  }
}

export function TurnstileWidget({ onVerify }: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

  const renderWidget = useCallback(() => {
    if (!containerRef.current || !window.turnstile || !siteKey) return
    if (widgetIdRef.current) return // 既にレンダー済み

    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      callback: (token: string) => onVerify(token),
      theme: "light",
      language: "ja",
    })
  }, [onVerify, siteKey])

  useEffect(() => {
    if (!siteKey) return

    // Turnstile スクリプトが既にロード済みの場合
    if (window.turnstile) {
      renderWidget()
      return
    }

    // スクリプトをロード
    window.onTurnstileLoad = renderWidget

    const existing = document.querySelector('script[src*="turnstile"]')
    if (!existing) {
      const script = document.createElement("script")
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad"
      script.async = true
      script.defer = true
      document.head.appendChild(script)
    }
  }, [renderWidget, siteKey])

  // Turnstile未設定の場合は何も表示しない
  if (!siteKey) return null

  return <div ref={containerRef} className="flex justify-center" />
}
