import crypto from "crypto"
import { logger } from "@/lib/logger"
import { prisma } from "@/lib/prisma"
import {
  SETTING_KEY as EMAIL_TEMPLATES_KEY,
  DEFAULT_VERIFICATION_TEMPLATE,
  DEFAULT_WELCOME_TEMPLATE,
  type EmailTemplatesSettingValue,
  type VerificationEmailTemplate,
  type WelcomeEmailTemplate,
} from "@/lib/email-templates"

/**
 * メール送信ユーティリティ（Resend API）
 *
 * 環境変数 SMTP_HOST が設定されている場合は Resend API で送信。
 * 未設定の場合はコンソールにログ出力（開発用フォールバック）。
 *
 * 必要な環境変数（本番用）:
 *   SMTP_HOST: Resend API エンドポイント（https://api.resend.com/emails）
 *   SMTP_PASS: Resend API キー（re_xxxxxxxx）
 *   SMTP_FROM: 送信元アドレス（例: MIERU Clinic <register@mieru-clinic.com>）
 */

interface SendMailOptions {
  to: string
  subject: string
  html: string
}

/** 一時的なエラー（リトライ対象）かどうか判定 */
function isTransientError(status: number): boolean {
  return status >= 500 || status === 408 || status === 429
}

/** 指定ミリ秒待機 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

const MAX_RETRIES = 2
const RETRY_DELAYS = [1000, 3000] // 1秒, 3秒

export async function sendMail({ to, subject, html }: SendMailOptions): Promise<boolean> {
  const smtpHost = process.env.SMTP_HOST

  if (smtpHost) {
    const apiKey = process.env.SMTP_PASS
    if (!apiKey) {
      logger.error("SMTP_PASS is not configured — cannot authenticate with mail API", {
        component: "sendMail", to, subject,
      })
      return false
    }

    const fromAddress = process.env.SMTP_FROM || "MIERU Clinic <register@mieru-clinic.com>"
    const payload = JSON.stringify({ from: fromAddress, to, subject, html })

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const res = await fetch(smtpHost, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
          },
          body: payload,
        })

        if (res.ok) {
          if (attempt > 0) {
            logger.info("Mail sent after retry", { component: "sendMail", to, attempt })
          }
          return true
        }

        const body = await res.text().catch(() => "")

        // 一時的なエラーならリトライ
        if (isTransientError(res.status) && attempt < MAX_RETRIES) {
          logger.warn("Mail API transient error, retrying", {
            component: "sendMail", to, status: res.status, attempt: attempt + 1, body,
          })
          await sleep(RETRY_DELAYS[attempt])
          continue
        }

        // リトライ不可のエラー（認証失敗、バリデーションエラー等）
        logger.error("Mail API responded with error", {
          component: "sendMail", to, subject, status: res.status, body, attempt,
        })
        return false
      } catch (err) {
        // ネットワークエラーはリトライ
        if (attempt < MAX_RETRIES) {
          logger.warn("Mail send network error, retrying", {
            component: "sendMail", to, error: String(err), attempt: attempt + 1,
          })
          await sleep(RETRY_DELAYS[attempt])
          continue
        }
        logger.error("Mail send failed after retries", {
          component: "sendMail", to, subject, error: String(err), attempts: attempt + 1,
        })
        return false
      }
    }

    return false
  }

  // SMTP未設定: 開発環境ではログ出力して成功扱い、本番では警告
  if (process.env.NODE_ENV === "production") {
    logger.error("SMTP_HOST is not configured — email not sent", { component: "sendMail", to, subject })
    return false
  }

  logger.info("Mail sent (dev fallback — SMTP_HOST not set)", { component: "sendMail", to, subject })
  return true
}

/** 安全なランダムトークンを生成（タイムスタンプ付きで有効期限判定に使用） */
export function generateVerificationToken(): string {
  const timestamp = Date.now().toString(36)
  const random = crypto.randomBytes(32).toString("hex")
  return `${timestamp}.${random}`
}

/** トークンから発行時刻を取得（ミリ秒）。パース不能時は null */
export function getTokenTimestamp(token: string): number | null {
  const dotIndex = token.indexOf(".")
  if (dotIndex === -1) return null
  const timestamp = parseInt(token.substring(0, dotIndex), 36)
  return Number.isFinite(timestamp) ? timestamp : null
}

/** HTMLエスケープ（XSS防止） */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

