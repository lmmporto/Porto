"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, CheckCircle2, Zap, Clock, Calendar,
  User, Target, Trophy, Lightbulb, FileText, Mic, Ear,
  RefreshCw, ExternalLink, ArrowRight, BarChart3, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
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
    <div className="fixed inset-0 z-[40] w-full h-full bg-[#020617] text-slate-200 overflow-y-auto p-6 lg:p-10">
      <div className="max-w-[1800px] mx-auto space-y-8">
        
        {/* HEADER COMPACTO */}
        <header className="flex flex-col lg:flex-row justify-between items-center gap-6 border-b border-slate-800/60 pb-8">
          <div className="flex items-center gap-6">
            <Button variant="ghost" onClick={() => router.back()} className="text-slate-500 hover:text-white"><ArrowLeft className="w-4 h-4" /></Button>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight">{call.title}</h1>
              <div className="flex gap-4 mt-2 text-xs font-bold text-slate-500 uppercase tracking-widest">
                <span className="flex items-center gap-2"><User className="w-3.5 h-3.5 text-indigo-500" /> {call.ownerName}</span>
                <span className="flex items-center gap-2"><Clock className="w-3.5 h-3.5 text-indigo-500" /> {(call.durationMs / 60000).toFixed(1)} min</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Button asChild className="bg-[#ff7a59] hover:bg-[#ff8f73] text-white rounded-xl font-black h-12 px-6 shadow-lg shadow-orange-500/20">
              <a href={`https://app.hubspot.com/calls/${call.portalId || '1554114'}/review/${call.hubspotCallId || call.callId}`} target="_blank">
                <ExternalLink className="w-4 h-4 mr-2" /> HubSpot
              </a>
            </Button>
            <div className={cn("bg-slate-900 px-8 py-3 rounded-2xl border-2 text-center", scoreStyle)}>
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Nota Spin</p>
              <p className="text-4xl font-black">{score.toFixed(1)}</p>
            </div>
          </div>
        </header>

        {/* GRID PRINCIPAL: 2 COLUNAS (70% Análise / 30% Coaching) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* COLUNA DA ESQUERDA: ANÁLISE DETALHADA */}
          <div className="lg:col-span-2 space-y-8">
            <Card className="bg-slate-900/40 border-slate-800 p-8 rounded-[2rem]">
              <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] flex items-center gap-2 mb-4"><FileText className="w-4 h-4" /> Resumo Executivo</h3>
              <p className="text-lg text-slate-200 leading-relaxed italic font-medium">"{call.resumo}"</p>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-slate-900/40 border-slate-800 p-6 rounded-2xl space-y-4">
                <h4 className="text-[10px] font-black text-sky-400 uppercase flex items-center gap-2"><Ear className="w-4 h-4" /> Análise de Escuta</h4>
                <p className="text-sm text-slate-400 leading-relaxed whitespace-pre-wrap">{call.analise_escuta}</p>
              </Card>
              <Card className="bg-slate-900/40 border-slate-800 p-6 rounded-2xl space-y-4">
                <h4 className="text-[10px] font-black text-rose-400 uppercase flex items-center gap-2"><Target className="w-4 h-4" /> Maior Dificuldade</h4>
                <p className="text-sm text-slate-400 leading-relaxed">{call.maior_dificuldade}</p>
              </Card>
            </div>

            <Card className="bg-emerald-500/5 border border-emerald-500/10 p-6 rounded-2xl">
              <h4 className="text-[10px] font-black text-emerald-500 uppercase flex items-center gap-2 mb-4"><Trophy className="w-4 h-4" /> Pontos Fortes</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {call.pontos_fortes?.map((p, i) => (
                  <div key={i} className="flex gap-2 text-xs font-bold text-emerald-100/80"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> {p}</div>
                ))}
              </div>
            </Card>
          </div>

          {/* COLUNA DA DIREITA: PLAYBOOK DE COACHING (O OURO SEMPRE VISÍVEL) */}
          <div className="space-y-6">
            <div className="bg-orange-500/10 border-2 border-orange-500/20 p-8 rounded-[2.5rem] shadow-xl">
              <div className="flex items-center gap-3 text-orange-400 mb-6">
                <Sparkles className="w-5 h-5" />
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em]">Playbook de Coaching</h4>
              </div>
              
              <Accordion type="single" collapsible className="space-y-4">
                {call.alertas?.map((alerta, i) => (
                  <AccordionItem key={i} value={`item-${i}`} className="border-b-0">
                    <AccordionTrigger className="bg-slate-950/50 border border-white/5 rounded-xl px-4 py-4 text-left text-sm font-bold text-orange-100 hover:no-underline hover:bg-slate-900 transition-all">
                      {alerta.substring(0, 50)}...
                    </AccordionTrigger>
                    <AccordionContent className="bg-slate-950/30 p-4 rounded-b-xl text-xs text-slate-300 leading-relaxed whitespace-pre-wrap border-x border-b border-white/5">
                      {alerta}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>

              <div className="mt-8 pt-6 border-t border-orange-500/10">
                <h4 className="text-[10px] font-black text-indigo-400 uppercase mb-3">Foco de Melhoria</h4>
                <p className="text-sm font-bold text-slate-200 leading-tight">{call.ponto_atencao}</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}