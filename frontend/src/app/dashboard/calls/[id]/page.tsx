"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Lightbulb } from 'lucide-react'; // Importar ícone de lâmpada
import { cn } from "@/lib/utils";
import { TrendingDown, TrendingUp, CheckCircle, AlertTriangle, MessageSquareText } from "lucide-react";

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

  const playbookData = call.playbook_detalhado || call.analysisResult?.playbook_detalhado; // Fallback de dados

  const formatPlaybookItem = (itemRaw: any) => {
    if (typeof itemRaw === 'string') {
      // Caso seja uma string antiga, tentar extrair informações básicas
      return {
        timestamp: 'N/A',
        diagnostico: itemRaw.length > 50 ? itemRaw.substring(0, 50) + '...' : itemRaw,
        fala_lead: 'Contexto não disponível (formato antigo)',
        recomendacao: itemRaw, // Usar a string como recomendação
      };
    }
    return itemRaw; // Já é um objeto no formato esperado
  };

  // Certifique-se que playbookData é um array para o map
  const playbookArray = Array.isArray(playbookData) ? playbookData : (playbookData ? [playbookData] : []);

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
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 w-full">
            <h1 className="text-[34px] font-semibold tracking-[-0.04em] text-white md:text-[44px]">
              Análise da Call: {call.nome_do_lead || call.call_title || call.title || 'Carregando...'}
            </h1>
            {call.recordingUrl && (
              <button
                onClick={() => window.open(call.recordingUrl, '_blank')}
                className="bg-orange px-4 py-2 rounded-xl text-xs font-bold hover:opacity-90 transition-all flex items-center gap-2"
                style={{ backgroundColor: '#FF7A1A' }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-play"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                Ouvir Gravação no HubSpot
              </button>
            )}
          </div>
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
            <div 
              key={idx} 
              className="glass-card p-6 rounded-xl border-t-2" 
              style={{ 
                borderTopColor: insight.type === 'positive' ? '#4edea3' : 
                               insight.type === 'negative' ? '#ffb4ab' : '#94a3b8' 
              }}
            >
              <p className="label-elite mb-2">{insight.label}</p>
              <p className="text-2xl font-black font-headline">{insight.value}</p>
            </div>
          ))}
        </section>
      )}

      {/* Mensagem Final ao SDR */}
      {call.mensagem_final_sdr && (
        <section className="glass-card p-8 rounded-xl bg-primary/5 border-l-4 border-primary">
          <h3 className="label-elite mb-4 flex items-center gap-2"><MessageSquareText size={16} className="text-primary" /> Feedback Direto ao SDR</h3>
          <p className="text-lg text-white font-medium italic">
            "{call.mensagem_final_sdr}"
          </p>
        </section>
      )}

      {/* Pontos Fortes e Alertas */}
      <section className="grid md:grid-cols-2 gap-6">
        {Array.isArray(call.pontos_fortes) && call.pontos_fortes.length > 0 && (
          <div className="glass-card p-6 rounded-xl border-l-4 border-secondary">
            <h3 className="label-elite mb-4 flex items-center gap-2"><TrendingUp size={16} className="text-secondary" /> Pontos de Mérito</h3>
            <ul className="space-y-2">
              {call.pontos_fortes.map((item: string, idx: number) => (
                <li key={idx} className="text-sm text-on-surface-variant flex items-center gap-2">
                  <CheckCircle size={14} className="text-secondary shrink-0" /> {item}
                </li>
              ))}
            </ul>
          </div>
        )}
        {Array.isArray(call.alertas) && call.alertas.length > 0 && (
          <div className="glass-card p-6 rounded-xl border-l-4 border-yellow">
            <h3 className="label-elite mb-4 flex items-center gap-2"><AlertTriangle size={16} className="text-yellow" /> Alertas de Risco</h3>
            <ul className="space-y-2">
              {call.alertas.map((item: string, idx: number) => (
                <li key={idx} className="text-sm text-on-surface-variant flex items-center gap-2">
                  <AlertTriangle size={14} className="text-yellow shrink-0" /> {item}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

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
      {playbookArray.length > 0 && (
        <section className="space-y-4">
          <h3 className="label-elite">Playbook de Coaching</h3>
          <div className="mt-8">
            <Accordion type="single" collapsible className="space-y-4">
              {playbookArray.map((itemRaw: any, index: number) => {
                const item = formatPlaybookItem(itemRaw);
                return (
                  <AccordionItem key={index} value={`item-${index}`} className="rounded-xl border border-white/5 border-l-4 border-l-[#FF7A1A] shadow-[0_0_15px_rgba(255,122,26,0.15)] bg-[#FF7A1A]/5 px-5">
                    <AccordionTrigger className="hover:no-underline py-5">
                      <div className="flex items-center gap-4 text-left">
                        <span className="text-[11px] font-bold uppercase tracking-widest text-blue-400 whitespace-nowrap">
                          🕒 {item.timestamp || '00:00'}
                        </span>
                        <h4 className="text-[16px] font-semibold text-white">
                          {!item.diagnostico || item.diagnostico === 'N/A' || item.diagnostico.includes('Contexto não disponível') ? 'Ponto de Atenção' : item.diagnostico}
                        </h4>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-6">
                      {item.fala_lead && item.fala_lead !== "N/A" && !item.fala_lead.includes('Contexto não disponível') && (
                        <div className="mb-4 rounded-lg bg-black/20 p-3 text-sm italic text-white/60 border-l-2 border-white/10">
                          " {item.fala_lead} "
                        </div>
                      )}

                      <div className="flex gap-3 rounded-xl bg-[#FF7A1A]/10 p-4 border border-[#FF7A1A]/30">
                        <Lightbulb className="text-[#FF7A1A] flex-shrink-0" size={16} />
                        <div className="flex-1">
                          <strong className="block mb-1 text-[#FF7A1A] uppercase text-[10px] tracking-wider">Recomendação da IA:</strong>
                          <p className="text-[14px] leading-relaxed text-white">
                            {item.recomendacao}
                          </p>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </div>
        </section>
      )}
    </div>
  );
}