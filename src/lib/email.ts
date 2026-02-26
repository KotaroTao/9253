import crypto from "crypto"

/**
 * メール送信ユーティリティ
 *
 * 環境変数 SMTP_HOST が設定されている場合は nodemailer で実際に送信。
 * 未設定の場合はコンソールにログ出力（開発用フォールバック）。
 *
 * 必要な環境変数（本番用）:
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
 */

interface SendMailOptions {
  to: string
  subject: string
  html: string
}

export async function sendMail({ to, subject, html }: SendMailOptions): Promise<boolean> {
  const smtpHost = process.env.SMTP_HOST

  if (smtpHost) {
    try {
      // fetch ベースのメール送信（外部メールAPIを使用）
      // SMTP_HOST を API endpoint として使用（例: https://api.resend.com/emails）
      const apiKey = process.env.SMTP_PASS || ""
      const fromAddress = process.env.SMTP_FROM || "noreply@mieru-clinic.com"
      const res = await fetch(smtpHost, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ from: fromAddress, to, subject, html }),
      })
      if (!res.ok) {
        const body = await res.text().catch(() => "")
        console.error(`[sendMail] API responded ${res.status}: ${body}`)
        return false
      }
      return true
    } catch (err) {
      console.error("[sendMail] SMTP error:", err)
      return false
    }
  }

  // フォールバック: コンソールにログ出力（開発用）
  console.log("─── [sendMail] ───")
  console.log(`To: ${to}`)
  console.log(`Subject: ${subject}`)
  console.log(`Body:\n${html}`)
  console.log("──────────────────")
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
    <h1 style="color: #0f172a; font-size: 24px;">MIERU PX</h1>
  </div>
  ${body}
  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
  <p style="color: #94a3b8; font-size: 12px; text-align: center;">
    <a href="${appUrl}" style="color: #94a3b8;">MIERU PX</a> — 患者体験の見える化
  </p>
</body>
</html>`.trim()
}

/** メール認証用のHTMLメール本文を生成 */
export function buildVerificationEmail(verifyUrl: string, clinicName: string): {
  subject: string
  html: string
} {
  const safeName = escapeHtml(clinicName)
  return {
    subject: "【MIERU PX】メールアドレスの確認",
    html: emailLayout(`
  <p>${safeName} 様</p>
  <p>MIERU PX にご登録いただきありがとうございます。</p>
  <p>以下のボタンをクリックして、メールアドレスの確認を完了してください。</p>
  <div style="text-align: center; margin: 30px 0;">
    <a href="${verifyUrl}" style="display: inline-block; background-color: #0f172a; color: #ffffff; padding: 12px 32px; border-radius: 6px; text-decoration: none; font-weight: bold;">
      メールアドレスを確認する
    </a>
  </div>
  <p style="color: #64748b; font-size: 14px;">ボタンが動作しない場合は、以下のURLをブラウザに貼り付けてください:</p>
  <p style="color: #64748b; font-size: 12px; word-break: break-all;">${verifyUrl}</p>
  <p style="color: #64748b; font-size: 14px;">このリンクの有効期限は24時間です。</p>
  <p style="color: #94a3b8; font-size: 12px;">このメールに心当たりがない場合は、このメールを無視してください。</p>
`),
  }
}

/** ウェルカムメール（メール認証完了後に送信） */
export function buildWelcomeEmail(clinicName: string, loginUrl: string): {
  subject: string
  html: string
} {
  const safeName = escapeHtml(clinicName)
  return {
    subject: "【MIERU PX】ご利用開始ガイド",
    html: emailLayout(`
  <p>${safeName} 様</p>
  <p>メールアドレスの確認が完了しました。MIERU PX をご利用いただけます。</p>
  <h2 style="font-size: 16px; color: #0f172a; margin-top: 24px;">最初にやること 3ステップ</h2>
  <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
    <tr>
      <td style="padding: 12px; background: #f0f9ff; border-radius: 8px 8px 0 0; border-bottom: 1px solid #e0f2fe;">
        <strong style="color: #0369a1;">Step 1.</strong> スタッフを登録する<br>
        <span style="font-size: 13px; color: #64748b;">ダッシュボード → スタッフ管理 から追加できます</span>
      </td>
    </tr>
    <tr>
      <td style="padding: 12px; background: #f0f9ff; border-bottom: 1px solid #e0f2fe;">
        <strong style="color: #0369a1;">Step 2.</strong> テストアンケートを試す<br>
        <span style="font-size: 13px; color: #64748b;">ダッシュボード → テスト から、実際の画面を確認できます</span>
      </td>
    </tr>
    <tr>
      <td style="padding: 12px; background: #f0f9ff; border-radius: 0 0 8px 8px;">
        <strong style="color: #0369a1;">Step 3.</strong> 初回アンケートを実施<br>
        <span style="font-size: 13px; color: #64748b;">受付のタブレットでアンケート画面を開き、患者さまにお渡しください</span>
      </td>
    </tr>
  </table>
  <div style="text-align: center; margin: 24px 0;">
    <a href="${loginUrl}" style="display: inline-block; background-color: #0f172a; color: #ffffff; padding: 12px 32px; border-radius: 6px; text-decoration: none; font-weight: bold;">
      ダッシュボードにログイン
    </a>
  </div>
  <p style="color: #64748b; font-size: 14px;">ご不明な点がございましたら、使い方ガイドをご覧ください。</p>
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
    subject: "【MIERU PX】アンケートを始めてみませんか？",
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
      ? `【MIERU PX】今週の実績: ${weeklyResponses}件の回答`
      : "【MIERU PX】今週のアンケートを始めましょう",
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
