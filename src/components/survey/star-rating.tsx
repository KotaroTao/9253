"use client"

import { useState, useCallback, useEffect } from "react"
import { Star } from "lucide-react"
import { cn } from "@/lib/utils"
import { messages } from "@/lib/messages"

interface StarRatingProps {
  value: number
  onChange: (value: number) => void
  disabled?: boolean
  large?: boolean
}

export function StarRating({ value, onChange, disabled, large }: StarRatingProps) {
  const [hovering, setHovering] = useState(0)

  // Reset hover state when value changes (prevents stale hover from previous interaction)
  useEffect(() => {
    setHovering(0)
  }, [value])

  // Use mouseenter/mouseleave instead of pointer events to prevent phantom selection on iPad.
  // Touch interactions do not fire mouse events during scroll/proximity,
  // while trackpad/mouse interactions correctly trigger them.
  const handleMouseEnter = useCallback((star: number) => {
    setHovering(star)
  }, [])

  const handleMouseLeave = useCallback(() => {
    setHovering(0)
  }, [])

  const handleClick = useCallback((star: number) => {
    setHovering(0)
    onChange(star)
  }, [onChange])

  const displayValue = hovering || value

  return (
    <div className={cn("flex", large ? "gap-3" : "gap-2")} role="radiogroup" aria-label={messages.survey.scoreSuffix}>
      {[1, 2, 3, 4, 5].map((star) => {
        const isActive = displayValue > 0 && star <= displayValue
        return (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={value === star}
            onClick={() => handleClick(star)}
            onMouseEnter={() => handleMouseEnter(star)}
            onMouseLeave={handleMouseLeave}
            disabled={disabled}
            className={cn(
              "rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              large ? "p-3" : "p-2.5",
              isActive ? "bg-yellow-50 scale-110" : "bg-transparent scale-100",
              value > 0 && star === value && "scale-125",
              disabled && "cursor-not-allowed opacity-50",
              "active:scale-90"
            )}
            aria-label={`${star}${messages.survey.scoreSuffix}`}
          >
            <Star
              className={cn(
                "transition-all duration-200",
                large ? "h-14 w-14" : "h-11 w-11",
                isActive
                  ? "fill-yellow-400 text-yellow-400 drop-shadow-sm"
                  : "fill-none text-muted-foreground/30"
              )}
            />
          </button>
        )
      })}
    </div>
  )
}
