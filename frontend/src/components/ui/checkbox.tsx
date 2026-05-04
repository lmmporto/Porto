"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Inbox,
  Loader2,
  RefreshCcw,
  Search,
  Calendar,
  TrendingUp,
  PhoneCall,
  Users
} from 'lucide-react';

import { CallCard } from '@/components/dashboard/CallCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

import type { SDRCall } from '@/types';
import { isWithinPeriod, calculateAverageSpin, getSDRRanking } from '@/lib/metrics';

export default function DashboardPage() {
  const router = useRouter();

  const [calls, setCalls] = useState<SDRCall[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [period, setPeriod] = useState('month');
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const rawUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || '';
  const API = rawUrl.replace(/\/$/, '');

  const fetchCalls = async () => {
    // 🚩 TRAVA DE SEGURANÇA: Previne loops e requisições duplicadas
    if (isLoading && calls.length > 0) return;
    if (!API) {
      setError('Configuração de API ausente.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API}/api/calls`, {
        credentials: 'include', // 🚩 OBRIGATÓRIO: Envio de cookies cross-origin
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
      });

      if (res.status === 401) {
        router.push('/login');
        return;
      }

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Falha ao carregar chamadas');
      }

      const data = await res.json();
      setCalls(Array.isArray(data) ? (data as SDRCall[]) : []);
    } catch (err) {
      console.error('[ERROR] fetchCalls:', err);
      setError('Erro ao carregar os dados.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      if (!API) {
        setIsCheckingAuth(false);
        return;
      }

      try {
        const res = await fetch(`${API}/auth/me`, {
          credentials: 'include', // 🚩 OBRIGATÓRIO: Validação de sessão via cookie
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
          },
        });

        if (res.status === 401) {
          router.push('/login');
          return;
        }

        const data = await res.json();
        if (!data?.authenticated) {
          router.push('/login');
          return;
        }

        await fetchCalls();
      } catch (err) {
        console.error('[ERROR] checkAuth:', err);
        router.push('/login');
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [API, router]);

  const { filteredCalls, stats, sdrSummary } = useMemo(() => {
    const filtered = calls
      .filter((call) => {
        const matchesPeriod = isWithinPeriod(call.analyzedAt, period);
        const hasValidNota = typeof call.nota_spin === 'number' && !isNaN(call.nota_spin);
        const matchesSearch =
          call.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          call.ownerName?.toLowerCase().includes(searchTerm.toLowerCase());

        return matchesPeriod && hasValidNota && matchesSearch;
      })
      .sort((a, b) => {
        const dateA = a.analyzedAt ? new Date(a.analyzedAt).getTime() : 0;
        const dateB = b.analyzedAt ? new Date(b.analyzedAt).getTime() : 0;
        return dateB - dateA;
      });

    return { 
      filteredCalls: filtered, 
      stats: { avgSpin: calculateAverageSpin(filtered) }, 
      sdrSummary: getSDRRanking(filtered) 
    };
  }, [calls, period, searchTerm]);

  if (isCheckingAuth) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-slate-900">Análises de Chamadas</h1>
          <p className="text-slate-400 text-sm">Feed cronológico das avaliações.</p>
        </div>

        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[160px] h-9 text-xs bg-white border-slate-100">
              <Calendar className="w-3.5 h-3.5 mr-2 text-slate-400" />
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Hoje</SelectItem>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="month">Mês atual</SelectItem>
              <SelectItem value="all">Todo histórico</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" onClick={fetchCalls} disabled={isLoading} className="h-9 text-xs">
            <RefreshCcw className={`w-3.5 h-3.5 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-slate-100 shadow-none bg-white">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 bg-slate-50 rounded-lg"><TrendingUp className="w-5 h-5 text-slate-900" /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Média SPIN</p>
              <h3 className="text-xl font-bold text-slate-900">{stats.avgSpin}</h3>
            </div>
          </CardContent>
        </Card>
        {/* Outros Cards mantidos conforme original */}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-4">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Resumo por SDR</h4>
          <div className="space-y-2">
            {sdrSummary.slice(0, 5).map((sdr) => (
              <div key={sdr.name} className="p-3 bg-white border border-slate-50 rounded-lg flex justify-between items-center">
                <p className="text-xs font-bold text-slate-900 truncate max-w-[70%]">{sdr.name}</p>
                <p className="text-sm font-bold text-slate-900">{sdr.avgSpin}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-3 space-y-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-300" />
            <Input
              placeholder="Filtrar por título ou SDR..."
              className="pl-9 bg-white border-slate-100 h-9 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-slate-200" />
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Sincronizando...</p>
            </div>
          ) : filteredCalls.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
              <Inbox className="w-6 h-6 text-slate-200" />
              <h2 className="text-sm font-bold text-slate-900">Nenhuma chamada encontrada</h2>
            </div>
          ) : (
            <div className="grid gap-3">
              {filteredCalls.map((call) => (
                <CallCard key={call.callId} call={call} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}