import { useState, useCallback } from 'react';
import type { SDRCall } from '@/types';

export function useCalls(limit = 10) {
  const [calls, setCalls] = useState<SDRCall[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastVisible, setLastVisible] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Estado para armazenar os critérios de busca (datas, sort, owner, etc.)
  const [filters, setFilters] = useState<any>({});

  // Função que atualiza o critério de busca e reseta o cursor
  const updateFilters = useCallback((newFilters: any) => {
    setFilters(newFilters);
    setLastVisible(null); // Reset do cursor ao mudar filtros (volta à pág 1)
  }, []);

  const fetchData = useCallback(async (isReset = false) => {
    setIsLoading(true);
    setError(null);

    try {
      // 🚩 AQUI: Usamos o lastVisible que está no estado do Hook
      let url = `/api/calls?limit=${limit}`;
      
      // Injeta os filtros dinamicamente na URL (cobre minScore, datas, sort, ownerName)
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          url += `&${key}=${encodeURIComponent(String(value))}`;
        }
      });

      // Se não for reset, adicionamos o cursor atual para a paginação
      if (!isReset && lastVisible) {
        url += `&lastVisible=${lastVisible}`;
      }

      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Erro ao buscar chamadas');

      // 🚩 AQUI: Se for reset, substitui. Se for carregar mais, adiciona ao fim.
      setCalls(prev => isReset ? (data.calls || []) : [...prev, ...(data.calls || [])]);
      
      // Atualiza o cursor para a próxima página
      setLastVisible(data.lastVisible || null);
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [limit, lastVisible, filters]); // lastVisible aqui garante que a próxima página saiba onde começar

  return { 
    calls, 
    isLoading, 
    error, 
    fetchData, 
    updateFilters, 
    hasMore: !!lastVisible 
  };
}