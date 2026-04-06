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

  useEffect(() => {
    if (isLoading) return;

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

    updateFilters({
      startDate: start,
      endDate: end,
      sort: sortOrder,
      minScore
    });

    fetchData(true);

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
  const analyzedCount = stats?.valid_calls || 0; 
  const avgSpin = stats && analyzedCount > 0 ? (stats.sum_notes / analyzedCount) : 0;

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold text-slate-900 tracking-tight">Performance Geral</h1>
          <p className="text-slate-400 text-sm mt-1">Dados consolidados do Cofre.</p>
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
            
            {/* 🚩 CAMPOS DE DATA PERSONALIZADA INTEGRADOS */}
            {dateFilter === 'custom' && (
              <div className="flex items-center gap-2 sm:ml-2 sm:pl-3 sm:border-l border-slate-100 animate-in zoom-in duration-200">
                <input 
                  type="date" 
                  value={customStartDate} 
                  onChange={e => setCustomStartDate(e.target.value)} 
                  className="h-8 text-xs font-medium text-slate-600 rounded-lg px-2 border border-slate-100 outline-none focus:border-indigo-300"
                />
                <span className="text-slate-300 text-[10px] font-bold">ATÉ</span>
                <input 
                  type="date" 
                  value={customEndDate} 
                  onChange={e => setCustomEndDate(e.target.value)} 
                  className="h-8 text-xs font-medium text-slate-600 rounded-lg px-2 border border-slate-100 outline-none focus:border-indigo-300"
                />
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-7 w-7 p-0 hover:bg-indigo-50 text-indigo-600" 
                  onClick={() => fetchData(true)}
                >
                  <Search className="w-3.5 h-3.5"/>
                </Button>
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

      {/* Restante do layout (Cards, Ranking, Lista) mantido conforme original... */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-slate-100 shadow-sm"><CardContent className="p-6 flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><TrendingUp className="w-6 h-6" /></div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Média SPIN</p>
            <p className="text-3xl font-bold">{analyzedCount > 0 ? avgSpin.toFixed(1) : "--"}</p>
          </div>
        </CardContent></Card>
        {/* ... outros cards ... */}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <SDRRanking summary={summary} />
        <div className="lg:col-span-3 space-y-6">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input placeholder="Pesquisar..." className="pl-11 h-12 rounded-xl" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
          </div>
          <div className="grid gap-4">
            {filteredCalls.map(call => <CallCard key={call.id} call={call} />)}
            {hasMore && (
              <Button variant="ghost" className="w-full py-8 border-2 border-dashed rounded-2xl" onClick={() => fetchData(false)} disabled={isLoading}>
                {isLoading ? "Carregando..." : "Carregar mais chamadas"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}