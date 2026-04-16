"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";

export default function CallDetailPage() {
  const { id } = useParams();
  const [call, setCall] = useState<any>(null);

  useEffect(() => {
    if (!id || !db) return;
    return onSnapshot(doc(db, "calls_analysis", id as string), (docSnap) => {
      if (docSnap.exists()) setCall({ id: docSnap.id, ...docSnap.data() });
    });
  }, [id]);

  if (!call) return <div className="p-8 text-slate-500 font-headline">Carregando análise estratégica...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <section className="glass-card rounded-xl p-8 flex flex-col md:flex-row justify-between items-start gap-8 relative overflow-hidden">
        <div className="flex gap-8 items-center z-10">
          <div className="w-20 h-20 rounded-full border-4 border-primary/20 flex items-center justify-center bg-surface-dim">
            <span className="text-2xl font-black text-white font-headline">{call.nota_spin || 0}</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold font-headline text-white">{call.clientName || "Lead Nibo"}</h2>
            <div className="flex gap-2 mt-2">
                {call.produto_principal && <span className="bg-primary/10 text-primary text-[10px] font-bold px-3 py-1 rounded-full uppercase">{call.produto_principal}</span>}
                {call.rota && <span className="bg-secondary/10 text-secondary text-[10px] font-bold px-3 py-1 rounded-full uppercase">Rota {call.rota}</span>}
            </div>
          </div>
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-6">
        {(call.insights_estrategicos || []).map((i: any, idx: number) => (
          <div key={idx} className="glass-card p-6 rounded-xl border-t-2" style={{ borderTopColor: i.type === 'positive' ? '#4edea3' : '#ffb4ab' }}>
            <p className="label-elite mb-2">{i.label}</p>
            <p className="text-2xl font-black font-headline">{i.value}</p>
          </div>
        ))}
      </section>

      <section className="glass-card p-8 rounded-xl">
        <h3 className="label-elite mb-4">Resumo Executivo</h3>
        <p className="text-lg text-on-surface-variant font-medium leading-relaxed">{call.resumo || "Sem resumo disponível."}</p>
      </section>

      <section className="space-y-4">
        <h3 className="label-elite">Playbook de Coaching</h3>
        <Accordion type="single" collapsible>
          {Array.isArray(call.playbook_detalhado) && call.playbook_detalhado.map((item: any, idx: number) => (
            <AccordionItem key={idx} value={`item-${idx}`} className="glass-card mb-3 rounded-xl px-6">
              <AccordionTrigger className="text-sm">{item.label || "Ponto de Atenção"}</AccordionTrigger>
              <AccordionContent className="text-xs text-slate-400 space-y-2">
                <p><strong>Diagnóstico:</strong> {item.diagnosis}</p>
                <p><strong>Recomendação:</strong> {item.recommendation}</p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
    </div>
  );
}