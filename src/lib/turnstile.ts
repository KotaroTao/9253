/**
 * Cloudflare Turnstile サーバーサイド検証
 *
 * 環境変数:
 *   NEXT_PUBLIC_TURNSTILE_SITE_KEY — クライアント側ウィジェットキー
 *   TURNSTILE_SECRET_KEY — サーバー側検証キー
 *
 * 両方未設定の場合は検証をスキップ（開発環境用）。
 */

const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify"

interface TurnstileVerifyResult {
  success: boolean
  "error-codes"?: string[]
}

/** Turnstileトークンをサーバーサイドで検証 */
export async function verifyTurnstileToken(token: string | null | undefined): Promise<boolean> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY

  // 未設定の場合はスキップ（開発環境用）
  if (!secretKey) {
    return true
  }

  if (!token) {
    return false
  }

  try {
    const res = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret: secretKey,
        response: token,
      }),
    })

    const data: TurnstileVerifyResult = await res.json()
    return data.success
  } catch (err) {
    console.error("[Turnstile] Verification failed:", err)
    return false
  }
}
