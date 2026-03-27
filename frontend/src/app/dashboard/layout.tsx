"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

type AuthUser = {
  id: string;
  email: string;
  name: string;
  picture?: string;
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

      if (!apiBaseUrl) {
        console.error('[AUTH] NEXT_PUBLIC_API_BASE_URL não definida');
        router.push('/login');
        return;
      }

      try {
        const res = await fetch(`${apiBaseUrl}/auth/me`, {
          credentials: 'include',
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
            Pragma: 'no-cache',
          },
        });

        console.log('[LAYOUT AUTH] status:', res.status);

        if (res.status === 401) {
          router.push('/login');
          return;
        }

        if (!res.ok) {
          const text = await res.text();
          console.error('[LAYOUT AUTH] resposta inesperada:', res.status, text);
          router.push('/login');
          return;
        }

        const data = await res.json();

        if (!data?.authenticated) {
          router.push('/login');
          return;
        }

        setUser(data.user ?? null);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('[LAYOUT AUTH] erro ao validar sessão:', error);
        router.push('/login');
      }
    };

    checkAuth();
  }, [router]);

  if (isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="w-5 h-5 border-2 border-slate-100 border-t-slate-900 rounded-full animate-spin" />
      </div>
    );
  }

  const fallbackInitials = user?.name
    ? user.name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('')
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
                Análise de chamadas
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-[10px] font-bold text-slate-900 leading-none uppercase tracking-wider">
                  {user?.name || 'Usuário'}
                </p>
                <p className="text-[10px] text-slate-400 leading-none mt-1">
                  {user?.email || ''}
                </p>
              </div>

              <Avatar className="h-7 w-7 border border-slate-100">
                <AvatarImage src={user?.picture || ''} />
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