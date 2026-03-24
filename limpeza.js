import { db } from "./src/firebase.js";

async function faxinaGeralHistorica() {
  console.log("🚀 Iniciando FAXINA GERAL em todo o histórico de chamadas...");

  const callsRef = db.collection('calls_analysis');
  
  // 1. Buscamos TODAS as chamadas do banco (sem filtro de data)
  const snapshot = await callsRef.get();
  
  console.log(`📦 Analisando ${snapshot.size} documentos no Firebase...`);

  let atualizados = 0;
  let ignorados = 0;
  const batch = db.batch();

  snapshot.forEach(doc => {
    const data = doc.data();
    
    // CRITÉRIOS PARA SER CONSIDERADO "RASTRO/LIXO":
    // 1. Durou menos de 2 min
    // 2. OU não conectou (wasConnected === false)
    // 3. OU a nota é 0 E não tem resumo (casos antigos sem status)
    const isShort = (data.durationMs || 0) < 120000;
    const notConnected = data.wasConnected === false;
    const hasNoAnalysis = !data.resumo || data.nota_spin === 0;

    const isTrash = isShort || notConnected || hasNoAnalysis;

    // SÓ ATUALIZAMOS SE: For lixo E ainda não tiver a etiqueta certa
    if (isTrash && data.processingStatus !== "SKIPPED_FOR_AUDIT") {
      batch.update(doc.ref, { 
        processingStatus: "SKIPPED_FOR_AUDIT", 
        nota_spin: 0,
        status_final: "NAO_IDENTIFICADO"
      });
      atualizados++;
    } else {
      ignorados++;
    }

    // O Firebase aceita no máximo 500 operações por batch. 
    // Se o seu banco for gigante, precisaremos rodar em partes.
  });

  if (atualizados > 0) {
    await batch.commit();
    console.log("---");
    console.log(`✅ SUCESSO! ${atualizados} chamadas antigas foram "limpas" e movidas para Auditoria.`);
    console.log(`ℹ️  ${ignorados} chamadas já estavam corretas ou são reuniões reais.`);
    console.log("---");
    console.log("💡 Agora seu Dashboard deve mostrar apenas o 'ouro' nas notas!");
  } else {
    console.log("✨ O banco já está 100% organizado. Nenhuma alteração necessária.");
  }
}

faxinaGeralHistorica().catch(console.error);