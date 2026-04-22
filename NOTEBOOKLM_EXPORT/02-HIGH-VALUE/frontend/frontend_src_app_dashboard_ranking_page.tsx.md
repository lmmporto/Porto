# page.tsx

## Visão geral
- Caminho original: `frontend/src/app/dashboard/ranking/page.tsx`
- Domínio: **frontend**
- Prioridade: **02-HIGH-VALUE**
- Tipo: **page**
- Criticidade: **important**
- Score de importância: **90**
- Entry point: **sim**
- Arquivo central de fluxo: **sim**
- Linhas: **18**
- Imports detectados: **1**
- Exports detectados: **2**
- Funções/classes detectadas: **1**

## Resumo factual
Este arquivo foi classificado como page no domínio frontend. Criticidade: important. Prioridade: 02-HIGH-VALUE. Exports detectados: RankingPage, function. Funções/classes detectadas: RankingPage. Dependências locais detectadas: @/features/dashboard/components/TopPerformance. Temas relevantes detectados: dashboard, ranking. Indícios de framework/arquitetura: react/tsx, next-app-router, client-component.

## Dependências locais
- `@/features/dashboard/components/TopPerformance`

## Dependências externas
_Nenhuma dependência externa detectada_

## Todos os imports detectados
- `@/features/dashboard/components/TopPerformance`

## Exports detectados
- `RankingPage`
- `function`

## Funções e classes detectadas
- `RankingPage`

## Endpoints detectados
_Nenhum padrão de endpoint detectado_

## Variáveis de ambiente detectadas
_Nenhuma variável de ambiente detectada_

## Temas relevantes
- `dashboard`
- `ranking`

## Indícios de framework/arquitetura
- `react/tsx`
- `next-app-router`
- `client-component`

## Código
```tsx
"use client";

import { TopPerformance } from "@/features/dashboard/components/TopPerformance";

export default function RankingPage() {
  return (
    <div className="p-8 space-y-8">
      <header>
        <h2 className="h1-elite">Leaderboard</h2>
        <p className="text-on-surface-variant">Ranking gamificado baseado na consistência e volume (Média Turbo).</p>
      </header>
      <div className="max-w-4xl">
        <TopPerformance /> {/* Tarefa Única: Chamando sem a prop filters */}
      </div>
    </div>
  );
}

```
