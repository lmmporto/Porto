"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, CheckCircle2, Zap, Clock, Calendar,
  User, Target, Trophy, Lightbulb, FileText, Mic, Ear,
  RefreshCw, ExternalLink, ArrowRight, BarChart3, 
  Target as DartIcon, Sparkles, Headphones
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from '@/lib/utils';

export default function CallDetailPage() {
  const params = useParams();
  const router = useRouter();
  const routeId = String(params?.id ?? '');
  const [call, setCall] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadCall = async () => {
      if (!routeId) return;
      try {
        const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || 'https://porto-58em.onrender.com').replace(/\/$/, '');
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
  const scoreStyle = score >= 8 ? "text-emerald-400 border-emerald-500/40 shadow-emerald-500/10" : score >= 5 ? "text-sky-400 border-sky-500/40 shadow-sky-500/10" : "text-orange-400 border-orange-500/40 shadow-orange-500/10";

  const hubspotReviewUrl = call.hubspotCallId || call.callId 
    ? `https://app.hubspot.com/calls/${call.portalId || '1554114'}/review/${call.hubspotCallId || call.callId}`
    : null;

  return (
    <div className="fixed inset-0 z-[50] w-full h-full bg-[#020617] text-slate-200 overflow-y-auto selection:bg-indigo-500/30">
      <div className="max-w-[1500px] mx-auto p-6 md:p-10 space-y-8">
        
        {/* 1. HEADER EXECUTIVO COMPACTO */}
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 border-b border-slate-800/60 pb-8">
          <div className="space-y-4 flex-1">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => router.back()} className="h-8 text-slate-500 hover:text-white p-0 transition-colors">
                <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
              </Button>
              <div className="flex items-center gap-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-900/80 px-3 py-1 rounded-full border border-slate-800">
                <Calendar className="w-3.5 h-3.5" /> {new Date(call.callTimestamp?._seconds * 1000 || call.callTimestamp).toLocaleDateString('pt-BR')}
                <Separator orientation="vertical" className="h-3 bg-slate-700 mx-1" />
                <Clock className="w-3.5 h-3.5" /> {(call.durationMs / 60000).toFixed(1)} min
              </div>
            </div>
            
            <div className="space-y-1">
              <h1 className="text-3xl font-black text-white tracking-tight leading-tight">{call.title}</h1>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-indigo-500/10 px-2 py-1 rounded-lg border border-indigo-500/20">
                  <User className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-xs font-black text-slate-200 uppercase tracking-wider">{call.ownerName}</span>
                </div>
                <p className="text-slate-400 font-medium italic text-sm border-l border-slate-800 pl-4 line-clamp-1">
                  {call.ponto_atencao}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-5">
            <div className="flex flex-col items-end gap-2">
              <Badge className={cn("px-3 py-1 border-0 font-black uppercase text-[10px] tracking-widest", 
                call.status_final === 'APROVADO' ? "bg-emerald-500/10 text-emerald-400" : "bg-orange-500/10 text-orange-400")}>
                {call.status_final}
              </Badge>
              {hubspotReviewUrl && (
                <Button asChild className="bg-[#ff7a59] hover:bg-[#ff8f73] text-white rounded-xl h-9 px-4 text-[10px] font-black uppercase tracking-widest transition-all">
                  <a href={hubspotReviewUrl} target="_blank" rel="noopener noreferrer"><ExternalLink className="w-3.5 h-3.5 mr-2" /> HubSpot</a>
                </Button>
              )}
            </div>
            <div className={cn("bg-slate-900 px-8 py-4 rounded-3xl border-2 text-center shadow-2xl transition-all", scoreStyle)}>
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mb-1">Nota Spin</p>
              <p className="text-5xl font-black tracking-tighter">{score.toFixed(1)}</p>
            </div>
          </div>
        </header>

        {/* 2. PRIMEIRA DOBRA: VISÃO EXECUTIVA (7/5 Grid) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Card Principal: Resumo */}
          <Card className="lg:col-span-7 bg-slate-900/40 border-slate-800 shadow-2xl rounded-[2rem] overflow-hidden">
            <CardContent className="p-8 space-y-6">
              <div className="flex items-center gap-3 text-indigo-400">
                <BarChart3 className="w-5 h-5" />
                <h3 className="text-[11px] font-black uppercase tracking-[0.2em]">Resumo Executivo</h3>
              </div>
              <p className="text-lg md:text-xl leading-relaxed text-slate-200 font-medium italic">
                "{call.resumo}"
              </p>
            </CardContent>
          </Card>

          {/* Coluna Lateral: Dificuldade e Ação */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <Card className="bg-orange-500/5 border-orange-500/10 rounded-[1.5rem]">
              <CardContent className="p-6 flex gap-4 items-start">
                <div className="p-3 bg-orange-500/10 rounded-2xl text-orange-500">
                  <Target className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-[10px] font-black text-orange-500/60 uppercase tracking-widest">Maior Dificuldade</h4>
                  <p className="text-base font-bold text-slate-200 leading-tight">{call.maior_dificuldade}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-indigo-500/5 border-indigo-500/10 rounded-[1.5rem]">
              <CardContent className="p-6 flex gap-4 items-start">
                <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-400">
                  <Zap className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-[10px] font-black text-indigo-400/60 uppercase tracking-widest">Ação Recomendada</h4>
                  <p className="text-base font-bold text-slate-200 leading-tight">{call.ponto_atencao}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 3. SEGUNDA CAMADA: VISÃO GERENCIAL */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <section className="bg-emerald-500/5 border border-emerald-500/10 p-8 rounded-[2rem] space-y-6">
            <h3 className="text-[11px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-3">
              <Trophy className="w-5 h-5" /> Principais Acertos
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {call.pontos_fortes?.map((p: string, i: number) => (
                <div key={i} className="flex gap-3 text-sm font-bold text-emerald-100/80 leading-snug">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" /> {p}
                </div>
              ))}
            </div>
          </section>

          <section className="bg-slate-900/40 border border-slate-800 p-8 rounded-[2rem] space-y-6 lg:col-span-2">
            <h3 className="text-[11px] font-black text-sky-400 uppercase tracking-widest flex items-center gap-3">
              <Ear className="w-5 h-5" /> Análise de Escuta
            </h3>
            <p className="text-base text-slate-400 leading-relaxed font-medium whitespace-pre-wrap">
              {call.analise_escuta}
            </p>
          </section>
        </div>

        {/* 4. TERCEIRA CAMADA: COACHING OPERACIONAL (ACCORDION) */}
        <section className="space-y-6 pt-4">
          <div className="flex items-center gap-4 px-2">
            <div className="p-3 bg-orange-500 rounded-2xl shadow-lg shadow-orange-500/20">
              <DartIcon className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-white tracking-tight">Oportunidades de Abordagem</h3>
              <p className="text-orange-500/60 text-[10px] font-black uppercase tracking-[0.2em]">Coaching Detalhado por Timestamp</p>
            </div>
          </div>

          <Accordion type="single" collapsible className="w-full space-y-4">
            {(call.playbook_detalhado || call.alertas)?.map((item: string, index: number) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="border border-slate-800 rounded-[1.5rem] px-8 bg-slate-900/20 hover:bg-slate-900/40 transition-all overflow-hidden"
              >
                <AccordionTrigger className="hover:no-underline py-7 group">
                  <div className="flex items-center gap-5 text-left">
                    <div className="bg-orange-500/10 p-2 rounded-lg group-data-[state=open]:bg-orange-500 group-data-[state=open]:text-slate-950 transition-colors">
                      <ArrowRight className="w-5 h-5 text-orange-500 group-data-[state=open]:text-slate-950" />
                    </div>
                    <span className="font-bold text-slate-200 text-lg md:text-xl leading-tight tracking-tight">
                      {item.split('|')[0].trim()}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-10 pt-2">
                  <div className="border-t border-slate-800/50 pt-8">
                    <div className="bg-orange-500/5 p-8 rounded-3xl border border-orange-500/10">
                      <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                        <Zap className="w-3 h-3 fill-current" /> Recomendação de IA
                      </span>
                      <p className="text-base text-orange-100/90 font-medium leading-relaxed whitespace-pre-wrap">
                        {item.includes('|') ? item.split('|')[1].trim() : item}
                      </p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

      </div>
    </div>
  );
}