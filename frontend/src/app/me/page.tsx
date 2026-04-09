"use client";

import { useEffect, useMemo, useState, useRef } from 'react';
import { useCallContext } from '@/context/CallContext';
import { useDashboard } from '@/context/DashboardContext';
import { 
  CheckCircle2, 
  XCircle, 
  Phone, 
  ArrowLeft,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CallCard } from '@/components/dashboard/CallCard';
import Link from 'next/link';

export default function SDRDashboardPage() {
  const { user, isAdmin } = useDashboard();
  const { calls, isLoading, applyFilter, refresh } = useCallContext();
  
  // 🚩 ESTADO PARA INSIGHTS REAIS DO BACKEND
  const [personalInsights, setPersonalInsights] = useState<{ gaps: string[], insights: string[] } | null>(null);
  
  // 🚩 O GUARDA: Impede que a busca rode mais de uma vez por carregamento
  const hasLoadedInitialData = useRef(false);

  // 1. ORQUESTRADOR DE CARREGAMENTO BLINDADO
  useEffect(() => {
    // Se não tem usuário ou se já carregamos os dados para este e-mail, sai fora
    if (!user?.email || hasLoadedInitialData.current) return;

    const loadData = async () => {
      console.log("🚀 [SDR PAGE] Carregando dados iniciais para:", user.email);
      
      // Marca como carregado IMEDIATAMENTE para evitar concorrência de re-renders
      hasLoadedInitialData.current = true;

      // A. Busca as chamadas (via Contexto)
      applyFilter({ ownerEmail: user.email });

      // B. Busca os insights qualitativos (via Fetch local)
      try {
        const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
        
        // 🚩 MUDANÇA: Passamos o e-mail na URL explicitamente para suportar simulação
        const res = await fetch(`${baseUrl}/api/stats/personal-summary?ownerEmail=${user.email}`, { 
          credentials: 'include' 
        });
        
        const data = await res.json();
        setPersonalInsights(data);
      } catch (e) {
        console.error("Erro ao buscar insights reais");
      }
    };

    loadData();
  }, [user?.email, applyFilter]);

  // 2. RESET DO GUARDA: Se o usuário mudar (ex: via simulação), permite nova carga
  useEffect(() => {
    hasLoadedInitialData.current = false;
  }, [user?.email]);

  // 3. INTELIGÊNCIA DE DADOS: Estatísticas quantitativas
  const stats = useMemo(() => {
    if (calls.length === 0) return { media: 0, analisadas: 0, total: 0 };

    const analisadas = calls.filter(c => c.nota_spin !== null);
    const somaNotas = analisadas.reduce((acc, c) => acc + (Number(c.nota_spin) || 0), 0);
    const media = analisadas.length > 0 ? (somaNotas / analisadas.length).toFixed(1) : "0";

    return {
      media: Number(media),
      analisadas: analisadas.length,
      total: calls.length
    };
  }, [calls]);

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 p-8 pb-20">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-10">
        <div>
          <p className="text-indigo-400 text-xs font-bold uppercase tracking-widest mb-1">Performance Individual</p>
          <h1 className="text-3xl font-black text-white">Olá, {user?.name}</h1>
        </div>
        
        <div className="flex gap-4">
          <Button onClick={() => refresh()} variant="outline" className="bg-[#1e293b] border-slate-700 text-white">
            {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          </Button>

          {isAdmin && (
            <Link href="/dashboard">
              <Button variant="ghost" className="text-slate-400 hover:text-white flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" /> Voltar para o Ranking
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* TOP SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        
        {/* MÉDIA CIRCULAR */}
        <Card className="bg-[#1e293b] border-slate-800 shadow-2xl relative overflow-hidden">
          <CardContent className="p-8 flex flex-col items-center justify-center min-h-[280px]">
            <div className="relative flex items-center justify-center">
              <svg className="w-40 h-40 transform -rotate-90">
                <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-700" />
                <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="8" fill="transparent" 
                  strokeDasharray={440} strokeDashoffset={440 - (440 * stats.media) / 10}
                  className="text-indigo-500 transition-all duration-1000 ease-out" />
              </svg>
              <div className="absolute text-center">
                <span className="text-5xl font-black text-white">{stats.media}</span>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Média Spin</p>
              </div>
            </div>
            <p className="mt-6 text-xs font-bold text-slate-400 uppercase">
              {stats.analisadas}/{stats.total} <span className="text-indigo-400">Analisadas / Volume Total</span>
            </p>
          </CardContent>
        </Card>

        {/* GAPS REAIS */}
        <Card className="bg-[#1e293b] border-slate-800 shadow-2xl">
          <CardContent className="p-8">
            <h3 className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
              <XCircle className="w-4 h-4" /> Gaps de Processo
            </h3>
            <div className="flex flex-col gap-3">
              {personalInsights?.gaps && personalInsights.gaps.length > 0 ? personalInsights.gaps.map((gap, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-rose-50/5 border border-rose-500/10 rounded-xl">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5" />
                  <span className="text-rose-200 text-xs font-medium leading-relaxed">{gap}</span>
                </div>
              )) : <p className="text-slate-500 text-xs italic text-center py-10">Nenhum gap identificado recentemente.</p>}
            </div>
          </CardContent>
        </Card>

        {/* INSIGHTS REAIS */}
        <Card className="bg-[#1e293b] border-slate-800 shadow-2xl">
          <CardContent className="p-8">
            <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Top Insights
            </h3>
            <div className="flex flex-col gap-3">
              {personalInsights?.insights && personalInsights.insights.length > 0 ? personalInsights.insights.map((insight, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-emerald-50/5 border border-emerald-500/10 rounded-xl">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5" />
                  <span className="text-emerald-200 text-xs font-medium leading-relaxed">{insight}</span>
                </div>
              )) : <p className="text-slate-500 text-xs italic text-center py-10">Continue evoluindo para gerar novos insights.</p>}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* BOTTOM SECTION: LISTA DE CHAMADAS */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Phone className="w-5 h-5 text-indigo-400" /> Histórico Recente
        </h2>

        <div className="grid gap-4">
          {calls.length > 0 ? (
            calls.map(call => <CallCard key={call.id} call={call} />)
          ) : !isLoading && (
            <div className="bg-[#1e293b] border border-slate-800 rounded-2xl p-20 text-center">
              <p className="text-slate-500 italic">Nenhuma chamada encontrada para o seu perfil.</p>
            </div>
          )}
          
          {isLoading && (
            <div className="flex justify-center py-10">
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}