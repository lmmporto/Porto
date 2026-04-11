"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, CheckCircle2, Zap, Clock, Calendar,
  User, Target, Trophy, Lightbulb, FileText, Mic, Ear,
  RefreshCw, ExternalLink, ArrowRight, Sparkles, 
  Target as DartIcon, Headphones
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from "@/components/ui/sheet";
import type { SDRCall } from '@/types';
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
      } finally { setIsLoading(false); }
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

  return (
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
                  <Clock className="w-4 h-4 text-indigo-500" /> {(call.durationMs / 60000).toFixed(1)} min
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <Button asChild className="bg-[#ff7a59] hover:bg-[#ff8f73] text-white rounded-2xl font-black text-[11px] uppercase tracking-widest h-14 px-8 shadow-xl shadow-orange-500/20 transition-all hover:scale-105">
              <a href={`https://app.hubspot.com/calls/${call.portalId || '1554114'}/review/${call.hubspotCallId || call.callId || call.id}`} target="_blank">
                <ExternalLink className="w-4 h-4 mr-2" /> Ver no HubSpot
              </a>
            </Button>
            <div className={cn("bg-slate-900 px-10 py-5 rounded-[2.5rem] border-2 text-center shadow-2xl transition-all min-w-[160px]", scoreStyle)}>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-1">Nota Spin</p>
              <p className="text-6xl font-black">{score.toFixed(1)}</p>
            </div>
          </div>
        </header>

        {/* GRID PRINCIPAL: VISÃO EXECUTIVA (7/5) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* RESUMO EXECUTIVO (ESSÊNCIA) */}
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
            {/* 🚩 O NOVO PLAYBOOK: Onde o "Ouro" (Escuta) mora agora */}
            <Sheet>
              <SheetTrigger asChild>
                <button className="flex-1 bg-orange-500/10 border-2 border-orange-500/30 hover:border-orange-500/60 p-8 rounded-[2.5rem] text-left transition-all group relative overflow-hidden shadow-2xl shadow-orange-500/5">
                  <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                    <DartIcon className="w-24 h-24 text-orange-500" />
                  </div>
                  <div className="relative z-10 space-y-4">
                    <div className="flex items-center gap-3 text-orange-400">
                      <Sparkles className="w-6 h-6 animate-pulse" />
                      <h4 className="text-[11px] font-black uppercase tracking-[0.3em]">Playbook de Coaching</h4>
                    </div>
                    <p className="text-2xl font-black text-white leading-tight tracking-tight">
                      Análise de Escuta & Oportunidades
                    </p>
                    <div className="flex items-center gap-2 text-orange-400 font-black text-[10px] uppercase tracking-widest pt-2">
                      Abrir Análise Detalhada <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                    </div>
                  </div>
                </button>
              </SheetTrigger>
              
              <SheetContent side="right" className="w-full sm:max-w-[650px] bg-[#020617] border-slate-800 text-slate-200 p-0 overflow-y-auto z-[100]">
                <div className="p-10 space-y-12">
                  <SheetHeader className="space-y-4">
                    <div className="p-3 bg-orange-500/10 rounded-2xl w-fit">
                      <Headphones className="w-8 h-8 text-orange-500" />
                    </div>
                    <SheetTitle className="text-3xl font-black text-white tracking-tight">Playbook de Coaching</SheetTitle>
                    <SheetDescription className="text-slate-400 font-medium text-base">
                      O "Ouro" da análise: timestamps e evidências reais da ligação.
                    </SheetDescription>
                  </SheetHeader>

                  {/* 🚩 O OURO: ANÁLISE DE ESCUTA EM DESTAQUE */}
                  <section className="space-y-4">
                    <h4 className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.3em] flex items-center gap-2">
                      <Ear className="w-4 h-4" /> Análise de Escuta Ativa
                    </h4>
                    <div className="bg-slate-900/80 border border-slate-800 p-8 rounded-[2rem] shadow-inner">
                      <p className="text-base text-slate-200 leading-relaxed whitespace-pre-wrap font-medium">
                        {call.analise_escuta}
                      </p>
                    </div>
                  </section>

                  {/* 🚩 PLAYBOOK DE OURO: Sugestões de Abordagem com Timestamps */}
                  <section className="space-y-6">
                    <h4 className="text-[11px] font-black text-orange-400 uppercase tracking-[0.3em]">
                      Sugestões de Abordagem
                    </h4>
                    <Accordion type="single" collapsible className="w-full space-y-4">
    {call.playbook_detalhado?.map((item: string, index: number) => {
      // 🚩 LÓGICA DE SEPARAÇÃO: Título antes do |, Conteúdo depois
    const [titulo, ...conteudo] = item.split('|');
    const aulaCompleta = conteudo.join('|').trim();

    return (
      <AccordionItem 
        key={index} 
        value={`item-${index}`} 
        className="border border-slate-800 rounded-2xl px-6 bg-slate-900/40 hover:bg-slate-900/60 transition-all"
      >
        <AccordionTrigger className="hover:no-underline py-6 group">
          <div className="flex items-center gap-4 text-left">
            <div className="bg-orange-500/10 p-2 rounded-lg group-data-[state=open]:bg-orange-500 group-data-[state=open]:text-slate-950 transition-colors">
              <ArrowRight className="w-4 h-4 text-orange-500 group-data-[state=open]:text-slate-950" />
            </div>
            {/* 🚩 TÍTULO: Curto e direto */}
            <span className="font-black text-slate-200 text-sm uppercase tracking-widest">
              {titulo.trim()}
            </span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="pb-8 pt-2 border-t border-slate-800/50 mt-2">
          <div className="pt-6">
            <div className="bg-orange-500/5 p-6 rounded-2xl border border-orange-500/10">
              <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest flex items-center gap-2 mb-3">
                <Zap className="w-3 h-3 fill-current" /> Coaching Operacional
              </span>
              {/* 🚩 AULA: O conteúdo completo */}
              <p className="text-sm text-orange-100/90 font-medium leading-relaxed whitespace-pre-wrap">
                {aulaCompleta || item}
              </p>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    );
  })}
</Accordion>
                  </section>
                </div>
              </SheetContent>
            </Sheet>

            {/* FOCO DE MELHORIA (RESUMIDO) */}
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

        {/* SEGUNDA CAMADA: DETALHES RÁPIDOS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="bg-slate-900/50 border border-slate-800 p-8 rounded-[2.5rem] space-y-6">
            <h4 className="text-[11px] font-black text-emerald-500 uppercase tracking-[0.3em] flex items-center gap-3">
              <Trophy className="w-5 h-5" /> Pontos Fortes
            </h4>
            <div className="space-y-4">
              {call.pontos_fortes?.map((p: string, i: number) => (
                <div key={i} className="flex gap-3 text-sm font-bold text-emerald-100/80 leading-snug">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" /> {p}
                </div>
              ))}
            </div>
          </Card>

          <Card className="bg-slate-900/50 border border-slate-800 p-8 rounded-[2.5rem] space-y-6">
            <h4 className="text-[11px] font-black text-rose-500 uppercase tracking-[0.3em] flex items-center gap-3">
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