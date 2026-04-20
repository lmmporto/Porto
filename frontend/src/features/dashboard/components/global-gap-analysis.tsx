import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function GlobalGapAnalysis({ distribution }: any) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Gargalos por Etapa do SPIN</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {distribution.map((item: any) => (
          <div key={item.label} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>{item.label}</span>
              <span className="font-medium">{item.value}%</span>
            </div>
            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-primary" style={{ width: `${item.value}%` }} />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
