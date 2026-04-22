# analysis-insights.tsx

## Visão geral
- Caminho original: `frontend/src/features/calls/components/analysis-insights.tsx`
- Domínio: **frontend**
- Prioridade: **01-FUNDAMENTAL**
- Tipo: **feature-component**
- Criticidade: **important**
- Score de importância: **108**
- Entry point: **não**
- Arquivo central de fluxo: **sim**
- Linhas: **51**
- Imports detectados: **2**
- Exports detectados: **1**
- Funções/classes detectadas: **1**

## Resumo factual
Este arquivo foi classificado como feature-component no domínio frontend. Criticidade: important. Prioridade: 01-FUNDAMENTAL. Exports detectados: AnalysisInsights. Funções/classes detectadas: AnalysisInsights. Dependências locais detectadas: @/components/ui/card. Dependências externas detectadas: lucide-react. Temas relevantes detectados: analysis, insights, summary. Indícios de framework/arquitetura: react/tsx.

## Dependências locais
- `@/components/ui/card`

## Dependências externas
- `lucide-react`

## Todos os imports detectados
- `@/components/ui/card`
- `lucide-react`

## Exports detectados
- `AnalysisInsights`

## Funções e classes detectadas
- `AnalysisInsights`

## Endpoints detectados
_Nenhum padrão de endpoint detectado_

## Variáveis de ambiente detectadas
_Nenhuma variável de ambiente detectada_

## Temas relevantes
- `analysis`
- `insights`
- `summary`

## Indícios de framework/arquitetura
- `react/tsx`

## Código
```tsx
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

```
