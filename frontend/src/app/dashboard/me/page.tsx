'use client';

import { useDashboard } from '@/context/DashboardContext';
import { SdrProfilePanel } from '@/features/dashboard/components/SdrProfilePanel';

export default function MyDashboardPage() {
  const { user, viewingEmail, isAdmin } = useDashboard();

  // Impersonação só é permitida para admins.
  // Usuários comuns sempre visualizam o próprio perfil.
  const activeEmail = isAdmin ? (viewingEmail || user?.email) : user?.email;

  if (!activeEmail) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#020817] text-white">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple border-t-transparent mx-auto mb-4"></div>
          <p className="text-soft">Autenticando acesso ao Flight Deck...</p>
        </div>
      </div>
    );
  }

  return <SdrProfilePanel sdrId={activeEmail} />;
}
