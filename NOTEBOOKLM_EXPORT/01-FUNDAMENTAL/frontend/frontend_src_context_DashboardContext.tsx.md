# DashboardContext.tsx

## Visão geral
- Caminho original: `frontend/src/context/DashboardContext.tsx`
- Domínio: **frontend**
- Prioridade: **01-FUNDAMENTAL**
- Tipo: **context**
- Criticidade: **important**
- Score de importância: **108**
- Entry point: **não**
- Arquivo central de fluxo: **sim**
- Linhas: **141**
- Imports detectados: **2**
- Exports detectados: **2**
- Funções/classes detectadas: **5**

## Resumo factual
Este arquivo foi classificado como context no domínio frontend. Criticidade: important. Prioridade: 01-FUNDAMENTAL. Exports detectados: DashboardProvider, useDashboard. Funções/classes detectadas: DashboardProvider, checkUser, setViewingEmail, toggleSidebar, useDashboard. Dependências externas detectadas: next/navigation, react. Variáveis de ambiente detectadas: NEXT_PUBLIC_API_BASE_URL, NEXT_PUBLIC_API_URL. Temas relevantes detectados: admin, auth, calls, dashboard, email, ranking, sdr. Indícios de framework/arquitetura: react/tsx, client-component, express, next-runtime.

## Dependências locais
_Nenhuma dependência local detectada_

## Dependências externas
- `next/navigation`
- `react`

## Todos os imports detectados
- `next/navigation`
- `react`

## Exports detectados
- `DashboardProvider`
- `useDashboard`

## Funções e classes detectadas
- `DashboardProvider`
- `checkUser`
- `setViewingEmail`
- `toggleSidebar`
- `useDashboard`

## Endpoints detectados
_Nenhum padrão de endpoint detectado_

## Variáveis de ambiente detectadas
- `NEXT_PUBLIC_API_BASE_URL`
- `NEXT_PUBLIC_API_URL`

## Temas relevantes
- `admin`
- `auth`
- `calls`
- `dashboard`
- `email`
- `ranking`
- `sdr`

## Indícios de framework/arquitetura
- `react/tsx`
- `client-component`
- `express`
- `next-runtime`

## Código
```tsx
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation'; // Importar useRouter e usePathname

interface DashboardContextType {
  user: { id?: string; email: string | null; name?: string; picture?: string; isAdmin?: boolean } | null;
  viewingEmail: string | null;
  setViewingEmail: (email: string | null) => void;
  isAdmin: boolean;
  isSidebarCollapsed: boolean; // Novo estado
  toggleSidebar: () => void; // Nova função
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<{ id?: string; email: string | null; name?: string; picture?: string; isAdmin?: boolean } | null>(null);
  const [viewingEmail, setViewingEmailState] = useState<string | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(true); // Bloqueio visual The Matrix

  const isAdmin = !!user?.isAdmin;

  // Lógica de autenticação real temporariamente simplificada para MVP
  useEffect(() => {
    const checkUser = async () => {
      setLoadingAuth(true);

      // 🔍 DIAGNÓSTICO DE AMBIENTE (Logs Temporários)
      const envUrl = process.env.NEXT_PUBLIC_API_URL;
      const envBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      
      const rawApiUrl = envUrl || envBaseUrl || '';
      const apiUrl = rawApiUrl.trim().replace(/\/$/, '');

      console.log("🛠️ Auth Debug:", {
        envUrl: envUrl || 'Nulo/Indefinido',
        envBaseUrl: envBaseUrl || 'Nulo/Indefinido',
        resovledUrl: apiUrl || 'Vazio'
      });

      // 🛑 GUARDA DE SEGURANÇA
      if (!apiUrl || apiUrl === 'undefined' || apiUrl === 'null') {
        console.error("❌ ERRO CRÍTICO: Nenhuma URL de API configurada (NEXT_PUBLIC_API_URL ou NEXT_PUBLIC_API_BASE_URL).");
        setLoadingAuth(false);
        setUser(null);
        return;
      }

      try {
        const res = await fetch(`${apiUrl}/auth/me`, {
          credentials: 'include',
          cache: 'no-store'
        });

        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
        } else {
          setUser(null);
        }

      } catch (error) {
        console.error('Erro ao verificar usuário:', error);
        setUser(null);
      } finally {
        setLoadingAuth(false);
      }
    };
    checkUser();
  }, []);

  // Persistência do viewingEmail e Limpeza de Segurança
  useEffect(() => {
    if (user === null) return; // Aguardando autenticação assíncrona não deve apagar cache local!

    if (isAdmin) {
      const saved = localStorage.getItem('viewing_sdr_email');
      if (saved) setViewingEmailState(saved);
    } else {
      // Regra Ouro: Se tentar logar como comum, desinfeta os vestígios de admin.
      localStorage.removeItem('viewing_sdr_email');
      setViewingEmailState(null);
    }
  }, [isAdmin, user]);

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

  const setViewingEmail = (email: string | null) => {
    if (!user?.isAdmin) {
      console.error("🚫 Tentativa de impersonate bloqueada.");
      return;
    }

    if (email) {
      const cleanEmail = decodeURIComponent(email);
      localStorage.setItem('viewing_sdr_email', cleanEmail);
      setViewingEmailState(cleanEmail);
    } else {
      localStorage.removeItem('viewing_sdr_email');
      setViewingEmailState(null);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => !prev);
  };

  if (loadingAuth) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#020817]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple border-t-transparent"></div>
      </div>
    );
  }

  return (
    <DashboardContext.Provider value={{ user, viewingEmail, setViewingEmail, isAdmin, isSidebarCollapsed, toggleSidebar }}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) throw new Error('useDashboard must be used within a DashboardProvider');
  return context;
}
```
