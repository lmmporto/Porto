# page.tsx

## Visão geral
- Caminho original: `frontend/src/app/me/page.tsx`
- Domínio: **frontend**
- Prioridade: **02-HIGH-VALUE**
- Tipo: **page**
- Criticidade: **important**
- Score de importância: **90**
- Entry point: **sim**
- Arquivo central de fluxo: **sim**
- Linhas: **248**
- Imports detectados: **12**
- Exports detectados: **2**
- Funções/classes detectadas: **3**

## Resumo factual
Este arquivo foi classificado como page no domínio frontend. Criticidade: important. Prioridade: 02-HIGH-VALUE. Exports detectados: SDRPersonalDashboard, function. Funções/classes detectadas: SDRPersonalDashboard, fetchGlobalData, getBrazilDateString. Dependências locais detectadas: @/components/dashboard/CallCard, @/components/dashboard/ManualTriggerCard, @/components/dashboard/SDRRanking, @/components/ui/button, @/components/ui/card, @/context/CallContext, @/context/DashboardContext, @/hooks/useSDRDashboardSync. Dependências externas detectadas: lucide-react, next/link, react. Variáveis de ambiente detectadas: NEXT_PUBLIC_API_BASE_URL, NEXT_PUBLIC_API_URL. Temas relevantes detectados: admin, calls, dashboard, email, insights, ranking, sdr, stats, summary. Indícios de framework/arquitetura: react/tsx, next-app-router, client-component.

## Dependências locais
- `@/components/dashboard/CallCard`
- `@/components/dashboard/ManualTriggerCard`
- `@/components/dashboard/SDRRanking`
- `@/components/ui/button`
- `@/components/ui/card`
- `@/context/CallContext`
- `@/context/DashboardContext`
- `@/hooks/useSDRDashboardSync`
- `@/types`

## Dependências externas
- `lucide-react`
- `next/link`
- `react`

## Todos os imports detectados
- `@/components/dashboard/CallCard`
- `@/components/dashboard/ManualTriggerCard`
- `@/components/dashboard/SDRRanking`
- `@/components/ui/button`
- `@/components/ui/card`
- `@/context/CallContext`
- `@/context/DashboardContext`
- `@/hooks/useSDRDashboardSync`
- `@/types`
- `lucide-react`
- `next/link`
- `react`

## Exports detectados
- `SDRPersonalDashboard`
- `function`

## Funções e classes detectadas
- `SDRPersonalDashboard`
- `fetchGlobalData`
- `getBrazilDateString`

## Endpoints detectados
_Nenhum padrão de endpoint detectado_

## Variáveis de ambiente detectadas
- `NEXT_PUBLIC_API_BASE_URL`
- `NEXT_PUBLIC_API_URL`

## Temas relevantes
- `admin`
- `calls`
- `dashboard`
- `email`
- `insights`
- `ranking`
- `sdr`
- `stats`
- `summary`

## Indícios de framework/arquitetura
- `react/tsx`
- `next-app-router`
- `client-component`

