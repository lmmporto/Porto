'use client';

import { use } from 'react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SdrProfilePanel } from '@/features/dashboard/components/SdrProfilePanel';
import { useDashboard } from '@/context/DashboardContext';
import { formatEmailToSdrId } from '@/lib/utils';

interface SdrPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function SdrDetailPage({ params }: SdrPageProps) {
  const resolvedParams = use(params);
  const sdrId = resolvedParams.id;
  const { user, isAdmin } = useDashboard();
  const router = useRouter();

  useEffect(() => {
    if (!user) return; // Aguarda o usuário carregar

    // Usuário comum só pode ver o próprio perfil
    if (!isAdmin) {
      const ownId = formatEmailToSdrId(user.email);
      if (sdrId !== ownId && sdrId !== user.email) {
        // Redireciona para a página pessoal sem expor o perfil de outro SDR
        router.replace('/me');
      }
    }
  }, [user, isAdmin, sdrId, router]);

  if (!sdrId) {
    return <div>ID do SDR não fornecido.</div>;
  }

  // Enquanto o usuário não carregou ainda, não renderiza nada (evita flash)
  if (!user) return null;

  // Usuário comum que tentou acessar um perfil alheio: não renderiza (o redirect vai acontecer)
  if (!isAdmin) {
    const ownId = formatEmailToSdrId(user.email);
    if (sdrId !== ownId && sdrId !== user.email) {
      return null;
    }
  }

  return <SdrProfilePanel sdrId={sdrId} />;
}