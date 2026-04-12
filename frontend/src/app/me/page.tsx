"use client";

import { useMemo, useState, useEffect } from 'react';
import { RefreshCw, BarChart3, Phone } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CallCard } from '@/components/dashboard/CallCard';
import { SDRRanking } from '@/components/dashboard/SDRRanking'; // 🚩 SEU COMPONENTE ATUAL
import { useSDRDashboardSync } from '@/hooks/useSDRDashboardSync';
import { useDashboard } from '@/context/DashboardContext';
import type { DashboardSummary } from '@/types';
import Link from 'next/link';

export default function SDRDashboardPage() {
  const { isAdmin } = useDashboard();
  const { user, calls, isLoading, personalInsights, refresh } = useSDRDashboardSync();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);

  // 🚩 CORREÇÃO SÊNIOR: Tratamento defensivo do nome
  const firstName = useMemo(() => {
    if (!user?.name) return "SDR";
    return user.name.split(' ')[1] ? user.name.split(' ')[0] : user.name;
  }, [user?.name]);

  // Busca o Ranking Global para alimentar a lateral
  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
        const res = await fetch(`${baseUrl}/api/stats/summary`, { credentials: 'include' });
        const data = await res.json();
        setSummary(data);
      } catch (e) {
        console.error("Erro ao carregar ranking");
      }
    };
    fetchSummary();
  }, []);

  const stats = useMemo(() => {
    const analisadas = calls.filter(c => c.nota_spin !== null);
    const somaNotas = analisadas.reduce((acc, c) => acc + (Number(c.nota_spin) || 0), 0);
    const media = analisadas.length > 0 ? (somaNotas / analisadas.length).toFixed(1) : "0";

    return {
      media: Number(media),
      analisadas: analisadas.length,
      total: calls.length,
      gaps: personalInsights?.gaps || [],
      insights: personalInsights?.insights || []
    };
  }, [calls, personalInsights]);

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 p-6 lg:p-10">
      
      {/* HEADER COMPACTO */}
      <div className="flex justify-between items-center mb-10">
        <div>
          <p className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.3em] mb-1">Performance Intelligence</p>
          {/* 🚩 AGORA SEGURO E SEM VERMELHO */}
          <h1 className="text-3xl font-black text-white">Olá, {firstName}</h1>
        </div>
        
        
        
        <div className="flex gap-3">
          <Button onClick={refresh} variant="outline" className="bg-slate-900 border-slate-800 text-white rounded-xl">
            <RefreshCw className={isLoading ? "animate-spin" : ""} />
          </Button>
          {isAdmin && (
            <Link href="/dashboard">
              <Button className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl">Painel Gestão</Button>
            </Link>
          )}
        </div>
      </div>

      {/* 🚩 GRID 3/12: A ESTRUTURA SÊNIOR */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* COLUNA LATERAL (3/12): RANKING FIXO */}
        <aside className="lg:col-span-3 space-y-6">
          <SDRRanking summary={summary} />
          
          {/* Card de Contexto Adicional */}
          <Card className="bg-slate-900/50 border-slate-800 p-6 rounded-2xl">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Dica do Coach</p>
            <p className="text-xs text-slate-400 leading-relaxed italic">
              "Clique em um colega no ranking para ver as 10 melhores chamadas dele e aprender com os melhores."
            </p>
          </Card>
        </aside>

        {/* COLUNA PRINCIPAL (9/12): CONTEÚDO DINÂMICO */}
        <main className="lg:col-span-9 space-y-8">
          
          {/* KPIS SUPERIORES */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* MÉDIA CIRCULAR */}
            <Card className="bg-slate-900 border-slate-800 shadow-2xl flex flex-col items-center justify-center p-8 rounded-[2rem]">
                <div className="relative flex items-center justify-center">
                  <svg className="w-32 h-32 transform -rotate-90">
                    <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-slate-800" />
                    <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" 
                      strokeDasharray={364} strokeDashoffset={364 - (364 * stats.media) / 10}
                      className="text-indigo-500" strokeLinecap="round" />
                  </svg>
                  <div className="absolute text-center">
                    <span className="text-4xl font-black text-white">{stats.media}</span>
                    <p className="text-[8px] font-bold text-slate-500 uppercase">Média</p>
                  </div>
                </div>
                <p className="mt-4 text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                  {stats.analisadas} / {stats.total} Analisadas
                </p>
            </Card>

            {/* GAPS (RECORRÊNCIA) */}
            <Card className="bg-slate-900 border-slate-800 p-8 rounded-[2rem]">
              <h3 className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-6">Gaps de Processo</h3>
              <div className="space-y-3">
                {stats.gaps.map((gap: string, i: number) => (
                  <div key={i} className="p-3 bg-rose-500/5 border border-rose-500/10 rounded-xl text-[11px] text-rose-200 font-medium">
                    {gap}
                  </div>
                ))}
              </div>
            </Card>

            {/* INSIGHTS (CONSISTÊNCIA) */}
            <Card className="bg-slate-900 border-slate-800 p-8 rounded-[2rem]">
              <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-6">Top Insights</h3>
              <div className="space-y-3">
                {stats.insights.map((insight: string, i: number) => (
                  <div key={i} className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl text-[11px] text-emerald-200 font-medium">
                    {insight}
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* LISTA DE CHAMADAS (FEED OU VITRINE) */}
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500/10 rounded-lg"><BarChart3 className="w-5 h-5 text-indigo-400" /></div>
              <h2 className="text-xl font-bold text-white">Atividades Recentes</h2>
            </div>

            <div className="grid gap-4">
              {calls.map(call => (
                <CallCard key={call.id} call={call} />
              ))}
              {isLoading && <div className="py-10 text-center text-slate-500 animate-pulse">Sincronizando dados...</div>}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}