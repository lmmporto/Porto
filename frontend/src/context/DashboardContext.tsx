"use client";
import { createContext, useContext, useState, useCallback, useEffect, ReactNode, useRef } from 'react';

// --- INTERFACES ---
interface User {
  email: string;
  name?: string;
  picture?: string;
}

interface DashboardContextType {
  user: User | null;
  isAdmin: boolean;
  isImpersonating: boolean;
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

  // 🚩 TRAVA DE EXECUÇÃO ÚNICA
  const isChecking = useRef(false);

  // 🚩 ESTADO DE SIMULAÇÃO
  const [impersonatedUser, setImpersonatedUser] = useState<User | null>(null);

  // 🚩 RECUPERAÇÃO: Ao carregar o app, verifica se havia uma simulação ativa no sessionStorage
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const savedSdr = sessionStorage.getItem('impersonated_sdr');
      if (savedSdr) {
        try {
          const parsedSdr = JSON.parse(savedSdr);
          console.log("🔄 [DEV MODE]: Restaurando simulação de:", parsedSdr.name);
          setImpersonatedUser(parsedSdr);
        } catch (e) {
          sessionStorage.removeItem('impersonated_sdr');
        }
      }
    }
  }, []);

  const checkUser = useCallback(async () => {
    // 🚩 PROTEÇÃO: Impede chamadas redundantes ao /auth/me
    if (isChecking.current) return;
    isChecking.current = true;

    setIsLoading(true);
    
    // 🚩 REGRA DE OURO: Bypass de autenticação em ambiente de desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      setUser({ 
        email: 'lucas.porto@nibo.com.br', 
        name: 'Lucas Porto (Dev)',
        picture: 'https://github.com/identicons/jedi.png' 
      });
      setServerIsAdmin(true);
      setIsInitialized(true);
      setIsLoading(false);
      return;
    }

    try {
      const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(/\/$/, '');
      const res = await fetch(`${baseUrl}/auth/me`, { credentials: 'include' });
      
      if (!res.ok) {
        setUser(null);
        return;
      }

      const data = await res.json();
      if (data.authenticated) {
        setUser(data.user);
        setServerIsAdmin(data.isAdmin || false);
      } else {
        setUser(null);
        setServerIsAdmin(false);
      }
    } catch (e) {
      console.error("🚨 [AUTH FATAL]:", e);
      setUser(null);
      setServerIsAdmin(false);
    } finally {
      // 🚩 REGRA DE OURO: O sistema DEVE ser marcado como inicializado aqui para evitar telas brancas
      setIsInitialized(true);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkUser();
  }, [checkUser]);

  // 🚩 LÓGICA DE SIMULAÇÃO COM PERSISTÊNCIA
  const startImpersonation = (sdr: User) => {
    console.warn(`⚠️ SIMULAÇÃO ATIVA: Agindo como ${sdr.name}`);
    setImpersonatedUser(sdr);
    // Salva no navegador para não perder no refresh
    sessionStorage.setItem('impersonated_sdr', JSON.stringify(sdr));
  };

  const stopImpersonation = () => {
    console.warn(`✅ SIMULAÇÃO ENCERRADA: Retornando ao perfil Admin.`);
    setImpersonatedUser(null);
    // Remove do navegador
    sessionStorage.removeItem('impersonated_sdr');
  };

  const effectiveUser = impersonatedUser || user;
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