import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, limit } from "firebase/firestore";

export const subscribeToCalls = (callback: (calls: any[]) => void) => {
  if (!db) return () => {};

  const q = query(
    collection(db, "calls_analysis"), 
    orderBy("callTimestamp", "desc"),
    limit(15)
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
