# trend-indicators.tsx

## Visão geral
- Caminho original: `frontend/src/features/insights/components/trend-indicators.tsx`
- Domínio: **frontend**
- Prioridade: **01-FUNDAMENTAL**
- Tipo: **feature-component**
- Criticidade: **important**
- Score de importância: **108**
- Entry point: **não**
- Arquivo central de fluxo: **sim**
- Linhas: **21**
- Imports detectados: **2**
- Exports detectados: **1**
- Funções/classes detectadas: **1**

## Resumo factual
Este arquivo foi classificado como feature-component no domínio frontend. Criticidade: important. Prioridade: 01-FUNDAMENTAL. Exports detectados: TrendIndicators. Funções/classes detectadas: TrendIndicators. Dependências locais detectadas: @/components/ui/card. Dependências externas detectadas: lucide-react. Indícios de framework/arquitetura: react/tsx.

## Dependências locais
- `@/components/ui/card`

## Dependências externas
- `lucide-react`

## Todos os imports detectados
- `@/components/ui/card`
- `lucide-react`

## Exports detectados
- `TrendIndicators`

## Funções e classes detectadas
- `TrendIndicators`

## Endpoints detectados
_Nenhum padrão de endpoint detectado_

## Variáveis de ambiente detectadas
_Nenhuma variável de ambiente detectada_

## Temas relevantes
_Nenhuma palavra-chave relevante detectada_

## Indícios de framework/arquitetura
- `react/tsx`

## Código
```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowUp, ArrowDown } from "lucide-react"

export function TrendIndicators({ trends }: any) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {trends.map((t: any) => (
        <Card key={t.label}>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">{t.label}</CardTitle></CardHeader>
          <CardContent className="flex items-center gap-2">
            <span className={`text-2xl font-bold ${t.status === 'up' ? 'text-status-success' : 'text-status-error'}`}>
              {t.value}
            </span>
            {t.status === 'up' ? <ArrowUp className="text-status-success" /> : <ArrowDown className="text-status-error" />}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

```
