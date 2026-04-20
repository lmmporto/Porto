import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, limit, where } from "firebase/firestore";

const ELITE_SDRS = [
  'amaranta.vieira@nibo.com.br',
  'andriel.mateus@nibo.com.br',
  'bruno.rezende@nibo.com.br',
  'elder.fernando@nibo.com.br',
  'italo.xavier@nibo.com.br',
  'mateus.braga@nibo.com.br'
];

export const subscribeToCalls = (callback: (calls: any[]) => void) => {
  if (!db) return () => {};

  const q = query(
    collection(db, "calls_analysis"),
    where('ownerEmail', 'in', ELITE_SDRS),
    orderBy("callTimestamp", "desc"),
    limit(20)
  );
  
  return onSnapshot(q, (snapshot) => {
    const calls = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        score: data.nota_spin || 0,
        sdrName: data.ownerName || "SDR Nibo",
        clientName: data.clientName || "Lead Nibo",
        main_product: data.produto_principal || "N/A",
        route: data.rota || "-",
        date: data.callTimestamp?.toDate ? data.callTimestamp.toDate() : new Date(),
      };
    });
    callback(calls);
  });
};
