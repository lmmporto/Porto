import { useState, useCallback, useRef, useEffect } from 'react';
import type { SDRCall, CallFilters } from '@/types';
import { useDashboard } from '@/context/DashboardContext';

export function useCalls(limit = 10) {
  const { user, isAdmin } = useDashboard();
  const [calls, setCalls] = useState<SDRCall[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastVisible, setLastVisible] = useState<string | null>(null);
  const [filters, setFilters] = useState<CallFilters>({});
  
  // 🏛️ ARQUITETO: Refs para garantir fetchData estável e evitar loops
  const filtersRef = useRef<CallFilters>(filters);
  const lastVisibleRef = useRef<string | null>(null);
  const lastRequestSignature = useRef<string>("");
  const abortControllerRef = useRef<AbortController | null>(null);

  // Sincroniza as Refs sem disparar re-renders
  useEffect(() => {
    filtersRef.current = filters;
    lastVisibleRef.current = lastVisible;
  }, [filters, lastVisible]);

  const fetchData = useCallback(async (isReset = false, overrideFilters?: CallFilters) => {
    // 1. Determina filtros ativos via Ref (fetchData não "vicia" quando o filtro muda)
    const activeFilters = overrideFilters || filtersRef.current;
    const currentLastVisible = isReset ? null : lastVisibleRef.current;
    
    // 2. Guarda de Assinatura: Impede chamadas idênticas
    const signature = JSON.stringify({ activeFilters, isReset, currentLastVisible, isAdmin, email: user?.email });
    if (signature === lastRequestSignature.current && !isReset) return;
    lastRequestSignature.current = signature;

    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();

    setIsLoading(true);

    try {
      const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(/\/$/, '');
      const params = new URLSearchParams();
      params.append('limit', String(limit));

      Object.entries(activeFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });

      if (!isAdmin && user?.email && !activeFilters.ownerEmail) {
        params.append('ownerEmail', user.email);
      }

      if (!isReset && currentLastVisible) {
        params.append('lastVisible', currentLastVisible);
      }

      const res = await fetch(`${baseUrl}/api/calls?${params.toString()}`, {
        credentials: 'include',
        signal: abortControllerRef.current.signal
      });

      const data = await res.json();
      
      setCalls(prev => isReset ? (data.calls || []) : [...prev, ...(data.calls || [])]);
      setLastVisible(data.lastVisible || null);
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      lastRequestSignature.current = ""; 
      console.error("Erro no fetch de chamadas:", err);
    } finally {
      setIsLoading(false);
    }
    // 🚩 DEPENDÊNCIAS ESTÁVEIS: fetchData não muda mais quando filters ou lastVisible mudam
  }, [limit, user?.email, isAdmin]); 

  const updateFilters = useCallback((newFilters: CallFilters) => {
    setFilters(newFilters);
    setLastVisible(null);
  }, []);

  return { 
    calls, 
    setCalls, 
    isLoading, 
    filters, 
    fetchData, 
    updateFilters, 
    hasMore: !!lastVisible 
  };
}