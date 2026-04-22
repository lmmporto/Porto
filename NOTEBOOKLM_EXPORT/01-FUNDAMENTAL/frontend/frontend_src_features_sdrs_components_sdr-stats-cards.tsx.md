# sdr-stats-cards.tsx

## Visão geral
- Caminho original: `frontend/src/features/sdrs/components/sdr-stats-cards.tsx`
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
Este arquivo foi classificado como feature-component no domínio frontend. Criticidade: important. Prioridade: 01-FUNDAMENTAL. Exports detectados: SdrStatsCards. Funções/classes detectadas: SdrStatsCards. Dependências locais detectadas: @/components/ui/card. Temas relevantes detectados: calls, sdr, stats. Indícios de framework/arquitetura: react/tsx.

## Dependências locais
- `@/components/ui/card`

## Dependências externas
_Nenhuma dependência externa detectada_

## Todos os imports detectados
- `@/components/ui/card`

## Exports detectados
- `SdrStatsCards`

## Funções e classes detectadas
- `SdrStatsCards`

## Endpoints detectados
_Nenhum padrão de endpoint detectado_

## Variáveis de ambiente detectadas
_Nenhuma variável de ambiente detectada_

## Temas relevantes
- `calls`
- `sdr`
- `stats`

## Indícios de framework/arquitetura
- `react/tsx`

## Código
```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function SdrStatsCards({ stats }: { stats: { avgSpinScore: number, totalCalls: number, approvalRate: number } }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Média Score SPIN</CardTitle></CardHeader>
        <CardContent><div className="text-2xl font-bold">{stats.avgSpinScore}</div></CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total de Calls</CardTitle></CardHeader>
        <CardContent><div className="text-2xl font-bold">{stats.totalCalls}</div></CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Taxa de Aprovação</CardTitle></CardHeader>
        <CardContent><div className="text-2xl font-bold">{stats.approvalRate}%</div></CardContent>
      </Card>
    </div>
  )
}

```
