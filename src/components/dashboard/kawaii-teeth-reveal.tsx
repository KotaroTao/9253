"use client"

import { useState, useEffect } from "react"
import { Sparkles, X } from "lucide-react"
import { messages } from "@/lib/messages"
import { Confetti } from "@/components/survey/confetti"

interface AcquiredCharacter {
  character: {
    id: string
    name: string
    description: string
    imageData: string
  }
  count: number
  isNew: boolean
}

interface KawaiiTeethRevealProps {
  acquired: AcquiredCharacter | null
  onClose: () => void
}

type Phase = "sparkle" | "reveal" | "done"

export function KawaiiTeethReveal({ acquired, onClose }: KawaiiTeethRevealProps) {
  const [phase, setPhase] = useState<Phase>("sparkle")

  useEffect(() => {
    if (!acquired) return
    setPhase("sparkle")

    const t1 = setTimeout(() => setPhase("reveal"), 1500)
    const t2 = setTimeout(() => setPhase("done"), 2200)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [acquired])

  if (!acquired) return null

  const { character, count, isNew } = acquired
  const m = messages.kawaiiTeeth

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60" />

      {phase === "done" && <Confetti />}

      <div className="relative z-10 w-full max-w-xs">
        {/* Sparkle phase */}
        {phase === "sparkle" && (
          <div className="flex flex-col items-center gap-4 animate-pulse">
            <div className="relative">
              <Sparkles className="h-20 w-20 text-yellow-400 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl">🦷</span>
              </div>
            </div>
            <p className="text-lg font-bold text-white animate-bounce">
              {m.revealSparkle}
            </p>
          </div>
        )}

        {/* Reveal phase + Done */}
        {(phase === "reveal" || phase === "done") && (
          <div className="rounded-2xl border bg-card p-6 shadow-2xl text-center animate-in zoom-in-75 duration-500">
            <button
              type="button"
              onClick={onClose}
              className="absolute right-3 top-3 rounded-md p-1 text-muted-foreground hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </button>

            <p className="text-xs font-bold text-pink-600 uppercase tracking-wider mb-3">
              {isNew ? m.revealNew : m.revealDuplicate}
            </p>

            <div className="mx-auto h-28 w-28 overflow-hidden rounded-2xl border-2 border-pink-300 bg-gradient-to-br from-pink-50 to-white p-2 shadow-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={character.imageData}
                alt={character.name}
                className="h-full w-full object-contain"
              />
            </div>

            <h3 className="mt-4 text-xl font-bold">{character.name}</h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              {character.description}
            </p>

            {!isNew && (
              <p className="mt-3 text-xs text-pink-600 font-medium">
                {m.ownedCount}: {count}{m.ownedCountUnit}
              </p>
            )}

            <button
              type="button"
              onClick={onClose}
              className="mt-5 w-full rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 py-2.5 text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-90"
            >
              {m.revealClose}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
