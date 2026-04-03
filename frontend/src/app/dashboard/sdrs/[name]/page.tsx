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
import { useCalls } from '@/hooks/useCalls';
import type { DashboardSummary } from '@/types';

type SortOrder = 'date_desc' | 'score_desc' | 'score_asc';
const BRAZIL_TIMEZONE = 'America/Sao_Paulo';

const getBrazilDateString = (date: Date): string => {
  return new Intl.DateTimeFormat('fr-CA', { 
    year: 'numeric', month: '2-digit', day: '2-digit', 
    timeZone: BRAZIL_TIMEZONE 
  }).format(date);
};

function SDRDetailContent() {
  const { name } = useParams(); 
  const router = useRouter();
  const searchParams = useSearchParams();
  const decodedName = decodeURIComponent(name as string);

  // 🚩 Instalação do motor novo
  const { calls, isLoading, error, fetchData, updateFilters, hasMore } = useCalls(10);
  
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [timeFilter, setTimeFilter] = useState(() => {
    return searchParams.get('filter') || searchParams.get('period') || 'today';
  });
  const [customStartDate, setCustomStartDate] = useState(() => searchParams.get('start') || '');
  const [customEndDate, setCustomEndDate] = useState(() => searchParams.get('end') || '');
  const [sortOrder, setSortOrder] = useState<SortOrder>('score_desc');
  const [minScore, setMinScore] = useState(0);

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

  // 🚩 LIGAÇÃO DOS FIOS (useEffect Sênior conforme sugestão)
  useEffect(() => {
    const sdrName = decodedName;
    const now = new Date();
    let start = '';
    let end = '';

    // Cálculo de datas para o objeto de filtros
    if (timeFilter === 'today') {
      start = getBrazilDateString(now);
      end = start;
    } else if (timeFilter === '7d') {
      const past = new Date(now);
      past.setDate(now.getDate() - 7);
      start = getBrazilDateString(past);
      end = getBrazilDateString(now);
    } else if (timeFilter === 'month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      start = getBrazilDateString(firstDay);
      end = getBrazilDateString(now);
    } else if (timeFilter === 'custom') {
      start = customStartDate;
      end = customEndDate;
    }
    
    // 1. Prepara o papel com os dados
    const novosFiltros = {
      ownerName: sdrName,
      startDate: start,
      endDate: end,
      sort: sortOrder,
      minScore: minScore
    };

    // 2. Guarda na gaveta para o futuro
    updateFilters(novosFiltros);

    // 3. Manda buscar AGORA passando o papel direto (novosFiltros)
    fetchData(true, novosFiltros);

    // Busca o Summary estatístico separadamente
    const fetchSummary = async () => {
      try {
        let url = `/api/stats/summary?t=${Date.now()}`;
        if (start && end) url += `&startDate=${start}&endDate=${end}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("Erro na rede");
        const data = await res.json();
        setSummary(data);
      } catch (e) {
        console.error("❌ Erro ao buscar resumo:", e);
      }
    };
    fetchSummary();

    // 🚩 REGRA DE OURO: Removidos fetchData e updateFilters das dependências
  }, [decodedName, timeFilter, sortOrder, minScore, customStartDate, customEndDate]);

  const sdrStats = useMemo(() => {
    const ranking = summary?.sdr_ranking;
    const stats = ranking ? ranking[decodedName] : null;
    if (!stats) return { total: 0, avg: 0, validos: 0 };
    return {
      total: Number(stats.calls || 0),
      validos: Number(stats.valid_calls || 0),
      avg: Number(stats.nota_media || 0)
    };
  }, [summary, decodedName]);

  const handleTimeFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newFilter = e.target.value;
    setTimeFilter(newFilter);
    if (newFilter !== 'custom') updateUrlParams(newFilter);
  };

  const handleCustomDateSearch = () => {
    if (customStartDate && customEndDate && customStartDate <= customEndDate) {
      updateUrlParams('custom', customStartDate, customEndDate);
    }
  };

  const totalVolume = calls.length; 
  const totalAnalyzed = calls.filter(c => c.processingStatus === 'DONE').length;

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
            <div className="bg-white border border-slate-100 rounded-xl p-4 flex flex-col items-center min-w-[140px] shadow-sm">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                <TrendingUp className="w-3 h-3 text-amber-500" /> Média SPIN
              </span>
              <span className="text-2xl font-headline font-bold text-slate-900">
                {sdrStats.validos > 0 ? sdrStats.avg.toFixed(1) : "--"}
              </span>
            </div>

            <div className="bg-white border border-slate-100 rounded-xl p-4 flex flex-col items-center min-w-[140px] shadow-sm">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                <PhoneCall className="w-3 h-3 text-emerald-500" /> Analisadas / Volume
              </span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl font-headline font-bold text-slate-900">{sdrStats.validos}</span>
                <span className="text-xs font-bold text-slate-300"> / {sdrStats.total}</span>
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
              {totalAnalyzed} / {totalVolume} exibidas
            </span>
          )}
        </h3>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center bg-white border border-slate-200 rounded-xl px-2 h-9 shadow-sm">
             <ArrowDownUp className="w-3.5 h-3.5 ml-1 text-slate-400" />
             <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value as SortOrder)} className="bg-transparent text-xs font-semibold text-slate-600 focus:outline-none p-1.5 cursor-pointer">
               <option value="score_desc">Melhores Notas</option>
               <option value="score_asc">Menores Notas</option>
               <option value="date_desc">Mais Recentes</option>
             </select>
          </div>

          <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
            <Calendar className="w-3.5 h-3.5 ml-2 text-slate-400" />
            <select value={timeFilter} onChange={handleTimeFilterChange} className="bg-transparent text-xs font-semibold text-slate-600 focus:outline-none p-1.5 cursor-pointer">
              <option value="today">Hoje</option>
              <option value="7d">Últimos 7 dias</option>
              <option value="month">Mês atual</option>
              <option value="all">Todo Histórico</option>
              <option value="custom">Personalizado...</option>
            </select>
            
            {timeFilter === 'custom' && (
              <div className="flex items-center gap-2 sm:ml-2 sm:pl-3 sm:border-l border-slate-100 animate-in zoom-in duration-200">
                <input type="date" value={customStartDate} max={todayMaxDate} onChange={e => setCustomStartDate(e.target.value)} className="h-8 text-xs font-medium text-slate-600 rounded-lg px-2 outline-none" />
                <span className="text-slate-300 text-[10px] font-bold">ATÉ</span>
                <input type="date" value={customEndDate} max={todayMaxDate} onChange={e => setCustomEndDate(e.target.value)} className="h-8 text-xs font-medium text-slate-600 rounded-lg px-2 outline-none" />
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={handleCustomDateSearch} disabled={!customStartDate || !customEndDate || customStartDate > customEndDate || isLoading}>
                  <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`}/>
                </Button>
              </div>
            )}
          </div>
          
          <Button onClick={() => fetchData(true)} variant="outline" size="sm" className="h-9 rounded-xl" disabled={isLoading}>
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      <div className="grid gap-3 min-h-[300px]">
        {isLoading && calls.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Buscando rastros...</p>
          </div>
        ) : calls.length > 0 ? (
          calls.map(call => <CallCard key={call.id} call={call} />)
        ) : (
          <div className="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-100 gap-3">
            <Hourglass className="w-8 h-8 text-slate-200" />
            <p className="text-sm text-slate-400 italic font-medium">Nenhum rastro encontrado para este SDR neste período.</p>
          </div>
        )}

        {hasMore && (
          <Button 
            variant="ghost" 
            className="w-full py-8 text-slate-400 hover:text-indigo-600 font-bold text-xs tracking-widest uppercase border-2 border-dashed border-slate-100 rounded-2xl mt-4" 
            onClick={() => fetchData(false)}
            disabled={isLoading}
          >
            {isLoading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : "Carregar mais chamadas"}
          </Button>
        )}
      </div>
    </div>
  );
}

export default function SDRDetailPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]"><RefreshCw className="w-6 h-6 animate-spin text-indigo-500" /></div>}>
      <SDRDetailContent />
    </Suspense>
  );
}