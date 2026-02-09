import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function GET() {
  const checks: Record<string, unknown> = {}

  // 1. DB接続チェック
  try {
    await prisma.$queryRaw`SELECT 1`
    checks.db = "OK"
  } catch (e) {
    checks.db = `ERROR: ${e instanceof Error ? e.message : String(e)}`
  }

  // 2. テーブル存在チェック
  try {
    const userCount = await prisma.user.count()
    checks.userCount = userCount
  } catch (e) {
    checks.userCount = `ERROR: ${e instanceof Error ? e.message : String(e)}`
  }

  // 3. テストユーザー存在チェック
  try {
    const clinicUser = await prisma.user.findUnique({
      where: { email: "clinic@demo.com" },
      select: { id: true, email: true, role: true, isActive: true, clinicId: true },
    })
    checks.clinicUser = clinicUser ?? "NOT FOUND"

    const adminUser = await prisma.user.findUnique({
      where: { email: "admin@mieru-clinic.com" },
      select: { id: true, email: true, role: true, isActive: true },
    })
    checks.adminUser = adminUser ?? "NOT FOUND"
  } catch (e) {
    checks.users = `ERROR: ${e instanceof Error ? e.message : String(e)}`
  }

  // 4. パスワード検証チェック
  try {
    const user = await prisma.user.findUnique({
      where: { email: "clinic@demo.com" },
      select: { password: true },
    })
    if (user) {
      const match = await bcrypt.compare("clinic123", user.password)
      checks.passwordMatch = match
      checks.hashPrefix = user.password.substring(0, 7)
    } else {
      checks.passwordMatch = "USER NOT FOUND"
    }
  } catch (e) {
    checks.passwordMatch = `ERROR: ${e instanceof Error ? e.message : String(e)}`
  }

  // 5. クリニック・スタッフ数
  try {
    const clinicCount = await prisma.clinic.count()
    const staffCount = await prisma.staff.count()
    checks.clinicCount = clinicCount
    checks.staffCount = staffCount
  } catch (e) {
    checks.counts = `ERROR: ${e instanceof Error ? e.message : String(e)}`
  }

  return NextResponse.json(checks)
}
