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