import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function EvolutionChart({ data }: any) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Tendência de Score SPIN</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {data.map((item: any) => (
          <div key={item.month} className="flex items-center gap-4">
            <span className="w-10 font-medium">{item.month}</span>
            <div className="flex-1 h-6 bg-secondary rounded-sm overflow-hidden flex items-center px-2">
              <div className="h-full bg-primary" style={{ width: `${item.avgSpinScore}%` }} />
            </div>
            <span className="w-12 font-bold">{item.avgSpinScore}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
