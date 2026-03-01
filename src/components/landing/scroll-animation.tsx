"use client"

import { useEffect, useRef, type ReactNode } from "react"
import { usePrefersReducedMotion } from "@/lib/use-reduced-motion"

export function ScrollAnimationProvider({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const prefersReducedMotion = usePrefersReducedMotion()

  useEffect(() => {
    const container = ref.current
    if (!container) return

    const elements = container.querySelectorAll(".animate-on-scroll")

    // reduced-motion 時は全要素を即座に表示
    if (prefersReducedMotion) {
      elements.forEach((el) => el.classList.add("visible"))
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible")
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    )

    elements.forEach((el) => observer.observe(el))

    return () => observer.disconnect()
  }, [prefersReducedMotion])

  return <div ref={ref}>{children}</div>
}
