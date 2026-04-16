import { gapDetailMock } from "@/features/gaps/mocks/gap-detail.mock"
import { GapAnalysisHeader } from "@/features/gaps/components/gap-analysis-header"
import { SdrImpactList } from "@/features/gaps/components/sdr-impact-list"
import { CallsTable } from "@/features/calls/components/calls-table"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function GapDetailPage({ params }: { params: { id: string } }) {
  const data = gapDetailMock

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      <Link href="/dashboard">
        <Button variant="ghost" className="pl-0"><ArrowLeft className="mr-2 h-4 w-4"/>Voltar ao Dashboard</Button>
      </Link>
      
      <GapAnalysisHeader {...data} />
      
      <SdrImpactList sdrs={data.mostAffectedSDRs} />
      
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Exemplos para treinamento</h2>
        <CallsTable calls={data.exampleCalls} />
      </div>
    </div>
  )
}
