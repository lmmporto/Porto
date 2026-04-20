'use client';

import { use } from 'react';
import { SdrProfilePanel } from '@/features/dashboard/components/SdrProfilePanel';

interface SdrPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function SdrDetailPage({ params }: SdrPageProps) {
  const resolvedParams = use(params);
  const sdrId = resolvedParams.id;

  if (!sdrId) {
    return <div>ID do SDR não fornecido.</div>;
  }

  return <SdrProfilePanel sdrId={sdrId} />;
}