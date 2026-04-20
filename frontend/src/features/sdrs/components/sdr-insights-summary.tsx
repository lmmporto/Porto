import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, AlertCircle } from "lucide-react"

export function SdrInsightsSummary({ strengths, gaps }: { strengths: string[], gaps: string[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardHeader><CardTitle className="text-base">Onde ele brilha</CardTitle></CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {strengths.map((s, i) => <li key={i} className="flex gap-2 text-sm"><CheckCircle2 className="w-4 h-4 text-status-success"/>{s}</li>)}
          </ul>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-base">Onde ele trava</CardTitle></CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {gaps.map((g, i) => <li key={i} className="flex gap-2 text-sm"><AlertCircle className="w-4 h-4 text-status-error"/>{g}</li>)}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
