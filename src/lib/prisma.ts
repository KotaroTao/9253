import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL,
    // Cloud Run max-instances=3 → インスタンスあたり接続数を制限
    // PostgreSQL デフォルト最大接続数100 ÷ 3インスタンス ≈ 30（余裕を持たせて10）
    ...(process.env.NODE_ENV === "production" && {
      datasources: {
        db: {
          url: appendConnectionParams(process.env.DATABASE_URL || ""),
        },
      },
    }),
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
