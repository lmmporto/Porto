"use client";
import { createContext, useContext, ReactNode, useCallback, useMemo } from 'react';
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
}

const CallContext = createContext<CallContextType | undefined>(undefined);

export function CallProvider({ children }: { children: ReactNode }) {
  // 🚩 CORREÇÃO: Removido 'error' da desestruturação pois o hook useCalls não o retorna
  const { 
    calls, 
    setCalls, 
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

  // 🏛️ ARQUITETO: Memorização obrigatória para evitar re-renders em cascata
  const contextValue = useMemo(() => ({ 
    calls, 
    isLoading, 
    filters, 
    error: null, // 🚩 Valor padrão para satisfazer a interface CallContextType
    hasMore, 
    applyFilter, 
    loadMore, 
    refresh 
  }), [calls, isLoading, filters, hasMore, applyFilter, loadMore, refresh]);

  return (
    <CallContext.Provider value={contextValue}>
      {children}
    </CallContext.Provider>
  );
}

export const useCallContext = () => {
  const context = useContext(CallContext);
  if (!context) throw new Error('useCallContext deve ser usado dentro de CallProvider');
  return context;
};