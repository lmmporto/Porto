'use client';

import { useDashboard } from '@/context/DashboardContext';
import { SdrProfilePanel } from '@/features/dashboard/components/SdrProfilePanel';
import { formatEmailToSdrId } from '@/lib/utils';

export default function MyDashboardPage() {
  const { user, impersonatedEmail } = useDashboard();

  // Filtro de Consciência: Prioriza a simulação se houver
  const activeEmail = impersonatedEmail || user?.email;

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

  // O sdrId para busca no Firestore é o email puro (normalização ocorre no painel)
  const sdrId = activeEmail;

  return <SdrProfilePanel sdrId={sdrId} />;
}
