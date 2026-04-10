import { useState, useCallback, useRef } from 'react';
import type { SDRCall, CallFilters } from '@/types';
import { useDashboard } from '@/context/DashboardContext';

export function useCalls(limit = 10) {
  // 🚩 Extraímos isAdmin para controlar a flexibilidade do filtro
  const { user, isAdmin } = useDashboard();

  const [calls, setCalls] = useState<SDRCall[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastVisible, setLastVisible] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<CallFilters>({});

  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async (isReset = false, overrideFilters?: CallFilters) => {
    const activeFilters = overrideFilters || filters;

    if (!user?.email && !activeFilters.ownerEmail && !activeFilters.ownerName) {
      console.warn("⚠️ [useCalls] Busca bloqueada: Usuário não autenticado e sem filtros.");
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
      const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');

      const params = new URLSearchParams();
      params.append('limit', String(limit || 50));

      // Propaga modo, ownerEmail, e qualquer outro filtro ativo
      Object.entries(activeFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '' && value !== 'undefined') {
          params.append(key, String(value));
        }
      });

      // 🚩 CORREÇÃO SÊNIOR: Só injeta o e-mail se não for Admin (visão restrita)
      // Se for Admin, params.ownerEmail virá apenas se houver um filtro explícito selecionado.
      const shouldFilterByEmail = !isAdmin && user?.email;

      if (shouldFilterByEmail && !activeFilters.ownerEmail) {
        params.append('ownerEmail', user.email);
      }

      if (!isReset && lastVisible) {
        params.append('lastVisible', lastVisible);
      }

      const url = `${baseUrl}/api/calls?${params.toString()}`;

      console.log("🚀 FETCHING FROM:", url);

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
    // 🚩 Adicionado isAdmin nas dependências para garantir consistência
  }, [limit, lastVisible, filters, user, isAdmin]);

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