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
