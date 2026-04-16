import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, doc, limit, where, documentId } from "firebase/firestore";

export const subscribeToGlobalStats = (period: string, callback: (stats: any) => void) => {
  if (!db) return () => {};

  console.log(`📊 [Leitura Eficiente] Buscando KPIs para o período: ${period}`);

  if (period === 'Tudo') {
    return onSnapshot(doc(db, "dashboard_stats", "global_summary"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        callback({
          totalCalls: data.total_calls || 0,
          teamAverage: data.media_geral || 0,
          approvalRate: data.taxa_aprovacao || 0,
          avgDuration: data.duracao_media || "00:00"
        });
      } else {
        callback({ totalCalls: 0, teamAverage: 0, approvalRate: 0, avgDuration: "00:00" });
      }
    });
  }

  const q = query(
    collection(db, "dashboard_stats"),
    where(documentId(), "<", "global_summary"),
    orderBy(documentId(), "desc"),
    limit(1)
  );

  return onSnapshot(q, (snapshot) => {
    if (!snapshot.empty) {
      const data = snapshot.docs[0].data();
      const documentDate = snapshot.docs[0].id;
      console.log(`✅ Fallback ativado: Lendo estatísticas do dia ${documentDate}`);
      
      const rankingMap = data.sdr_ranking || {};
      let totalCalls = 0;
      let totalSumNotes = 0;

      Object.values(rankingMap).forEach((sdr: any) => {
        totalCalls += (sdr.total || 0);
        totalSumNotes += (sdr.sum_notes || 0);
      });

      callback({
        totalCalls,
        teamAverage: totalCalls > 0 ? totalSumNotes / totalCalls : 0,
        approvalRate: data.taxa_aprovacao_geral || 0,
        avgDuration: data.duracao_media || "00:00"
      });
    } else {
      console.warn("⚠️ Nenhum dado diário encontrado no dashboard_stats.");
      callback({ totalCalls: 0, teamAverage: 0, approvalRate: 0, avgDuration: "00:00" });
    }
  });
};

export const subscribeToRanking = (callback: (sdrs: any[]) => void) => {
  if (!db) return () => {};
  const q = query(collection(db, "sdrs"), orderBy("ranking_score", "desc"), limit(10));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
  });
};
