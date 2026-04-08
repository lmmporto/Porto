import { useState, useCallback, useRef } from 'react';
// 🚩 IMPORTANTE: Use o tipo global que definimos antes para manter a consistência
import type { SDRCall, CallFilters } from '@/types';

export function useCalls(limit = 10) {
  const [calls, setCalls] = useState<SDRCall[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastVisible, setLastVisible] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Inicializamos com um objeto vazio tipado
  const [filters, setFilters] = useState<CallFilters>({});

  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async (isReset = false, overrideFilters?: CallFilters) => {
    // 🚩 Lógica de AbortController (Muito boa, mantida)
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setError(null);

    try {
      const activeFilters = overrideFilters || filters;
      const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(/\/$/, '');
      
      const params = new URLSearchParams();
      params.append('limit', String(limit));

      // 🚩 Limpeza de filtros: Removendo o 'any' e usando tipagem segura
      Object.entries(activeFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '' && value !== 'undefined') {
          // Se o valor for um array (ex: statusFinal), enviamos como string separada por vírgula ou múltiplos campos
          if (Array.isArray(value)) {
            params.append(key, value.join(','));
          } else {
            params.append(key, String(value));
          }
        }
      });

      if (!isReset && lastVisible) {
        params.append('lastVisible', lastVisible);
      }

      const url = `${baseUrl}/api/calls?${params.toString()}`;
      console.log(`🔎 [BUSCA ATÔMICA] URL: ${url}`);

      const res = await fetch(url, { 
        credentials: 'include',
        signal: controller.signal 
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Erro HTTP: ${res.status}`);
      }

      const data = await res.json();

      setCalls(prev => isReset ? (data.calls || []) : [...prev, ...(data.calls || [])]);
      setLastVisible(data.lastVisible || null);
      
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.error("❌ [useCalls Error]:", err.message);
      setError(err.message);
    } finally {
      if (controller === abortControllerRef.current) {
        setIsLoading(false);
      }
    }
    // 🚩 Removi 'lastVisible' e 'filters' das dependências para evitar loop infinito
    // se o fetchData for chamado dentro de um useEffect que reage a eles.
  }, [limit]); 

  const updateFilters = useCallback((newFilters: CallFilters) => {
    setFilters(newFilters);
    setLastVisible(null);
    // Dica Sênior: Geralmente, ao dar update nos filtros, 
    // queremos disparar o fetchData(true, newFilters) imediatamente
  }, []);

  return { 
    calls, 
    isLoading, 
    error, 
    filters, // 🚩 AQUI ESTAVA O ERRO: Agora o context consegue enxergar os filtros!
    fetchData, 
    updateFilters, 
    hasMore: !!lastVisible 
  };
}