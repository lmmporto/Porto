import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function SdrLeaderboard({ topPerformers, needsCoaching }: any) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardHeader><CardTitle className="text-base">Top Performers</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {topPerformers.map((sdr: any) => (
            <div key={sdr.id} className="flex justify-between items-center p-2 border rounded">
              <span>{sdr.name}</span>
              <Badge>{sdr.score}/100</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card className="border-destructive/50 bg-destructive/5">
        <CardHeader><CardTitle className="text-base text-destructive">SDRs em Alerta</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {needsCoaching.map((sdr: any) => (
            <div key={sdr.id} className="flex justify-between items-center p-2 border rounded">
              <span className="text-destructive font-medium">{sdr.name}</span>
              <Badge variant="destructive">{sdr.score}/100</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
