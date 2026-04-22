import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, doc, limit, where, documentId } from "firebase/firestore";

const ELITE_SDRS = [
  'amaranta.vieira@nibo.com.br',
  'andriel.mateus@nibo.com.br',
  'bruno.rezende@nibo.com.br',
  'elder.fernando@nibo.com.br',
  'italo.xavier@nibo.com.br',
  'mateus.braga@nibo.com.br'
];

export const subscribeToGlobalStats = (period: string, team: string, callback: (stats: any) => void) => {
  if (!db) {
    console.error("❌ Abortando subscrição: Firestore 'db' não inicializado.");
    return () => {}; 
  }

  // TAREFA 3: Cálculo manual para equipes específicas
  if (team !== 'all') {
    console.log(`📊 [Cálculo On-the-fly] Calculando KPIs para Equipe: ${team}, Período: ${period}`);
    const callsRef = collection(db, "calls_analysis");
    let constraints = [where("teamName", "==", team)];

    if (period !== 'Tudo') {
      const now = new Date();
      let startDate = new Date();
      if (period === 'Hoje') startDate.setHours(0,0,0,0);
      else if (period === '7D') startDate.setDate(now.getDate() - 7);
      else if (period === '30D') startDate.setDate(now.getDate() - 30);
      constraints.push(where('createdAt', '>=', startDate));
    }

    const q = query(callsRef, ...constraints);

    return onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(d => d.data());
      const totalCalls = docs.length;

      if (totalCalls === 0) {
        callback({ totalCalls: 0, teamAverage: 0, approvalRate: 0, avgDuration: "00:00", recurrent_gaps: {}, top_strengths: {} });
        return;
      }

      let totalSpin = 0;
      let approvedCount = 0;
      let totalDuration = 0;

      docs.forEach(d => {
        totalSpin += d.nota_spin || 0;
        if ((d.nota_spin || 0) >= 7) approvedCount++;
        totalDuration += d.durationMs || 0;
      });

      const avgDurationSec = (totalDuration / totalCalls) / 1000;
      const min = Math.floor(avgDurationSec / 60);
      const sec = Math.round(avgDurationSec % 60);
      const formattedDuration = `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;

      callback({
        totalCalls,
        teamAverage: totalSpin / totalCalls,
        approvalRate: Math.round((approvedCount / totalCalls) * 100),
        avgDuration: formattedDuration,
        recurrent_gaps: {}, 
        top_strengths: {}
      });
    });
  }

  console.log(`📊 [Leitura Eficiente] Buscando KPIs para o período: ${period}`);

  if (period === 'Tudo') {
    return onSnapshot(doc(db, "dashboard_stats", "global_summary"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        callback({
          totalCalls: data.total_calls || 0,
          teamAverage: data.media_geral || 0,
          approvalRate: data.taxa_aprovacao || 0,
          avgDuration: data.duracao_media || "00:00",
          recurrent_gaps: data.recurrent_gaps || {}, 
          top_strengths: data.top_strengths || {} 
        });
      } else {
        callback({ totalCalls: 0, teamAverage: 0, approvalRate: 0, avgDuration: "00:00", recurrent_gaps: {}, top_strengths: {} });
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
      callback({
        totalCalls: data.total_calls || 0,
        teamAverage: data.media_geral || 0,
        approvalRate: data.taxa_aprovacao || 0,
        avgDuration: data.duracao_media || "00:00",
        recurrent_gaps: data.recurrent_gaps || {}, 
        top_strengths: data.top_strengths || {} 
      });
    } else {
      callback({ totalCalls: 0, teamAverage: 0, approvalRate: 0, avgDuration: "00:00", recurrent_gaps: {}, top_strengths: {} });
    }
  });
};

export const subscribeToRanking = (period: string, team: string, callback: (sdrs: any[]) => void) => {
  if (!db) return () => {};

  console.log(`🏆 [Leitura Eficiente] Buscando Ranking para o período: ${period}, Equipe: ${team}`);

  let q = query(
    collection(db, "sdrs"), 
    orderBy("real_average", "desc"), 
    limit(50)
  ); 

  if (team !== 'all') {
    q = query(q, where('teamName', '==', team));
  } else {
    // Se for 'all', mantém o filtro de elite para não poluir o ranking global (opcional)
    q = query(q, where("email", "in", ELITE_SDRS));
  }
  
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
  }, (error) => {
    console.error("❌ Erro no onSnapshot de Ranking:", error);
  });
};
