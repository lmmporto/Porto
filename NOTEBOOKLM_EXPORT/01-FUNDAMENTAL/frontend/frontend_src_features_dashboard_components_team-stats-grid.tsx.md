# team-stats-grid.tsx

## Visão geral
- Caminho original: `frontend/src/features/dashboard/components/team-stats-grid.tsx`
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
Este arquivo foi classificado como feature-component no domínio frontend. Criticidade: important. Prioridade: 01-FUNDAMENTAL. Exports detectados: TeamStatsGrid. Funções/classes detectadas: TeamStatsGrid. Dependências locais detectadas: @/components/ui/card. Temas relevantes detectados: calls, stats, team. Indícios de framework/arquitetura: react/tsx.

## Dependências locais
- `@/components/ui/card`

## Dependências externas
_Nenhuma dependência externa detectada_

## Todos os imports detectados
- `@/components/ui/card`

## Exports detectados
- `TeamStatsGrid`

## Funções e classes detectadas
- `TeamStatsGrid`

## Endpoints detectados
_Nenhum padrão de endpoint detectado_

## Variáveis de ambiente detectadas
_Nenhuma variável de ambiente detectada_

## Temas relevantes
- `calls`
- `stats`
- `team`

## Indícios de framework/arquitetura
- `react/tsx`

## Código
```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function TeamStatsGrid({ totalCalls, avgScore, approvalRate }: any) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total de Calls</CardTitle></CardHeader>
        <CardContent><div className="text-3xl font-bold">{totalCalls}</div></CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Média da Equipe</CardTitle></CardHeader>
        <CardContent><div className="text-3xl font-bold">{avgScore}/100</div></CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Taxa de Aprovação</CardTitle></CardHeader>
        <CardContent><div className="text-3xl font-bold">{approvalRate}%</div></CardContent>
      </Card>
    </div>
  )
}

```
