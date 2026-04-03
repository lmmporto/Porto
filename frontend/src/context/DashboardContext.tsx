"use client";
import { createContext, useContext, useState, useCallback } from 'react';
import type { SDRCall } from '@/types';

const DashboardContext = createContext<any>(null);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [calls, setCalls] = useState<SDRCall[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState({ minScore: 0, startDate: '', endDate: '', ownerName: '' });

  const fetchData = useCallback(async (isReset = false) => {
    setIsLoading(true);
    try {
      let url = `/api/calls?limit=10&minScore=${filters.minScore}`;
      if (filters.startDate) url += `&startDate=${filters.startDate}&endDate=${filters.endDate}`;
      if (filters.ownerName) url += `&ownerName=${encodeURIComponent(filters.ownerName)}`;
      
      const res = await fetch(url);
      const data = await res.json();
      setCalls(isReset ? data.calls : [...calls, ...data.calls]);
    } catch (e) { console.error(e); } 
    finally { setIsLoading(false); }
  }, [filters, calls]);

  return (
    <DashboardContext.Provider value={{ calls, isLoading, fetchData, setFilters }}>
      {children}
    </DashboardContext.Provider>
  );
}

export const useDashboard = () => useContext(DashboardContext);