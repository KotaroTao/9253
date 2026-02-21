"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Settings,
  LogOut,
  Shield,
  Smartphone,
  QrCode,
  Target,
  PieChart,
  FileBarChart,
  PenSquare,
  ExternalLink,
  Brain,
  FlaskConical,
  Lock,
  Sparkles,
  Crown,
} from "lucide-react"
import { signOut } from "next-auth/react"
import { cn } from "@/lib/utils"
import { messages } from "@/lib/messages"
import { APP_NAME, PLANS, FEATURE_REQUIREMENTS } from "@/lib/constants"
import type { PlanInfo, PlanTier } from "@/types"

interface SidebarProps {
  role: string
  isOperatorMode?: boolean
  clinicSlug?: string
  planInfo?: PlanInfo
}

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  external?: boolean
  feature?: string // feature key for plan gating
}

function planLevel(plan: PlanTier): number {
  const order: PlanTier[] = ["free", "starter", "standard", "enterprise"]
  return order.indexOf(plan)
}

function hasFeatureAccess(effectivePlan: PlanTier, feature: string): boolean {
  const req = FEATURE_REQUIREMENTS[feature]
  if (!req) return true
  return planLevel(effectivePlan) >= planLevel(req)
}

const analyticsItems: NavItem[] = [
  { href: "/dashboard/analytics", label: messages.nav.analytics, icon: PieChart, feature: "analytics" },
  { href: "/dashboard/advisory", label: messages.nav.advisory, icon: Brain, feature: "advisory" },
  { href: "/dashboard/metrics", label: messages.nav.monthlyMetrics, icon: FileBarChart, feature: "business_metrics" },
  { href: "/dashboard/metrics/input", label: messages.nav.metricsInput, icon: PenSquare, feature: "business_metrics" },
  { href: "/dashboard/surveys", label: messages.nav.surveys, icon: ClipboardList, feature: "surveys_list" },
]

const actionItems: NavItem[] = [
  { href: "/dashboard/actions", label: messages.improvementActions.title, icon: Target, feature: "improvement_actions" },
]

function NavSection({
  label,
  items,
  pathname,
  effectivePlan,
}: {
  label: string
  items: NavItem[]
  pathname: string
  effectivePlan?: PlanTier
}) {
  return (
    <div>
      <p className="mb-1 px-3 pt-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
        {label}
      </p>
      {items.map((item) => {
        const isLocked = item.feature && effectivePlan
          ? !hasFeatureAccess(effectivePlan, item.feature)
          : false

        if (item.external) {
          return (
            <a
              key={item.href}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
              <ExternalLink className="ml-auto h-3 w-3 opacity-50" />
            </a>
          )
        }

        const isActive =
          item.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname === item.href || (pathname.startsWith(item.href + "/") && !items.some((other) => other.href !== item.href && other.href.startsWith(item.href) && pathname.startsWith(other.href)))
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isLocked
                ? "text-muted-foreground/50 hover:bg-muted/50"
                : isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <item.icon className={cn("h-4 w-4", isLocked && "opacity-50")} />
            <span className={cn(isLocked && "opacity-60")}>{item.label}</span>
            {isLocked && <Lock className="ml-auto h-3 w-3 text-muted-foreground/40" />}
          </Link>
        )
      })}
    </div>
  )
}

const PLAN_BADGE_STYLES: Record<PlanTier, string> = {
  free: "bg-slate-100 text-slate-700",
  starter: "bg-blue-100 text-blue-700",
  standard: "bg-primary/10 text-primary",
  enterprise: "bg-amber-100 text-amber-700",
}

export function Sidebar({ role, isOperatorMode = false, clinicSlug, planInfo }: SidebarProps) {
  const pathname = usePathname()
  const isAdmin = role === "clinic_admin" || role === "system_admin"
  const effectivePlan = planInfo?.effectivePlan

  const kioskUrl = clinicSlug ? `/kiosk/${encodeURIComponent(clinicSlug)}` : null
  const patientSurveyUrl = clinicSlug ? `/s/${encodeURIComponent(clinicSlug)}` : null

  const adminItems: NavItem[] = [
    { href: "/dashboard/staff", label: messages.nav.staff, icon: Users, feature: "staff_management" },
    { href: "/dashboard/test", label: messages.nav.testSurvey, icon: FlaskConical },
    { href: "/dashboard/settings", label: messages.nav.settings, icon: Settings },
  ]

  return (
    <aside className="flex h-screen w-60 flex-col border-r bg-card">
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/dashboard" className="text-lg font-bold text-primary">
          {APP_NAME}
        </Link>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-2">
        {/* Home link */}
        <Link
          href="/dashboard"
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            pathname === "/dashboard"
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <LayoutDashboard className="h-4 w-4" />
          {messages.nav.dashboard}
        </Link>

        {/* Survey CTA buttons */}
        {(kioskUrl || patientSurveyUrl) && (
          <div className="grid grid-cols-2 gap-1.5 px-1 py-3">
            {kioskUrl && (
              <a
                href={kioskUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-1.5 rounded-xl border-2 border-blue-200 bg-gradient-to-b from-blue-50 to-white px-2 py-3 transition-all hover:border-blue-400 hover:shadow-sm active:scale-[0.97]"
              >
                <Smartphone className="h-5 w-5 text-blue-500" />
                <span className="text-[11px] font-bold text-blue-800 leading-tight text-center">アンケート<br />（医院端末）</span>
              </a>
            )}
            {patientSurveyUrl && (
              <a
                href={patientSurveyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-1.5 rounded-xl border-2 border-emerald-200 bg-gradient-to-b from-emerald-50 to-white px-2 py-3 transition-all hover:border-emerald-400 hover:shadow-sm active:scale-[0.97]"
              >
                <QrCode className="h-5 w-5 text-emerald-500" />
                <span className="text-[11px] font-bold text-emerald-800 leading-tight text-center">アンケート<br />（患者端末）</span>
              </a>
            )}
          </div>
        )}

        {isAdmin && (
          <>
            <NavSection label={messages.nav.sectionAnalytics} items={analyticsItems} pathname={pathname} effectivePlan={effectivePlan} />
            <NavSection label={messages.nav.sectionActions} items={actionItems} pathname={pathname} effectivePlan={effectivePlan} />
            <NavSection label={messages.nav.sectionAdmin} items={adminItems} pathname={pathname} effectivePlan={effectivePlan} />
          </>
        )}
        {role === "system_admin" && (
          <div className="pt-2">
            <Link
              href="/admin"
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                pathname.startsWith("/admin")
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Shield className="h-4 w-4" />
              {messages.nav.systemAdmin}
            </Link>
          </div>
        )}
      </nav>

      {/* Plan badge */}
      {planInfo && (
        <div className="border-t px-3 py-2.5">
          <div className="flex items-center gap-2">
            <span className={cn(
              "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
              PLAN_BADGE_STYLES[planInfo.effectivePlan]
            )}>
              {planInfo.effectivePlan === "enterprise" ? (
                <Crown className="h-3 w-3" />
              ) : planInfo.isTrialActive ? (
                <Sparkles className="h-3 w-3" />
              ) : null}
              {PLANS[planInfo.effectivePlan].name}
              {planInfo.isTrialActive && (
                <span className="ml-0.5 text-[10px] opacity-75">
                  ({messages.plan.trialDaysRemaining.replace("{days}", String(planInfo.trialDaysRemaining ?? 0))})
                </span>
              )}
            </span>
          </div>
        </div>
      )}

      <div className="space-y-1 border-t p-2">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
          {messages.common.logout}
        </button>
      </div>
    </aside>
  )
}
