"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { messages } from "@/lib/messages"

interface CollectedCharacter {
  id: string
  name: string
  description: string
  imageData: string
  count: number
  firstAcquiredAt: string
}

export function KawaiiTeethCollection({ embedded = false }: { embedded?: boolean }) {
  const [collection, setCollection] = useState<CollectedCharacter[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedChar, setSelectedChar] = useState<CollectedCharacter | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/kawaii-teeth/collection")
        if (res.ok) {
          const data = await res.json()
          setCollection(data)
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading || collection.length === 0) return null

  const m = messages.kawaiiTeeth

  const content = (
    <>
      <div className={embedded ? "flex items-center gap-2 mb-2" : "flex items-center gap-2 mb-3"}>
        <span className={embedded ? "text-sm" : "text-lg"}>🦷</span>
        <p className={embedded ? "text-xs font-bold text-pink-800" : "text-sm font-bold text-pink-800"}>{m.collectionTitle}</p>
        <span className="text-[10px] rounded-full bg-pink-100 px-2 py-0.5 font-medium text-pink-600">
          {collection.length}{m.collectionTypesCount}
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {collection.map((char) => (
          <button
            key={char.id}
            type="button"
            onClick={() => setSelectedChar(char)}
            className={cn(
              "group relative shrink-0 overflow-hidden rounded-xl border-2 border-pink-200 bg-white transition-all hover:border-pink-400 hover:shadow-md active:scale-95",
              embedded ? "h-11 w-11" : "h-14 w-14"
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={char.imageData}
              alt={char.name}
              className="h-full w-full object-contain p-1"
            />
            {char.count > 1 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-pink-500 px-1 text-[9px] font-bold text-white">
                {char.count}
              </span>
            )}
          </button>
        ))}
      </div>
    </>
  )

  return (
    <>
      {embedded ? (
        content
      ) : (
        <Card className="border-pink-200 bg-gradient-to-r from-pink-50/50 to-white">
          <CardContent className="py-5">
            {content}
          </CardContent>
        </Card>
      )}

      {/* Detail modal */}
      {selectedChar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40" onClick={() => setSelectedChar(null)} />
          <div className="relative z-10 w-full max-w-xs max-h-[90vh] overflow-y-auto rounded-2xl border bg-card p-6 shadow-2xl text-center">
            <button
              type="button"
              onClick={() => setSelectedChar(null)}
              className="absolute right-3 top-3 rounded-md p-1 text-muted-foreground hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="mx-auto h-24 w-24 overflow-hidden rounded-2xl border-2 border-pink-200 bg-pink-50 p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedChar.imageData}
                alt={selectedChar.name}
                className="h-full w-full object-contain"
              />
            </div>

            <h3 className="mt-4 text-lg font-bold">{selectedChar.name}</h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed whitespace-pre-line break-words">
              {selectedChar.description}
            </p>

            {selectedChar.count > 1 && (
              <p className="mt-3 text-xs text-pink-600 font-medium">
                {m.ownedCount}: {selectedChar.count}{m.ownedCountUnit}
              </p>
            )}

            <p className="mt-2 text-[10px] text-muted-foreground">
              {m.firstAcquired}: {new Date(selectedChar.firstAcquiredAt).toLocaleDateString("ja-JP")}
            </p>
          </div>
        </div>
      )}
    </>
  )
}
