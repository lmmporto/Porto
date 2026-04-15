"use client";

import type { ReactNode } from 'react';
import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { useDashboard } from '@/context/DashboardContext';

interface DashboardLayoutProps {
  children: ReactNode;
}

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#020617]">
      <div
        className="h-6 w-6 animate-spin rounded-full border-2 border-slate-800 border-t-indigo-500"
        aria-label="Carregando dashboard"
      />
    </div>
  );
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const { user, isInitialized, isLoading, isAdmin } = useDashboard();

  const isAuthenticated = useMemo(() => Boolean(user), [user]);
  const shouldRedirect = useMemo(
    () => isInitialized && !isLoading && !isAuthenticated,
    [isAuthenticated, isInitialized, isLoading]
  );

  useEffect(() => {
    if (shouldRedirect) {
      router.replace('/');
    }
  }, [shouldRedirect, router]);

  if (!isInitialized || isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return null;
  }

  const fallbackInitials = user.name
    ? user.name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('')
    : 'AD';

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full bg-[#020617]">
        <SidebarNav />
        <SidebarInset className="flex min-h-screen flex-col bg-[#020617]">
          <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-slate-800/60 bg-slate-950/80 px-6 backdrop-blur-sm">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="h-8 w-8 text-slate-600 transition-colors hover:text-slate-200" />
              <div className="hidden h-4 w-px bg-slate-800 md:block" />
              <h2 className="hidden text-[9px] font-bold uppercase tracking-[0.2em] text-slate-600 md:block">
                Análise de chamadas {isAdmin && '(ADMIN)'}
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-[10px] font-bold uppercase leading-none tracking-wider text-slate-300">
                  {user.name}
                </p>
                <p className="mt-1 text-[10px] leading-none text-slate-600">
                  {user.email}
                </p>
              </div>

              <Avatar className="h-7 w-7 border border-slate-700">
                <AvatarImage src={user.picture || ''} />
                <AvatarFallback className="bg-slate-800 text-[10px] font-bold text-slate-300">
                  {fallbackInitials}
                </AvatarFallback>
              </Avatar>
            </div>
          </header>

          <main className="mx-auto w-full max-w-5xl flex-1 overflow-auto p-6 md:p-10">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
