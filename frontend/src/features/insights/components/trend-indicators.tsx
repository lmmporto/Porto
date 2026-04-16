import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowUp, ArrowDown } from "lucide-react"

export function TrendIndicators({ trends }: any) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {trends.map((t: any) => (
        <Card key={t.label}>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">{t.label}</CardTitle></CardHeader>
          <CardContent className="flex items-center gap-2">
            <span className={`text-2xl font-bold ${t.status === 'up' ? 'text-status-success' : 'text-status-error'}`}>
              {t.value}
            </span>
            {t.status === 'up' ? <ArrowUp className="text-status-success" /> : <ArrowDown className="text-status-error" />}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
