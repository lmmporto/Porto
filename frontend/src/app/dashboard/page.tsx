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
import type { SDRCall, DashboardSummary } from '@/types';

type SortOrder = 'date_desc' | 'score_desc' | 'score_asc';

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [calls, setCalls] = useState<SDRCall[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null); // 🚩 Estado de erro restaurado
  const [searchTerm, setSearchTerm] = useState('');
  
  const [sortOrder, setSortOrder] = useState<SortOrder>('score_desc');
  const [dateFilter, setDateFilter] = useState('today');
  
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const timestamp = Date.now();
      
      // 🚩 1. Calcula as datas exatas no Frontend para forçar o Backend
      let startIso = '';
      let endIso = '';
      const now = new Date();
      
      if (dateFilter === 'today') {
        const todayStr = now.toISOString().split('T')[0]; 
        startIso = `${todayStr}T00:00:00.000Z`;
        endIso = `${todayStr}T23:59:59.999Z`;
      } else if (dateFilter === '7d') {
        const past = new Date();
        past.setDate(now.getDate() - 7);
        startIso = `${past.toISOString().split('T')[0]}T00:00:00.000Z`;
        endIso = `${now.toISOString().split('T')[0]}T23:59:59.999Z`;
      } else if (dateFilter === 'month') {
        const monthStr = String(now.getMonth() + 1).padStart(2, '0');
        startIso = `${now.getFullYear()}-${monthStr}-01T00:00:00.000Z`;
        endIso = `${now.toISOString().split('T')[0]}T23:59:59.999Z`;
      } else if (dateFilter === 'custom' && customStartDate && customEndDate) {
        startIso = `${customStartDate}T00:00:00.000Z`;
        endIso = `${customEndDate}T23:59:59.999Z`;
      }

      // 🚩 2. Monta as URLs passando as datas exatas
      let summaryUrl = `/api/stats/summary?t=${timestamp}`;
      let callsUrl = `/api/calls?limit=50&t=${timestamp}`; 
      
      if (dateFilter !== 'all' && startIso && endIso) {
        summaryUrl += `&startDate=${startIso}&endDate=${endIso}`;
        callsUrl += `&startDate=${startIso}&endDate=${endIso}`;
      }

      // 🚩 3. Dispara os dois pedidos ao mesmo tempo (Mais rápido)
      const [resSummary, resCalls] = await Promise.all([
        fetch(summaryUrl),
        fetch(callsUrl)
      ]);

      const summaryData = await resSummary.json();
      const callsData = await resCalls.json();

      if (!resSummary.ok || summaryData.error) {
        throw new Error(summaryData.error || 'Falha ao carregar as métricas do Cofre.');
      }
      
      if (!resCalls.ok || callsData.error) {
        throw new Error(callsData.error || 'Falha ao carregar a lista de chamadas.');
      }

      setSummary(summaryData);
      setCalls(Array.isArray(callsData) ? callsData : []);

    } catch (err: any) {
      console.error("❌ Erro na sincronização do Dashboard:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dateFilter]); 

  const filteredCalls = useMemo(() => {
    let result = [...calls];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(c => 
        c.ownerName?.toLowerCase().includes(term) || 
        c.title?.toLowerCase().includes(term)
      );
    }
    return result.sort((a, b) => {
      if (sortOrder === 'score_desc') return (b.nota_spin || 0) - (a.nota_spin || 0);
      if (sortOrder === 'score_asc') return (a.nota_spin || 0) - (b.nota_spin || 0);
      return 0; 
    });
  }, [calls, searchTerm, sortOrder]);

  // 🚩 MÉTRICAS CORRIGIDAS (Adaptadas para o novo Backend)
  const stats = summary as any;
  const isSummaryEmpty = stats?.empty === true;
  const avgSpin = stats && !isSummaryEmpty ? (stats.sum_notes / (stats.valid_calls || 1)) : 0;
  const totalCalls = stats?.total_calls || 0;
  const analyzedCount = stats?.valid_calls || 0;
  const activeSDRsCount = stats?.sdr_ranking ? Object.keys(stats.sdr_ranking).length : 0;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" />
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Acessando Banco de Dados...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 animate-in fade-in zoom-in duration-300">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-2">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-headline font-bold text-slate-800">Problema de Conexão</h2>
        <p className="text-sm text-slate-500 text-center max-w-md bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
          {error}
        </p>
        <Button onClick={fetchData} className="mt-4 bg-slate-900 hover:bg-slate-800 rounded-xl">
          <RefreshCw className="w-4 h-4 mr-2" /> Tentar Novamente
        </Button>
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
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={fetchData}><RefreshCw className="w-3 h-3"/></Button>
              </div>
            )}
          </div>
          
          <Button onClick={fetchData} variant="outline" className="h-11 rounded-xl border-slate-200 hover:bg-slate-50">
            <RefreshCw className="w-4 h-4 mr-2" /> Atualizar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-slate-100 shadow-sm group">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:scale-110 transition-transform"><TrendingUp className="w-6 h-6" /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Média SPIN (Período)</p>
              <p className="text-3xl font-headline font-bold text-slate-900">{avgSpin > 0 ? avgSpin.toFixed(1) : "--"}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-100 shadow-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><PhoneCall className="w-6 h-6" /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Volume Total</p>
              <p className="text-3xl font-headline font-bold text-slate-900">{totalCalls}</p>
              <p className="text-[9px] text-emerald-500 font-bold uppercase mt-1">{analyzedCount} análises concluídas</p>
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
          <SDRRanking summary={summary} /> 
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

          <div className="space-y-2 mb-4 bg-amber-50 border border-amber-100 rounded-lg p-3 flex items-center gap-3">
             <AlertCircle className="w-4 h-4 text-amber-600" />
             <p className="text-amber-700 text-[11px] font-medium">
               Exibindo as chamadas de acordo com o filtro. Limite de segurança ativado para economizar dados.
             </p>
          </div>

          <div className="grid gap-4">
            {filteredCalls.length > 0 ? (
              filteredCalls.map(call => <CallCard key={call.id} call={call} />)
            ) : (
              <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-100">
                <p className="text-slate-400 italic">Nenhuma chamada encontrada para este período.</p>
              </div>
            )}
            
            {calls.length >= 50 && (
               <Button variant="ghost" className="w-full py-8 text-slate-400 hover:text-indigo-600 font-bold text-xs tracking-widest uppercase">
                 Limite de 50 chamadas atingido. Refine a busca →
               </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}