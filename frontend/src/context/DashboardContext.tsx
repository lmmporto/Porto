"use client";
import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';

// --- INTERFACES ---
interface User {
  email: string;
  name?: string;
  picture?: string;
}

interface DashboardContextType {
  user: User | null;
  isAdmin: boolean;
  isImpersonating: boolean; // 🚩 Útil para mostrar um aviso na UI
  isLoading: boolean;
  isInitialized: boolean;
  checkUser: () => Promise<void>;
  startImpersonation: (sdr: User) => void;
  stopImpersonation: () => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [serverIsAdmin, setServerIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // 🚩 ESTADO DE SIMULAÇÃO
  const [impersonatedUser, setImpersonatedUser] = useState<User | null>(null);

  const checkUser = useCallback(async () => {
    try {
      const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(/\/$/, '');
      const res = await fetch(`${baseUrl}/auth/me`, { 
        credentials: 'include' 
      });
      const data = await res.json();
      
      if (data.authenticated) {
        setUser(data.user);
        setServerIsAdmin(data.isAdmin || false);
      } else {
        setUser(null);
        setServerIsAdmin(false);
      }
    } catch (e) {
      console.error("🚨 [AUTH ERROR]: Falha ao validar sessão.");
    } finally {
      setIsInitialized(true);
    }
  }, []);

  useEffect(() => {
    checkUser();
  }, [checkUser]);

  // 🚩 LÓGICA DE SIMULAÇÃO
  const startImpersonation = (sdr: User) => {
    console.warn(`⚠️ SIMULAÇÃO ATIVA: Agindo como ${sdr.name}`);
    setImpersonatedUser(sdr);
  };

  const stopImpersonation = () => {
    console.warn(`✅ SIMULAÇÃO ENCERRADA: Retornando ao perfil Admin.`);
    setImpersonatedUser(null);
  };

  // 🚩 DEFINIÇÃO DO USUÁRIO EFETIVO E PAPEL
  // O resto do app (incluindo o hook useCallsEngine) usará este 'effectiveUser'
  const effectiveUser = impersonatedUser || user;
  
  // O usuário só tem poderes de admin se NÃO estiver simulando e se for admin no servidor
  // Adicionada a trava de segurança por e-mail conforme solicitado
  const isAdmin = !impersonatedUser && (serverIsAdmin || user?.email === 'lucas.porto@nibo.com.br');

  return (
    <DashboardContext.Provider value={{ 
      user: effectiveUser, 
      isAdmin,
      isImpersonating: !!impersonatedUser,
      isLoading, 
      isInitialized, 
      checkUser,
      startImpersonation,
      stopImpersonation
    }}>
      {isInitialized ? children : (
        <div className="min-h-screen flex items-center justify-center bg-white">
           <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </DashboardContext.Provider>
  );
}

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboard deve ser usado dentro de um DashboardProvider');
  }
  return context;
};