/** 共通メールレイアウト */
function emailLayout(body: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://mieru-clinic.com"
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #334155;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #0f172a; font-size: 24px;">MIERU Clinic</h1>
  </div>
  ${body}
  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
  <p style="color: #94a3b8; font-size: 12px; text-align: center;">
    <a href="${appUrl}" style="color: #94a3b8;">MIERU Clinic</a> — 患者体験の見える化
  </p>
</body>
</html>`.trim()
}

/** PlatformSettingからカスタムメールテンプレートを取得。未設定時はデフォルトを返す */
export async function getEmailTemplates(): Promise<{
  verification: VerificationEmailTemplate
  welcome: WelcomeEmailTemplate
  isCustom: boolean
}> {
  try {
    const setting = await prisma.platformSetting.findUnique({
      where: { key: EMAIL_TEMPLATES_KEY },
    })
    if (setting) {
      const value = setting.value as unknown as EmailTemplatesSettingValue
      return {
        verification: value.verification ?? DEFAULT_VERIFICATION_TEMPLATE,
        welcome: value.welcome ?? DEFAULT_WELCOME_TEMPLATE,
        isCustom: true,
      }
    }
  } catch (err) {
    logger.warn("Failed to fetch email templates, using defaults", {
      component: "getEmailTemplates", error: String(err),
    })
  }
  return {
    verification: DEFAULT_VERIFICATION_TEMPLATE,
    welcome: DEFAULT_WELCOME_TEMPLATE,
    isCustom: false,
  }
}

/** メール認証用のHTMLメール本文を生成 */
export function buildVerificationEmail(
  verifyUrl: string,
  clinicName: string,
  template?: VerificationEmailTemplate,
): {
  subject: string
  html: string
} {
  const t = template ?? DEFAULT_VERIFICATION_TEMPLATE
  const safeName = escapeHtml(clinicName)
  return {
    subject: t.subject,
    html: emailLayout(`
  <p>${safeName} 様</p>
  <p>${escapeHtml(t.greeting)}</p>
  ${t.body ? `<p>${escapeHtml(t.body)}</p>` : ""}
  <div style="text-align: center; margin: 30px 0;">
    <a href="${verifyUrl}" style="display: inline-block; background-color: #0f172a; color: #ffffff; padding: 12px 32px; border-radius: 6px; text-decoration: none; font-weight: bold;">
      メールアドレスを確認する
    </a>
  </div>
  <p style="color: #64748b; font-size: 14px;">ボタンが動作しない場合は、以下のURLをブラウザに貼り付けてください:</p>
  <p style="color: #64748b; font-size: 12px; word-break: break-all;">${verifyUrl}</p>
  <p style="color: #64748b; font-size: 14px;">このリンクの有効期限は24時間です。</p>
  ${t.note ? `<p style="color: #94a3b8; font-size: 12px;">${escapeHtml(t.note)}</p>` : ""}
`),
  }
}

/** ウェルカムメール（メール認証完了後に送信） */
export function buildWelcomeEmail(
  clinicName: string,
  loginUrl: string,
  template?: WelcomeEmailTemplate,
): {
  subject: string
  html: string
} {
  const t = template ?? DEFAULT_WELCOME_TEMPLATE
  const safeName = escapeHtml(clinicName)
  const steps = t.steps ?? DEFAULT_WELCOME_TEMPLATE.steps!
  const stepsHtml = steps.map((step, i) => {
    const borderRadius = i === 0
      ? "border-radius: 8px 8px 0 0;"
      : i === steps.length - 1
        ? "border-radius: 0 0 8px 8px;"
        : ""
    const borderBottom = i < steps.length - 1 ? "border-bottom: 1px solid #e0f2fe;" : ""
    return `
    <tr>
      <td style="padding: 12px; background: #f0f9ff; ${borderRadius} ${borderBottom}">
        <strong style="color: #0369a1;">Step ${i + 1}.</strong> ${escapeHtml(step.title)}<br>
        <span style="font-size: 13px; color: #64748b;">${escapeHtml(step.description)}</span>
      </td>
    </tr>`
  }).join("")

  return {
    subject: t.subject,
    html: emailLayout(`
  <p>${safeName} 様</p>
  <p>${escapeHtml(t.greeting)}</p>
  ${t.body ? `<p>${escapeHtml(t.body)}</p>` : ""}
  <h2 style="font-size: 16px; color: #0f172a; margin-top: 24px;">最初にやること 3ステップ</h2>
  <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
    ${stepsHtml}
  </table>
  <div style="text-align: center; margin: 24px 0;">
    <a href="${loginUrl}" style="display: inline-block; background-color: #0f172a; color: #ffffff; padding: 12px 32px; border-radius: 6px; text-decoration: none; font-weight: bold;">
      ダッシュボードにログイン
    </a>
  </div>
  ${t.note ? `<p style="color: #64748b; font-size: 14px;">${escapeHtml(t.note)}</p>` : ""}
`),
  }
}

/** 未利用リマインダーメール */
export function buildReminderEmail(clinicName: string, loginUrl: string, daysSinceRegistration: number): {
  subject: string
  html: string
} {
  let message: string
  let cta: string

  if (daysSinceRegistration <= 3) {
    message = "ご登録ありがとうございます。まだアンケートを開始されていないようです。テストモードで画面を確認してみませんか？"
    cta = "テストアンケートを試す"
  } else if (daysSinceRegistration <= 7) {
    message = "最初の1件のアンケートを取ると、ダッシュボードが動き始めます。受付タブレットからアンケートを始めてみましょう。"
    cta = "アンケートを始める"
  } else {
    message = "無料体験期間がまもなく終了します。体験期間中にぜひアンケートをお試しください。"
    cta = "ダッシュボードを開く"
  }

  const safeName = escapeHtml(clinicName)
  return {
    subject: "【MIERU Clinic】アンケートを始めてみませんか？",
    html: emailLayout(`
  <p>${safeName} 様</p>
  <p>${message}</p>
  <div style="text-align: center; margin: 24px 0;">
    <a href="${loginUrl}" style="display: inline-block; background-color: #0f172a; color: #ffffff; padding: 12px 32px; border-radius: 6px; text-decoration: none; font-weight: bold;">
      ${cta}
    </a>
  </div>
  <p style="color: #64748b; font-size: 13px;">「お会計の際にタブレットをお渡しください」— たった一言で始められます。</p>
`),
  }
}

/** 週次サマリーメール */
export function buildWeeklySummaryEmail(
  clinicName: string,
  loginUrl: string,
  stats: {
    weeklyResponses: number
    weeklyAvgScore: number | null
    prevWeekResponses: number
    streak: number
    totalResponses: number
  }
): {
  subject: string
  html: string
} {
  const { weeklyResponses, weeklyAvgScore, prevWeekResponses, streak, totalResponses } = stats

  const changePercent = prevWeekResponses > 0
    ? Math.round(((weeklyResponses - prevWeekResponses) / prevWeekResponses) * 100)
    : null
  const changeText = changePercent !== null
    ? changePercent > 0
      ? `<span style="color: #16a34a;">前週比 +${changePercent}%</span>`
      : changePercent < 0
        ? `<span style="color: #dc2626;">前週比 ${changePercent}%</span>`
        : `<span style="color: #64748b;">前週と同水準</span>`
    : ""

  const hasData = weeklyResponses > 0

  const summarySection = hasData
    ? `
  <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
    <tr>
      <td style="padding: 16px; background: #f8fafc; border-radius: 8px; text-align: center; width: 33%;">
        <p style="font-size: 24px; font-weight: bold; margin: 0; color: #0f172a;">${weeklyResponses}</p>
        <p style="font-size: 12px; color: #64748b; margin: 4px 0 0;">今週の回答数</p>
        ${changeText ? `<p style="font-size: 11px; margin: 4px 0 0;">${changeText}</p>` : ""}
      </td>
      <td style="width: 8px;"></td>
      <td style="padding: 16px; background: #f8fafc; border-radius: 8px; text-align: center; width: 33%;">
        <p style="font-size: 24px; font-weight: bold; margin: 0; color: #0f172a;">${weeklyAvgScore?.toFixed(1) ?? "-"}</p>
        <p style="font-size: 12px; color: #64748b; margin: 4px 0 0;">平均スコア</p>
      </td>
      <td style="width: 8px;"></td>
      <td style="padding: 16px; background: #f8fafc; border-radius: 8px; text-align: center; width: 33%;">
        <p style="font-size: 24px; font-weight: bold; margin: 0; color: #0f172a;">${streak}</p>
        <p style="font-size: 12px; color: #64748b; margin: 4px 0 0;">連続日数</p>
      </td>
    </tr>
  </table>
  <p style="color: #64748b; font-size: 13px;">通算 ${totalResponses.toLocaleString()} 件の回答をいただいています。</p>`
    : `
  <div style="padding: 20px; background: #fef3c7; border-radius: 8px; margin: 16px 0;">
    <p style="margin: 0; font-size: 14px; color: #92400e;">今週はまだアンケート回答がありません。今週こそ最初の1件を始めてみませんか？</p>
  </div>`

  const safeName = escapeHtml(clinicName)
  return {
    subject: hasData
      ? `【MIERU Clinic】今週の実績: ${weeklyResponses}件の回答`
      : "【MIERU Clinic】今週のアンケートを始めましょう",
    html: emailLayout(`
  <p>${safeName} 様</p>
  <h2 style="font-size: 16px; color: #0f172a;">週次レポート</h2>
  ${summarySection}
  <div style="text-align: center; margin: 24px 0;">
    <a href="${loginUrl}" style="display: inline-block; background-color: #0f172a; color: #ffffff; padding: 12px 32px; border-radius: 6px; text-decoration: none; font-weight: bold;">
      ダッシュボードを確認
    </a>
  </div>
`),
  }
}
