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
  SearchX
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

        const res = await fetch(`/api/calls/${encodeURIComponent(routeId)}`, {
          cache: 'no-store',
        });

        const data = await res.json();

        if (!res.ok) {
          // Se for 404 ou erro de cota, capturamos a mensagem vinda do Proxy
          throw new Error(data.debug || data.error || 'Não foi possível carregar esta análise.');
        }

        setCall(data);

      } catch (err: any) {
        console.error("Erro ao carregar chamada:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadCall();
  }, [routeId]);

  // Formatador Robusto para Datas do Firebase (seconds/nanoseconds)
  const formatDate = (dateInput: any) => {
    if (!dateInput) return 'Data não disponível';
    const seconds = dateInput?._seconds || dateInput?.seconds || (typeof dateInput === 'number' ? dateInput : null);
    
    let date: Date;
    if (seconds) {
      date = new Date(seconds * 1000);
    } else {
      date = new Date(dateInput);
    }
    
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
        return {
          icon: <CheckCircle2 className="w-4 h-4" />,
          color: 'text-green-600',
          bg: 'bg-green-50',
          border: 'border-green-100',
          label: 'Aprovado'
        };
      case 'ATENCAO':
        return {
          icon: <AlertTriangle className="w-4 h-4" />,
          color: 'text-amber-600',
          bg: 'bg-amber-50',
          border: 'border-amber-100',
          label: 'Atenção'
        };
      case 'REPROVADO':
        return {
          icon: <XCircle className="w-4 h-4" />,
          color: 'text-red-600',
          bg: 'bg-red-50',
          border: 'border-red-100',
          label: 'Reprovado'
        };
      case 'NAO_SE_APLICA':
        return {
          icon: <MinusCircle className="w-4 h-4" />,
          color: 'text-slate-500',
          bg: 'bg-slate-100',
          border: 'border-slate-200',
          label: 'Descarte (Rota C)'
        };
      default:
        return {
          icon: <Zap className="w-4 h-4" />,
          color: 'text-slate-400',
          bg: 'bg-slate-50',
          border: 'border-slate-100',
          label: 'Pendente'
        };
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">
          Sincronizando Análise...
        </p>
      </div>
    );
  }

  // 🚩 TRATAMENTO DE ERRO AMIGÁVEL
  if (error || !call) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center space-y-6 px-6 max-w-md mx-auto">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
          <SearchX className="w-8 h-8 text-slate-300" />
        </div>
        <div className="space-y-2">
          <h2 className="text-lg font-bold text-slate-900">Análise não encontrada</h2>
          <p className="text-sm text-slate-500 leading-relaxed">
            {error || 'Os detalhes desta chamada ainda não foram processados ou o registro foi removido.'}
          </p>
        </div>
        <Button 
          variant="outline" 
          className="rounded-xl border-slate-200 font-bold uppercase text-[10px] tracking-widest"
          onClick={() => router.push('/dashboard')}
        >
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
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/dashboard')}
          className="w-fit -ml-2 text-slate-400 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para Performance Geral
        </Button>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-headline font-bold text-slate-900 tracking-tight">
                {call.title || 'Chamada sem Título'}
              </h1>

              <Badge
                className={cn(
                  'px-2.5 py-0.5 border shadow-none flex items-center gap-1.5',
                  status.bg,
                  status.color,
                  status.border
                )}
              >
                {status.icon}
                <span className="font-bold uppercase tracking-wider text-[10px]">
                  {status.label}
                </span>
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-slate-400 text-sm">
              <span className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span className="font-bold text-slate-700">{call.ownerName}</span>
              </span>
              <span className="flex items-center gap-2 font-medium">
                <Clock className="w-4 h-4" /> {durationMin} min
              </span>
              <span className="flex items-center gap-2 font-medium">
                <Calendar className="w-4 h-4" /> {formatDate(call.analyzedAt || call.updatedAt)}
              </span>
            </div>

            {call.recordingUrl && (
              <div className="pt-2">
                <Button 
                  asChild 
                  variant="outline" 
                  size="sm" 
                  className="border-indigo-100 bg-indigo-50/30 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all active:scale-95 h-9 rounded-xl"
                >
                  <a href={call.recordingUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 font-bold uppercase tracking-wider text-[9px]">
                    <Mic className="w-3.5 h-3.5" /> Ouvir no HubSpot
                  </a>
                </Button>
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-100 rounded-2xl p-6 flex flex-col items-center justify-center min-w-[150px] shadow-sm">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">
              Nota SPIN
            </span>
            <span className={cn(
              "text-4xl font-headline font-black",
              isRotaC ? "text-slate-200" : "text-slate-900"
            )}>
              {isRotaC ? "--" : (typeof call.nota_spin === 'number' ? call.nota_spin.toFixed(1) : '0.0')}
            </span>
            <span className="text-[10px] text-slate-400 font-bold mt-1 uppercase">
              {isRotaC ? "Descarte" : "Métrica Técnica"}
            </span>
          </div>
        </div>
      </div>

      <Separator className="bg-slate-100" />

      <div className="grid grid-cols-1 gap-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-slate-900">
              <FileText className="w-4 h-4 text-indigo-500" />
              <h3 className="text-xs font-black uppercase tracking-widest">Resumo da Análise</h3>
            </div>
            <Card className="border-slate-100 shadow-none bg-slate-50/50 rounded-2xl">
              <CardContent className="p-6">
                <p className="text-slate-600 leading-relaxed text-sm italic">"{call.resumo}"</p>
              </CardContent>
            </Card>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2 text-indigo-600">
              <Ear className="w-4 h-4" />
              <h3 className="text-xs font-black uppercase tracking-widest">Análise de Escuta</h3>
            </div>
            <Card className="border-indigo-100 shadow-none bg-indigo-50/20 rounded-2xl">
              <CardContent className="p-6">
                <p className="text-slate-700 leading-relaxed text-sm">
                  {call.analise_escuta || "Análise comportamental não disponível para esta chamada."}
                </p>
              </CardContent>
            </Card>
          </section>
        </div>

        {call.perguntas_sugeridas && call.perguntas_sugeridas.length > 0 && (
          <section className="space-y-4 bg-slate-900 p-8 rounded-3xl text-white shadow-xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500 rounded-xl">
                <HelpCircle className="w-5 h-5 text-slate-900" />
              </div>
              <div>
                <h3 className="text-lg font-bold tracking-tight">Perguntas de Impacto Sugeridas</h3>
                <p className="text-slate-400 text-xs mt-1 font-medium">Use estas perguntas no próximo contato com o lead</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
              {call.perguntas_sugeridas.map((pergunta, i) => (
                <div key={i} className="flex gap-3 p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-colors">
                  <MessageSquare className="w-4 h-4 text-amber-500 shrink-0 mt-1" />
                  <p className="text-sm font-medium text-slate-200 leading-snug">{pergunta}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-rose-600">
              <ShieldAlert className="w-4 h-4" />
              <h3 className="text-xs font-black uppercase tracking-widest">Alertas Críticos</h3>
            </div>
            <div className="space-y-3">
              {call.alertas && call.alertas.length > 0 ? (
                call.alertas.map((alerta, i) => (
                  <div key={i} className="flex items-start gap-3 p-4 bg-rose-50/50 border border-rose-100 rounded-xl text-rose-800 text-xs font-medium">
                    <XCircle className="w-4 h-4 shrink-0 mt-0.5 opacity-50" />
                    {alerta}
                  </div>
                ))
              ) : (
                <p className="text-slate-400 text-xs italic">Nenhum alerta crítico identificado.</p>
              )}
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2 text-slate-900">
              <Target className="w-4 h-4 text-indigo-500" />
              <h3 className="text-xs font-black uppercase tracking-widest">Maior Dificuldade</h3>
            </div>
            <Card className="border-slate-100 shadow-none rounded-2xl">
              <CardContent className="p-6">
                <p className="text-slate-600 text-sm leading-relaxed font-medium">
                  {call.maior_dificuldade || 'Não identificada especificamente.'}
                </p>
              </CardContent>
            </Card>
          </section>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-emerald-600">
              <Trophy className="w-4 h-4" />
              <h3 className="text-xs font-black uppercase tracking-widest">Pontos Fortes</h3>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {Array.isArray(call.pontos_fortes) && call.pontos_fortes.length > 0 ? (
                call.pontos_fortes.map((p, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl text-emerald-800 text-xs font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    {p}
                  </div>
                ))
              ) : (
                <p className="text-slate-400 text-xs italic">Nenhum ponto forte destacado.</p>
              )}
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2 text-slate-900">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              <h3 className="text-xs font-black uppercase tracking-widest">Foco de Melhoria</h3>
            </div>
            <div className="p-6 border-l-4 border-slate-900 bg-slate-50 rounded-r-2xl">
              <p className="text-slate-700 text-sm font-bold leading-relaxed">
                {call.ponto_atencao}
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}