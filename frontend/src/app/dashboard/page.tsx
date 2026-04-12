"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  TrendingUp, 
  PhoneCall, 
  Users, 
  Calendar, 
  RefreshCw,
  AlertCircle,
  Target
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

const AdminDebugPanel = () => {
  const { startImpersonation, stopImpersonation, isImpersonating } = useDashboard();
  const [sdrs, setSdrs] = useState<any[]>([]);

  useEffect(() => {
    const fetchSdrs = async () => {
      try {
        const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(/\/$/, '');
        const res = await fetch(`${baseUrl}/api/sdr-registry`, { credentials: 'include' });
        const data = await res.json();
        setSdrs(data.sdrs || []);
      } catch (e) {
        console.error("Erro ao carregar SDRs para simulação");
      }
    };
    if (process.env.NODE_ENV === 'development') fetchSdrs();
  }, []);

  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <div className="fixed bottom-4 right-4 bg-amber-100 border-2 border-amber-400 p-4 rounded-2xl shadow-2xl z-50 max-w-xs">
      <h3 className="text-xs font-black text-amber-800 uppercase tracking-widest mb-3 flex items-center gap-2">
        <AlertCircle className="w-3 h-3" /> Painel de Simulação
      </h3>
      <div className="space-y-3">
        <select 
          onChange={(e) => {
            const sdr = sdrs.find(s => s.email === e.target.value);
            if (sdr) startImpersonation(sdr);
          }}
          className="w-full p-2 text-xs rounded-lg border border-amber-200 bg-white outline-none"
        >
          <option value="">Simular visão de...</option>
          {sdrs
            .filter(sdr => sdr.email && sdr.email.includes('@'))
            .filter((sdr, index, self) => index === self.findIndex((t) => t.email === sdr.email))
            .map((sdr) => <option key={sdr.email} value={sdr.email}>{sdr.name}</option>)
          }
        </select>
        {isImpersonating && (
          <Button onClick={stopImpersonation} variant="destructive" className="w-full h-8 text-[10px] font-bold uppercase">
            Encerrar Simulação
          </Button>
        )}
      </div>
    </div>
  );
};

export default function DashboardPage() {
  const { calls, isLoading, applyFilter, refresh, hasMore, loadMore } = useCallContext();
  const { isAdmin, isInitialized, isImpersonating } = useDashboard(); 
  const router = useRouter();

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder] = useState<SortOrder>('score_desc');
  const [dateFilter, setDateFilter] = useState('today');
  const [rotaFilter, setRotaFilter] = useState('ALL'); 
  const [minScore] = useState(0);
  const [customStartDate] = useState('');
  const [customEndDate] = useState('');

  // 🏛️ O Arquiteto: Derivamos o Top 10 Elite a partir das chamadas carregadas
  const topEliteCalls = useMemo(() => {
    return [...calls]
      .filter(call => (call.nota_spin || 0) >= 7.0)
      .sort((a, b) => (b.nota_spin || 0) - (a.nota_spin || 0))
      .slice(0, 10);
  }, [calls]);

  useEffect(() => {
    if (isInitialized && !isAdmin && !isImpersonating) router.replace('/me');
  }, [isInitialized, isAdmin, isImpersonating, router]);

  useEffect(() => {
    const agora = new Date();
    let start = '', end = '';

    if (dateFilter === 'today') { start = end = getBrazilDateString(agora); }
    else if (dateFilter === '7d') {
      const past = new Date(agora); past.setDate(agora.getDate() - 7);
      start = getBrazilDateString(past); end = getBrazilDateString(agora);
    } else if (dateFilter === 'month') {
      start = getBrazilDateString(new Date(agora.getFullYear(), agora.getMonth(), 1));
      end = getBrazilDateString(agora);
    }
    
    applyFilter({
      startDate: start,
      endDate: end,
      sort: sortOrder,
      minScore: minScore,
      rota: rotaFilter !== 'ALL' ? rotaFilter : undefined
    } as any);

    const fetchSummary = async () => {
      try {
        const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(/\/$/, '');
        const res = await fetch(`${baseUrl}/api/stats/summary?t=${Date.now()}${start ? `&startDate=${start}&endDate=${end}` : ''}`, { credentials: 'include' });
        setSummary(await res.json());
      } catch (e) { console.error("Erro ao buscar resumo:", e); }
    };
    fetchSummary();
  }, [dateFilter, sortOrder, rotaFilter, minScore, applyFilter]);

  const filteredCalls = useMemo(() => {
    const allowlisted = calls.filter(c => c.nota_spin !== null && ['APROVADO', 'ATENCAO', 'REPROVADO'].includes(c.status_final ?? ''));
    if (!searchTerm) return allowlisted;
    const term = searchTerm.toLowerCase();
    return allowlisted.filter(c => c.ownerName?.toLowerCase().includes(term) || c.title?.toLowerCase().includes(term));
  }, [calls, searchTerm]);

  if (isInitialized && !isAdmin && !isImpersonating) return null;

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Performance Geral</h1>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm">
            <Target className="w-4 h-4 text-slate-400" />
            <select value={rotaFilter} onChange={(e) => setRotaFilter(e.target.value)} className="text-sm font-bold text-slate-700 bg-transparent outline-none cursor-pointer">
              <option value="ALL">Todas as Rotas</option>
              <option value="ROTA_A">Rota A</option>
              <option value="ROTA_B">Rota B</option>
            </select>
          </div>
          <Button onClick={() => refresh()} variant="outline" className="h-11 rounded-xl">
            <RefreshCw className="w-4 h-4 mr-2" /> Atualizar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <SDRRanking summary={summary} topCalls={topEliteCalls} />
        <div className="lg:col-span-3 space-y-6">
          <Input placeholder="Pesquisar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="h-12 rounded-xl border-slate-200" />
          <div className="grid gap-4">
            {filteredCalls.map(call => <CallCard key={call.id} call={call} />)}
            {hasMore && <Button variant="ghost" className="w-full" onClick={loadMore}>Carregar mais</Button>}
          </div>
        </div>
      </div>
      <AdminDebugPanel />
    </div>
  );
}