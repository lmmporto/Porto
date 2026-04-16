"use client";

import type { ReactNode } from 'react';
import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useDashboard } from '@/context/DashboardContext';
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

interface DashboardLayoutProps {
  children: ReactNode;
}

function LoadingScreen() {
  return (
    <div className="flex h-screen items-center justify-center bg-surface">
      <div
        className="h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-primary"
        aria-label="Carregando dashboard"
      />
    </div>
  );
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const { user, isInitialized, isLoading } = useDashboard();

  const shouldRedirect = useMemo(
    () => isInitialized && !isLoading && !user,
    [isInitialized, isLoading, user]
  );

  useEffect(() => {
    if (shouldRedirect) {
      router.replace('/');
    }
  }, [shouldRedirect, router]);

  if (!isInitialized || isLoading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen bg-surface overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col lg:ml-64 h-full overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
