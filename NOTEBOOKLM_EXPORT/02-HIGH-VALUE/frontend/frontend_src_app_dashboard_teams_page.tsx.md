# page.tsx

## Visão geral
- Caminho original: `frontend/src/app/dashboard/teams/page.tsx`
- Domínio: **frontend**
- Prioridade: **02-HIGH-VALUE**
- Tipo: **page**
- Criticidade: **important**
- Score de importância: **90**
- Entry point: **sim**
- Arquivo central de fluxo: **sim**
- Linhas: **92**
- Imports detectados: **6**
- Exports detectados: **2**
- Funções/classes detectadas: **1**

## Resumo factual
Este arquivo foi classificado como page no domínio frontend. Criticidade: important. Prioridade: 02-HIGH-VALUE. Exports detectados: TeamsPage, function. Funções/classes detectadas: TeamsPage. Dependências locais detectadas: @/components/dashboard/TeamCard, @/components/ui/button, @/context/CallContext, @/lib/groupers. Dependências externas detectadas: lucide-react, react. Temas relevantes detectados: calls, dashboard, team. Indícios de framework/arquitetura: react/tsx, next-app-router, client-component.

## Dependências locais
- `@/components/dashboard/TeamCard`
- `@/components/ui/button`
- `@/context/CallContext`
- `@/lib/groupers`

## Dependências externas
- `lucide-react`
- `react`

## Todos os imports detectados
- `@/components/dashboard/TeamCard`
- `@/components/ui/button`
- `@/context/CallContext`
- `@/lib/groupers`
- `lucide-react`
- `react`

## Exports detectados
- `TeamsPage`
- `function`

## Funções e classes detectadas
- `TeamsPage`

## Endpoints detectados
_Nenhum padrão de endpoint detectado_

## Variáveis de ambiente detectadas
_Nenhuma variável de ambiente detectada_

## Temas relevantes
- `calls`
- `dashboard`
- `team`

## Indícios de framework/arquitetura
- `react/tsx`
- `next-app-router`
- `client-component`

## Código
```tsx
"use client";

import { useEffect } from 'react';
import { TeamCard } from '@/components/dashboard/TeamCard';
import { groupCallsByTeam } from '@/lib/groupers';
import { Loader2, Users, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCallContext } from '@/context/CallContext'; // 🚩 Passo 1: O Import Correto

export default function TeamsPage() {
  // 🚩 Passo 2: A Desestruturação Correta
  const { calls, isLoading, error, applyFilter, refresh, loadMore, hasMore } = useCallContext();

  useEffect(() => {
    // 🚩 Passo 3: O Disparo da Busca (Busca Atômica)
    applyFilter({});

    // Executa apenas no mount para carregar o buffer inicial
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isLoading && calls.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // A função de agrupamento agora processa o que vem do contexto global
  const grouped = groupCallsByTeam(calls);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold text-primary">Performance por Equipe</h1>
          <p className="text-muted-foreground mt-1">Visão agregada de resultados técnicos de cada time.</p>
        </div>

        {/* 🚩 Passo 4: Botão de Atualizar */}
        <Button 
          onClick={() => refresh()} 
          variant="outline" 
          disabled={isLoading}
          className="h-11 rounded-xl border-slate-200"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? "Sincronizando..." : "Atualizar"}
        </Button>
      </div>

      {Object.keys(grouped).length === 0 && !isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
          <Users className="w-12 h-12 text-muted-foreground opacity-20" />
          <div>
            <h2 className="text-xl font-bold">Nenhuma equipe identificada</h2>
            <p className="text-muted-foreground">Não há dados de chamadas vinculados a equipes no momento.</p>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(grouped).map(([teamName, teamCalls]) => (
              <TeamCard key={teamName} teamName={teamName} calls={teamCalls} />
            ))}
          </div>

          {/* 🚩 Passo 4: Botão de Carregar Mais */}
          {hasMore && (
            <div className="flex justify-center pt-8">
              <Button 
                variant="ghost" 
                className="w-full max-w-md py-8 text-slate-400 hover:text-indigo-600 font-bold text-xs tracking-widest uppercase border-2 border-dashed border-slate-100 rounded-2xl" 
                onClick={loadMore}
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Carregar mais chamadas para o grupo"}
              </Button>
            </div>
          )}
        </>
      )}

      {error && (
        <p className="text-center text-rose-500 text-xs font-bold mt-4 uppercase tracking-widest">
          Erro ao sincronizar equipes: {error}
        </p>
      )}
    </div>
  );
}
```
