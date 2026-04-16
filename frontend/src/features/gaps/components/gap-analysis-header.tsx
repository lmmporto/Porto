import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function GapAnalysisHeader({ name, description, impact, incidence }: any) {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-2xl">{name}</CardTitle>
          <Badge variant="destructive" className="text-lg px-3 py-1">Incidência: {incidence}%</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground">{description}</p>
        <div className="bg-primary/5 p-4 rounded-lg border">
          <h4 className="font-semibold mb-1 text-sm">Por que isso importa?</h4>
          <p className="text-sm text-muted-foreground">{impact}</p>
        </div>
      </CardContent>
    </Card>
  )
}
