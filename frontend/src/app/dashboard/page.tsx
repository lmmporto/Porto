"use client";

import { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, 
  PhoneCall, 
  Users, 
  Search, 
  Calendar, 
  RefreshCw,
  ArrowDownUp,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CallCard } from '@/components/dashboard/CallCard';
import { SDRRanking } from '@/components/dashboard/SDRRanking';
import { useCalls } from '@/hooks/useCalls';
import type { DashboardSummary } from '@/types';

type SortOrder = 'date_desc' | 'score_desc' | 'score_asc';
const BRAZIL_TIMEZONE = 'America/Sao_Paulo';

const getBrazilDateString = (date: Date): string => {
  const formatter = new Intl.DateTimeFormat('fr-CA', { 
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: BRAZIL_TIMEZONE,
  });
  return formatter.format(date);
};

export default function DashboardPage() {
  const { calls, isLoading, fetchData, updateFilters, hasMore } = useCalls(10);
  
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('score_desc');
  const [dateFilter, setDateFilter] = useState('today');
  const [minScore, setMinScore] = useState(0);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // 🚩 ORQUESTRADOR DE BUSCA ATÔMICA (Visão Geral)
  useEffect(() => {
    const agora = new Date();
    let start = '';
    let end = '';

    if (dateFilter === 'today') {
      start = getBrazilDateString(agora);
      end = start;
    } else if (dateFilter === '7d') {
      const past = new Date(agora);
      past.setDate(agora.getDate() - 7);
      start = getBrazilDateString(past);
      end = getBrazilDateString(agora);
    } else if (dateFilter === 'month') {
      const firstDay = new Date(agora.getFullYear(), agora.getMonth(), 1);
      start = getBrazilDateString(firstDay);
      end = getBrazilDateString(agora);
    } else if (dateFilter === 'custom') {
      start = customStartDate;
      end = customEndDate;
    }

    // 🚩 FILTROS GERAIS: ownerName removido para pegar todos os SDRs
    const filtrosParaEnviar = {
      startDate: start,
      endDate: end,
      sort: sortOrder,
      minScore: minScore
    };

    // 1. Sincroniza o estado interno do Hook
    updateFilters(filtrosParaEnviar);

    // 2. Dispara a busca imediata ignorando o delay do React
    fetchData(true, filtrosParaEnviar);

    // 3. Busca o resumo estatístico
    const fetchSummary = async () => {
      try {
        let url = `/api/stats/summary?t=${Date.now()}`;
        if (start && end) url += `&startDate=${start}&endDate=${end}`;
        const res = await fetch(url);
        const data = await res.json();
        setSummary(data);
      } catch (e) {
        console.error("Erro ao buscar resumo:", e);
      }
    };
    fetchSummary();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFilter, sortOrder, customStartDate, customEndDate, minScore]);

  const filteredCalls = useMemo(() => {
    if (!searchTerm) return calls;
    const term = searchTerm.toLowerCase();
    return calls.filter(c => 
      c.ownerName?.toLowerCase().includes(term) || 
      c.title?.toLowerCase().includes(term)
    );
  }, [calls, searchTerm]);

  const stats = summary as any;
  const isSummaryEmpty = stats?.empty === true || !stats; 
  // 🚩 MUDANÇA: Agora o Dashboard usa a média geral que o Backend já calculou com o novo peso
  const avgSpin = stats?.media_geral || 0;
  const totalCalls = stats?.total_calls || 0;
  const analyzedCount = stats?.valid_calls || 0; 
  const activeSDRsCount = stats?.sdr_ranking ? Object.keys(stats.sdr_ranking).length : 0;

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold text-slate-900 tracking-tight">Performance Geral</h1>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm">
            <Calendar className="w-4 h-4 text-slate-400" />
            <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="text-sm font-bold text-slate-700 bg-transparent outline-none cursor-pointer">
              <option value="today">Hoje</option>
              <option value="7d">Últimos 7 dias</option>
              <option value="month">Mês atual</option>
              <option value="custom">Personalizado...</option>
            </select>
          </div>
          
          <Button onClick={() => fetchData(true)} variant="outline" disabled={isLoading} className="h-11 rounded-xl">
            {isLoading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
            Atualizar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-slate-100 shadow-sm"><CardContent className="p-6">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Média SPIN</p>
          <p className="text-3xl font-bold">{analyzedCount > 0 ? avgSpin.toFixed(1) : "--"}</p>
        </CardContent></Card>
        <Card className="border-slate-100 shadow-sm"><CardContent className="p-6">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Volume Total</p>
          <p className="text-3xl font-bold">{totalCalls}</p>
        </CardContent></Card>
        <Card className="border-slate-100 shadow-sm"><CardContent className="p-6">
          <p className="text-[10px] font-bold text-slate-400 uppercase">SDRs Ativos</p>
          <p className="text-3xl font-bold">{activeSDRsCount}</p>
        </CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <SDRRanking summary={summary} />
        <div className="lg:col-span-3 space-y-6">
          <Input placeholder="Pesquisar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          <div className="grid gap-4">
            {filteredCalls.map(call => <CallCard key={call.id} call={call} />)}
            {hasMore && (
              <Button variant="ghost" className="w-full py-8 border-2 border-dashed rounded-2xl" onClick={() => fetchData(false)} disabled={isLoading}>
                {isLoading ? "Carregando..." : "Carregar mais"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}