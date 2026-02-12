import { prisma } from "@/lib/prisma"
import { TallyTapUI } from "@/components/tally/tally-tap-ui"
import { messages } from "@/lib/messages"

interface TallyPageProps {
  params: { token: string }
}

export default async function TallyPage({ params }: TallyPageProps) {
  const staff = await prisma.staff.findFirst({
    where: { qrToken: params.token, isActive: true },
    select: { id: true, name: true, role: true, qrToken: true },
  })

  if (!staff) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
        <div className="w-full max-w-sm text-center">
          <div className="mb-4 text-4xl">😔</div>
          <h1 className="mb-2 text-xl font-bold">{messages.tally.staffNotFound}</h1>
          <p className="text-muted-foreground">{messages.tally.staffNotFoundSub}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-8">
      <div className="w-full max-w-sm">
        <TallyTapUI staffName={staff.name} staffToken={staff.qrToken} />
      </div>
    </div>
  )
}
