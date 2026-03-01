import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Cloud Run max-instances=3 → インスタンスあたり接続数を制限
// PostgreSQL デフォルト最大接続数100 ÷ 3インスタンス ≈ 30（余裕を持たせて10）
const databaseUrl = process.env.NODE_ENV === "production"
  ? appendConnectionParams(process.env.DATABASE_URL || "")
  : process.env.DATABASE_URL

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: databaseUrl,
  })

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}

/** DATABASE_URL に接続プールパラメータを追加（未設定の場合のみ） */
function appendConnectionParams(url: string): string {
  if (!url || url.includes("connection_limit")) return url
  const separator = url.includes("?") ? "&" : "?"
  return `${url}${separator}connection_limit=10&connect_timeout=10`
}
