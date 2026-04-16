import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function SdrStatsCards({ stats }: { stats: { avgSpinScore: number, totalCalls: number, approvalRate: number } }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Média Score SPIN</CardTitle></CardHeader>
        <CardContent><div className="text-2xl font-bold">{stats.avgSpinScore}</div></CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total de Calls</CardTitle></CardHeader>
        <CardContent><div className="text-2xl font-bold">{stats.totalCalls}</div></CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Taxa de Aprovação</CardTitle></CardHeader>
        <CardContent><div className="text-2xl font-bold">{stats.approvalRate}%</div></CardContent>
      </Card>
    </div>
  )
}
