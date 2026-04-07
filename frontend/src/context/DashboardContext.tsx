"use client";
import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const DashboardContext = createContext<any>(null);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [calls, setCalls] = useState([]);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Pergunta quem é o usuário assim que abre o site
  const checkUser = useCallback(async () => {
    try {
      const res = await fetch('/auth/me');
      const data = await res.json();
      if (data.authenticated) setUser(data.user);
    } catch (e) { console.error("Erro ao checar usuário"); }
  }, []);

  const fetchData = useCallback(async (filters = {}) => {
    setIsLoading(true);
    try {
      let url = `/api/calls?limit=10`;
      // Adiciona filtros na URL se existirem...
      const res = await fetch(url);
      const data = await res.json();
      setCalls(data.calls || []);
      setIsAdmin(data.isAdmin || false); // O servidor diz se ele é admin
    } catch (e) { console.error(e); } 
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { checkUser(); }, [checkUser]);

  return (
    <DashboardContext.Provider value={{ calls, user, isAdmin, isLoading, fetchData }}>
      {children}
    </DashboardContext.Provider>
  );
}

export const useDashboard = () => useContext(DashboardContext);