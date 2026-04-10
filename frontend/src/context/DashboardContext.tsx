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

  const checkUser = useCallback(async (retryCount = 0) => {
    // 🚩 REGRA DE OURO: Bypass de autenticação em ambiente de desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.log("🛠️ [DEV MODE]: Ignorando autenticação real e usando perfil Admin.");
      setUser({ 
        email: 'lucas.porto@nibo.com.br', 
        name: 'Lucas Porto (Dev)',
        picture: 'https://github.com/identicons/jedi.png' 
      });
      setServerIsAdmin(true);
      setIsInitialized(true);
      return;
    }

    // --- FLUXO DE PRODUÇÃO ---
    try {
      const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(/\/$/, '');
      const res = await fetch(`${baseUrl}/auth/me`, { 
        credentials: 'include' 
      });
      
      // 🚩 SE O SERVIDOR ESTIVER "ACORDANDO" (502), TENTA DE NOVO
      if (res.status === 502 && retryCount < 2) {
        console.warn(`⚠️ [AUTH RETRY ${retryCount + 1}/2]: Servidor instável (502), tentando reconectar...`);
        setTimeout(() => checkUser(retryCount + 1), 2000);
        return;
      }

      if (!res.ok) throw new Error("Não autenticado");
      
      const data = await res.json();
      
      if (data.authenticated) {
        setUser(data.user);
        setServerIsAdmin(data.isAdmin || false);
      } else {
        setUser(null);
        setServerIsAdmin(false);
      }
    } catch (e: any) {
      // 🚩 TENTA DE NOVO CASO SEJA ERRO DE REDE OU TIMEOUT
      if (retryCount < 2) {
        console.warn(`⚠️ [AUTH RETRY ${retryCount + 1}/2]: Falha na conexão. Tentando novamente...`);
        setTimeout(() => checkUser(retryCount + 1), 2000);
      } else {
        console.error("🚨 [AUTH ERROR]: Sessão expirada ou servidor inacessível.", e.message);
        setUser(null);
        setServerIsAdmin(false);
      }
    } finally {
      // Só encerra o loading se não houver retry pendente
      if (retryCount >= 2) {
        setIsInitialized(true);
      }
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