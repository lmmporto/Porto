# page.tsx

## Visão geral
- Caminho original: `frontend/src/app/dashboard/insights/page.tsx`
- Domínio: **frontend**
- Prioridade: **02-HIGH-VALUE**
- Tipo: **page**
- Criticidade: **important**
- Score de importância: **90**
- Entry point: **sim**
- Arquivo central de fluxo: **sim**
- Linhas: **24**
- Imports detectados: **4**
- Exports detectados: **2**
- Funções/classes detectadas: **1**

## Resumo factual
Este arquivo foi classificado como page no domínio frontend. Criticidade: important. Prioridade: 02-HIGH-VALUE. Exports detectados: InsightsPage, function. Funções/classes detectadas: InsightsPage. Dependências locais detectadas: @/components/ui/card, @/features/insights/components/ai-recommendations, @/features/insights/components/trend-indicators, @/features/insights/mocks/ai-insights.mock. Temas relevantes detectados: insights. Indícios de framework/arquitetura: react/tsx, next-app-router.

## Dependências locais
- `@/components/ui/card`
- `@/features/insights/components/ai-recommendations`
- `@/features/insights/components/trend-indicators`
- `@/features/insights/mocks/ai-insights.mock`

## Dependências externas
_Nenhuma dependência externa detectada_

## Todos os imports detectados
- `@/components/ui/card`
- `@/features/insights/components/ai-recommendations`
- `@/features/insights/components/trend-indicators`
- `@/features/insights/mocks/ai-insights.mock`

## Exports detectados
- `InsightsPage`
- `function`

## Funções e classes detectadas
- `InsightsPage`

## Endpoints detectados
_Nenhum padrão de endpoint detectado_

## Variáveis de ambiente detectadas
_Nenhuma variável de ambiente detectada_

## Temas relevantes
- `insights`

## Indícios de framework/arquitetura
- `react/tsx`
- `next-app-router`

## Código
```tsx
import { aiInsightsMock } from "@/features/insights/mocks/ai-insights.mock"
import { TrendIndicators } from "@/features/insights/components/trend-indicators"
import { AiRecommendations } from "@/features/insights/components/ai-recommendations"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function InsightsPage() {
  const data = aiInsightsMock
  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      <h1 className="text-2xl font-bold">Insights Estratégicos da IA</h1>
      
      <TrendIndicators trends={data.trends} />
      
      <Card>
        <CardHeader><CardTitle className="text-base">Padrão de Comportamento da Semana</CardTitle></CardHeader>
        <CardContent className="text-muted-foreground italic">"{data.patterns}"</CardContent>
      </Card>

      <h2 className="text-xl font-semibold">Recomendações e Alertas</h2>
      <AiRecommendations recommendations={data.recommendations} />
    </div>
  )
}

```
