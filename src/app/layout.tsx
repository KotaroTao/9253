import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "MIERU Clinic | 患者体験の見える化",
  description:
    "医療機関専用 患者体験改善プラットフォーム。アンケートで患者体験を可視化し、医院の改善と成長を支援します。",
  keywords: ["歯科", "患者体験", "アンケート", "口コミ", "MIERU Clinic"],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  )
}
