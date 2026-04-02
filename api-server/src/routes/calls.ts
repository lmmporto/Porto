import { useState, useCallback } from 'react';
import type { SDRCall } from '@/types';

export function useCalls(limit = 10) {
  const [calls, setCalls] = useState<SDRCall[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastVisible, setLastVisible] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [filters, setFilters] = useState<any>({});

  const updateFilters = useCallback((newFilters: any) => {
    setFilters(newFilters);
    setLastVisible(null); 
  }, []);

  const fetchData = useCallback(async (isReset = false) => {
    setIsLoading(true);
    setError(null);

    try {
      let url = `/api/calls?limit=${limit}`;
      
      if (!isReset && lastVisible) {
        url += `&lastVisible=${lastVisible}`;
      }

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          url += `&${key}=${encodeURIComponent(String(value))}`;
        }
      });

      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Erro ao buscar chamadas');

      // 🚩 APLICAÇÃO DA DICA SÊNIOR: Usar "prev" aqui elimina a necessidade
      // de ter 'calls' no array de dependências do useCallback
      setCalls(prev => isReset ? (data.calls || []) : [...prev, ...(data.calls || [])]);
      setLastVisible(data.lastVisible || null);
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [limit, lastVisible, filters]); // 🚩 AJUSTE FEITO: 'calls' removido daqui!

  return { 
    calls, 
    isLoading, 
    error, 
    fetchData, 
    updateFilters, 
    hasMore: !!lastVisible 
  };
}