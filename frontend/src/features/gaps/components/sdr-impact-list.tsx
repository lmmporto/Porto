import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function SdrImpactList({ sdrs }: { sdrs: { name: string; count: number }[] }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">SDRs que precisam de foco</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {sdrs.map((sdr, i) => (
          <div key={i} className="flex justify-between items-center p-2 border rounded">
            <span className="font-medium">{sdr.name}</span>
            <Badge variant="outline">{sdr.count} ocorrências</Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
