import { useEffect, useRef, useCallback, useState } from 'react';
import { useCallContext } from '@/context/CallContext';
import { useDashboard } from '@/context/DashboardContext';

export function useSDRDashboardSync() {
  const { user, isAdmin } = useDashboard();
  const { calls, isLoading, applyFilter } = useCallContext();
  const [personalInsights, setPersonalInsights] = useState<any>(null);
  
  // 🚩 TRAVA DE SEGURANÇA: Impede que o mesmo e-mail seja carregado várias vezes
  const lastLoadedEmail = useRef<string | null>(null);

  const loadData = useCallback(async (targetEmail: string) => {
    if (lastLoadedEmail.current === targetEmail) return;
    
    lastLoadedEmail.current = targetEmail;
    console.log("🚀 [SYNC] Iniciando carga estável para:", targetEmail);

    const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || 'https://porto-58em.onrender.com').replace(/\/$/, '');

    try {
      await Promise.all([
        applyFilter({ ownerEmail: targetEmail }),
        fetch(`${baseUrl}/api/stats/personal-summary?ownerEmail=${encodeURIComponent(targetEmail)}`, { 
          credentials: 'include' 
        })
        .then(res => res.json())
        .then(data => setPersonalInsights(data))
      ]);
    } catch (error) {
      console.error("❌ [SYNC ERROR]:", error);
      // Libera para tentar de novo após 5 segundos em caso de erro
      setTimeout(() => { lastLoadedEmail.current = null; }, 5000);
    }
  }, [applyFilter]);

  useEffect(() => {
    if (user?.email) {
      loadData(user.email.toLowerCase().trim());
    }
  }, [user?.email, loadData]);

  return { 
    user, 
    calls, 
    isLoading, 
    personalInsights, 
    isAdmin,
    refresh: () => {
      lastLoadedEmail.current = null;
      if (user?.email) loadData(user.email.toLowerCase().trim());
    }
  };
}