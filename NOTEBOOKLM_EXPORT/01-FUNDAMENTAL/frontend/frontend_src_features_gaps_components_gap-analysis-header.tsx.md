# gap-analysis-header.tsx

## Visão geral
- Caminho original: `frontend/src/features/gaps/components/gap-analysis-header.tsx`
- Domínio: **frontend**
- Prioridade: **01-FUNDAMENTAL**
- Tipo: **feature-component**
- Criticidade: **important**
- Score de importância: **108**
- Entry point: **não**
- Arquivo central de fluxo: **sim**
- Linhas: **23**
- Imports detectados: **2**
- Exports detectados: **1**
- Funções/classes detectadas: **1**

## Resumo factual
Este arquivo foi classificado como feature-component no domínio frontend. Criticidade: important. Prioridade: 01-FUNDAMENTAL. Exports detectados: GapAnalysisHeader. Funções/classes detectadas: GapAnalysisHeader. Dependências locais detectadas: @/components/ui/badge, @/components/ui/card. Temas relevantes detectados: analysis. Indícios de framework/arquitetura: react/tsx.

## Dependências locais
- `@/components/ui/badge`
- `@/components/ui/card`

## Dependências externas
_Nenhuma dependência externa detectada_

## Todos os imports detectados
- `@/components/ui/badge`
- `@/components/ui/card`

## Exports detectados
- `GapAnalysisHeader`

## Funções e classes detectadas
- `GapAnalysisHeader`

## Endpoints detectados
_Nenhum padrão de endpoint detectado_

## Variáveis de ambiente detectadas
_Nenhuma variável de ambiente detectada_

## Temas relevantes
- `analysis`

## Indícios de framework/arquitetura
- `react/tsx`

## Código
```tsx
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

```
