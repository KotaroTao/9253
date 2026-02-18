import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "研究計画書 | MIERU Clinic",
  description:
    "MIERU Clinic 研究計画書ドラフト — デジタル患者体験フィードバックシステムが歯科医院の患者満足度に与える影響",
  robots: { index: false, follow: false },
}

export default function ResearchProtocolLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
