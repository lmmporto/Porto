import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, documentId } from "firebase/firestore";
import { formatDuration } from "@/lib/utils";

const chunkArray = <T>(arr: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
};

/**
 * Helper genérico para criar subscrições baseadas na soberania do sdr_registry.
 * Primeiro busca os membros ativos do time e depois assina os dados alvo.
 */
const createTeamBasedSubscription = (
  targetCollection: string,
  team: string,
  callback: (data: any[]) => void,
  idField: string = "ownerEmail"
) => {
  if (!db) return () => {};

  const registryRef = collection(db, "sdr_registry");
  const qMembers = team === 'all' 
    ? query(registryRef, where("isActive", "==", true))
    : query(registryRef, where("assignedTeam", "==", team), where("isActive", "==", true));

  return onSnapshot(qMembers, (membersSnap) => {
    const teamEmails = membersSnap.docs
        .map(d => d.data().email?.toLowerCase().trim())
        .filter(Boolean) as string[];

    if (teamEmails.length === 0) {
      callback([]);
      return;
    }

    const emailChunks = chunkArray(teamEmails, 30);
    const unsubscribers: (() => void)[] = [];
    const resultsByChunk: { [key: number]: any[] } = {};

    emailChunks.forEach((chunk, index) => {
      const dataRef = collection(db, targetCollection);
      
      let qData;
      if (idField === "__name__") {
        const sdrIds = chunk.map(email => email.replace(/\./g, '_'));
        qData = query(dataRef, where(documentId(), "in", sdrIds));
      } else {
        qData = query(dataRef, where(idField, "in", chunk));
      }

      const unsub = onSnapshot(qData, (snapshot) => {
        resultsByChunk[index] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const allDocs = Object.values(resultsByChunk).flat();
        callback(allDocs);
      });
      unsubscribers.push(unsub);
    });

    return () => unsubscribers.forEach(unsub => unsub());
  });
};

export const getKPIs = async (period: string, team: string) => {
  const API_URL = (process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(/\/$/, '');
  const response = await fetch(`${API_URL}/api/stats?period=${period}&team=${encodeURIComponent(team)}`, {
    credentials: 'include'
  });
  if (!response.ok) throw new Error('Falha ao buscar KPIs');
  return response.json();
};

export const subscribeToGlobalStats = (period: string, team: string, callback: (stats: any) => void) => {
  return createTeamBasedSubscription("calls_analysis", team, (allDocs) => {
    // Filtro de período (Manual no frontend para simplificar a query do Firestore)
    let filteredDocs = allDocs;
    if (period !== 'Tudo') {
        const now = new Date();
        let startDate = new Date();
        if (period === 'Hoje') startDate.setHours(0,0,0,0);
        else if (period === '7D') startDate.setDate(now.getDate() - 7);
        else if (period === '30D') startDate.setDate(now.getDate() - 30);
        
        filteredDocs = allDocs.filter(d => {
            const createdAt = d.createdAt?.toDate ? d.createdAt.toDate() : new Date(d.createdAt);
            return createdAt >= startDate;
        });
    }

    const totalCalls = filteredDocs.length;

    if (totalCalls === 0) {
      callback({ totalCalls: 0, teamAverage: 0, approvalRate: 0, avgDuration: "00:00", recurrent_gaps: {}, top_strengths: {} });
      return;
    }

    let totalSpin = 0;
    let approvedCount = 0;
    let totalDuration = 0;

    filteredDocs.forEach(d => {
      totalSpin += d.nota_spin || 0;
      if ((d.nota_spin || 0) >= 7) approvedCount++;
      totalDuration += d.durationMs || 0;
    });

    callback({
      totalCalls,
      teamAverage: totalSpin / totalCalls,
      approvalRate: Math.round((approvedCount / totalCalls) * 100),
      avgDuration: formatDuration(totalDuration / totalCalls),
      recurrent_gaps: {}, 
      top_strengths: {}
    });
  });
};

export const subscribeToRanking = (period: string, team: string, callback: (ranking: any[]) => void) => {
  // O ranking continua lendo da coleção 'sdrs' para performance, mas filtrando pela soberania do sdr_registry
  return createTeamBasedSubscription("sdrs", team, (allSdrs) => {
    const sortedRanking = allSdrs.sort((a, b) => (b.real_average || 0) - (a.real_average || 0));
    callback(sortedRanking);
  }, "__name__");
};
