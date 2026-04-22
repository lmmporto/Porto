# sdr-insights-summary.tsx

## Visão geral
- Caminho original: `frontend/src/features/sdrs/components/sdr-insights-summary.tsx`
- Domínio: **frontend**
- Prioridade: **01-FUNDAMENTAL**
- Tipo: **feature-component**
- Criticidade: **important**
- Score de importância: **108**
- Entry point: **não**
- Arquivo central de fluxo: **sim**
- Linhas: **26**
- Imports detectados: **2**
- Exports detectados: **1**
- Funções/classes detectadas: **1**

## Resumo factual
Este arquivo foi classificado como feature-component no domínio frontend. Criticidade: important. Prioridade: 01-FUNDAMENTAL. Exports detectados: SdrInsightsSummary. Funções/classes detectadas: SdrInsightsSummary. Dependências locais detectadas: @/components/ui/card. Dependências externas detectadas: lucide-react. Temas relevantes detectados: insights, sdr, summary. Indícios de framework/arquitetura: react/tsx.

## Dependências locais
- `@/components/ui/card`

## Dependências externas
- `lucide-react`

## Todos os imports detectados
- `@/components/ui/card`
- `lucide-react`

## Exports detectados
- `SdrInsightsSummary`

## Funções e classes detectadas
- `SdrInsightsSummary`

## Endpoints detectados
_Nenhum padrão de endpoint detectado_

## Variáveis de ambiente detectadas
_Nenhuma variável de ambiente detectada_

## Temas relevantes
- `insights`
- `sdr`
- `summary`

## Indícios de framework/arquitetura
- `react/tsx`

## Código
```tsx
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

```
