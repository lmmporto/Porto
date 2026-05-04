import { db } from "@/lib/firebase";
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  limit, 
  where, 
  getDocs, 
  startAfter,
  QueryDocumentSnapshot,
  DocumentData
} from "firebase/firestore";

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

/**
 * 🚀 getPaginatedCalls: Busca robusta por cursor para evitar estouro de memória
 */
export const getPaginatedCalls = async (
  pageSize: number = 10,
  lastVisibleDoc: QueryDocumentSnapshot<DocumentData> | null = null,
  sdrEmail: string | null = null
) => {
  if (!db) throw new Error("Database not initialized");

  const callsRef = collection(db, 'calls_analysis');
  let q;

  const constraints: any[] = [];

  if (sdrEmail) {
    constraints.push(where('ownerEmail', '==', sdrEmail));
  }

  constraints.push(orderBy('callTimestamp', 'desc'));

  if (lastVisibleDoc) {
    constraints.push(startAfter(lastVisibleDoc));
  }

  constraints.push(limit(pageSize));

  q = query(callsRef, ...constraints);
  const snapshot = await getDocs(q);

  const calls = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

  return {
    calls,
    lastVisibleDoc: snapshot.docs[snapshot.docs.length - 1] || null,
    hasNextPage: snapshot.docs.length === pageSize
  };
};

