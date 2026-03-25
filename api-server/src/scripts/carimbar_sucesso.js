import { db } from "../firebase.js";

async function carimbarChamadasAntigas() {
  console.log("🏆 Carimbando chamadas antigas de sucesso como 'DONE'...");

  const callsRef = db.collection('calls_analysis');
  const snapshot = await callsRef.get();
  
  let carimbados = 0;
  const batch = db.batch();

  snapshot.forEach(doc => {
    const data = doc.data();
    
    // CRITÉRIO: Chamada longa (>2min) e com nota real, que ainda não tem status
    const isGoodCall = (data.durationMs || 0) >= 120000 && (data.nota_spin || 0) > 0;
    const hasNoStatus = !data.processingStatus;

    if (isGoodCall && hasNoStatus) {
      batch.update(doc.ref, { 
        processingStatus: "DONE" // O carimbo que o Front-end precisa ver
      });
      carimbados++;
    }
  });

  if (carimbados > 0) {
    await batch.commit();
    console.log(`✅ SUCESSO! ${carimbados} chamadas antigas agora são oficiais (DONE).`);
  } else {
    console.log("✨ Nenhuma chamada no limbo encontrada.");
  }
}

carimbarChamadasAntigas().catch(console.error);