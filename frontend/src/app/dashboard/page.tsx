"use client";

import { useState, useEffect, useMemo, useCallback } from 'react'; // 🚩 ALTERAÇÃO: Adicionado useCallback
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

// 🚩 ALTERAÇÃO CRÍTICA: Constante para o fuso horário de Brasília, usada em todo o cálculo de datas
const BRAZIL_TIMEZONE = 'America/Sao_Paulo';

// 🚩 ALTERAÇÃO CRÍTICA: Função auxiliar para obter a data YYYY-MM-DD no fuso horário de Brasília
const getBrazilDateString = (date: Date): string => {
  // Usamos 'fr-CA' porque formata para YYYY-MM-DD naturalmente sem precisar de split/reverse/join
  // Ex: new Date() no Brasil em 27/03/2026 => "2026-03-27"
  const formatter = new Intl.DateTimeFormat('fr-CA', { 
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: BRAZIL_TIMEZONE,
  });
  return formatter.format(date);
};

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [calls, setCalls] = useState<SDRCall[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [sortOrder, setSortOrder] = useState<SortOrder>('score_desc');
  const [dateFilter, setDateFilter] = useState('today');
  
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // 🚩 ALTERAÇÃO CRÍTICA: Função fetchData envolvida em useCallback e com lógica de data revisada
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const timestamp = Date.now();
      
      let startPeriodStr = ''; // Formato: YYYY-MM-DD (fuso horário de Brasília)
      let endPeriodStr = '';   // Formato: YYYY-MM-DD (fuso horário de Brasília)
      
      const now = new Date(); // Objeto Date do JavaScript, representa a data/hora local

      if (dateFilter === 'today') {
        const todayBrazilStr = getBrazilDateString(now); // Ex: "2026-03-27"
        startPeriodStr = todayBrazilStr;
        endPeriodStr = todayBrazilStr;
      } else if (dateFilter === '7d') {
        const sevenDaysAgo = new Date(now); // Cria uma nova instância para não modificar 'now'
        sevenDaysAgo.setDate(now.getDate() - 7); // Subtrai 7 dias
        
        startPeriodStr = getBrazilDateString(sevenDaysAgo);
        endPeriodStr = getBrazilDateString(now); // Fim do dia "hoje" em Brasília
      } else if (dateFilter === 'month') {
        // Primeiro dia do mês atual (no fuso horário de Brasília)
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        startPeriodStr = getBrazilDateString(firstDayOfMonth);
        endPeriodStr = getBrazilDateString(now); // Fim do dia "hoje" em Brasília
      } else if (dateFilter === 'custom' && customStartDate && customEndDate) {
        // Para personalizado, customStartDate e customEndDate já são YYYY-MM-DD
        // assumimos que são no fuso horário desejado, vindo do input type="date"
        startPeriodStr = customStartDate;
        endPeriodStr = customEndDate;
      }

      // 🚩 ALTERAÇÃO CRÍTICA: Monta as URLs passando APENAS as strings YYYY-MM-DD
      let summaryUrl = `/api/stats/summary?t=${timestamp}`;
      let callsUrl = `/api/calls?limit=50&t=${timestamp}`; 
      
      // 🚩 CRÍTICO: SOMENTE ADICIONA startDate e endDate se o filtro NÃO for 'all' e se as datas foram calculadas
      if (dateFilter !== 'all' && startPeriodStr && endPeriodStr) {
        summaryUrl += `&startDate=${startPeriodStr}&endDate=${endPeriodStr}`;
        callsUrl += `&startDate=${startPeriodStr}&endDate=${endPeriodStr}`;
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
  }, [dateFilter, customStartDate, customEndDate]); // 🚩 Dependências adicionadas para useCallback

  useEffect(() => {
    fetchData();
  }, [fetchData]); // 🚩 Chama fetchData quando suas dependências mudarem

  const filteredCalls = useMemo(() => {
    let result = [...calls];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(c => 
        c.ownerName?.toLowerCase().includes(term) || 
        c.title?.toLowerCase().includes(term)
      );
    }
    // 🚩 ALTERAÇÃO: Garante que sortOrder 'date_desc' também seja tratado
    return result.sort((a, b) => {
      if (sortOrder === 'score_desc') return (b.nota_spin || 0) - (a.nota_spin || 0);
      if (sortOrder === 'score_asc') return (a.nota_spin || 0) - (b.nota_spin || 0);
      // 🚩 ALTERAÇÃO: Ordenar por data (assumindo analyzedAt, updatedAt ou createdAt para desempate)
      // Usar uma data de fallback segura, como Date(0) para nulls.
      if (sortOrder === 'date_desc') {
        const dateA = a.analyzedAt || a.updatedAt || a.createdAt;
        const dateB = b.analychedAt || b.updatedAt || b.createdAt;
        const timeA = dateA ? new Date(dateA as any).getTime() : 0;
        const timeB = dateB ? new Date(dateB as any).getTime() : 0;
        return timeB - timeA;
      }
      return 0; // fallback, não deve ser atingido com os sortOrders definidos
    });
  }, [calls, searchTerm, sortOrder]);

  const stats = summary as any;
  const isSummaryEmpty = stats?.empty === true || !stats; 
  // 🚩 ALTERAÇÃO: Proteção para evitar divisão por zero se valid_calls for 0
  const avgSpin = stats && !isSummaryEmpty && stats.valid_calls > 0 ? (stats.sum_notes / stats.valid_calls) : 0;
  const totalCalls = stats?.total_calls || 0;
  const analyzedCount = stats?.valid_calls || 0; // 'valid_calls' do backend já é o 'analyzedCount'
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
              {/* 🚩 ALTERAÇÃO: Proteção para exibir 0.0 ou -- */}
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
               Exibindo as chamadas de acordo com o filtro. Limite de 50 chamadas ativado.
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