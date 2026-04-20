'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation'; // Importar useRouter e usePathname

interface DashboardContextType {
  user: { email: string | null; name?: string; picture?: string } | null; // Adicionado 'picture'
  impersonatedEmail: string | null;
  setImpersonatedEmail: (email: string | null) => void;
  isAdmin: boolean;
  isSidebarCollapsed: boolean; // Novo estado
  toggleSidebar: () => void; // Nova função
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<{ email: string | null; name?: string; picture?: string } | null>(null); // Estado real, não mock
  const [impersonatedEmail, setImpersonatedEmailState] = useState<string | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false); // Estado da sidebar

  const ADMIN_EMAIL = 'lucas.porto@nibo.com.br'; // Email do admin
  const isAdmin = React.useMemo(() => user?.email === ADMIN_EMAIL, [user?.email]);

  // Lógica de autenticação real temporariamente simplificada para MVP
  useEffect(() => {
    const checkUser = async () => {
      // --- BYPASS DE AUTENTICAÇÃO ATIVO (MVP) ---
      setUser({
        email: 'lucas.porto@nibo.com.br',
        name: 'Lucas Porto (Admin MVP)',
        picture: 'https://github.com/identicons/jedi.png',
      });
      return; 
      // --- FIM DO BYPASS ---

      /* Lógica de produção (Render Auth) 
      try {
        const res = await fetch('/auth/me');
        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Erro ao verificar usuário:', error);
        setUser(null);
      }
      */
    };
    checkUser();
  }, []);

  // Persistência do impersonatedEmail
  useEffect(() => {
    const saved = localStorage.getItem('impersonated_sdr_email');
    if (saved && isAdmin) setImpersonatedEmailState(saved);
  }, [isAdmin]);

  // Redirecionamento para não-admins
  useEffect(() => {
    if (user && !isAdmin && pathname === '/dashboard') { // Apenas se tentar acessar a raiz /dashboard
      router.push('/dashboard/me');
    }
    // Bloqueio de acesso a rotas de gestão para não-admins
    if (user && !isAdmin && (pathname === '/dashboard/ranking' || pathname === '/dashboard/calls')) {
      // Se não for admin e tentar acessar rotas restritas, redireciona para o painel pessoal
      router.push('/dashboard/me');
    }
  }, [user, isAdmin, router, pathname]);

  const setImpersonatedEmail = (email: string | null) => {
    if (email) {
      const cleanEmail = decodeURIComponent(email);
      localStorage.setItem('impersonated_sdr_email', cleanEmail);
      setImpersonatedEmailState(cleanEmail);
    } else {
      localStorage.removeItem('impersonated_sdr_email');
      setImpersonatedEmailState(null);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => !prev);
  };

  return (
    <DashboardContext.Provider value={{ user, impersonatedEmail, setImpersonatedEmail, isAdmin, isSidebarCollapsed, toggleSidebar }}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) throw new Error('useDashboard must be used within a DashboardProvider');
  return context;
}