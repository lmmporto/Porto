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

  // Guarda os unsubscribers internos (um por chunk) para cleanup antes de cada re-criação
  let internalUnsubscribers: (() => void)[] = [];

  const cancelInternals = () => {
    internalUnsubscribers.forEach((unsub) => unsub());
    internalUnsubscribers = [];
  };

  const registryRef = collection(db, "sdr_registry");
  const qMembers = team === 'all' 
    ? query(registryRef, where("isActive", "==", true))
    : query(registryRef, where("assignedTeam", "==", team), where("isActive", "==", true));

  const unsubscribeExternal = onSnapshot(qMembers, (membersSnap) => {
    // SEMPRE cancela listeners internos anteriores antes de criar novos
    cancelInternals();

    const teamEmails = membersSnap.docs
        .map(d => d.data().email?.toLowerCase().trim())
        .filter(Boolean) as string[];

    if (teamEmails.length === 0) {
      callback([]);
      return;
    }

    const emailChunks = chunkArray(teamEmails, 30);
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

      // Captura o unsubscribe interno na lista gerenciada
      internalUnsubscribers.push(unsub);
    });
  });

  // Retorna função que cancela AMBOS os níveis de listeners
  return () => {
    cancelInternals();
    unsubscribeExternal();
  };
};

export const getKPIs = async (period: string, team: string, route: string = 'all') => {
  const API_URL = (process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(/\/$/, '');
  const response = await fetch(`${API_URL}/api/stats?period=${period}&team=${encodeURIComponent(team)}&route=${route}`, {
    credentials: 'include'
  });
  if (!response.ok) throw new Error('Falha ao buscar KPIs');
  return response.json();
};

export const subscribeToGlobalStats = (period: string, team: string, route: string = 'all', callback: (stats: any) => void) => {
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

    // Filtro de rota — campo esperado no documento: "rota" (ex: "A", "B", "C")
    if (route !== 'all') {
      filteredDocs = filteredDocs.filter(d => d.rota === route);
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

export const subscribeToRanking = (period: string, team: string, route: string = 'all', callback: (ranking: any[]) => void) => {
  // O ranking usa dados de sdrs (agregados), que não têm período nem rota.
  // A solução correta: buscar calls_analysis filtradas e agregar na hora.
  return createTeamBasedSubscription("calls_analysis", team, (allDocs) => {
    let filteredDocs = allDocs;

    // Filtro de período
    if (period !== 'Tudo') {
      const now = new Date();
      let startDate = new Date();
      if (period === 'Hoje') startDate.setHours(0, 0, 0, 0);
      else if (period === '7D') startDate.setDate(now.getDate() - 7);
      else if (period === '30D') startDate.setDate(now.getDate() - 30);
      filteredDocs = filteredDocs.filter(d => {
        const createdAt = d.createdAt?.toDate ? d.createdAt.toDate() : new Date(d.createdAt);
        return createdAt >= startDate;
      });
    }

    // Filtro de rota
    if (route !== 'all') {
      filteredDocs = filteredDocs.filter(d => d.rota === route);
    }

    // Agregar por SDR na hora
    const sdrMap: Record<string, { name: string; picture?: string; teamName?: string; total_calls: number; totalScore: number }> = {};
    filteredDocs.forEach(d => {
      const email = d.ownerEmail;
      if (!email) return;
      if (!sdrMap[email]) {
        sdrMap[email] = { name: d.ownerName || email, picture: d.ownerPicture, teamName: d.teamName, total_calls: 0, totalScore: 0 };
      }
      sdrMap[email].total_calls += 1;
      sdrMap[email].totalScore += d.nota_spin || 0;
    });

    const ranking = Object.entries(sdrMap).map(([email, data]) => ({
      id: email.replace(/\./g, '_'),
      email,
      name: data.name,
      picture: data.picture,
      teamName: data.teamName,
      total_calls: data.total_calls,
      real_average: data.total_calls > 0 ? data.totalScore / data.total_calls : 0,
      ranking_score: data.total_calls > 0 ? data.totalScore / data.total_calls : 0,
    })).sort((a, b) => b.real_average - a.real_average);

    callback(ranking);
  });
};
