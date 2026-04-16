import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, Mic } from "lucide-react"

interface ListeningStatsProps {
  sdrPercentage: number
  clientPercentage: number
  mainSuccesses: string[]
}

export function ListeningStats({ sdrPercentage, clientPercentage, mainSuccesses }: ListeningStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Análise de Escuta */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Mic className="h-4 w-4" />
            Análise de Escuta (Talk Ratio)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between text-sm font-medium mb-1">
            <span className="text-primary">SDR ({sdrPercentage}%)</span>
            <span className="text-muted-foreground">Cliente ({clientPercentage}%)</span>
          </div>
          {/* Barra de progresso customizada com Tailwind */}
          <div className="h-4 w-full bg-secondary rounded-full overflow-hidden flex">
            <div 
              className="h-full bg-primary transition-all duration-500" 
              style={{ width: `${sdrPercentage}%` }}
            />
            <div 
              className="h-full bg-muted-foreground/30 transition-all duration-500" 
              style={{ width: `${clientPercentage}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            O ideal é que o cliente fale mais durante a fase de investigação (SPIN).
          </p>
        </CardContent>
      </Card>

      {/* Principais Acertos */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Principais Acertos</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {mainSuccesses.map((success, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-status-success shrink-0 mt-0.5" />
                <span className="text-muted-foreground">{success}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
