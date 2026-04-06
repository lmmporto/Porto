"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Zap,
  Clock,
  Calendar,
  User,
  ShieldAlert,
  Trophy,
  Target,
  Lightbulb,
  FileText,
  Mic,
  Ear,
  HelpCircle,
  MessageSquare,
  MinusCircle,
  RefreshCw,
  SearchX,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { SDRCall, StatusFinal } from '@/types';
import { cn } from '@/lib/utils';

export default function CallDetailPage() {
  const params = useParams();
  const router = useRouter();

  const rawId = params?.id;
  const routeId = Array.isArray(rawId) ? rawId[0] : String(rawId ?? '');

  const [call, setCall] = useState<SDRCall | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCall = async () => {
      if (!routeId) return;
      
      try {
        setIsLoading(true);
        setError(null);

        // 🚩 BUSCA DIRETA: Garantindo o apontamento para o endpoint individual
        const res = await fetch(`/api/calls/${routeId}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Falha ao carregar a análise.');
        }

        setCall(data);
      } catch (err: any) {
        console.error("❌ [DETAIL ERROR]:", err);
        setError(err.message);
        // 🚩 COMENTADO PARA TESTE: Impede o redirecionamento fantasma
        // router.push('/dashboard'); 
      } finally {
        setIsLoading(false);
      }
    };

    loadCall();
  }, [routeId]);

  const formatDate = (dateInput: any) => {
    if (!dateInput) return 'Data não disponível';
    const seconds = dateInput?._seconds || dateInput?.seconds || (typeof dateInput === 'number' ? dateInput : null);
    let date = seconds ? new Date(seconds * 1000) : new Date(dateInput);
    if (isNaN(date.getTime())) return 'Data não disponível';

    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const getStatusConfig = (status: StatusFinal | "NAO_SE_APLICA") => {
    switch (status) {
      case 'APROVADO':
        return { icon: <CheckCircle2 className="w-4 h-4" />, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100', label: 'Aprovado' };
      case 'ATENCAO':
        return { icon: <AlertTriangle className="w-4 h-4" />, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', label: 'Atenção' };
      case 'REPROVADO':
        return { icon: <XCircle className="w-4 h-4" />, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100', label: 'Reprovado' };
      case 'NAO_SE_APLICA':
        return { icon: <MinusCircle className="w-4 h-4" />, color: 'text-slate-500', bg: 'bg-slate-100', border: 'border-slate-200', label: 'Descarte (Rota C)' };
      default:
        return { icon: <Zap className="w-4 h-4" />, color: 'text-slate-400', bg: 'bg-slate-50', border: 'border-slate-100', label: 'Pendente' };
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Sincronizando Análise...</p>
      </div>
    );
  }

  if (error || !call) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center space-y-6 px-6 max-w-md mx-auto">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
          <SearchX className="w-8 h-8 text-slate-300" />
        </div>
        <div className="space-y-2">
          <h2 className="text-lg font-bold text-slate-900">Análise não encontrada</h2>
          <p className="text-sm text-slate-500 leading-relaxed">{error || 'Os detalhes desta chamada não foram encontrados.'}</p>
        </div>
        <Button variant="outline" className="rounded-xl" onClick={() => router.push('/dashboard')}>
          <ArrowLeft className="w-3.5 h-3.5 mr-2" /> Voltar ao Dashboard
        </Button>
      </div>
    );
  }

  const status = getStatusConfig(call.status_final);
  const isRotaC = call.status_final === 'NAO_SE_APLICA';
  const durationMin = call.durationMs ? (call.durationMs / 60000).toFixed(1) : '0.0';

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20 px-4 md:px-0">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')} className="text-slate-400 hover:text-indigo-600">
            <ArrowLeft className="w-4 h-4 mr-2" /> Voltar para Performance Geral
          </Button>
          <Button variant="ghost" size="sm" onClick={() => window.location.reload()} className="text-slate-400 hover:text-indigo-600">
            <RefreshCw className="w-4 h-4 mr-2" /> Atualizar
          </Button>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4">
            <h1 className="text-2xl md:text-3xl font-headline font-bold text-slate-900">{call.title || 'Chamada sem Título'}</h1>
            <Badge className={cn('px-2.5 py-0.5 border shadow-none flex items-center gap-1.5', status.bg, status.color, status.border)}>
              {status.icon} <span className="font-bold uppercase tracking-wider text-[10px]">{status.label}</span>
            </Badge>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-slate-400 text-sm">
              <span className="flex items-center gap-2"><User className="w-4 h-4" /><span className="font-bold text-slate-700">{call.ownerName}</span></span>
              <span className="flex items-center gap-2 font-medium"><Clock className="w-4 h-4" /> {durationMin} min</span>
              <span className="flex items-center gap-2 font-medium"><Calendar className="w-4 h-4" /> {formatDate(call.callTimestamp || call.analyzedAt)}</span>
            </div>
          </div>
          <div className="bg-white border border-slate-100 rounded-2xl p-6 flex flex-col items-center justify-center min-w-[150px] shadow-sm">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Nota SPIN</span>
            <span className={cn("text-4xl font-headline font-black", isRotaC ? "text-slate-200" : "text-slate-900")}>
              {isRotaC ? "--" : (Number(call.nota_spin || 0).toFixed(1))}
            </span>
          </div>
        </div>
      </div>
      <Separator className="bg-slate-100" />
      {/* Restante do conteúdo de análise mantido... */}
    </div>
  );
}