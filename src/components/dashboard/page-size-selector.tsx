"use client"

import { useRouter, useSearchParams } from "next/navigation"

const PAGE_SIZES = [10, 20, 50] as const

interface PageSizeSelectorProps {
  currentLimit: number
  basePath: string
}

export function PageSizeSelector({ currentLimit, basePath }: PageSizeSelectorProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function handleChange(newLimit: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", "1")
    if (newLimit === 20) {
      params.delete("limit")
    } else {
      params.set("limit", String(newLimit))
    }
    router.push(`${basePath}?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-1">
      {PAGE_SIZES.map((size) => (
        <button
          key={size}
          onClick={() => handleChange(size)}
          className={`rounded px-2 py-0.5 text-xs font-medium transition-colors ${
            currentLimit === size
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted"
          }`}
        >
          {size}件
        </button>
      ))}
    </div>
  )
}
