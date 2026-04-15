"use client";

import type { ReactNode } from 'react';
import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
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

  return <>{children}</>;
}
