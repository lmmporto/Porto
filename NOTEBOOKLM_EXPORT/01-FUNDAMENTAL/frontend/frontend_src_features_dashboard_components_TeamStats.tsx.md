# TeamStats.tsx

## Visão geral
- Caminho original: `frontend/src/features/dashboard/components/TeamStats.tsx`
- Domínio: **frontend**
- Prioridade: **01-FUNDAMENTAL**
- Tipo: **feature-component**
- Criticidade: **important**
- Score de importância: **108**
- Entry point: **não**
- Arquivo central de fluxo: **sim**
- Linhas: **75**
- Imports detectados: **3**
- Exports detectados: **1**
- Funções/classes detectadas: **2**

## Resumo factual
Este arquivo foi classificado como feature-component no domínio frontend. Criticidade: important. Prioridade: 01-FUNDAMENTAL. Exports detectados: TeamStats. Funções/classes detectadas: StatCard, TeamStats. Dependências locais detectadas: @/lib/utils. Dependências externas detectadas: lucide-react, react. Temas relevantes detectados: calls, stats, team. Indícios de framework/arquitetura: react/tsx, client-component.

## Dependências locais
- `@/lib/utils`

## Dependências externas
- `lucide-react`
- `react`

## Todos os imports detectados
- `@/lib/utils`
- `lucide-react`
- `react`

## Exports detectados
- `TeamStats`

## Funções e classes detectadas
- `StatCard`
- `TeamStats`

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
- `client-component`

## Código
```tsx
"use client";

import React from "react";
import { TrendingUp, Activity, CheckCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface TeamStatsProps {
  stats: {
    totalCalls?: number;
    teamAverage?: number;
    approvalRate?: number;
    avgDuration?: string;
  } | null;
}

export const TeamStats = ({ stats }: TeamStatsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        label="Total de Chamadas"
        value={stats?.totalCalls || 0} // TAREFA 3: Lendo stats.totalCalls
        icon={<Activity className="text-primary" size={20} />}
        trend="+12%" // Placeholder, idealmente viria do stats
      />
      <StatCard
        label="Média SPIN"
        value={stats?.teamAverage?.toFixed(1) || "0.0"}
        icon={<TrendingUp className="text-secondary" size={20} />}
        trend="+0.4" // Placeholder
        isPositive
      />
      <StatCard
        label="Taxa de Aprovação"
        value={`${stats?.approvalRate || 0}%`}
        icon={<CheckCircle className="text-tertiary" size={20} />}
      />
      <StatCard
        label="Duração Média"
        value={stats?.avgDuration || "00:00"}
        icon={<Clock className="text-slate-400" size={20} />}
      />
    </div>
  );
};

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  isPositive?: boolean;
}

const StatCard = ({ label, value, icon, trend, isPositive }: StatCardProps) => (
  <div className="glass-card p-6 rounded-xl obsidian-glow flex flex-col justify-between min-h-[140px] transition-all hover:bg-surface-container-highest/50">
    <div className="flex justify-between items-start">
      <div className="p-2 bg-surface-container-highest rounded-lg border border-white/5">
        {icon}
      </div>
      {trend && (
        <span className={cn(
          "text-[10px] font-bold px-2 py-0.5 rounded-full",
          isPositive ? "bg-secondary/10 text-secondary" : "bg-primary/10 text-primary"
        )}>
          {trend}
        </span>
      )}
    </div>
    <div>
      <div className="text-3xl font-black font-headline text-on-surface mb-1">{value}</div>
      <div className="label-elite text-slate-500">{label}</div>
    </div>
  </div>
);

```
