"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { messages } from "@/lib/messages"

const faqs = [
  { q: messages.landing.faq1Q, a: messages.landing.faq1A },
  { q: messages.landing.faq2Q, a: messages.landing.faq2A },
  { q: messages.landing.faq3Q, a: messages.landing.faq3A },
  { q: messages.landing.faq4Q, a: messages.landing.faq4A },
  { q: messages.landing.faq5Q, a: messages.landing.faq5A },
]

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section id="faq" className="py-20 lg:py-28">
      <div className="container max-w-3xl">
        <div className="mb-14 text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {messages.landing.faqTitle}
          </h2>
        </div>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="rounded-xl border bg-card transition-colors hover:border-primary/20"
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="flex w-full items-center justify-between px-6 py-5 text-left"
              >
                <span className="pr-4 font-medium">{faq.q}</span>
                <ChevronDown
                  className={cn(
                    "h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200",
                    openIndex === i && "rotate-180"
                  )}
                />
              </button>
              <div
                className={cn(
                  "grid transition-all duration-200 ease-in-out",
                  openIndex === i
                    ? "grid-rows-[1fr] opacity-100"
                    : "grid-rows-[0fr] opacity-0"
                )}
              >
                <div className="overflow-hidden">
                  <p className="px-6 pb-5 text-sm leading-relaxed text-muted-foreground">
                    {faq.a}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
