# CallList.tsx

## Visão geral
- Caminho original: `frontend/src/features/calls/components/CallList.tsx`
- Domínio: **frontend**
- Prioridade: **01-FUNDAMENTAL**
- Tipo: **feature-component**
- Criticidade: **important**
- Score de importância: **108**
- Entry point: **não**
- Arquivo central de fluxo: **sim**
- Linhas: **41**
- Imports detectados: **4**
- Exports detectados: **1**
- Funções/classes detectadas: **1**

## Resumo factual
Este arquivo foi classificado como feature-component no domínio frontend. Criticidade: important. Prioridade: 01-FUNDAMENTAL. Exports detectados: CallRow. Funções/classes detectadas: CallRow. Dependências locais detectadas: @/lib/utils. Dependências externas detectadas: lucide-react, next/link, react. Temas relevantes detectados: calls, dashboard. Indícios de framework/arquitetura: react/tsx.

## Dependências locais
- `@/lib/utils`

## Dependências externas
- `lucide-react`
- `next/link`
- `react`

## Todos os imports detectados
- `@/lib/utils`
- `lucide-react`
- `next/link`
- `react`

## Exports detectados
- `CallRow`

## Funções e classes detectadas
- `CallRow`

## Endpoints detectados
_Nenhum padrão de endpoint detectado_

## Variáveis de ambiente detectadas
_Nenhuma variável de ambiente detectada_

## Temas relevantes
- `calls`
- `dashboard`

## Indícios de framework/arquitetura
- `react/tsx`

## Código
```tsx
import React from "react";
import Link from "next/link";
import { Play, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export const CallRow = ({ call }: { call: any }) => {
  return (
    <Link href={`/dashboard/calls/${call.id}`}> {/* Tarefa 1: Link para o ID real */}
      <div className="group flex items-center justify-between p-5 rounded-2xl bg-surface-container-low border border-white/5 hover:bg-surface-container-highest hover:border-primary/30 transition-all duration-300 cursor-pointer">
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-bold text-slate-500 uppercase">Score</span>
          <div className="w-10 h-10 rounded-full bg-surface-container-highest border border-white/10 flex items-center justify-center group-hover:border-primary/50 transition-colors">
            <span className={cn(
              "text-sm font-black",
              call.nota_spin >= 7 ? "text-secondary" : "text-error"
            )}>
              {call.nota_spin?.toFixed(1) || "0.0"}
            </span>
          </div>
        </div>
        <div>
          <h4 className="font-bold text-lg text-on-surface group-hover:text-primary transition-colors">
            {call.clientName || "Lead Nibo"}
          </h4>
          <div className="flex gap-2 mt-1">
            <span className="px-2 py-0.5 rounded bg-surface-container-highest text-[10px] font-bold text-on-surface-variant border border-white/5">
              {call.produto_principal || "N/A"}
            </span>
            <span className="text-[10px] text-slate-500 uppercase flex items-center gap-1">
              Rota {call.rota || "-"}
            </span>
          </div>
        </div>
        <div className="text-right">
          <ChevronRight className="text-slate-600 group-hover:text-primary group-hover:translate-x-1 transition-all" />
        </div>
      </div>
    </Link>
  );
};

```
