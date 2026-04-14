"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDashboard } from '@/context/DashboardContext';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isInitialized, isLoading, isAdmin } = useDashboard();

  useEffect(() => {
    if (isInitialized && !user && !isLoading) {
      console.warn("🚩 [LAYOUT]: Acesso negado. Redirecionando...");
      router.replace('/');
    }
  }, [user, isInitialized, isLoading, router]);

  // ⏳ Loading screen
  if (!isInitialized || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#020617]">
        <div className="w-5 h-5 border-2 border-slate-800 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const fallbackInitials = user.name
    ? user.name.trim().split(/\s+/).slice(0, 2).map(p => p[0]?.toUpperCase()).join('')
    : 'AD';

  return (
    <SidebarProvider defaultOpen={true}>
      {/* ─── Shell escura unificada ─────────────────────────────────── */}
      <div className="flex min-h-screen w-full bg-[#020617]">
        <SidebarNav />
        <SidebarInset className="flex flex-col min-h-screen bg-[#020617]">

          {/* ─── Header dark ───────────────────────────────────────────── */}
          <header className="flex h-14 items-center justify-between border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-sm px-6 sticky top-0 z-10">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="h-8 w-8 text-slate-600 hover:text-slate-200 transition-colors" />
              <div className="h-4 w-px bg-slate-800 hidden md:block" />
              <h2 className="text-[9px] font-bold text-slate-600 uppercase tracking-[0.2em] hidden md:block">
                Análise de chamadas {isAdmin && "(ADMIN)"}
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-[10px] font-bold text-slate-300 leading-none uppercase tracking-wider">
                  {user.name}
                </p>
                <p className="text-[10px] text-slate-600 leading-none mt-1">
                  {user.email}
                </p>
              </div>

              <Avatar className="h-7 w-7 border border-slate-700">
                <AvatarImage src={user.picture || ''} />
                <AvatarFallback className="text-[10px] font-bold bg-slate-800 text-slate-300">
                  {fallbackInitials}
                </AvatarFallback>
              </Avatar>
            </div>
          </header>

          {/* ─── Content ───────────────────────────────────────────────── */}
          <main className="flex-1 p-6 md:p-10 overflow-auto max-w-5xl mx-auto w-full">
            {children}
          </main>

        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}