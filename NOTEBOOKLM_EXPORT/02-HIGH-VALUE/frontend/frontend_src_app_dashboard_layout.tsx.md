# layout.tsx

## Visão geral
- Caminho original: `frontend/src/app/dashboard/layout.tsx`
- Domínio: **frontend**
- Prioridade: **02-HIGH-VALUE**
- Tipo: **layout**
- Criticidade: **important**
- Score de importância: **78**
- Entry point: **não**
- Arquivo central de fluxo: **não**
- Linhas: **50**
- Imports detectados: **5**
- Exports detectados: **2**
- Funções/classes detectadas: **2**

## Resumo factual
Este arquivo foi classificado como layout no domínio frontend. Criticidade: important. Prioridade: 02-HIGH-VALUE. Exports detectados: RootDashboardLayout, function. Funções/classes detectadas: DashboardLayoutContent, RootDashboardLayout. Dependências locais detectadas: @/components/layout/header, @/components/layout/sidebar, @/context/DashboardContext. Dependências externas detectadas: next/navigation, react. Temas relevantes detectados: admin, calls, dashboard, ranking, sdr. Indícios de framework/arquitetura: react/tsx, next-app-router, client-component, express, next-runtime.

## Dependências locais
- `@/components/layout/header`
- `@/components/layout/sidebar`
- `@/context/DashboardContext`

## Dependências externas
- `next/navigation`
- `react`

## Todos os imports detectados
- `@/components/layout/header`
- `@/components/layout/sidebar`
- `@/context/DashboardContext`
- `next/navigation`
- `react`

## Exports detectados
- `RootDashboardLayout`
- `function`

## Funções e classes detectadas
- `DashboardLayoutContent`
- `RootDashboardLayout`

## Endpoints detectados
_Nenhum padrão de endpoint detectado_

## Variáveis de ambiente detectadas
_Nenhuma variável de ambiente detectada_

## Temas relevantes
- `admin`
- `calls`
- `dashboard`
- `ranking`
- `sdr`

## Indícios de framework/arquitetura
- `react/tsx`
- `next-app-router`
- `client-component`
- `express`
- `next-runtime`

## Código
```tsx
'use client';

import { DashboardProvider, useDashboard } from '@/context/DashboardContext';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header'; // Caminho correto para o Header

import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const { isSidebarCollapsed, isAdmin, user } = useDashboard();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (user && !isAdmin) {
      const allowedSdrRoutes = ['/dashboard/me', '/dashboard/calls', '/dashboard/ranking'];
      const isAllowed = allowedSdrRoutes.some(route => pathname?.startsWith(route));
      
      // Se não estiver em uma rota permitida ou estiver na raiz admin, redireciona para a vitrine pessoal
      if (!isAllowed || pathname === '/dashboard') {
        router.replace('/dashboard/me');
      }
    }
  }, [user, isAdmin, pathname, router]);

  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar />
      <main
        className={`flex-1 transition-all duration-300 ease-in-out overflow-y-auto h-screen bg-shell
          ${isSidebarCollapsed ? 'ml-20' : 'ml-64'}`}
      >
        <Header /> {/* Renderiza o Header dentro do main content */}
        <div className="p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

export default function RootDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </DashboardProvider>
  );
}

```
