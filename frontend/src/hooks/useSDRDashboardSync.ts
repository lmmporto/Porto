import { useEffect, useRef, useCallback, useState } from 'react';
import { useCallContext } from '@/context/CallContext';
import { useDashboard } from '@/context/DashboardContext';

export function useSDRDashboardSync() {
  const { user, isAdmin } = useDashboard();
  const { calls, isLoading, applyFilter } = useCallContext();
  const [personalInsights, setPersonalInsights] = useState<any>(null);
  
  const lastLoadedEmail = useRef<string | null>(null);

  const loadData = useCallback(async (targetEmail: string) => {
    if (lastLoadedEmail.current === targetEmail) return;
    
    console.log(`🚀 [SYNC] Carga estável para: ${targetEmail}`);
    lastLoadedEmail.current = targetEmail;

    // Fallback inteligente para desenvolvimento local
    const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
    
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
      lastLoadedEmail.current = null; // Permite retentativa em caso de falha
    }
  }, [applyFilter]);

  useEffect(() => {
    if (user?.email) {
      loadData(user.email.toLowerCase().trim());
    }
  }, [user?.email, loadData]);

  return { user, calls, isLoading, personalInsights, isAdmin, refresh: () => {
    lastLoadedEmail.current = null;
    if (user?.email) loadData(user.email);
  }};
}