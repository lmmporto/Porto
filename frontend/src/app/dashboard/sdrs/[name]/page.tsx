"use client";

import { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { CallCard } from '@/components/dashboard/CallCard';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  PhoneCall, 
  TrendingUp, 
  Calendar, 
  ArrowDownUp, 
  Hourglass,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { getInitials } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import type { SDRCall, DashboardSummary } from '@/types';

type SortOrder = 'date_desc' | 'score_desc' | 'score_asc';

// 🚩 Renomeado para Content (Padrão Next.js com Suspense)
function SDRDetailContent() {
  const { name } = useParams(); 
  const router = useRouter();
  const searchParams = useSearchParams();
  const decodedName = decodeURIComponent(name as string);

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [calls, setCalls] = useState<SDRCall[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const initialTimeFilter = searchParams.get('period') || searchParams.get('filter') || 'today';
  const initialStartDate = searchParams.get('startDate') || searchParams.get('start') || '';
  const initialEndDate = searchParams.get('endDate') || searchParams.get('end') || '';

  const [timeFilter, setTimeFilter] = useState(initialTimeFilter); 
  const [sortOrder, setSortOrder] = useState<SortOrder>('score_desc');
  
  const [customStartDate, setCustomStartDate] = useState(initialStartDate);
  const [customEndDate, setCustomEndDate] = useState(initialEndDate);

  const todayMaxDate = useMemo(() => new Date().toISOString().split('T')[0], []);

  const updateUrlParams = useCallback((newFilter: string, start?: string, end?: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('filter', newFilter);
    
    if (newFilter === 'custom' && start && end) {
      params.set('start', start);
      params.set('end', end);
    } else {
      params.delete('start');
      params.delete('end');
    }

    router.replace(`?${params.toString()}`, { scroll: false });
  }, [searchParams, router]);

  // 🚩 O MOTOR DE DATAS RESTAURADO: É ele quem traduz "7d" para datas exatas!
  const getDateRange = useCallback(() => {
    const now = new Date();
    let startIso = '';
    let endIso = '';

    const toLocalISO = (date: Date) => {
      const offset = date.getTimezoneOffset() * 60000;
      return new Date(date.getTime() - offset).toISOString().split('T')[0];
    };

    if (timeFilter === 'today') {
      const today = toLocalISO(now);
      startIso = `${today}T00:00:00.000Z`;
      endIso = `${today}T23:59:59.999Z`;
    } else if (timeFilter === '7d' || timeFilter === '7days') {
      const past = new Date();
      past.setDate(now.getDate() - 7);
      startIso = `${toLocalISO(past)}T00:00:00.000Z`;
      endIso = `${toLocalISO(now)}T23:59:59.999Z`;
    } else if (timeFilter === 'month') {
      const monthStr = String(now.getMonth() + 1).padStart(2, '0');
      startIso = `${now.getFullYear()}-${monthStr}-01T00:00:00.000Z`;
      endIso = `${toLocalISO(now)}T23:59:59.999Z`;
    } else if (timeFilter === 'custom' && customStartDate && customEndDate) {
      startIso = `${customStartDate}T00:00:00.000Z`;
      endIso = `${customEndDate}T23:59:59.999Z`;
    }
    return { startIso, endIso };
  }, [timeFilter, customStartDate, customEndDate]);


  const fetchData = async () => {
    if (timeFilter === 'custom') {
      if (!customStartDate || !customEndDate) return;
      if (customStartDate > customEndDate) return; 
    }

    setIsLoading(true);
    try {
      const timestamp = Date.now();
      const { startIso, endIso } = getDateRange(); // 🚩 Pega as datas calculadas
      
      let summaryUrl = `/api/stats/summary?t=${timestamp}`;
      let callsUrl = `/api/calls?ownerName=${encodeURIComponent(decodedName)}&limit=50&t=${timestamp}`;

      // 🚩 Passa AS DATAS (startDate e endDate) para o Backend entender
      if (timeFilter !== 'all' && startIso && endIso) {
        const dateParams = `&startDate=${encodeURIComponent(startIso)}&endDate=${encodeURIComponent(endIso)}`;
        summaryUrl += dateParams;
        callsUrl += dateParams;
      }

      const resSummary = await fetch(summaryUrl);
      if (resSummary.ok) {
        const summaryData = await resSummary.json();
        setSummary(summaryData);
      }

      const resCalls = await fetch(callsUrl);
      if (resCalls.ok) {
        const callsData = await resCalls.json();
        setCalls(Array.isArray(callsData) ? callsData : []);
      }

    } catch (error) {
      console.error("Erro ao carregar perfil do SDR:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (decodedName) fetchData();
  }, [decodedName, timeFilter, customStartDate, customEndDate]);

  const handleTimeFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newFilter = e.target.value;
    setTimeFilter(newFilter);
    if (newFilter !== 'custom') {
      updateUrlParams(newFilter);
    }
  };

  const handleCustomDateSearch = () => {
    if (customStartDate && customEndDate && customStartDate <= customEndDate) {
      updateUrlParams('custom', customStartDate, customEndDate);
      fetchData();
    }
  };

  const sdrStats = useMemo(() => {
    const ranking = summary?.sdr_ranking;
    const stats = ranking ? ranking[decodedName] : null;

    if (!stats) {
      return { total: 0, avg: 0, validos: 0 };
    }

    // 🚩 Lendo estritamente o que o Backend mastigado envia (e o que o types.ts aprova)
    return {
      total: Number(stats.calls || 0),
      validos: Number(stats.valid_calls || 0),
      avg: Number(stats.nota_media || 0)
    };
  }, [summary, decodedName]);

  const sortedCalls = useMemo(() => {
    return [...calls].sort((a, b) => {
      if (sortOrder === 'score_desc') return (Number(b.nota_spin) || 0) - (Number(a.nota_spin) || 0);
      if (sortOrder === 'score_asc') return (Number(a.nota_spin) || 0) - (Number(b.nota_spin) || 0);
      
      const dateA = new Date(a.createdAt || a.updatedAt || 0).getTime();
      const dateB = new Date(b.createdAt || b.updatedAt || 0).getTime();
      return dateB - dateA; 
    });
  }, [calls, sortOrder]);


  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20 px-4 md:px-0">
      <div className="flex flex-col gap-6">
        <Button variant="ghost" size="sm" onClick={() => router.push(`/dashboard/sdrs?filter=${timeFilter}`)} className="w-fit -ml-2 text-slate-400 hover:text-indigo-600">
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar para o Ranking
        </Button>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shadow-sm text-2xl font-black text-indigo-600">
              {getInitials(decodedName)}
            </div>
            <div>
              <h1 className="text-3xl font-headline font-bold text-slate-900 tracking-tight">{decodedName}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em]">SDR Ativo no Período</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="bg-white border border-slate-100 rounded-xl p-4 flex flex-col items-center min-w-[140px] shadow-sm transition-opacity duration-300" style={{ opacity: isLoading ? 0.5 : 1 }}>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                <TrendingUp className="w-3 h-3 text-amber-500" /> Média SPIN
              </span>
              <span className="text-2xl font-headline font-bold text-slate-900">
                {sdrStats.avg > 0 ? sdrStats.avg.toFixed(1) : "--"}
              </span>
            </div>

            <div className="bg-white border border-slate-100 rounded-xl p-4 flex flex-col items-center min-w-[140px] shadow-sm transition-opacity duration-300" style={{ opacity: isLoading ? 0.5 : 1 }}>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                <PhoneCall className="w-3 h-3 text-emerald-500" /> Analisadas
              </span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl font-headline font-bold text-slate-900">{sdrStats.validos}</span>
                <span className="text-xs font-bold text-slate-400">/{sdrStats.total}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Separator className="bg-slate-100" />

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
          Últimas Atividades 
          {!isLoading && (
            <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full text-[9px]">
              {calls.length} exibidas
            </span>
          )}
        </h3>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center bg-white border border-slate-200 rounded-xl px-2 h-9 shadow-sm">
             <ArrowDownUp className="w-3.5 h-3.5 ml-1 text-slate-400" />
             <select 
               value={sortOrder}
               onChange={(e) => setSortOrder(e.target.value as SortOrder)}
               className="bg-transparent text-xs font-semibold text-slate-600 focus:outline-none p-1.5 cursor-pointer"
             >
               <option value="score_desc">Melhores Notas</option>
               <option value="score_asc">Menores Notas</option>
               <option value="date_desc">Mais Recentes</option>
             </select>
          </div>

          <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
            <Calendar className="w-3.5 h-3.5 ml-2 text-slate-400" />
            <select 
              value={timeFilter}
              onChange={handleTimeFilterChange}
              className="bg-transparent text-xs font-semibold text-slate-600 focus:outline-none p-1.5 cursor-pointer"
            >
              <option value="today">Hoje</option>
              <option value="7d">Últimos 7 dias</option>
              <option value="month">Mês atual</option>
              <option value="all">Todo Histórico</option>
              <option value="custom">Personalizado...</option>
            </select>
            
            {timeFilter === 'custom' && (
              <div className="flex items-center gap-2 sm:ml-2 sm:pl-3 sm:border-l border-slate-100 animate-in zoom-in duration-200">
                <input 
                  type="date" 
                  value={customStartDate} 
                  max={todayMaxDate}
                  onChange={e => setCustomStartDate(e.target.value)} 
                  className="h-8 text-xs font-medium text-slate-600 rounded-lg px-2 outline-none"
                />
                <span className="text-slate-300 text-[10px] font-bold">ATÉ</span>
                <input 
                  type="date" 
                  value={customEndDate} 
                  max={todayMaxDate}
                  onChange={e => setCustomEndDate(e.target.value)} 
                  className="h-8 text-xs font-medium text-slate-600 rounded-lg px-2 outline-none"
                />
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-7 w-7 p-0" 
                  onClick={handleCustomDateSearch}
                  disabled={!customStartDate || !customEndDate || customStartDate > customEndDate || isLoading}
                >
                  <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`}/>
                </Button>
              </div>
            )}
          </div>
          
          <Button 
            onClick={fetchData} 
            variant="outline" 
            size="sm"
            className="h-9 rounded-xl border-slate-200 hover:bg-slate-50"
            disabled={isLoading}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-bold text-amber-800 uppercase tracking-tight">Barreira de Performance Ativa</p>
          <p className="text-[11px] text-amber-700 mt-0.5">
            Para economizar cota, exibimos até as 50 chamadas mais recentes da busca. 
            O volume de <strong>{sdrStats.total}</strong> chamadas continua contabilizado nos cards.
          </p>
        </div>
      </div>

      <div className="grid gap-3 min-h-[300px]">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Buscando rastros...</p>
          </div>
        ) : sortedCalls.length > 0 ? (
          sortedCalls.map(call => (
            <CallCard key={call.id} call={call} />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-100 gap-3">
            <Hourglass className="w-8 h-8 text-slate-200" />
            <p className="text-sm text-slate-400 italic font-medium">Nenhum rastro encontrado para este SDR neste período.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// 🚩 WRAPPER OBRIGATÓRIO NO NEXT.JS PARA PÁGINAS COM USE_SEARCH_PARAMS
export default function SDRDetailPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <RefreshCw className="w-6 h-6 animate-spin text-indigo-500 mb-4" />
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Carregando Perfil...</p>
      </div>
    }>
      <SDRDetailContent />
    </Suspense>
  );
}