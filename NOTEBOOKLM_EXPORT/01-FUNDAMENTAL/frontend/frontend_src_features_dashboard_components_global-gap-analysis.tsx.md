# global-gap-analysis.tsx

## Visão geral
- Caminho original: `frontend/src/features/dashboard/components/global-gap-analysis.tsx`
- Domínio: **frontend**
- Prioridade: **01-FUNDAMENTAL**
- Tipo: **feature-component**
- Criticidade: **important**
- Score de importância: **108**
- Entry point: **não**
- Arquivo central de fluxo: **sim**
- Linhas: **23**
- Imports detectados: **1**
- Exports detectados: **1**
- Funções/classes detectadas: **1**

## Resumo factual
Este arquivo foi classificado como feature-component no domínio frontend. Criticidade: important. Prioridade: 01-FUNDAMENTAL. Exports detectados: GlobalGapAnalysis. Funções/classes detectadas: GlobalGapAnalysis. Dependências locais detectadas: @/components/ui/card. Temas relevantes detectados: analysis. Indícios de framework/arquitetura: react/tsx.

## Dependências locais
- `@/components/ui/card`

## Dependências externas
_Nenhuma dependência externa detectada_

## Todos os imports detectados
- `@/components/ui/card`

## Exports detectados
- `GlobalGapAnalysis`

## Funções e classes detectadas
- `GlobalGapAnalysis`

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

export function GlobalGapAnalysis({ distribution }: any) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Gargalos por Etapa do SPIN</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {distribution.map((item: any) => (
          <div key={item.label} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>{item.label}</span>
              <span className="font-medium">{item.value}%</span>
            </div>
            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-primary" style={{ width: `${item.value}%` }} />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

```
