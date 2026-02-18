"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { messages } from "@/lib/messages"
import { APP_NAME } from "@/lib/constants"

const navLinks = [
  { href: "#pain", label: messages.landing.painNav },
  { href: "#features", label: messages.landing.features },
  { href: "#flow", label: messages.landing.flow },
  { href: "#results", label: messages.landing.resultsNav },
  { href: "#faq", label: messages.landing.faq },
]

export function LandingHeader() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="text-xl font-bold text-gradient">
          {APP_NAME}
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
          <Link href="/login">
            <Button variant="outline" size="sm">
              {messages.landing.login}
            </Button>
          </Link>
          <a href="#cta">
            <Button size="sm">{messages.landing.heroCta}</Button>
          </a>
        </nav>

        {/* Mobile toggle */}
        <div className="flex items-center gap-3 md:hidden">
          <Link href="/login">
            <Button variant="outline" size="sm">
              {messages.landing.login}
            </Button>
          </Link>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 text-muted-foreground hover:text-foreground"
            aria-label="メニュー"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t bg-background md:hidden">
          <nav className="container flex flex-col gap-1 py-4">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
            <div className="mt-2 px-3">
              <a href="#cta" onClick={() => setMobileOpen(false)}>
                <Button className="w-full" size="sm">
                  {messages.landing.heroCta}
                </Button>
              </a>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
