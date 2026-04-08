import { useState, useCallback, useRef } from 'react';
import type { SDRCall, CallFilters } from '@/types';
import { useDashboard } from '@/context/DashboardContext'; 

export function useCalls(limit = 10) {
  const { user } = useDashboard(); 

  const [calls, setCalls] = useState<SDRCall[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastVisible, setLastVisible] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<CallFilters>({});

  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async (isReset = false, overrideFilters?: CallFilters) => {
    const activeFilters = overrideFilters || filters;
    
    // 🚩 PROTEÇÃO: Se não temos o usuário logado ainda e nenhum filtro de e-mail, não buscamos nada!
    if (!user?.email && !activeFilters.ownerEmail) {
      console.warn("⚠️ [useCalls] Busca bloqueada: Usuário não autenticado e sem filtro de e-mail.");
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setError(null);

    try {
      const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(/\/$/, '');
      
      const params = new URLSearchParams();
      params.append('limit', String(limit));

      // 🚩 FILTRAGEM LIMPA: Apenas ownerEmail é enviado para o backend
      if (activeFilters.ownerEmail) {
        params.append('ownerEmail', activeFilters.ownerEmail);
      } else if (user?.email) {
        // Blindagem: Injeta o e-mail do usuário logado se não houver filtro específico
        params.set('ownerEmail', user.email);
      }

      // Adiciona outros filtros válidos (datas, score, etc)
      Object.entries(activeFilters).forEach(([key, value]) => {
        if (key !== 'ownerEmail' && value !== undefined && value !== null && value !== '' && value !== 'undefined') {
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
  }, [limit, lastVisible, filters, user]);

  const updateFilters = useCallback((newFilters: CallFilters) => {
    setFilters(newFilters);
    setLastVisible(null);
    setCalls([]); 
  }, []);

  return { 
    calls, 
    setCalls, 
    isLoading, 
    error, 
    filters, 
    fetchData, 
    updateFilters, 
    hasMore: !!lastVisible 
  };
}