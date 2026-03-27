
"use client";

import { useState, useEffect } from 'react';
import { TeamCard } from '@/components/dashboard/TeamCard';
import { groupCallsByTeam } from '@/lib/groupers';
import type { SDRCall } from '@/types';
import { Loader2, Users } from 'lucide-react';

export default function TeamsPage() {
  const [calls, setCalls] = useState<SDRCall[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/calls')
      .then(res => res.json())
      .then(data => {
        setCalls(Array.isArray(data) ? data : []);
        setIsLoading(false);
      })
      .catch(() => {
        setCalls([]);
        setIsLoading(false);
      });
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const grouped = groupCallsByTeam(calls);

  if (Object.keys(grouped).length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
        <Users className="w-12 h-12 text-muted-foreground opacity-20" />
        <div>
          <h2 className="text-xl font-bold">Nenhuma equipe identificada</h2>
          <p className="text-muted-foreground">Não há dados de chamadas vinculados a equipes no momento.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-headline font-bold text-primary">Performance por Equipe</h1>
        <p className="text-muted-foreground mt-1">Visão agregada de resultados técnicos de cada time.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(grouped).map(([teamName, teamCalls]) => (
          <TeamCard key={teamName} teamName={teamName} calls={teamCalls} />
        ))}
      </div>
    </div>
  );
}
