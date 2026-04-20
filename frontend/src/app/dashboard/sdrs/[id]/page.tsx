"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db } from "@/lib/firebase"; // Import correto do SDK de cliente
import { doc, onSnapshot, collection, query, where, getDoc, getDocs, orderBy } from "firebase/firestore"; // Importações do SDK de cliente
import { CallRow } from "@/features/calls/components/CallList";
import { Lightbulb, TrendingDown, PhoneCall } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SDRDetailPage() {
  const { id } = useParams();
  // Tarefa Única: Decodificar o ID da URL
  const decodedId = decodeURIComponent(id as string); 

  const [sdr, setSdr] = useState<any>(null);
  const [calls, setCalls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!decodedId || !db) { // Usar decodedId aqui
      console.error("❌ Firestore 'db' não inicializado ou ID decodificado ausente.");
      setLoading(false);
      return;
    }

    console.log("🔌 Conectando ao Firestore para buscar SDR com ID decodificado:", decodedId); // Log de depuração

    const fetchSdrAndCalls = async () => {
      setLoading(true);
      let currentSdr: any = null;

      // 1. Tenta buscar pelo ID do documento (prioritário)
      console.log("🔍 Tentando buscar na coleção 'sdrs' o documento ID:", decodedId); // Usar decodedId
      const docRef = doc(db, "sdrs", decodedId); // Usar decodedId
      
      try {
        const docSnap = await getDoc(docRef); // Usa getDoc para busca direta

        console.log("📊 Documento encontrado por ID direto?", docSnap.exists());

        if (docSnap.exists()) {
          currentSdr = { id: docSnap.id, ...docSnap.data() };
          console.log("✅ SDR encontrado por ID direto.");
        } else {
          // 2. Fallback: Tenta buscar pelo campo email
          console.log("🔍 Documento não encontrado por ID direto. Tentando buscar por email...");
          // A conversão de underscores para pontos já foi feita no ID do documento,
          // mas se o ID da URL já for um email com pontos, não precisa de replace.
          // A busca por email deve usar o decodedId diretamente, pois ele já está no formato correto.
          const emailToSearch = decodedId.includes('@') ? decodedId : decodedId.replace(/_/g, '.'); // Lógica para garantir formato de email
          console.log("📧 Tentando buscar com email formatado:", emailToSearch);

          const qEmail = query(collection(db, "sdrs"), where("email", "==", emailToSearch)); // Usar emailToSearch
          const querySnap = await getDocs(qEmail);

          if (!querySnap.empty) {
            currentSdr = { id: querySnap.docs[0].id, ...querySnap.docs[0].data() };
            console.log("✅ SDR encontrado por email.");
          } else {
            console.log("❌ SDR não encontrado por ID nem por email.");
          }
        }

        if (currentSdr) {
          setSdr(currentSdr);
          // 3. Busca o histórico de chamadas deste SDR
          const qCalls = query(collection(db, "calls_analysis"), where("ownerEmail", "==", currentSdr.email), orderBy("callTimestamp", "desc"));
          const unsubCalls = onSnapshot(qCalls, (snapshot) => {
            setCalls(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
          });
          setLoading(false);
          return unsubCalls; // Retorna a função de unsubscribe para o cleanup
        } else {
          setLoading(false);
          setSdr(null); // SDR não encontrado
        }
      } catch (error) {
        console.error("❌ Erro ao buscar dados do SDR:", error);
        setLoading(false);
      }
      return () => {}; // Retorna uma função vazia se não houver subscrição
    };

    const unsubscribePromise = fetchSdrAndCalls();
    return () => {
      unsubscribePromise.then(unsub => {
        if (typeof unsub === 'function') {
          unsub();
        }
      });
    };
  }, [decodedId]); // Usar decodedId como dependência

  if (loading) return <div className="p-8 text-slate-500 font-headline">Carregando painel de voo do SDR...</div>;
  if (!sdr) return <div className="p-8 text-error font-headline">SDR não encontrado no sistema.</div>;

  const negativeInsights = (sdr.insights_estrategicos || []).filter((i: any) => i.type === 'negative');
  const positiveInsights = (sdr.insights_estrategicos || []).filter((i: any) => i.type === 'positive');

  return (
    <div className="p-8 space-y-10">
      {/* Header: Olá, [Nome do SDR] */}
      <header className="flex items-end gap-6">
        <div className="w-24 h-24 rounded-2xl bg-primary/20 flex items-center justify-center text-4xl font-black text-primary border border-primary/30">
          {sdr.name?.charAt(0) || 'S'}
        </div>
        <div>
          <h1 className="h1-elite">Olá, {sdr.name || 'SDR'}</h1>
          <p className="label-elite text-slate-500">{sdr.email}</p>
        </div>
      </header>

      {/* Grid Superior: Cards de Métricas e Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Acionar Ligação (HubSpot Link) */}
        <div className="glass-card p-6 rounded-xl flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-4">
            <PhoneCall size={20} className="text-secondary" />
            <p className="label-elite">Acionar Ligação</p>
          </div>
          <input 
            type="text" 
            readOnly 
            value={`https://app.hubspot.com/contacts/${sdr.hubspotId || 'SEU_ID'}/contact/${sdr.contactId || 'NO_CONTACT'}`} 
            className="w-full bg-surface-container-highest border-none rounded-lg text-xs text-on-surface p-2"
          />
          <button className="mt-4 w-full bg-primary/10 text-primary text-xs font-bold py-2 rounded-lg hover:bg-primary/20 transition-colors">
            Copiar Link HubSpot
          </button>
        </div>

        {/* Card 2: Círculo de Média (real_average) */}
        <div className="glass-card p-6 rounded-xl flex flex-col justify-between items-center">
          <p className="label-elite mb-4">Média Real (SPIN)</p>
          <div className="relative w-24 h-24">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path className="stroke-surface-container-highest" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" strokeWidth="3"></path>
              <path className="stroke-primary" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" strokeDasharray={`${(sdr.real_average || 0) * 10}, 100`} strokeLinecap="round" strokeWidth="3"></path>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-primary font-black text-xl">{sdr.real_average?.toFixed(1) || "0.0"}</span>
            </div>
          </div>
          <p className="text-[10px] text-slate-500 uppercase mt-2">Baseado em {sdr.callCount || 0} calls</p>
        </div>

        {/* Card 3: Gaps de Processo (Insights Negativos) */}
        <div className="glass-card p-6 rounded-xl flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-4">
            <TrendingDown size={20} className="text-error" />
            <p className="label-elite">Gaps de Processo</p>
          </div>
          <ul className="space-y-2">
            {negativeInsights.length > 0 ? negativeInsights.map((insight: any, idx: number) => (
              <li key={idx} className="text-sm text-on-surface-variant flex items-center gap-2">
                <span className="text-error">●</span> {insight.label}: {insight.value}
              </li>
            )) : <li className="text-sm text-slate-500">Nenhum gap detectado.</li>}
          </ul>
        </div>

        {/* Card 4: Top Insights (Insights Positivos) */}
        <div className="glass-card p-6 rounded-xl flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-4">
            <Lightbulb size={20} className="text-tertiary" />
            <p className="label-elite">Top Insights</p>
          </div>
          <ul className="space-y-2">
            {positiveInsights.length > 0 ? positiveInsights.map((insight: any, idx: number) => (
              <li key={idx} className="text-sm text-on-surface-variant flex items-center gap-2">
                <span className="text-tertiary">●</span> {insight.label}: {insight.value}
              </li>
            )) : <li className="text-sm text-slate-500">Nenhum insight positivo.</li>}
          </ul>
        </div>
      </div>

      {/* Histórico Individual Real */}
      <section>
        <h3 className="label-elite mb-6">Meu Histórico de Chamadas</h3>
        <div className="space-y-4">
          {calls.length > 0 ? calls.map(call => (
            <CallRow key={call.id} call={call} />
          )) : <div className="p-4 text-slate-500 glass-card rounded-xl">Nenhuma chamada analisada para este SDR ainda.</div>}
        </div>
      </section>
    </div>
  );
}