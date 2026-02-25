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

/** メール認証用のHTMLメール本文を生成 */
export function buildVerificationEmail(verifyUrl: string, clinicName: string): {
  subject: string
  html: string
} {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://mieru-clinic.com"

  return {
    subject: "【MIERU Clinic】メールアドレスの確認",
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #0f172a; font-size: 24px;">MIERU Clinic</h1>
  </div>
  <p>${clinicName} 様</p>
  <p>MIERU Clinic にご登録いただきありがとうございます。</p>
  <p>以下のボタンをクリックして、メールアドレスの確認を完了してください。</p>
  <div style="text-align: center; margin: 30px 0;">
    <a href="${verifyUrl}" style="display: inline-block; background-color: #0f172a; color: #ffffff; padding: 12px 32px; border-radius: 6px; text-decoration: none; font-weight: bold;">
      メールアドレスを確認する
    </a>
  </div>
  <p style="color: #64748b; font-size: 14px;">ボタンが動作しない場合は、以下のURLをブラウザに貼り付けてください:</p>
  <p style="color: #64748b; font-size: 12px; word-break: break-all;">${verifyUrl}</p>
  <p style="color: #64748b; font-size: 14px;">このリンクの有効期限は24時間です。</p>
  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
  <p style="color: #94a3b8; font-size: 12px; text-align: center;">
    このメールに心当たりがない場合は、このメールを無視してください。<br>
    <a href="${appUrl}" style="color: #94a3b8;">MIERU Clinic</a>
  </p>
</body>
</html>`.trim(),
  }
}
