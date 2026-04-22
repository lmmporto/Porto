# evolution-chart.tsx

## Visão geral
- Caminho original: `frontend/src/features/evolution/components/evolution-chart.tsx`
- Domínio: **frontend**
- Prioridade: **01-FUNDAMENTAL**
- Tipo: **feature-component**
- Criticidade: **important**
- Score de importância: **108**
- Entry point: **não**
- Arquivo central de fluxo: **sim**
- Linhas: **21**
- Imports detectados: **1**
- Exports detectados: **1**
- Funções/classes detectadas: **1**

## Resumo factual
Este arquivo foi classificado como feature-component no domínio frontend. Criticidade: important. Prioridade: 01-FUNDAMENTAL. Exports detectados: EvolutionChart. Funções/classes detectadas: EvolutionChart. Dependências locais detectadas: @/components/ui/card. Temas relevantes detectados: evolution. Indícios de framework/arquitetura: react/tsx.

## Dependências locais
- `@/components/ui/card`

## Dependências externas
_Nenhuma dependência externa detectada_

## Todos os imports detectados
- `@/components/ui/card`

## Exports detectados
- `EvolutionChart`

## Funções e classes detectadas
- `EvolutionChart`

## Endpoints detectados
_Nenhum padrão de endpoint detectado_

## Variáveis de ambiente detectadas
_Nenhuma variável de ambiente detectada_

## Temas relevantes
- `evolution`

## Indícios de framework/arquitetura
- `react/tsx`

## Código
```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function EvolutionChart({ data }: any) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Tendência de Score SPIN</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {data.map((item: any) => (
          <div key={item.month} className="flex items-center gap-4">
            <span className="w-10 font-medium">{item.month}</span>
            <div className="flex-1 h-6 bg-secondary rounded-sm overflow-hidden flex items-center px-2">
              <div className="h-full bg-primary" style={{ width: `${item.avgSpinScore}%` }} />
            </div>
            <span className="w-12 font-bold">{item.avgSpinScore}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

```
