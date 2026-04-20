import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function TeamStatsGrid({ totalCalls, avgScore, approvalRate }: any) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total de Calls</CardTitle></CardHeader>
        <CardContent><div className="text-3xl font-bold">{totalCalls}</div></CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Média da Equipe</CardTitle></CardHeader>
        <CardContent><div className="text-3xl font-bold">{avgScore}/100</div></CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Taxa de Aprovação</CardTitle></CardHeader>
        <CardContent><div className="text-3xl font-bold">{approvalRate}%</div></CardContent>
      </Card>
    </div>
  )
}
