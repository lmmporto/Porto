"use client";

import { useEffect } from 'react';
import { TeamCard } from '@/components/dashboard/TeamCard';
import { groupCallsByTeam } from '@/lib/groupers';
import { Loader2, Users, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCalls } from '@/hooks/useCalls'; // 🚩 2. Instalação do motor novo

export default function TeamsPage() {
  // 🚩 1 e 2. Arranque o motor velho e instale o motor novo
  const { calls, isLoading, error, fetchData, updateFilters, hasMore } = useCalls(20);

  // 🚩 3. Ligue os fios (useEffect)
  useEffect(() => {
    // Sincroniza filtros (vazio para pegar o histórico geral inicial)
    updateFilters({});
    
    // Dispara a busca inicial
    fetchData(true);

    // Executa apenas no mount para carregar o buffer inicial
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isLoading && calls.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // A função de agrupamento agora processa o que vem do hook
  const grouped = groupCallsByTeam(calls);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold text-primary">Performance por Equipe</h1>
          <p className="text-muted-foreground mt-1">Visão agregada de resultados técnicos de cada time.</p>
        </div>

        {/* 🚩 4. Conecte os botões: Atualizar */}
        <Button 
          onClick={() => fetchData(true)} 
          variant="outline" 
          disabled={isLoading}
          className="h-11 rounded-xl border-slate-200"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? "Sincronizando..." : "Atualizar"}
        </Button>
      </div>

      {Object.keys(grouped).length === 0 && !isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
          <Users className="w-12 h-12 text-muted-foreground opacity-20" />
          <div>
            <h2 className="text-xl font-bold">Nenhuma equipe identificada</h2>
            <p className="text-muted-foreground">Não há dados de chamadas vinculados a equipes no momento.</p>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(grouped).map(([teamName, teamCalls]) => (
              <TeamCard key={teamName} teamName={teamName} calls={teamCalls} />
            ))}
          </div>

          {/* 🚩 4. Conecte os botões: Carregar Mais */}
          {hasMore && (
            <div className="flex justify-center pt-8">
              <Button 
                variant="ghost" 
                className="w-full max-w-md py-8 text-slate-400 hover:text-indigo-600 font-bold text-xs tracking-widest uppercase border-2 border-dashed border-slate-100 rounded-2xl" 
                onClick={() => fetchData(false)}
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Carregar mais chamadas para o grupo"}
              </Button>
            </div>
          )}
        </>
      )}

      {error && (
        <p className="text-center text-rose-500 text-xs font-bold mt-4 uppercase tracking-widest">
          Erro ao sincronizar equipes: {error}
        </p>
      )}
    </div>
  );
}