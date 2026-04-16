import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, AlertOctagon, Lightbulb } from "lucide-react"

interface AnalysisInsightsProps {
  executiveSummary: string
  biggestDifficulty: string
  recommendedAction: string
}

export function AnalysisInsights({ executiveSummary, biggestDifficulty, recommendedAction }: AnalysisInsightsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center gap-2 space-y-0">
          <FileText className="h-5 w-5 text-primary" />
          <CardTitle className="text-base">Resumo Executivo</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {executiveSummary}
          </p>
        </CardContent>
      </Card>

      <Card className="border-destructive/50 bg-destructive/5">
        <CardHeader className="pb-2 flex flex-row items-center gap-2 space-y-0">
          <AlertOctagon className="h-5 w-5 text-destructive" />
          <CardTitle className="text-base text-destructive">Maior Dificuldade</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-foreground leading-relaxed">
            {biggestDifficulty}
          </p>
        </CardContent>
      </Card>

      <Card className="border-status-success/50 bg-status-success/5">
        <CardHeader className="pb-2 flex flex-row items-center gap-2 space-y-0">
          <Lightbulb className="h-5 w-5 text-status-success" />
          <CardTitle className="text-base text-status-success">Ação Recomendada</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-foreground leading-relaxed">
            {recommendedAction}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
