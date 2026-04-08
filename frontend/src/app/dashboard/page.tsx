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
import { useCallContext } from '@/context/CallContext';
import { useDashboard } from '@/context/DashboardContext'; 
import type { DashboardSummary } from '@/types';

type SortOrder = 'date_desc' | 'score_desc' | 'score_asc';
const BRAZIL_TIMEZONE = 'America/Sao_Paulo';

const getBrazilDateString = (date: Date): string => {
  return new Intl.DateTimeFormat('fr-CA', { 
    year: 'numeric', month: '2-digit', day: '2-digit', 
    timeZone: BRAZIL_TIMEZONE 
  }).format(date);
};

// --- COMPONENTE DE DEBUG (SIMULAÇÃO) ---
const AdminDebugPanel = () => {
  const { startImpersonation, stopImpersonation, isImpersonating } = useDashboard();
  const [sdrs, setSdrs] = useState<any[]>([]);

  useEffect(() => {
    const fetchSdrs = async () => {
      try {
        const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(/\/$/, '');
        const res = await fetch(`${baseUrl}/api/stats/summary`, { credentials: 'include' });
        const data = await res.json();
        if (data.sdr_ranking) {
          const list = Object.entries(data.sdr_ranking).map(([name, stats]: [string, any]) => ({
            name,
            email: stats.ownerEmail || name
          }));
          setSdrs(list);
        }
      } catch (e) {
        console.error("Erro ao carregar lista de SDRs para o painel de debug");
      }
    };
    if (process.env.NODE_ENV === 'development') fetchSdrs();
  }, []);

  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <div className="fixed bottom-4 right-4 bg-amber-100 border-2 border-amber-400 p-4 rounded-2xl shadow-2xl z-50 max-w-xs animate-in slide-in-from-bottom-10">
      <h3 className="text-xs font-black text-amber-800 uppercase tracking-widest mb-3 flex items-center gap-2">
        <AlertCircle className="w-3 h-3" /> Painel de Simulação
      </h3>
      <div className="space-y-3">
        <select 
          onChange={(e) => {
            const sdr = sdrs.find(s => s.email === e.target.value);
            if (sdr) startImpersonation(sdr);
          }}
          className="w-full p-2 text-xs rounded-lg border border-amber-200 bg-white outline-none focus:ring-2 focus:ring-amber-500"
        >
          <option value="">Simular visão de...</option>
          {sdrs.map(sdr => (
            <option key={sdr.email} value={sdr.email}>{sdr.name}</option>
          ))}
        </select>
        
        {isImpersonating && (
          <Button 
            onClick={stopImpersonation} 
            variant="destructive" 
            className="w-full h-8 text-[10px] font-bold uppercase tracking-widest rounded-lg"
          >
            Encerrar Simulação
          </Button>
        )}
      </div>
    </div>
  );
};

export default function DashboardPage() {
  const { calls, isLoading, applyFilter, refresh, hasMore, loadMore } = useCallContext();
  
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('score_desc');
  const [dateFilter, setDateFilter] = useState('today');
  const [minScore, setMinScore] = useState(0);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // 🚩 ORQUESTRADOR DE BUSCA ATÔMICA ATUALIZADO
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

    const filtrosParaEnviar = {
      startDate: start,
      endDate: end,
      sort: sortOrder,
      minScore: minScore
    };

    // Disparo da busca via contexto
    applyFilter(filtrosParaEnviar as any);

    const fetchSummary = async () => {
      try {
        const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(/\/$/, '');
        let url = `${baseUrl}/api/stats/summary?t=${Date.now()}`;
        if (start && end) url += `&startDate=${start}&endDate=${end}`;
        
        const res = await fetch(url, { credentials: 'include' });
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

  const analyzedCount = summary?.valid_calls ?? 0;
  const totalCalls = summary?.total_calls ?? 0;
  const avgSpin = summary?.media_geral ?? 0;
  const activeSDRsCount = summary?.sdr_ranking ? Object.keys(summary.sdr_ranking).length : 0;

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
          
          <Button onClick={() => refresh()} variant="outline" disabled={isLoading} className="h-11 rounded-xl">
            {isLoading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
            Atualizar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-slate-100 shadow-sm"><CardContent className="p-6 flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><TrendingUp className="w-6 h-6" /></div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Média SPIN</p>
            <p className="text-3xl font-bold">{analyzedCount > 0 ? Number(avgSpin).toFixed(1) : "--"}</p>
          </div>
        </CardContent></Card>
        
        <Card className="border-slate-100 shadow-sm"><CardContent className="p-6 flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><PhoneCall className="w-6 h-6" /></div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Volume Total</p>
            <p className="text-3xl font-bold">{totalCalls}</p>
          </div>
        </CardContent></Card>

        <Card className="border-slate-100 shadow-sm"><CardContent className="p-6 flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl"><Users className="w-6 h-6" /></div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">SDRs Ativos</p>
            <p className="text-3xl font-bold">{activeSDRsCount}</p>
          </div>
        </CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <SDRRanking summary={summary} />
        <div className="lg:col-span-3 space-y-6">
          <Input placeholder="Pesquisar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          <div className="grid gap-4">
            {filteredCalls.map(call => <CallCard key={call.id} call={call} />)}
            {hasMore && (
              <Button variant="ghost" className="w-full py-8 border-2 border-dashed rounded-2xl" onClick={loadMore} disabled={isLoading}>
                {isLoading ? "Carregando..." : "Carregar mais"}
              </Button>
            )}
          </div>
        </div>
      </div>

      <AdminDebugPanel />
    </div>
  );
}