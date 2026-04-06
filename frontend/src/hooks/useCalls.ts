import { useState, useCallback } from 'react';
import type { SDRCall } from '@/types';

export function useCalls(limit = 10) {
  const [calls, setCalls] = useState<SDRCall[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastVisible, setLastVisible] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<any>({});

  const fetchData = useCallback(async (isReset = false, overrideFilters?: any) => {
    if (isLoading) return;
    setIsLoading(true);
    setError(null);

    try {
      // 🚩 Usa os filtros que acabaram de chegar ou os que já estavam salvos
      const currentFilters = overrideFilters || filters;
      let url = `/api/calls?limit=${limit}`;
      
      Object.entries(currentFilters).forEach(([key, value]) => {
        // 🚩 TRAVA DE SEGURANÇA: Só adiciona se o valor existir e não for a palavra "undefined"
        if (value !== undefined && value !== null && value !== '' && value !== 'undefined') {
          url += `&${key}=${encodeURIComponent(String(value))}`;
        }
      });

      if (!isReset && lastVisible) {
        url += `&lastVisible=${lastVisible}`;
      }

      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Erro ao buscar chamadas');

      setCalls(prev => isReset ? (data.calls || []) : [...prev, ...(data.calls || [])]);
      setLastVisible(data.lastVisible || null);
      
    } catch (err: any) {
      console.error("❌ [useCalls Error]:", err.message);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [limit, lastVisible, filters, isLoading]);

  const updateFilters = useCallback((newFilters: any) => {
    setFilters(newFilters);
    setLastVisible(null);
  }, []);

  return { 
    calls, 
    isLoading, 
    error, 
    fetchData, 
    updateFilters, 
    hasMore: !!lastVisible 
  };
}