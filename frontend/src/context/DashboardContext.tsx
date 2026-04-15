"use client";

import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

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

interface DashboardProviderProps {
  children: ReactNode;
}

export function DashboardProvider({ children }: DashboardProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [serverIsAdmin, setServerIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [impersonatedUser, setImpersonatedUser] = useState<User | null>(null);
  const isChecking = useRef(false);

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const savedSdr = sessionStorage.getItem('impersonated_sdr');
      if (savedSdr) {
        try {
          const parsedSdr = JSON.parse(savedSdr) as User;
          console.log('[DEV MODE]: Restaurando simulacao de:', parsedSdr.name);
          setImpersonatedUser(parsedSdr);
        } catch {
          sessionStorage.removeItem('impersonated_sdr');
        }
      }
    }
  }, []);

  const checkUser = useCallback(async () => {
    if (isChecking.current) {
      return;
    }

    isChecking.current = true;
    setIsLoading(true);

    try {
      if (process.env.NODE_ENV === 'development') {
        setUser({
          email: 'lucas.porto@nibo.com.br',
          name: 'Lucas Porto (Dev)',
          picture: 'https://github.com/identicons/jedi.png',
        });
        setServerIsAdmin(true);
        return;
      }

      const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(/\/$/, '');
      const res = await fetch(`${baseUrl}/auth/me`, { credentials: 'include' });

      if (res.ok) {
        const data = await res.json();

        if (data.authenticated) {
          setUser(data.user);
          setServerIsAdmin(data.isAdmin || false);
        } else {
          setUser(null);
          setServerIsAdmin(false);
        }

        return;
      }

      setUser(null);
      setServerIsAdmin(false);
    } catch (error) {
      console.error('[AUTH FATAL]:', error);
      setUser(null);
      setServerIsAdmin(false);
    } finally {
      setIsInitialized(true);
      setIsLoading(false);
      isChecking.current = false;
    }
  }, []);

  useEffect(() => {
    checkUser();
  }, [checkUser]);

  const startImpersonation = useCallback((sdr: User) => {
    console.warn(`SIMULACAO ATIVA: Agindo como ${sdr.name}`);
    setImpersonatedUser(sdr);
    sessionStorage.setItem('impersonated_sdr', JSON.stringify(sdr));
  }, []);

  const stopImpersonation = useCallback(() => {
    console.warn('SIMULACAO ENCERRADA: Retornando ao perfil Admin.');
    setImpersonatedUser(null);
    sessionStorage.removeItem('impersonated_sdr');
  }, []);

  const effectiveUser = impersonatedUser || user;

  // 🏛️ ARQUITETO: Normalização para evitar quebras por Case-Sensitivity ou Espaços
  const isAdmin = useMemo(() => {
    if (impersonatedUser) return false; // Se está simulando, não é admin da visão atual
    
    const userEmail = user?.email?.toLowerCase().trim();
    const isHardcodedAdmin = userEmail === 'lucas.porto@nibo.com.br';
    
    const finalStatus = serverIsAdmin || isHardcodedAdmin;
    
    // Log de Debug para você ver no console o que está acontecendo
    if (userEmail) {
      console.log(`[AUTH CHECK]: User=${userEmail} | ServerAdmin=${serverIsAdmin} | FinalAdmin=${finalStatus}`);
    }
    
    return finalStatus;
  }, [impersonatedUser, serverIsAdmin, user?.email]);

  const contextValue = useMemo(
    () => ({
      user: effectiveUser,
      isAdmin,
      isImpersonating: Boolean(impersonatedUser),
      isLoading,
      isInitialized,
      checkUser,
      startImpersonation,
      stopImpersonation,
    }),
    [effectiveUser, isAdmin, impersonatedUser, isLoading, isInitialized, checkUser, startImpersonation, stopImpersonation]
  );

  return (
    <DashboardContext.Provider value={contextValue}>
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