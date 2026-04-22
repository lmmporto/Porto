# CallContext.tsx

## Visão geral
- Caminho original: `frontend/src/context/CallContext.tsx`
- Domínio: **frontend**
- Prioridade: **01-FUNDAMENTAL**
- Tipo: **context**
- Criticidade: **important**
- Score de importância: **108**
- Entry point: **não**
- Arquivo central de fluxo: **sim**
- Linhas: **74**
- Imports detectados: **4**
- Exports detectados: **2**
- Funções/classes detectadas: **2**

## Resumo factual
Este arquivo foi classificado como context no domínio frontend. Criticidade: important. Prioridade: 01-FUNDAMENTAL. Exports detectados: CallProvider, useCallContext. Funções/classes detectadas: CallProvider, useCallContext. Dependências locais detectadas: @/hooks/useCallsEngine, @/types. Dependências externas detectadas: next/navigation, react. Temas relevantes detectados: calls, dashboard, sdr. Indícios de framework/arquitetura: react/tsx, client-component, express, next-runtime.

## Dependências locais
- `@/hooks/useCallsEngine`
- `@/types`

## Dependências externas
- `next/navigation`
- `react`

## Todos os imports detectados
- `@/hooks/useCallsEngine`
- `@/types`
- `next/navigation`
- `react`

## Exports detectados
- `CallProvider`
- `useCallContext`

## Funções e classes detectadas
- `CallProvider`
- `useCallContext`

## Endpoints detectados
_Nenhum padrão de endpoint detectado_

## Variáveis de ambiente detectadas
_Nenhuma variável de ambiente detectada_

## Temas relevantes
- `calls`
- `dashboard`
- `sdr`

## Indícios de framework/arquitetura
- `react/tsx`
- `client-component`
- `express`
- `next-runtime`

## Código
```tsx
"use client";
import { createContext, useContext, ReactNode, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useCalls } from '@/hooks/useCallsEngine';
import type { SDRCall, CallFilters } from '@/types';

interface CallContextType {
  calls: SDRCall[];
  isLoading: boolean;
  filters: CallFilters;
  error: string | null;
  hasMore: boolean;
  applyFilter: (newFilters: CallFilters) => void;
  loadMore: () => void;
  refresh: () => void;
  openCall: (id: string) => void;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

export function CallProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { 
    calls, 
    isLoading, 
    filters, 
    fetchData, 
    updateFilters, 
    hasMore 
  } = useCalls();

  const applyFilter = useCallback((newFilters: CallFilters) => {
    updateFilters(newFilters);
    fetchData(true, newFilters); 
  }, [updateFilters, fetchData]);

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      fetchData(false);
    }
  }, [isLoading, hasMore, fetchData]);

  const refresh = useCallback(() => {
    fetchData(true);
  }, [fetchData]);

  const openCall = useCallback((id: string) => {
    router.push(`/dashboard/calls/${id}`);
  }, [router]);

  const value = useMemo<CallContextType>(() => ({ 
    calls, 
    isLoading, 
    filters, 
    error: null, 
    hasMore, 
    applyFilter, 
    loadMore, 
    refresh,
    openCall
  }), [calls, isLoading, filters, hasMore, applyFilter, loadMore, refresh, openCall]);

  return (
    <CallContext.Provider value={value}>
      {children}
    </CallContext.Provider>
  );
}

export const useCallContext = () => {
  const context = useContext(CallContext);
  if (!context) throw new Error('useCallContext deve ser usado dentro de CallProvider');
  return context;
};
```
