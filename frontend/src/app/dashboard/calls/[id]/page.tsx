"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, CheckCircle2, Zap, Clock, Calendar,
  User, Target, Trophy, Lightbulb, FileText, Mic, Ear,
  RefreshCw, ExternalLink, ArrowRight, BarChart3, 
  Target as DartIcon, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription,
} from "@/components/ui/sheet";
import type { SDRCall } from '@/types';
import { cn } from '@/lib/utils';

export default function CallDetailPage() {
  const params = useParams();
  const router = useRouter();
  const routeId = String(params?.id ?? '');
  const [call, setCall] = useState<SDRCall | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadCall = async () => {
      if (!routeId) return;
      try {
        const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(/\/$/, '');
        const res = await fetch(`${baseUrl}/api/calls/${routeId}`, { credentials: 'include' });
        const data = await res.json();
        setCall(data);
      } finally {
        setIsLoading(false);
      }
    };
    loadCall();
  }, [routeId]);

  if (isLoading) return (
    <div className="fixed inset-0 z-[100] bg-[#020617] flex flex-col items-center justify-center gap-4">
      <RefreshCw className="w-10 h-10 animate-spin text-indigo-500" />
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Sincronizando Cockpit...</p>
    </div>
  );

  if (!call) return null;

  const score = Number(call.nota_spin || 0);
  const scoreStyle = score >= 8 
    ? { color: 'text-emerald-400', border: 'border-emerald-500/40', shadow: 'shadow-emerald-500/10' }
    : score >= 5 
    ? { color: 'text-sky-400', border: 'border-sky-500/40', shadow: 'shadow-sky-500/10' }
    : { color: 'text-orange-400', border: 'border-orange-500/40', shadow: 'shadow-orange-500/10' };

  const hubspotReviewUrl = call.hubspotCallId || call.callId 
    ? `https://app.hubspot.com/calls/${call.portalId || '1554114'}/review/${call.hubspotCallId || call.callId}`
    : null;

  return (
    /* MODO FOCO: Overlay Fullscreen para anular sidebar branca */
    <div className="fixed inset-0 z-[40] w-full h-full bg-[#020617] text-slate-200 overflow-y-auto selection:bg-indigo-500/30">
      <div className="max-w-[1600px] mx-auto p-6 md:p-12 space-y-10">
        
        {/* HEADER EXECUTIVO */}
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8 border-b border-slate-800/60 pb-10">
          <div className="space-y-6 flex-1">
            <Button variant="ghost" onClick={() => router.back()} className="h-8 text-slate-500 hover:text-white p-0 transition-colors">
              <ArrowLeft className="w-4 h-4 mr-2" /> Voltar para a listagem
            </Button>
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-none">{call.title}</h1>
              <div className="flex flex-wrap gap-6 items-center">
                <div className="flex items-center gap-2 bg-slate-900/80 px-4 py-2 rounded-xl border border-slate-800">
                  <User className="w-4 h-4 text-indigo-400" />
                  <span className="text-sm font-black text-slate-200 uppercase tracking-wider">{call.ownerName}</span>
                </div>
                <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
                  <Clock className="w-4 h-4" /> {(call.durationMs / 60000).toFixed(1)} min
                </div>
                <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
                  <Calendar className="w-4 h-4" /> {new Date(call.callTimestamp?._seconds * 1000 || call.analyzedAt).toLocaleDateString('pt-BR')}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end gap-3">
              {hubspotReviewUrl && (
                <Button asChild className="bg-[#ff7a59] hover:bg-[#ff8f73] text-white rounded-2xl font-black text-[11px] uppercase tracking-widest h-14 px-8 shadow-xl shadow-orange-500/20 transition-all hover:scale-105">
                  <a href={hubspotReviewUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-2" /> Ver no HubSpot
                  </a>
                </Button>
              )}
              <Badge className={cn("px-4 py-1 border-0 font-black uppercase text-[10px] tracking-[0.2em]", 
                call.status_final === 'APROVADO' ? "bg-emerald-500/10 text-emerald-400" : "bg-orange-500/10 text-orange-400")}>
                {call.status_final}
              </Badge>
            </div>
            <div className={cn("bg-slate-900 px-10 py-5 rounded-[2.5rem] border-2 text-center shadow-2xl transition-all min-w-[160px]", scoreStyle.border, scoreStyle.shadow)}>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-1">Nota Spin</p>
              <p className={cn("text-6xl font-black", scoreStyle.color)}>{score.toFixed(1)}</p>
            </div>
          </div>
        </header>

        {/* PRIMEIRA DOBRA: VISÃO EXECUTIVA (7/5) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <Card className="lg:col-span-7 bg-slate-900 border-slate-800 shadow-xl overflow-hidden flex flex-col">
            <div className="h-1.5 w-full bg-indigo-500" />
            <CardContent className="p-10 space-y-6 flex-1">
              <div className="flex items-center gap-3 text-indigo-400">
                <FileText className="w-6 h-6" />
                <h3 className="text-[11px] font-black uppercase tracking-[0.3em]">Resumo Executivo</h3>
              </div>
              <p className="text-xl md:text-2xl leading-relaxed text-slate-200 font-medium italic">
                "{call.resumo}"
              </p>
            </CardContent>
          </Card>

          <div className="lg:col-span-5 flex flex-col gap-6">
            {/* CARD GATILHO PARA O PLAYBOOK DE COACHING */}
            <Sheet>
              <SheetTrigger asChild>
                <button className="flex-1 bg-orange-500/10 border-2 border-orange-500/30 hover:border-orange-500/60 p-8 rounded-[2.5rem] text-left transition-all group relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                    <DartIcon className="w-24 h-24 text-orange-500" />
                  </div>
                  <div className="relative z-10 space-y-4">
                    <div className="flex items-center gap-3 text-orange-400">
                      <Sparkles className="w-6 h-6 animate-pulse" />
                      <h4 className="text-[11px] font-black uppercase tracking-[0.3em]">Sugestão de Abordagem</h4>
                    </div>
                    <p className="text-2xl font-black text-white leading-tight tracking-tight">
                      {call.alertas?.length || 0} Oportunidades de Evolução Identificadas
                    </p>
                    <div className="flex items-center gap-2 text-orange-400 font-black text-[10px] uppercase tracking-widest pt-2">
                      Abrir Playbook Completo <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                    </div>
                  </div>
                </button>
              </SheetTrigger>
              
              <SheetContent side="right" className="w-full sm:max-w-[600px] bg-[#020617] border-slate-800 text-slate-200 p-0 overflow-y-auto z-[100]">
                <div className="p-10 space-y-10">
                  <SheetHeader className="space-y-4">
                    <div className="p-3 bg-orange-500/10 rounded-2xl w-fit">
                      <DartIcon className="w-8 h-8 text-orange-500" />
                    </div>
                    <SheetTitle className="text-3xl font-black text-white tracking-tight">Playbook de Coaching</SheetTitle>
                    <SheetDescription className="text-slate-400 font-medium text-base">
                      Direções práticas baseadas na análise de IA para elevar sua conversão.
                    </SheetDescription>
                  </SheetHeader>

                  <Accordion type="single" collapsible className="w-full space-y-6">
                    {call.alertas?.map((alerta, index) => (
                      <AccordionItem key={index} value={`item-${index}`} className="border border-slate-800 rounded-3xl px-6 bg-slate-900/40 overflow-hidden">
                        <AccordionTrigger className="hover:no-underline py-8 group">
                          <div className="flex items-center gap-5 text-left">
                            <div className="p-2 bg-orange-500/10 rounded-lg text-orange-500">
                              <ArrowRight className="w-4 h-4" />
                            </div>
                            <span className="font-bold text-slate-100 text-lg md:text-xl leading-snug tracking-tight">
                              {alerta}
                            </span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pb-8 pt-2 border-t border-slate-800/50 mt-2">
                          <div className="pt-6 space-y-6">
                            <div className="space-y-2">
                              <span className="text-[10px] font-black text-orange-500/70 uppercase tracking-widest">Direção Recomendada</span>
                              <p className="text-base text-slate-300 leading-relaxed">
                                Esta abordagem visa contornar a resistência identificada e acelerar o avanço para a próxima etapa do funil.
                              </p>
                            </div>
                            <div className="bg-orange-500/5 p-6 rounded-2xl border border-orange-500/10">
                              <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                                <Zap className="w-3 h-3" /> Aplicação Prática
                              </span>
                              <p className="text-sm text-orange-100/90 font-bold italic leading-relaxed">
                                Utilize esta sugestão na próxima interação para validar a dor e acelerar o ciclo de vendas.
                              </p>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              </SheetContent>
            </Sheet>

            <Card className="bg-indigo-500/5 border border-indigo-500/20 shadow-lg flex-1">
              <CardContent className="p-8 flex gap-5 items-start">
                <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400">
                  <Zap className="w-6 h-6" />
                </div>
                <div className="space-y-2">
                  <h4 className="text-[11px] font-black text-indigo-400/70 uppercase tracking-[0.3em]">Foco de Melhoria</h4>
                  <p className="text-xl font-bold text-slate-200 leading-tight">{call.ponto_atencao}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* SEGUNDA CAMADA: VISÃO GERENCIAL (3 COLUNAS) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="bg-slate-900/50 border border-slate-800 p-8 rounded-[2.5rem] space-y-6">
            <h4 className="text-[11px] font-black text-emerald-500 uppercase tracking-[0.3em] flex items-center gap-3">
              <Trophy className="w-5 h-5" /> Pontos Fortes
            </h4>
            <div className="space-y-4">
              {call.pontos_fortes?.map((p, i) => (
                <div key={i} className="flex gap-3 text-sm font-bold text-emerald-100/80 leading-snug">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" /> {p}
                </div>
              ))}
            </div>
          </Card>

          <Card className="bg-slate-900/50 border border-slate-800 p-8 rounded-[2.5rem] space-y-6">
            <h4 className="text-[11px] font-black text-sky-400 uppercase tracking-[0.3em] flex items-center gap-3">
              <Ear className="w-5 h-5" /> Análise de Escuta
            </h4>
            <p className="text-base text-slate-400 leading-relaxed font-medium">
              {call.analise_escuta}
            </p>
          </Card>

          <Card className="bg-slate-900/50 border border-slate-800 p-8 rounded-[2.5rem] space-y-6">
            <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-3">
              <Target className="w-5 h-5" /> Maior Dificuldade
            </h4>
            <p className="text-base text-slate-400 leading-relaxed font-medium">
              {call.maior_dificuldade}
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}