/**
 * Secret Manager 統合モジュール
 *
 * 本番環境では Google Cloud Secret Manager からシークレットを取得し、
 * 開発環境では process.env にフォールバックする。
 *
 * 使い方:
 *   import { getSecret } from "@/lib/secrets"
 *   const dbUrl = await getSecret("DATABASE_URL")
 *
 * Cloud Run 設定:
 *   環境変数 USE_SECRET_MANAGER=true を設定すると Secret Manager モードが有効になる。
 *   サービスアカウントに secretmanager.versions.access 権限が必要。
 *
 * Secret Manager へのシークレット登録:
 *   gcloud secrets create DATABASE_URL --replication-policy=automatic
 *   echo -n "postgresql://..." | gcloud secrets versions add DATABASE_URL --data-file=-
 */

import { logger } from "./logger"

const COMPONENT = "secrets"

/** シークレットキャッシュ（プロセスライフタイム） */
const cache = new Map<string, string>()

/** アクセストークンキャッシュ（有効期限の5分前に失効） */
let tokenCache: { value: string; expiresAt: number } | null = null

/** GCP メタデータサーバーからアクセストークンを取得（キャッシュ付き） */
async function getAccessToken(): Promise<string> {
  const now = Date.now() / 1000
  if (tokenCache && tokenCache.expiresAt > now + 300) {
    return tokenCache.value
  }

  const tokenRes = await fetch(
    "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token",
    { headers: { "Metadata-Flavor": "Google" } },
  )
  if (!tokenRes.ok) {
    throw new Error(`メタデータサーバーからトークン取得失敗: ${tokenRes.status}`)
  }
  const { access_token, expires_in } = (await tokenRes.json()) as {
    access_token: string
    expires_in: number
  }

  tokenCache = { value: access_token, expiresAt: now + expires_in }
  return access_token
}

/** Secret Manager API を使ってシークレットを取得 */
async function fetchFromSecretManager(
  secretName: string,
  projectId: string,
): Promise<string> {
  const accessToken = await getAccessToken()

  const url = `https://secretmanager.googleapis.com/v1/projects/${projectId}/secrets/${secretName}/versions/latest:access`
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) {
    throw new Error(`Secret Manager からの取得失敗: ${secretName} (${res.status})`)
  }

  const data = (await res.json()) as { payload: { data: string } }
  return Buffer.from(data.payload.data, "base64").toString("utf8")
}

/**
 * シークレットを取得する。
 *
 * USE_SECRET_MANAGER=true かつ GCP_PROJECT_ID が設定されている場合は
 * Secret Manager から取得し、それ以外は process.env から取得する。
 *
 * @param name - シークレット名（環境変数名と同一）
 * @param required - true の場合、見つからないとエラーをスロー（デフォルト: true）
 */
export async function getSecret(
  name: string,
  required: true,
): Promise<string>
export async function getSecret(
  name: string,
  required?: boolean,
): Promise<string | undefined>
export async function getSecret(
  name: string,
  required = true,
): Promise<string | undefined> {
  // キャッシュチェック
  if (cache.has(name)) {
    return cache.get(name)
  }

  const useSecretManager = process.env.USE_SECRET_MANAGER === "true"
  const projectId = process.env.GCP_PROJECT_ID

  if (useSecretManager && projectId) {
    try {
      const value = await fetchFromSecretManager(name, projectId)
      cache.set(name, value)
      logger.info(`Secret Manager からシークレット取得成功: ${name}`, { component: COMPONENT })
      return value
    } catch (err) {
      logger.warn(
        `Secret Manager フォールバック → 環境変数: ${name}`,
        { component: COMPONENT, error: String(err) },
      )
      // フォールバック: 環境変数
    }
  }

  const envValue = process.env[name]
  if (envValue) {
    cache.set(name, envValue)
    return envValue
  }

  if (required) {
    throw new Error(`シークレット "${name}" が見つかりません（Secret Manager / 環境変数 両方）`)
  }

  return undefined
}

/** キャッシュをクリア（テスト用） */
export function clearSecretCache(): void {
  cache.clear()
}
