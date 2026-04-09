import { useEffect, useRef, useState, useCallback } from 'react';
import { useCallContext } from '@/context/CallContext';
import { useDashboard } from '@/context/DashboardContext';

export function useSDRDashboardSync() {
  const { user } = useDashboard();
  const { calls, isLoading, applyFilter, refresh } = useCallContext();
  const [personalInsights, setPersonalInsights] = useState<any>(null);
  const hasLoaded = useRef(false);

  const loadAllData = useCallback(async () => {
    if (!user?.email) return;
    
    hasLoaded.current = true;
    
    // Dispara as duas buscas em paralelo (mais rápido)
    const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
    
    await Promise.all([
      applyFilter({ ownerEmail: user.email }),
      fetch(`${baseUrl}/api/stats/personal-summary`, { credentials: 'include' })
        .then(res => res.json())
        .then(data => setPersonalInsights(data))
        .catch(err => console.error("Erro nos insights:", err))
    ]);
  }, [user?.email, applyFilter]);

  useEffect(() => {
    if (user?.email && !hasLoaded.current) {
      loadAllData();
    }
  }, [user?.email, loadAllData]);

  // Resetar quando o usuário mudar (simulação)
  useEffect(() => {
    hasLoaded.current = false;
  }, [user?.email]);

  return {
    user,
    calls,
    isLoading,
    personalInsights,
    refresh: loadAllData // O refresh agora limpa e recarrega tudo
  };
}