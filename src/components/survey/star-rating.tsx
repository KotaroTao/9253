"use client"

import { Star } from "lucide-react"
import { cn } from "@/lib/utils"
import { messages } from "@/lib/messages"

interface StarRatingProps {
  value: number
  onChange: (value: number) => void
  disabled?: boolean
}

export function StarRating({ value, onChange, disabled }: StarRatingProps) {
  return (
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          disabled={disabled}
          className={cn(
            "rounded-full p-2.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-90",
            star <= value ? "bg-yellow-50" : "bg-transparent",
            disabled && "cursor-not-allowed opacity-50"
          )}
          aria-label={`${star}${messages.survey.scoreSuffix}`}
        >
          <Star
            className={cn(
              "h-11 w-11 transition-colors",
              star <= value
                ? "fill-yellow-400 text-yellow-400"
                : "fill-none text-muted-foreground/30"
            )}
          />
        </button>
      ))}
    </div>
  )
}
