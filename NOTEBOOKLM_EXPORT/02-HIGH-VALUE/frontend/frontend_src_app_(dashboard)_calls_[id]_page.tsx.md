# page.tsx

## Visão geral
- Caminho original: `frontend/src/app/(dashboard)/calls/[id]/page.tsx`
- Domínio: **frontend**
- Prioridade: **02-HIGH-VALUE**
- Tipo: **page**
- Criticidade: **important**
- Score de importância: **90**
- Entry point: **sim**
- Arquivo central de fluxo: **sim**
- Linhas: **42**
- Imports detectados: **5**
- Exports detectados: **2**
- Funções/classes detectadas: **1**

## Resumo factual
Este arquivo foi classificado como page no domínio frontend. Criticidade: important. Prioridade: 02-HIGH-VALUE. Exports detectados: CallAnalysisPage, function. Funções/classes detectadas: CallAnalysisPage. Dependências locais detectadas: @/features/calls/components/analysis-insights, @/features/calls/components/call-header, @/features/calls/components/coaching-timeline, @/features/calls/components/listening-stats, @/features/calls/mocks/call-detail.mock. Temas relevantes detectados: analysis, calls, coaching, insights, sdr, stats, summary. Indícios de framework/arquitetura: react/tsx, next-app-router.

## Dependências locais
- `@/features/calls/components/analysis-insights`
- `@/features/calls/components/call-header`
- `@/features/calls/components/coaching-timeline`
- `@/features/calls/components/listening-stats`
- `@/features/calls/mocks/call-detail.mock`

## Dependências externas
_Nenhuma dependência externa detectada_

## Todos os imports detectados
- `@/features/calls/components/analysis-insights`
- `@/features/calls/components/call-header`
- `@/features/calls/components/coaching-timeline`
- `@/features/calls/components/listening-stats`
- `@/features/calls/mocks/call-detail.mock`

## Exports detectados
- `CallAnalysisPage`
- `function`

## Funções e classes detectadas
- `CallAnalysisPage`

## Endpoints detectados
_Nenhum padrão de endpoint detectado_

## Variáveis de ambiente detectadas
_Nenhuma variável de ambiente detectada_

## Temas relevantes
- `analysis`
- `calls`
- `coaching`
- `insights`
- `sdr`
- `stats`
- `summary`

## Indícios de framework/arquitetura
- `react/tsx`
- `next-app-router`

## Código
```tsx
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

```
