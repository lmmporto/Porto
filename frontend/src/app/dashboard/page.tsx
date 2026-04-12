"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  TrendingUp, 
  PhoneCall, 
  Users, 
  Search, 
  Calendar, 
  RefreshCw,
  ArrowDownUp,
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

// --- COMPONENTE DE DEBUG (SIMULAÇÃO) ---
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
            .map((sdr) => (
              <option key={sdr.email} value={sdr.email}>{sdr.name}</option>
            ))
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
  const { user, isAdmin, isInitialized, isImpersonating } = useDashboard(); 
  const router = useRouter();

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('score_desc');
  const [dateFilter, setDateFilter] = useState('today');
  const [rotaFilter, setRotaFilter] = useState('ALL'); 
  const [minScore, setMinScore] = useState(0);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // 🚩 SEGURANÇA: Redirecionamento
  useEffect(() => {
    if (isInitialized && !isAdmin && !isImpersonating) {
      router.replace('/me');
    }
  }, [isInitialized, isAdmin, isImpersonating, router]);

  // 🚩 ORQUESTRADOR DE DADOS ESTABILIZADO
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
    
    // 🏛️ O Arquiteto: applyFilter chamado com dependências primitivas
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

    // 🚩 DEPENDÊNCIAS LIMPAS: Removido applyFilter e user para evitar loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFilter, sortOrder, rotaFilter, minScore, customStartDate, customEndDate]);

  const filteredCalls = useMemo(() => {
    const allowlisted = calls.filter(call => 
      call.nota_spin !== null && 
      ['APROVADO', 'ATENCAO', 'REPROVADO'].includes(call.status_final ?? '')
    );
    if (!searchTerm) return allowlisted;
    const term = searchTerm.toLowerCase();
    return allowlisted.filter(c => 
      c.ownerName?.toLowerCase().includes(term) || c.title?.toLowerCase().includes(term)
    );
  }, [calls, searchTerm]);

  if (isInitialized && !isAdmin && !isImpersonating) return null;

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Performance Geral</h1>
        
        <div className="flex flex-wrap items-center gap-2">
          {/* FILTRO DE ROTA */}
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm">
            <Target className="w-4 h-4 text-slate-400" />
            <select 
              value={rotaFilter} 
              onChange={(e) => setRotaFilter(e.target.value)} 
              className="text-sm font-bold text-slate-700 bg-transparent outline-none cursor-pointer"
            >
              <option value="ALL">Todas as Rotas</option>
              <option value="ROTA_A">Rota A (Prospecção)</option>
              <option value="ROTA_B">Rota B (Reagendamento)</option>
              <option value="ROTA_C">Rota C (Gatekeeper)</option>
              <option value="ROTA_D">Rota D (Descarte)</option>
            </select>
          </div>

          {/* FILTRO DE DATA */}
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
        <Card className="border-slate-100 shadow-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><TrendingUp className="w-6 h-6" /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Média SPIN</p>
              <p className="text-3xl font-bold">{summary?.valid_calls && summary.valid_calls > 0 ? Number(summary.media_geral).toFixed(1) : "--"}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-slate-100 shadow-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><PhoneCall className="w-6 h-6" /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Volume Total</p>
              <p className="text-3xl font-bold">{summary?.total_calls ?? 0}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-100 shadow-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl"><Users className="w-6 h-6" /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">SDRs Ativos</p>
              <p className="text-3xl font-bold">{summary?.sdr_ranking ? Object.keys(summary.sdr_ranking).length : 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <SDRRanking summary={summary} />
        <div className="lg:col-span-3 space-y-6">
          <Input placeholder="Pesquisar por SDR ou título..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="h-12 rounded-xl border-slate-200" />
          <div className="grid gap-4">
            {filteredCalls.length > 0 ? (
              filteredCalls.map(call => <CallCard key={call.id} call={call} />)
            ) : !isLoading && (
              <div className="bg-white border border-slate-100 rounded-3xl p-20 text-center shadow-sm">
                <p className="text-slate-400 italic">Nenhuma chamada encontrada para os filtros selecionados.</p>
              </div>
            )}
            {hasMore && (
              <Button variant="ghost" className="w-full py-8 border-2 border-dashed border-slate-100 rounded-2xl text-slate-400 hover:text-indigo-600 hover:border-indigo-100 transition-all" onClick={loadMore} disabled={isLoading}>
                {isLoading ? "Carregando..." : "Carregar mais chamadas"}
              </Button>
            )}
          </div>
        </div>
      </div>

      <AdminDebugPanel />
    </div>
  );
}