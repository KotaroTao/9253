"use client"

import { useEffect, useState, useCallback } from "react"
import { List, X, ChevronRight } from "lucide-react"

export interface TocItem {
  id: string
  number: string
  title: string
}

interface TocSidebarProps {
  items: TocItem[]
}

export function TocSidebar({ items }: TocSidebarProps) {
  const [activeId, setActiveId] = useState<string>("")
  const [mobileOpen, setMobileOpen] = useState(false)

  /* ---- Scroll spy via IntersectionObserver ---- */
  useEffect(() => {
    const ids = items.map((i) => i.id)
    const observer = new IntersectionObserver(
      (entries) => {
        // Pick the first entry that is intersecting from the top
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible.length > 0) {
          setActiveId(visible[0].target.id)
        }
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0 },
    )

    ids.forEach((id) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [items])

  const scrollTo = useCallback(
    (id: string) => {
      const el = document.getElementById(id)
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" })
        setActiveId(id)
        setMobileOpen(false)
      }
    },
    [],
  )

  return (
    <>
      {/* ===== Desktop sidebar ===== */}
      <nav className="hidden lg:block sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto pr-4 pb-8">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          目次
        </p>
        <ul className="space-y-0.5">
          {items.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => scrollTo(item.id)}
                className={`flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-left text-[13px] leading-snug transition-colors ${
                  activeId === item.id
                    ? "bg-primary/10 font-medium text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <span className="shrink-0 w-6 text-right text-[11px] opacity-60">{item.number}</span>
                <span className="truncate">{item.title}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* ===== Mobile floating button ===== */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30"
        aria-label="目次を開く"
      >
        <List className="h-5 w-5" />
      </button>

      {/* ===== Mobile overlay ===== */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-[60]">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
          {/* Panel */}
          <div className="absolute right-0 top-0 h-full w-80 max-w-[85vw] overflow-y-auto bg-background p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-semibold">目次</p>
              <button
                onClick={() => setMobileOpen(false)}
                className="rounded-lg p-1.5 hover:bg-muted"
                aria-label="閉じる"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <ul className="space-y-0.5">
              {items.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => scrollTo(item.id)}
                    className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                      activeId === item.id
                        ? "bg-primary/10 font-medium text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <span className="shrink-0 w-6 text-right text-xs opacity-60">{item.number}</span>
                    <span>{item.title}</span>
                    {activeId === item.id && (
                      <ChevronRight className="ml-auto h-3.5 w-3.5 shrink-0" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  )
}
