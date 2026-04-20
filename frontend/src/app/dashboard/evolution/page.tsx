import { evolutionDataMock } from "@/features/evolution/mocks/evolution-data.mock"
import { EvolutionChart } from "@/features/evolution/components/evolution-chart"
import { EvolutionTable } from "@/features/evolution/components/evolution-table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function EvolutionPage() {
  const data = evolutionDataMock
  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      <h1 className="text-2xl font-bold">Evolução da Equipe</h1>
      
      <EvolutionChart data={data} />
      
      <Card>
        <CardHeader><CardTitle className="text-base">Histórico Detalhado</CardTitle></CardHeader>
        <CardContent>
          <EvolutionTable data={data} />
        </CardContent>
      </Card>
    </div>
  )
}
