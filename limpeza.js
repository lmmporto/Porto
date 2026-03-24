import { db } from "./src/firebase.js";
import { Timestamp } from "firebase-admin/firestore";

async function limparDadosDeHoje() {
  console.log("🧹 Iniciando limpeza das chamadas de HOJE...");

  // 1. Pega o horário de 00:00 de hoje
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const inicioDoDia = Timestamp.fromDate(hoje);

  const callsRef = db.collection('calls_analysis');
  
  // 2. Busca apenas o que foi gravado HOJE
  const snapshot = await callsRef.where('updatedAt', '>=', inicioDoDia).get();
  
  let deletados = 0;
  const batch = db.batch();

  snapshot.forEach(doc => {
    const data = doc.data();
    
    // CRITÉRIOS DE LIMPEZA (Douglas Case):
    // Se durou menos de 2 min (120000ms) OU não conectou
    const isShort = (data.durationMs || 0) < 120000;
    const notConnected = data.wasConnected === false;

    if (isShort || notConnected) {
      batch.delete(doc.ref);
      deletados++;
    }
  });

  if (deletados > 0) {
    await batch.commit();
    console.log(`✅ FAXINA CONCLUÍDA! Foram removidas ${deletados} chamadas inúteis de hoje.`);
  } else {
    console.log("✨ O painel de hoje já está limpo. Nada para deletar.");
  }
}

limparDadosDeHoje().catch(console.error);
