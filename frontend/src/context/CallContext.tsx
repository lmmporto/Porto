"use client";
import { createContext, useContext, ReactNode, useCallback } from 'react';
import { useCalls } from '@/hooks/useCallsEngine'; // O hook motor que refatoramos
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
  const { calls, isLoading, error, filters, fetchData, updateFilters, hasMore } = useCalls();

  // Abstração para facilitar o uso nos componentes
  const applyFilter = useCallback((newFilters: CallFilters) => {
    updateFilters(newFilters);
    fetchData(true, newFilters); // Reset e busca atômica
  }, [updateFilters, fetchData]);

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      fetchData(false); // Paginação
    }
  }, [isLoading, hasMore, fetchData]);

  const refresh = useCallback(() => {
    fetchData(true);
  }, [fetchData]);

  return (
    <CallContext.Provider value={{ 
      calls, isLoading, filters, error, hasMore, applyFilter, loadMore, refresh 
    }}>
      {children}
    </CallContext.Provider>
  );
}

export const useCallContext = () => {
  const context = useContext(CallContext);
  if (!context) throw new Error('useCallContext deve ser usado dentro de CallProvider');
  return context;
};