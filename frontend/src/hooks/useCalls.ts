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
      const currentFilters = overrideFilters || filters;

      // 🚩 DECLARAÇÃO DA BASE URL (Puxa do .env e limpa a barra final)
      const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(/\/$/, '');
      
      // 🚩 MONTAGEM DA URL USANDO A VARIÁVEL DECLARADA
      let url = `${baseUrl}/api/calls?limit=${limit}`;

      // LOG DE AUDITORIA
      console.log(`🔎 [BUSCA] SDR: ${currentFilters.ownerName || "TODOS"} | Datas: ${currentFilters.startDate || 'Início'} a ${currentFilters.endDate || 'Fim'}`);
      
      Object.entries(currentFilters).forEach(([key, value]) => {
        // TRAVA DE SEGURANÇA: Ignora valores inválidos ou a string 'undefined'
        if (value !== undefined && value !== null && value !== '' && value !== 'undefined') {
          url += `&${key}=${encodeURIComponent(String(value))}`;
        }
      });

      if (!isReset && lastVisible) {
        url += `&lastVisible=${lastVisible}`;
      }

      // 🚩 FETCH DIRETO PARA O RENDER COM CREDENTIALS (Sessão Passport)
      const res = await fetch(url, { credentials: 'include' });
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