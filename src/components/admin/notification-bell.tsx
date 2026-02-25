"use client"

import { useState, useEffect, useRef } from "react"
import { Bell } from "lucide-react"
import { messages } from "@/lib/messages"

interface Notification {
  id: string
  type: string
  title: string
  message: string
  isRead: boolean
  createdAt: string
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return messages.notifications.minutesAgo.replace("{minutes}", String(Math.max(1, minutes)))
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return messages.notifications.hoursAgo.replace("{hours}", String(hours))
  const days = Math.floor(hours / 24)
  return messages.notifications.daysAgo.replace("{days}", String(days))
}

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchNotifications()
    // ポーリング: 60秒ごと
    const interval = setInterval(fetchNotifications, 60000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  async function fetchNotifications() {
    try {
      const res = await fetch("/api/admin/notifications")
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications)
        setUnreadCount(data.unreadCount)
      }
    } catch { /* ignore */ }
  }

  async function markAllRead() {
    try {
      const res = await fetch("/api/admin/notifications", { method: "PATCH" })
      if (res.ok) {
        setUnreadCount(0)
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
      }
    } catch { /* ignore */ }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-80 rounded-lg border bg-card shadow-lg">
          <div className="flex items-center justify-between border-b px-3 py-2">
            <h3 className="text-sm font-semibold">{messages.notifications.title}</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-primary hover:underline"
              >
                {messages.notifications.markAllRead}
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                {messages.notifications.noNotifications}
              </p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`border-b last:border-0 px-3 py-2.5 ${!n.isRead ? "bg-blue-50/50" : ""}`}
                >
                  <p className="text-sm">{n.message}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {formatTimeAgo(n.createdAt)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
