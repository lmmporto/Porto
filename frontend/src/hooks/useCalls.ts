import { useState, useCallback } from 'react';
import type { SDRCall } from '@/types';

export function useCalls(limit = 10) {
  const [calls, setCalls] = useState<SDRCall[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastVisible, setLastVisible] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // 🚩 Estado para armazenar os critérios de busca (datas, sort, owner, etc.)
  const [filters, setFilters] = useState<any>({});

  // 🚩 Função que atualiza o critério de busca e reseta o cursor
  const updateFilters = useCallback((newFilters: any) => {
    setFilters(newFilters);
    setLastVisible(null); // Reset do cursor ao mudar filtros (volta à pág 1)
  }, []);

  const fetchData = useCallback(async (isReset = false) => {
    setIsLoading(true);
    setError(null);

    try {
      // Constrói a URL base com o limite
      let url = `/api/calls?limit=${limit}`;
      
      // Adiciona o cursor de paginação se não for um reset (carregamento contínuo)
      if (!isReset && lastVisible) {
        url += `&lastVisible=${lastVisible}`;
      }

      // 🚩 Injeta os filtros dinamicamente na URL
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          url += `&${key}=${encodeURIComponent(String(value))}`;
        }
      });

      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Erro ao buscar chamadas');

      // 🚩 ATUALIZAÇÃO SEGURA: Utilizando prevState para evitar a dependência de `calls`
      // Se for reset, substitui a lista. Se for paginação, anexa ao final.
      setCalls(prev => isReset ? (data.calls || []) : [...prev, ...(data.calls || [])]);
      
      setLastVisible(data.lastVisible || null);
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  // 🚩 ARRAY DE DEPENDÊNCIAS SEGURO (Sem 'calls' para evitar loops infinitos)
  }, [limit, lastVisible, filters]); 

  return { 
    calls, 
    isLoading, 
    error, 
    fetchData, 
    updateFilters, 
    hasMore: !!lastVisible 
  };
}