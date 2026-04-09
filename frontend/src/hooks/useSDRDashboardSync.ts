import { useEffect, useRef, useState, useCallback } from 'react';
import { useCallContext } from '@/context/CallContext';
import { useDashboard } from '@/context/DashboardContext';

export function useSDRDashboardSync() {
  const { user } = useDashboard();
  const { calls, isLoading, applyFilter } = useCallContext();
  const [personalInsights, setPersonalInsights] = useState<any>(null);
  
  // 🚩 TRAVA DE SEGURANÇA: Impede loops infinitos e requisições redundantes
  const lastLoadedEmail = useRef<string | null>(null);

  const loadData = useCallback(async () => {
    if (!user?.email || lastLoadedEmail.current === user.email) return;

    lastLoadedEmail.current = user.email;
    console.log("🚀 [SYNC] Carregando Radar para:", user.email);

    const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');

    try {
      // Busca chamadas (via Contexto) e insights (via API) em paralelo
      await Promise.all([
        applyFilter({ ownerEmail: user.email }),
        fetch(`${baseUrl}/api/stats/personal-summary?ownerEmail=${encodeURIComponent(user.email)}`, { 
          credentials: 'include' 
        })
        .then(res => res.json())
        .then(data => setPersonalInsights(data))
      ]);
    } catch (error) {
      console.error("❌ [SYNC ERROR]:", error);
      lastLoadedEmail.current = null; // Libera para nova tentativa em caso de erro
    }
  }, [user?.email, applyFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Resetar trava se o e-mail mudar (essencial para simulação de SDRs)
  useEffect(() => {
    if (user?.email && user.email !== lastLoadedEmail.current) {
      lastLoadedEmail.current = null;
    }
  }, [user?.email]);

  return {
    user,
    calls,
    isLoading,
    personalInsights,
    refresh: () => {
      lastLoadedEmail.current = null;
      loadData();
    }
  };
}