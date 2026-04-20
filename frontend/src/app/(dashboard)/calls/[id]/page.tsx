import { callDetailMock } from "@/features/calls/mocks/call-detail.mock"
import { CallHeader } from "@/features/calls/components/call-header"
import { AnalysisInsights } from "@/features/calls/components/analysis-insights"
import { ListeningStats } from "@/features/calls/components/listening-stats"
import { CoachingTimeline } from "@/features/calls/components/coaching-timeline"

export default function CallAnalysisPage({ params }: { params: { id: string } }) {
  // Em um cenário real: const data = await getCallDetail(params.id)
  const data = callDetailMock

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      {/* 1. Header com Metadados */}
      <CallHeader 
        sdrName={data.sdrName}
        clientName={data.clientName}
        date={data.date}
        duration={data.duration}
        overallScore={data.overallScore}
        status={data.status}
      />

      {/* 2. Bloco de Insights Rápidos (Grid 3 colunas) */}
      <AnalysisInsights 
        executiveSummary={data.executiveSummary}
        biggestDifficulty={data.biggestDifficulty}
        recommendedAction={data.recommendedAction}
      />

      {/* 3. Seção de Performance (Escuta e Acertos) */}
      <ListeningStats 
        sdrPercentage={data.listeningAnalysis.sdr}
        clientPercentage={data.listeningAnalysis.client}
        mainSuccesses={data.mainSuccesses}
      />

      {/* 4. Seção de Detalhamento (Coaching Timeline) */}
      <CoachingTimeline events={data.coachingEvents} />
    </div>
  )
}
