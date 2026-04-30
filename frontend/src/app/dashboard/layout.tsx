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
      const allowedSdrRoutes = [
        '/dashboard/me',
        '/dashboard/calls',
        '/dashboard/ranking',
        '/dashboard/sdrs',
        '/me',
      ];
      const isAllowed = allowedSdrRoutes.some(route => pathname?.startsWith(route));

      // Se estiver na raiz do painel de gestão ou em rota não permitida, manda para o painel pessoal
      if (!isAllowed || pathname === '/dashboard') {
        router.replace('/me');
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
