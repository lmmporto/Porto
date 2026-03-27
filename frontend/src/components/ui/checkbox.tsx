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
import { isWithinPeriod, getGlobalStats, getSDRRanking } from '@/lib/metrics';

export default function DashboardPage() {
  const router = useRouter();

  const [calls, setCalls] = useState<SDRCall[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [period, setPeriod] = useState('month');
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API = process.env.NEXT_PUBLIC_API_BASE_URL;

  const fetchCalls = async () => {
    if (!API) {
      setError('NEXT_PUBLIC_API_BASE_URL não configurada.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('[DEBUG] Buscando chamadas em /api/calls');

      const res = await fetch(`${API}/api/calls`, {
        credentials: 'include',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
        },
      });

      console.log('[DEBUG] Status fetchCalls:', res.status);

      if (res.status === 401) {
        console.warn('[AUTH] Sessão expirada ou inválida ao buscar chamadas.');
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
      console.error('[ERROR] Falha ao buscar chamadas:', err);
      setError('Erro ao carregar os dados. Verifique sua conexão.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      console.log('[DEBUG] Verificando autenticação...');

      if (!API) {
        console.error('[ERROR] API_BASE_URL ausente.');
        setError('Configuração do servidor ausente.');
        setIsCheckingAuth(false);
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API}/auth/me`, {
          credentials: 'include',
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
            Pragma: 'no-cache',
          },
        });

        console.log('[DEBUG] Status do checkAuth:', res.status);

        if (res.status === 401) {
          console.warn('[AUTH] Usuário não autenticado (401).');
          router.push('/login');
          return;
        }

        if (!res.ok) {
          const text = await res.text();
          console.error('[AUTH] Resposta inesperada no /auth/me:', res.status, text);
          router.push('/login');
          return;
        }

        const data = await res.json();
        console.log('[DEBUG] Dados do usuário:', data);

        if (!data?.authenticated) {
          console.warn('[AUTH] Propriedade authenticated falsa.');
          router.push('/login');
          return;
        }

        await fetchCalls();
      } catch (err) {
        console.error('[ERROR] Falha na validação de auth:', err);
        router.push('/login');
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
  }, [API, router]);

  const { filteredCalls, stats, sdrSummary } = useMemo(() => {
    const filtered = calls
      .filter((call) => {
        const matchesPeriod = isWithinPeriod(call.analyzedAt, period);
        const hasValidNota =
          typeof call.nota_spin === 'number' && !isNaN(call.nota_spin);
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

    const stats = getGlobalStats(filtered);
    const sdrSummary = getSDRRanking(filtered);

    return { filteredCalls: filtered, stats, sdrSummary };
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
          <h1 className="text-2xl font-bold text-slate-900">
            Análises de Chamadas
          </h1>

          <p className="text-slate-400 text-sm">
            Feed cronológico das avaliações realizadas pela IA.
          </p>
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
              <SelectItem value="year">Ano atual</SelectItem>
              <SelectItem value="all">Todo histórico</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchCalls}
            disabled={isLoading}
            className="h-9 text-xs"
          >
            <RefreshCcw
              className={`w-3.5 h-3.5 mr-2 ${isLoading ? 'animate-spin' : ''}`}
            />
            Atualizar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-slate-100 shadow-none bg-white">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 bg-slate-50 rounded-lg">
              <TrendingUp className="w-5 h-5 text-slate-900" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Média SPIN
              </p>
              <h3 className="text-xl font-bold text-slate-900">
                {stats.avgSpin}
              </h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-100 shadow-none bg-white">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 bg-slate-50 rounded-lg">
              <PhoneCall className="w-5 h-5 text-slate-900" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Total Ligações
              </p>
              <h3 className="text-xl font-bold text-slate-900">
                {stats.totalCalls}
              </h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-100 shadow-none bg-white">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 bg-slate-50 rounded-lg">
              <Users className="w-5 h-5 text-slate-900" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                SDRs Ativos
              </p>
              <h3 className="text-xl font-bold text-slate-900">
                {stats.sdrCount}
              </h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-4">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
            Resumo por SDR
          </h4>

          <div className="space-y-2">
            {sdrSummary.length === 0 ? (
              <p className="text-[10px] text-slate-300 italic">
                Sem dados no período.
              </p>
            ) : (
              sdrSummary.slice(0, 5).map((sdr) => (
                <div
                  key={sdr.name}
                  className="p-3 bg-white border border-slate-50 rounded-lg flex justify-between items-center"
                >
                  <div className="max-w-[70%]">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {sdr.name}
                    </p>
                    <p className="text-[9px] text-slate-400 uppercase">
                      {sdr.count} calls
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900">
                      {sdr.avgSpin}
                    </p>
                    <p className="text-[8px] font-bold text-slate-300 uppercase">
                      SPIN
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="lg:col-span-3 space-y-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-300" />
            <Input
              placeholder="Filtrar por título ou SDR..."
              className="pl-9 bg-white border-slate-100 focus:border-slate-300 transition-all h-9 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-slate-200" />
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                Sincronizando análises...
              </p>
            </div>
          ) : error ? (
            <div className="p-8 border border-red-50 bg-red-50/20 rounded-xl text-center">
              <p className="text-sm text-red-600 font-medium">{error}</p>
              <Button
                variant="ghost"
                className="mt-4 text-xs"
                onClick={fetchCalls}
              >
                Tentar novamente
              </Button>
            </div>
          ) : filteredCalls.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
              <div className="p-4 bg-slate-50 rounded-full">
                <Inbox className="w-6 h-6 text-slate-200" />
              </div>

              <div className="space-y-1">
                <h2 className="text-sm font-bold text-slate-900">
                  Nenhuma chamada encontrada
                </h2>
                <p className="text-xs text-slate-400">
                  Tente ajustar o período ou o termo de busca.
                </p>
              </div>
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