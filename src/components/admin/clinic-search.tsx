"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useState, useCallback } from "react"
import { Search, X } from "lucide-react"
import { messages } from "@/lib/messages"

export function ClinicSearch() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentSearch = searchParams.get("search") ?? ""
  const [value, setValue] = useState(currentSearch)

  const handleSearch = useCallback(
    (searchValue: string) => {
      const params = new URLSearchParams()
      if (searchValue.trim()) {
        params.set("search", searchValue.trim())
      }
      // 検索時はページを1にリセット
      router.push(`/admin?${params.toString()}`)
    },
    [router]
  )

  const handleClear = useCallback(() => {
    setValue("")
    router.push("/admin")
  }, [router])

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            handleSearch(value)
          }
        }}
        placeholder={messages.admin.searchPlaceholder}
        className="w-full rounded-md border bg-background py-2 pl-9 pr-9 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:ring-offset-2"
      />
      {value && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
