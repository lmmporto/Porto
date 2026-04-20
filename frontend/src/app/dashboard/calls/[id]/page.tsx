"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { Lightbulb, TrendingDown, TrendingUp, CheckCircle, AlertTriangle, MessageSquareText } from "lucide-react";

export default function CallDetailPage() {
  const { id } = useParams();
  const [call, setCall] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      setLoading(true);
      const callRef = doc(db, "calls_analysis", id as string);
      
      const unsubscribe = onSnapshot(callRef, (docSnap) => {
        if (docSnap.exists()) {
          setCall({ id: docSnap.id, ...docSnap.data() });
        } else {
          console.log("Documento não encontrado no Firestore.");
          setCall(null);
        }
        setLoading(false);
      });

      // Cleanup da subscrição ao desmontar o componente
      return () => unsubscribe();
    }
  }, [id]);

  if (loading) return <div className="p-8 text-slate-500 font-headline">Carregando análise estratégica...</div>;
  if (!call) return <div className="p-8 text-error font-headline">Análise da chamada não encontrada.</div>;

  const insightsEstrategicos = Array.isArray(call.insights_estrategicos) ? call.insights_estrategicos : [];
  const playbookDetalhado = Array.isArray(call.playbook_detalhado) ? call.playbook_detalhado : [];
  // TAREFA 3: Suporta array ou string legada
  const maiorDificuldade = Array.isArray(call.maior_dificuldade)
    ? call.maior_dificuldade
    : (call.maior_dificuldade ? [call.maior_dificuldade] : []);

  // Função para formatar itens do playbook (lida com strings e objetos)
  const formatPlaybookItem = (item: string | any) => {
    if (typeof item === 'string') {
      const timestampMatch = item.match(/^\[(\d{2}:\d{2})\]/);
      const timestamp = timestampMatch ? timestampMatch[1] : "00:00";
      const content = item.replace(/^\[\d{2}:\d{2}\]\s*/, '');
      const mentorSplit = content.split('| Mentor: ');
      const fala_lead = mentorSplit[0].replace("Lead disse: ", "").trim();
      const mentorFeedback = mentorSplit[1] ? mentorSplit[1].trim() : "N/A";

      const diagnosisMatch = mentorFeedback.match(/^\[(.*?)\]:\s*(.*)/);
      const diagnostico = diagnosisMatch ? diagnosisMatch[1] : "N/A";
      const recomendacao = diagnosisMatch ? diagnosisMatch[2] : mentorFeedback;

      return { timestamp, fala_lead, diagnostico, recomendacao };
    }
    // Se já for um objeto, retorna como está
    return item;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Header com Nota Real e Metadados */}
      <section className="glass-card rounded-xl p-8 flex flex-col md:flex-row justify-between items-start gap-8 relative overflow-hidden">
        <div className="flex gap-8 items-center z-10">
          <div className="w-20 h-20 rounded-full bg-surface-dim border-4 border-white/5 flex items-center justify-center">
            <span className={cn(
              "text-3xl font-black font-headline",
              call.nota_spin >= 7 ? "text-secondary" : "text-error"
            )}>
              {call.nota_spin?.toFixed(1) || "0.0"}
            </span>
          </div>
          <div>
            <h2 className="text-2xl font-bold font-headline text-white">{call.nome_do_lead || call.clientName || "Lead Nibo"}</h2>
            <div className="flex gap-2 mt-2">
                {call.produto_principal && <span className="bg-primary/10 text-primary text-[10px] font-bold px-3 py-1 rounded-full uppercase">{call.produto_principal}</span>}
                {call.rota && <span className="bg-secondary/10 text-secondary text-[10px] font-bold px-3 py-1 rounded-full uppercase">Rota {call.rota}</span>}
            </div>
          </div>
        </div>
      </section>

      {/* Insights Estratégicos Dinâmicos */}
      {insightsEstrategicos.length > 0 && (
        <section className="grid md:grid-cols-3 gap-6">
          {insightsEstrategicos.map((insight: any, idx: number) => (
            <div key={idx} className="glass-card p-6 rounded-xl border-t-2" style={{ borderTopColor: insight.type === 'positive' ? '#4edea3' : '#ffb4ab' }}>
              <p className="label-elite mb-2">{insight.label}</p>
              <p className="text-2xl font-black font-headline">{insight.value}</p>
            </div>
          ))}
        </section>
      )}

      {/* Resumo Executivo */}
      <section className="glass-card p-8 rounded-xl">
        <h3 className="label-elite mb-4">Resumo Executivo</h3>
        <p className="text-lg text-on-surface-variant font-medium leading-relaxed">
          {call.resumo || "Resumo não disponível para esta chamada."}
        </p>
      </section>

      {/* Diagnóstico Adicional */}
      <section className="grid md:grid-cols-2 gap-6">
        <div className="glass-card p-6 rounded-xl border-l-4 border-error">
          <h3 className="label-elite mb-4 flex items-center gap-2"><AlertTriangle size={16} className="text-error" /> Maior Dificuldade</h3>
          {/* TAREFA 3: Mapeamento da lista de dificuldades */}
          {maiorDificuldade.length > 0 ? (
            <ul className="space-y-2">
              {maiorDificuldade.map((item: string, idx: number) => (
                <li key={idx} className="text-sm text-on-surface-variant flex items-center gap-2">
                  <AlertTriangle size={14} className="text-error shrink-0" /> {item}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-on-surface-variant leading-relaxed">N/A</p>
          )}
        </div>
        <div className="glass-card p-6 rounded-xl border-l-4 border-primary">
          <h3 className="label-elite mb-4 flex items-center gap-2"><CheckCircle size={16} className="text-primary" /> Análise de Escuta</h3>
          <p className="text-on-surface-variant leading-relaxed">{call.analise_escuta || "N/A"}</p>
        </div>
      </section>

      {/* Playbook Detalhado (Accordion) */}
      {playbookDetalhado.length > 0 && (
        <section className="space-y-4">
          <h3 className="label-elite">Playbook de Coaching</h3>
          <div className="space-y-6">
            {Array.isArray(call.playbook_detalhado) && call.playbook_detalhado.map((item: any, index: number) => (
              <div key={index} className="rounded-lg bg-white/5 p-4">
                <div className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                  {item.timestamp || 'N/A'}
                </div>
                <div className="mt-2 font-semibold text-white">
                  {item.diagnostico || 'Diagnóstico não disponível'}
                </div>
                <p className="mt-1 text-sm text-gray-400">
                  {item.recomendacao || 'Recomendação não disponível'}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}