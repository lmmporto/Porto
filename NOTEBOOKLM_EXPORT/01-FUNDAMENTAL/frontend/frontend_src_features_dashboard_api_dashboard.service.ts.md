# dashboard.service.ts

## Visão geral
- Caminho original: `frontend/src/features/dashboard/api/dashboard.service.ts`
- Domínio: **frontend**
- Prioridade: **01-FUNDAMENTAL**
- Tipo: **feature-api**
- Criticidade: **important**
- Score de importância: **124**
- Entry point: **não**
- Arquivo central de fluxo: **sim**
- Linhas: **92**
- Imports detectados: **2**
- Exports detectados: **2**
- Funções/classes detectadas: **2**

## Resumo factual
Este arquivo foi classificado como feature-api no domínio frontend. Criticidade: important. Prioridade: 01-FUNDAMENTAL. Exports detectados: subscribeToGlobalStats, subscribeToRanking. Funções/classes detectadas: subscribeToGlobalStats, subscribeToRanking. Dependências locais detectadas: @/lib/firebase. Dependências externas detectadas: firebase/firestore. Temas relevantes detectados: calls, dashboard, email, firebase, ranking, sdr, stats, summary, team. Indícios de framework/arquitetura: firebase.

## Dependências locais
- `@/lib/firebase`

## Dependências externas
- `firebase/firestore`

## Todos os imports detectados
- `@/lib/firebase`
- `firebase/firestore`

## Exports detectados
- `subscribeToGlobalStats`
- `subscribeToRanking`

## Funções e classes detectadas
- `subscribeToGlobalStats`
- `subscribeToRanking`

## Endpoints detectados
_Nenhum padrão de endpoint detectado_

## Variáveis de ambiente detectadas
_Nenhuma variável de ambiente detectada_

## Temas relevantes
- `calls`
- `dashboard`
- `email`
- `firebase`
- `ranking`
- `sdr`
- `stats`
- `summary`
- `team`

## Indícios de framework/arquitetura
- `firebase`

## Código
```ts
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

export const subscribeToGlobalStats = (period: string, callback: (stats: any) => void) => {
  if (!db) {
    console.error("❌ Abortando subscrição: Firestore 'db' não inicializado.");
    return () => {}; 
  }

  console.log(`📊 [Leitura Eficiente] Buscando KPIs para o período: ${period}`);

  if (period === 'Tudo') {
    return onSnapshot(doc(db, "dashboard_stats", "global_summary"), (docSnap) => {
      console.log("📊 Dados recebidos do Global Summary:", docSnap.data()); // Debug de Dados

      if (docSnap.exists()) {
        const data = docSnap.data();
        callback({
          totalCalls: data.total_calls || 0,
          teamAverage: data.media_geral || 0,
          approvalRate: data.taxa_aprovacao || 0,
          avgDuration: data.duracao_media || "00:00",
          recurrent_gaps: data.recurrent_gaps || {}, // TAREFA 1: Adicionado
          top_strengths: data.top_strengths || {} // TAREFA 1: Adicionado
        });
      } else {
        console.warn("⚠️ Documento dashboard_stats/global_summary não encontrado.");
        callback({ totalCalls: 0, teamAverage: 0, approvalRate: 0, avgDuration: "00:00", recurrent_gaps: {}, top_strengths: {} });
      }
    }, (error) => {
      console.error("❌ Erro no onSnapshot de GlobalStats (Tudo):", error);
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
      
      callback({
        totalCalls: data.total_calls || 0,
        teamAverage: data.media_geral || 0,
        approvalRate: data.taxa_aprovacao || 0,
        avgDuration: data.duracao_media || "00:00",
        recurrent_gaps: data.recurrent_gaps || {}, // TAREFA 1: Adicionado
        top_strengths: data.top_strengths || {} // TAREFA 1: Adicionado
      });
    } else {
      console.warn("⚠️ Nenhum dado diário encontrado no dashboard_stats para o período.");
      callback({ totalCalls: 0, teamAverage: 0, approvalRate: 0, avgDuration: "00:00", recurrent_gaps: {}, top_strengths: {} });
    }
  }, (error) => {
    console.error("❌ Erro no onSnapshot de GlobalStats (Período):", error);
  });
};

export const subscribeToRanking = (period: string, callback: (sdrs: any[]) => void) => {
  if (!db) return () => {};

  console.log(`🏆 [Leitura Eficiente] Buscando Ranking para o período: ${period}`);

  let q = query(
    collection(db, "sdrs"), 
    where("email", "in", ELITE_SDRS),
    orderBy("ranking_score", "desc"), 
    limit(50)
  ); 
  
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
  }, (error) => {
    console.error("❌ Erro no onSnapshot de Ranking:", error);
  });
};

```