## Código
```tsx
"use client";

import { useMemo, useState, useEffect } from 'react';
import { RefreshCw, BarChart3, Calendar, Target, Star, LayoutDashboard, SearchX } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CallCard } from '@/components/dashboard/CallCard';
import { SDRRanking } from '@/components/dashboard/SDRRanking';
import { useSDRDashboardSync } from '@/hooks/useSDRDashboardSync';
import { useDashboard } from '@/context/DashboardContext';
import { useCallContext } from '@/context/CallContext';
import { ManualTriggerCard } from '@/components/dashboard/ManualTriggerCard';
import type { DashboardSummary, SDRCall } from '@/types';
import Link from 'next/link';

const BRAZIL_TIMEZONE = 'America/Sao_Paulo';

const getBrazilDateString = (date: Date): string => {
  return new Intl.DateTimeFormat('fr-CA', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    timeZone: BRAZIL_TIMEZONE
  }).format(date);
};

export default function SDRPersonalDashboard() {
  const { isAdmin } = useDashboard();
  const { applyFilter, hasMore, loadMore } = useCallContext();
  const { user, calls, isLoading, personalInsights, refresh } = useSDRDashboardSync();

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [globalTopCalls, setGlobalTopCalls] = useState<SDRCall[]>([]); // 🚩 ESTADO PARA O TOP 10
  const [dateRange, setDateRange] = useState('month');
  const [minScore, setMinScore] = useState(0);
  const [rotaFilter, setRotaFilter] = useState('ALL');

  const firstName = useMemo(() => {
    if (!user?.name) return "SDR";
    return user.name.split(' ')[0];
  }, [user?.name]);

  // 🏛️ ARQUITETO: Orquestrador de Filtros Estratégicos (Visão Pessoal)
  useEffect(() => {
    const agora = new Date();
    let start = '';
    let end = getBrazilDateString(agora);

    if (dateRange === 'today') start = end;
    else if (dateRange === '7d') {
      const past = new Date(agora);
      past.setDate(agora.getDate() - 7);
      start = getBrazilDateString(past);
    } else if (dateRange === 'month') {
      start = getBrazilDateString(new Date(agora.getFullYear(), agora.getMonth(), 1));
    }

    applyFilter({
      ownerEmail: user?.email,
      startDate: start,
      endDate: end,
      minScore: minScore > 0 ? minScore : undefined,
      rota: rotaFilter !== 'ALL' ? rotaFilter : undefined
    } as any);
  }, [dateRange, minScore, rotaFilter, user?.email, applyFilter]);

  // 🏛️ ARQUITETO: Busca de Dados Globais (Vitrine e Ranking)
  useEffect(() => {
    const fetchGlobalData = async () => {
      try {
        const rawUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || '';
        const baseUrl = rawUrl.replace(/\/$/, '');
        
        // 1. Busca o Ranking (Bayesiano)
        const resSum = await fetch(`${baseUrl}/api/stats/summary`, { credentials: 'include' });
        setSummary(await resSum.json());

        // 2. Busca a Vitrine Elite (Global - Sem filtro de e-mail)
        const resVit = await fetch(`${baseUrl}/api/stats/leaderboard-vitrine`, { credentials: 'include' });
        const dataVit = await resVit.json();
        console.log("📦 DADOS DA VITRINE RECEBIDOS:", dataVit.topCalls); // Adicione isso
        setGlobalTopCalls(dataVit.topCalls || []); // Alimenta o Top 10
        
      } catch (e) { 
        console.error("Erro ao carregar dados globais da vitrine"); 
      }
    };
    fetchGlobalData();
  }, []);

  const stats = useMemo(() => {
    const analisadas = calls.filter(c => typeof c.nota_spin === 'number');
    const mediaExibicao = personalInsights?.mediaPessoal || 
                         (analisadas.length > 0 ? (analisadas.reduce((acc, c) => acc + (c.nota_spin || 0), 0) / analisadas.length) : 0);

    return {
      media: Number(Number(mediaExibicao).toFixed(1)),
      analisadas: analisadas.length,
      total: calls.length,
      gaps: personalInsights?.gaps || [],
      insights: personalInsights?.insights || []
    };
  }, [calls, personalInsights]);

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 p-6 lg:p-10">
      
      {/* HEADER ESTRATÉGICO */}
      <div className="flex justify-between items-center mb-10">
        <div>
          <p className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.3em] mb-1">Strategic Intelligence</p>
          <h1 className="text-3xl font-black text-white">Olá, {firstName}</h1>
        </div>

        <div className="flex gap-3">
          <Button onClick={refresh} variant="outline" className="bg-slate-900 border-slate-800 text-white rounded-xl hover:bg-slate-800">
            <RefreshCw className={isLoading ? "animate-spin w-4 h-4" : "w-4 h-4"} />
          </Button>
          {isAdmin && (
            <Link href="/dashboard">
              <Button className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20">
                <LayoutDashboard className="w-4 h-4 mr-2" /> Painel Gestão
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* COLUNA LATERAL: OPERAÇÃO & VITRINE */}
        <aside className="lg:col-span-3 space-y-6">
          <ManualTriggerCard theme="dark" />
          <SDRRanking summary={summary} topCalls={globalTopCalls} />
          <Card className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl border-dashed">
            <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-2">Dica do Coach</p>
            <p className="text-xs text-slate-400 leading-relaxed italic">
              "O Top 10 Elite mostra as melhores abordagens da semana. Estude o playbook dessas chamadas."
            </p>
          </Card>
        </aside>

        {/* COLUNA PRINCIPAL */}
        <main className="lg:col-span-9 space-y-8">
          {/* KPIS DE PERFORMANCE */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-slate-900 border-slate-800 shadow-2xl flex flex-col items-center justify-center p-8 rounded-[2rem] relative overflow-hidden group">
              <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
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

            <Card className="bg-slate-900 border-slate-800 p-8 rounded-[2rem] border-l-4 border-l-rose-500/50">
              <h3 className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                <Target className="w-3 h-3" /> Gaps de Processo
              </h3>
              <div className="space-y-3">
                {stats.gaps.length > 0 ? stats.gaps.map((gap: string, i: number) => (
                  <div key={i} className="p-3 bg-rose-500/5 border border-rose-500/10 rounded-xl text-[11px] text-rose-200 font-medium leading-relaxed">{gap}</div>
                )) : <p className="text-[10px] text-slate-600 italic">Nenhum gap recorrente detectado.</p>}
              </div>
            </Card>

            <Card className="bg-slate-900 border-slate-800 p-8 rounded-[2rem] border-l-4 border-l-emerald-500/50">
              <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                <Star className="w-3 h-3" /> Top Insights
              </h3>
              <div className="space-y-3">
                {stats.insights.length > 0 ? stats.insights.map((insight: string, i: number) => (
                  <div key={i} className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl text-[11px] text-emerald-200 font-medium leading-relaxed">{insight}</div>
                )) : <p className="text-[10px] text-slate-600 italic">Continue performando para gerar insights.</p>}
              </div>
            </Card>
          </div>

          {/* FEED DE ATIVIDADES */}
          <section className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/50 pb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/10 rounded-lg"><BarChart3 className="w-5 h-5 text-indigo-400" /></div>
                <h2 className="text-xl font-bold text-white">Meu Histórico</h2>
              </div>

              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <select value={dateRange} onChange={(e) => setDateRange(e.target.value)} className="bg-transparent text-xs font-bold text-slate-300 outline-none cursor-pointer">
                    <option value="today">Hoje</option>
                    <option value="7d">Últimos 7 Dias</option>
                    <option value="month">Mês Atual</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2">
                  <Star className="w-3.5 h-3.5 text-slate-500" />
                  <select value={minScore} onChange={(e) => setMinScore(Number(e.target.value))} className="bg-transparent text-xs font-bold text-slate-300 outline-none cursor-pointer">
                    <option value="0">Todas Notas</option>
                    <option value="7">Notas 7+</option>
                    <option value="8">Notas 8+</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2">
                  <Target className="w-3.5 h-3.5 text-slate-500" />
                  <select value={rotaFilter} onChange={(e) => setRotaFilter(e.target.value)} className="bg-transparent text-xs font-bold text-slate-300 outline-none cursor-pointer">
                    <option value="ALL">Todas Rotas</option>
                    <option value="ROTA_A">Rota A</option>
                    <option value="ROTA_B">Rota B</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="grid gap-4 relative">
              {isLoading && <div className="absolute inset-0 bg-[#020617]/50 z-10 flex items-center justify-center rounded-2xl backdrop-blur-sm" />}
              
              {calls.length > 0 ? (
                calls.map(call => <CallCard key={call.id} call={call} />)
              ) : !isLoading && (
                <div className="py-20 flex flex-col items-center justify-center text-center bg-slate-900/20 border border-slate-800 border-dashed rounded-[2rem]">
                  <SearchX className="w-12 h-12 text-slate-700 mb-4" />
                  <p className="text-slate-500 font-medium">Nenhuma chamada encontrada para os filtros selecionados.</p>
                </div>
              )}

              {hasMore && (
                <Button variant="ghost" className="w-full py-8 border border-dashed border-slate-800 text-slate-500 hover:text-indigo-400 hover:bg-slate-900/50 transition-all" onClick={loadMore} disabled={isLoading}>
                  {isLoading ? "Carregando..." : "Ver mais atividades"}
                </Button>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
```
