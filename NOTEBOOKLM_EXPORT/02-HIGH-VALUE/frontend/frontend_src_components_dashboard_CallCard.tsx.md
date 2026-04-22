# CallCard.tsx

## Visão geral
- Caminho original: `frontend/src/components/dashboard/CallCard.tsx`
- Domínio: **frontend**
- Prioridade: **02-HIGH-VALUE**
- Tipo: **component**
- Criticidade: **important**
- Score de importância: **78**
- Entry point: **não**
- Arquivo central de fluxo: **não**
- Linhas: **100**
- Imports detectados: **5**
- Exports detectados: **1**
- Funções/classes detectadas: **3**

## Resumo factual
Este arquivo foi classificado como component no domínio frontend. Criticidade: important. Prioridade: 02-HIGH-VALUE. Exports detectados: CallCard. Funções/classes detectadas: CallCard, getTheme, handleNavigation. Dependências locais detectadas: @/context/DashboardContext, @/lib/utils, @/types. Dependências externas detectadas: lucide-react, next/navigation. Temas relevantes detectados: admin, calls, dashboard, email, sdr. Indícios de framework/arquitetura: react/tsx, client-component, express, next-runtime.

## Dependências locais
- `@/context/DashboardContext`
- `@/lib/utils`
- `@/types`

## Dependências externas
- `lucide-react`
- `next/navigation`

## Todos os imports detectados
- `@/context/DashboardContext`
- `@/lib/utils`
- `@/types`
- `lucide-react`
- `next/navigation`

## Exports detectados
- `CallCard`

## Funções e classes detectadas
- `CallCard`
- `getTheme`
- `handleNavigation`

## Endpoints detectados
_Nenhum padrão de endpoint detectado_

## Variáveis de ambiente detectadas
_Nenhuma variável de ambiente detectada_

## Temas relevantes
- `admin`
- `calls`
- `dashboard`
- `email`
- `sdr`

## Indícios de framework/arquitetura
- `react/tsx`
- `client-component`
- `express`
- `next-runtime`

## Código
```tsx
"use client";

import { useRouter } from 'next/navigation';
import { Phone, ArrowRight, Lock, User } from 'lucide-react';
import type { SDRCall } from '@/types';
import { cn } from '@/lib/utils';
import { useDashboard } from '@/context/DashboardContext';

interface CallCardProps {
  call: SDRCall;
}

export function CallCard({ call }: CallCardProps) {
  const router = useRouter();
  const { user, isAdmin } = useDashboard();

  // 🏛️ ARQUITETO: Lógica de Acesso (Gatekeeper)
  const isOwner = call.ownerEmail?.toLowerCase().trim() === user?.email?.toLowerCase().trim();
  const isElite = Number(call.nota_spin || 0) >= 7;
  const isDone = call.processingStatus === 'DONE';
  
  // Pode acessar se: for Admin OU for o Dono OU for uma chamada nota 7+
  const canAccess = isAdmin || isOwner || isElite;

  const getTheme = () => {
    if (!isDone) return { color: "text-slate-500", label: "PROCESSANDO" };
    if (call.rota === "ROTA_C") return { color: "text-sky-400", label: "ROTA C" };
    
    const score = call.nota_spin || 0;
    if (score >= 8) return { color: "text-emerald-400", label: "NOTA SPIN" };
    if (score >= 5) return { color: "text-amber-400", label: "NOTA SPIN" };
    return { color: "text-rose-400", label: "NOTA SPIN" };
  };

  const theme = getTheme();

  const handleNavigation = () => {
    if (canAccess) {
      router.push(`/dashboard/calls/${call.id}`);
    }
  };

  return (
    <div 
      onClick={handleNavigation}
      className={cn(
        "bg-slate-900/50 border transition-all rounded-2xl p-5 group",
        canAccess 
          ? "border-slate-800 hover:border-indigo-500/50 cursor-pointer" 
          : "border-slate-800/40 opacity-60 cursor-not-allowed"
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 min-w-0">
          <div className={cn(
            "p-3 rounded-xl transition-colors shrink-0",
            canAccess ? "bg-slate-800 text-slate-400 group-hover:text-indigo-400" : "bg-slate-900 text-slate-600"
          )}>
            {canAccess ? <Phone className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
          </div>
          
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-tight truncate">
              {call.title || 'Cliente Externo'}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-[10px] text-slate-500 font-medium">
                {call.ownerName} • {new Date(call.callTimestamp || Date.now()).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-6 shrink-0">
          <div className="text-right">
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
              {theme.label}
            </p>
            <p className={cn("text-xl font-black", theme.color)}>
              {isDone ? call.nota_spin?.toFixed(1) : '--'}
            </p>
          </div>
          
          {canAccess ? (
            <ArrowRight className="w-5 h-5 text-slate-700 group-hover:text-indigo-500 transform group-hover:translate-x-1 transition-all" />
          ) : (
            <div className="w-5 h-5" /> // Espaçador para manter o alinhamento
          )}
        </div>
      </div>

      {/* Tooltip de aviso para chamadas bloqueadas */}
      {!canAccess && (
        <p className="mt-3 text-[9px] text-slate-600 italic border-t border-slate-800/50 pt-2">
          Acesso restrito. Apenas chamadas nota 7+ de colegas são abertas para estudo.
        </p>
      )}
    </div>
  );
}
```
