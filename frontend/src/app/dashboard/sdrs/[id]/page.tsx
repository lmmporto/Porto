"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, onSnapshot, collection, query, where, getDocs } from "firebase/firestore";
import { CallRow } from "@/features/calls/components/CallList";

export default function SDRDetailPage() {
  const { id } = useParams();
  const [sdr, setSdr] = useState<any>(null);
  const [calls, setCalls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const unsubSdr = onSnapshot(doc(db, "sdr_stats", id as string), async (docSnap) => {
      if (docSnap.exists()) {
        const sdrData = docSnap.data();
        setSdr(sdrData);
        const q = query(collection(db, "calls_analysis"), where("ownerEmail", "==", sdrData.email));
        onSnapshot(q, (snapshot) => setCalls(snapshot.docs.map(d => ({ id: d.id, ...d.data() }))));
      } else {
        const qEmail = query(collection(db, "sdr_stats"), where("email", "==", id));
        const querySnap = await getDocs(qEmail);
        if (!querySnap.empty) setSdr(querySnap.docs[0].data());
      }
      setLoading(false);
    });

    return () => unsubSdr();
  }, [id]);

  if (loading) return <div className="p-8 text-slate-500">Carregando inteligência...</div>;
  if (!sdr) return <div className="p-8 text-error">SDR não encontrado no sistema.</div>;

  return (
    <div className="space-y-10">
      <section className="flex items-end gap-6">
        <div className="w-24 h-24 rounded-2xl bg-primary/20 flex items-center justify-center text-4xl font-black text-primary border border-primary/30">
          {sdr.name?.charAt(0)}
        </div>
        <div>
          <h1 className="h1-elite">{sdr.name}</h1>
          <p className="label-elite text-slate-500">SDR Senior • {sdr.email}</p>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 rounded-xl border-l-4 border-primary">
          <p className="label-elite mb-2">Média Real (Gestão)</p>
          <div className="text-4xl font-black text-on-surface">{sdr.real_average || "0.0"}</div>
        </div>
      </div>

      <section>
        <h3 className="label-elite mb-6">Histórico de Chamadas Analisadas</h3>
        <div className="space-y-4">
          {calls.map(call => <CallRow key={call.id} call={call} />)}
        </div>
      </section>
    </div>
  );
}