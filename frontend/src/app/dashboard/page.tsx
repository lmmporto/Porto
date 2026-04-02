"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
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
import { useCalls } from '../../hooks/useCalls';
import type { SDRCall, DashboardSummary } from '@/types';

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
  // 🚩 1. SUBSTITUIÇÃO DOS ESTADOS PELO HOOK
  const { calls, isLoading, error, fetchData, updateFilters, hasMore } = useCalls(10);
  
  // 🚩 2. FILTROS QUE PERMANECEM NO COMPONENTE
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('score_desc');
  const [dateFilter, setDateFilter] = useState('today');
  const [minScore, setMinScore] = useState(0);
  
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // 🚩 3. LÓGICA DE SINCRONIZAÇÃO DE FILTROS E BUSCA
  useEffect(() => {
    const now = new Date();
    let start = '';
    let end = '';

    if (dateFilter === 'today') {
      start = getBrazilDateString(now);
      end = start;
    } else if (dateFilter === '7d') {
      const past = new Date(now);
      past.setDate(now.getDate() - 7);
      start = getBrazilDateString(past);
      end = getBrazilDateString(now);
    } else if (dateFilter === 'month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      start = getBrazilDateString(firstDay);
      end = getBrazilDateString(now);
    } else if (dateFilter === 'custom') {
      start = customStartDate;
      end = customEndDate;
    }

    // Atualiza os filtros internos do hook
    updateFilters({
      startDate: start,
      endDate: end,
      sort: sortOrder,
      minScore
    });

    // Dispara a busca resetando a lista (Página 1)
    fetchData(true);

    // Busca o resumo estatístico (Summary) separadamente
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
  }, [dateFilter, sortOrder, minScore, customStartDate, customEndDate, fetchData, updateFilters]);

  const filteredCalls = useMemo(() => {
    let result = [...calls];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(c => 
        c.ownerName?.toLowerCase().includes(term) || 
        c.title?.toLowerCase().includes(term)
      );
    }
    return result;
  }, [calls, searchTerm]);

  const stats = summary as any;
  const isSummaryEmpty = stats?.empty === true || !stats; 
  const avgSpin = stats && !isSummaryEmpty && stats.valid_calls > 0 ? (stats.sum_notes / stats.valid_calls) : 0;
  const totalCalls = stats?.total_calls || 0;
  const analyzedCount = stats?.valid_calls || 0; 
  const activeSDRsCount = stats?.sdr_ranking ? Object.keys(stats.sdr_ranking).length : 0;

  if (isLoading && calls.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" />
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Acessando Banco de Dados...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold text-slate-900 tracking-tight">Performance Geral</h1>
          <p className="text-slate-400 text-sm mt-1">Dados consolidados do Cofre (Consumo Inteligente).</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-col sm:flex-row items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm">
            <div className="flex items-center h-8">
              <Calendar className="w-4 h-4 text-slate-400 mr-2" />
              <select 
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="text-sm font-bold text-slate-700 bg-transparent outline-none cursor-pointer"
              >
                <option value="today">Hoje</option>
                <option value="7d">Últimos 7 dias</option>
                <option value="month">Mês atual</option>
                <option value="all">Todo o período</option>
                <option value="custom">Personalizado...</option>
              </select>
            </div>

            <div className="h-4 w-px bg-slate-100 hidden sm:block mx-1" />
            
            {/* 🚩 FILTRO DE NOTA MÍNIMA */}
            <select 
              value={minScore}
              onChange={(e) => setMinScore(Number(e.target.value))}
              className="text-sm font-bold text-slate-700 bg-transparent outline-none cursor-pointer h-8"
            >
              <option value="0">Qualquer Nota</option>
              <option value="5">Nota 5+</option>
              <option value="8">Nota 8+</option>
            </select>
            
            {dateFilter === 'custom' && (
              <div className="flex items-center gap-2 sm:ml-2 sm:pl-3 sm:border-l border-slate-100 animate-in zoom-in duration-200">
                <input 
                  type="date" 
                  value={customStartDate} 
                  onChange={e => setCustomStartDate(e.target.value)} 
                  className="h-8 text-xs font-medium text-slate-600 rounded-lg px-2 outline-none"
                />
                <span className="text-slate-300 text-[10px] font-bold">ATÉ</span>
                <input 
                  type="date" 
                  value={customEndDate} 
                  onChange={e => setCustomEndDate(e.target.value)} 
                  className="h-8 text-xs font-medium text-slate-600 rounded-lg px-2 outline-none"
                />
              </div>
            )}
          </div>
          
          <Button 
            onClick={() => fetchData(true)} 
            variant="outline" 
            disabled={isLoading}
            className="h-11 rounded-xl border-slate-200 hover:bg-slate-50"
          >
            {isLoading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
            {isLoading ? "Sincronizando..." : "Atualizar"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-slate-100 shadow-sm group">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:scale-110 transition-transform"><TrendingUp className="w-6 h-6" /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Média SPIN (Período)</p>
              <p className="text-3xl font-headline font-bold text-slate-900">
                {analyzedCount > 0 ? avgSpin.toFixed(1) : "--"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-100 shadow-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><PhoneCall className="w-6 h-6" /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Volume Total</p>
              <p className="text-3xl font-headline font-bold text-slate-900">{totalCalls}</p>
              <p className="text-[9px] text-emerald-500 font-bold uppercase mt-1">
                {analyzedCount} análise{analyzedCount !== 1 ? 's' : ''} concluída{analyzedCount !== 1 ? 's' : ''}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-100 shadow-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl"><Users className="w-6 h-6" /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">SDRs Ativos</p>
              <p className="text-3xl font-headline font-bold text-slate-900">{activeSDRsCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="space-y-4">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Ranking de Performance</h3>
          <SDRRanking 
            summary={summary} 
          
          /> 
        </div>

        <div className="lg:col-span-3 space-y-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                placeholder="Pesquisar nas chamadas recentes..." 
                className="pl-11 h-12 bg-white border-slate-100 rounded-xl shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center bg-white border border-slate-200 rounded-xl px-4 h-12 shadow-sm min-w-[200px]">
              <ArrowDownUp className="w-4 h-4 text-slate-400 mr-3" />
              <select 
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as SortOrder)}
                className="text-sm font-bold text-slate-700 bg-transparent outline-none cursor-pointer w-full"
              >
                <option value="score_desc">Maior Nota</option>
                <option value="score_asc">Menor Nota</option>
                <option value="date_desc">Mais Recentes</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4">
            {filteredCalls.length > 0 ? (
              filteredCalls.map(call => <CallCard key={call.id} call={call} />)
            ) : (
              <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-100">
                <p className="text-slate-400 italic">Nenhuma chamada encontrada para este período.</p>
              </div>
            )}
            
            {/* 🚩 BOTÃO CARREGAR MAIS (SUBSTITUINDO O LIMITE FIXO) */}
            {hasMore && (
              <Button 
                variant="ghost" 
                className="w-full py-8 text-slate-400 hover:text-indigo-600 font-bold text-xs tracking-widest uppercase border-2 border-dashed border-slate-100 rounded-2xl" 
                onClick={() => fetchData(false)}
                disabled={isLoading}
              >
                {isLoading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : "Carregar mais chamadas"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}