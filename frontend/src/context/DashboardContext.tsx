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
  isLoading: boolean;
  isInitialized: boolean;
  checkUser: () => Promise<void>;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false); // 🚩 Trava de inicialização

  // 1. Pergunta quem é o usuário e quais os poderes dele
  const checkUser = useCallback(async () => {
    try {
      // 🚩 CREDENTIALS: 'INCLUDE' habilitado para persistência de sessão cross-origin
      const res = await fetch('/auth/me', { 
        credentials: 'include' 
      });
      const data = await res.json();
      
      if (data.authenticated) {
        setUser(data.user);
        setIsAdmin(data.isAdmin || false); // O servidor já responde isso no /me
      } else {
        setUser(null);
        setIsAdmin(false);
      }
    } catch (e) {
      console.error("🚨 [AUTH ERROR]: Falha ao validar sessão.");
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // Inicializa o sistema uma única vez
  useEffect(() => {
    checkUser();
  }, [checkUser]);

  return (
    <DashboardContext.Provider value={{ 
      user, 
      isAdmin, 
      isLoading, 
      isInitialized, 
      checkUser 
    }}>
      {/* 🚩 Só mostra o app quando terminar de checar o usuário */}
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