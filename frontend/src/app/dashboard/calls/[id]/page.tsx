"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, RefreshCw, SearchX, User, Clock, Calendar, Mic, ExternalLink, FileText, Ear, HelpCircle, MessageSquare, ShieldAlert, Target, Trophy, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { getInitials } from '@/lib/utils';

export default function CallDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [call, setCall] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCall = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/calls/${id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erro ao carregar');
        setCall(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    if (id) loadCall();
  }, [id]);

  if (isLoading) return <div className="flex flex-col items-center justify-center min-h-screen"><RefreshCw className="animate-spin" /></div>;
  if (error || !call) return <div className="text-center py-20"><SearchX className="mx-auto mb-4" /><h2>Análise não encontrada</h2><Button onClick={() => router.push('/dashboard')}>Voltar</Button></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 px-4">
      <Button variant="ghost" onClick={() => router.back()}><ArrowLeft className="mr-2 h-4 w-4" /> Voltar</Button>
      
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold">{call.title || 'Chamada'}</h1>
          <p className="text-slate-500">{call.ownerName} • {(call.durationMs / 60000).toFixed(1)} min</p>
        </div>
        <div className="text-right bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Nota SPIN</p>
          <p className="text-4xl font-black">{Number(call.nota_spin || 0).toFixed(1)}</p>
        </div>
      </div>

      <Separator />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section className="space-y-2">
          <h3 className="text-xs font-bold uppercase text-indigo-600">Resumo</h3>
          <Card className="bg-slate-50/50 border-none"><CardContent className="p-6 text-sm italic">"{call.resumo}"</CardContent></Card>
        </section>
        <section className="space-y-2">
          <h3 className="text-xs font-bold uppercase text-indigo-600">Análise de Escuta</h3>
          <Card className="bg-indigo-50/20 border-indigo-100"><CardContent className="p-6 text-sm">{call.analise_escuta || "Texto não disponível."}</CardContent></Card>
        </section>
      </div>

      {call.perguntas_sugeridas?.length > 0 && (
        <section className="bg-slate-900 p-8 rounded-3xl text-white">
          <h3 className="text-lg font-bold mb-4">Perguntas Sugeridas</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {call.perguntas_sugeridas.map((p: string, i: number) => (
              <div key={i} className="p-4 bg-white/5 rounded-xl text-sm">{p}</div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}