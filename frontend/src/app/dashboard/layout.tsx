"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDashboard } from '@/context/DashboardContext'; // 🏛️ A única fonte da verdade
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  
  // 🏛️ Extraímos tudo do Contexto. Sem fetch local, sem estados locais.
  const { user, isInitialized, isLoading, isAdmin } = useDashboard();

  useEffect(() => {
    // 🛡️ Só redireciona se o sistema já inicializou e confirmou que não há usuário
    if (isInitialized && !user && !isLoading) {
      console.warn("🚩 [LAYOUT]: Acesso negado. Redirecionando...");
      router.replace('/');
    }
  }, [user, isInitialized, isLoading, router]);

  // ⏳ Tela de Loading unificada
  if (!isInitialized || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="w-5 h-5 border-2 border-slate-100 border-t-slate-900 rounded-full animate-spin" />
      </div>
    );
  }

  // Se não houver usuário após carregar, não renderiza nada (o useEffect cuidará do push)
  if (!user) return null;

  const fallbackInitials = user.name
    ? user.name.trim().split(/\s+/).slice(0, 2).map(p => p[0]?.toUpperCase()).join('')
    : 'AD';

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full bg-[#FAFAFA]">
        <SidebarNav />
        <SidebarInset className="flex flex-col min-h-screen">
          <header className="flex h-14 items-center justify-between border-b border-slate-100 bg-white px-6 sticky top-0 z-10">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="h-8 w-8 text-slate-300 hover:text-slate-900 transition-colors" />
              <div className="h-4 w-px bg-slate-100 hidden md:block" />
              <h2 className="text-[9px] font-bold text-slate-300 uppercase tracking-[0.2em] hidden md:block">
                Análise de chamadas {isAdmin && "(ADMIN)"}
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-[10px] font-bold text-slate-900 leading-none uppercase tracking-wider">
                  {user.name}
                </p>
                <p className="text-[10px] text-slate-400 leading-none mt-1">
                  {user.email}
                </p>
              </div>

              <Avatar className="h-7 w-7 border border-slate-100">
                <AvatarImage src={user.picture || ''} />
                <AvatarFallback className="text-[10px] font-bold">
                  {fallbackInitials}
                </AvatarFallback>
              </Avatar>
            </div>
          </header>

          <main className="flex-1 p-6 md:p-10 overflow-auto max-w-5xl mx-auto w-full">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}