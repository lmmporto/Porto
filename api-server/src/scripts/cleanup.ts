import { db } from '../firebase.js';
import { CONFIG } from '../config.js';
import { fetchCall, fetchOwnerDetails } from '../services/hubspot.js';
import { 
  analyzeCallWithGemini, 
  updateDailyStats, 
  updateSdrGlobalStats,
  transcribeRecordingFromHubSpot 
} from '../services/analysis.service.js';
import { hubspot } from '../clients.js';
import admin from 'firebase-admin';

const { FieldValue } = admin.firestore;
const TARGET_VERSION = "V10_MESTRE_MENTOR";


async function cleanSdrStats() {
  console.log("🚀 Iniciando higienização da coleção sdr_stats...");
  const statsRef = db.collection('sdr_stats');
  const snapshot = await statsRef.get();

  for (const doc of snapshot.docs) {
    const id = doc.id;
    const data = doc.data();

    // 1. Identifica se o ID está no formato "sujo" (com underscores em vez de @)
    const isDirty = id.includes('_nibo_com_br');
    
    if (isDirty) {
      // Tenta reconstruir o e-mail correto
      // Ex: amaranta_vieira_nibo_com_br_2026_04 -> amaranta.vieira@nibo.com.br_2026_04
      // Nota: Como a reconstrução automática de string é arriscada, 
      // o mais seguro é usar o campo 'ownerEmail' que está DENTRO do documento.
      
      const correctEmail = data.ownerEmail?.toLowerCase().trim();
      const suffix = id.split('_').slice(-2).join('_'); // Pega o "2026_04"
      
      if (correctEmail && suffix.includes('20')) {
        const correctId = `${correctEmail}_${suffix}`;
        
        if (id !== correctId) {
          console.log(`Merging: ${id} -> ${correctId}`);
          
          const correctDocRef = statsRef.doc(correctId);
          const correctDoc = await correctDocRef.get();

          if (correctDoc.exists) {
            // Soma os dados no documento correto
            const correctData = correctDoc.data()!;
            await correctDocRef.update({
              totalCalls: (correctData.totalCalls || 0) + (data.totalCalls || 0),
              totalScore: (correctData.totalScore || 0) + (data.totalScore || 0),
              averageScore: Number(((correctData.totalScore + data.totalScore) / (correctData.totalCalls + data.totalCalls)).toFixed(2))
            });
          } else {
            // Se o correto não existe, cria ele com os dados do sujo
            await correctDocRef.set({
              ...data,
              ownerEmail: correctEmail
            });
          }
          
          // Deleta o sujo
          await doc.ref.delete();
          console.log(`✅ Deletado documento sujo: ${id}`);
        }
      } else {
        // Se não tem data ou e-mail, é lixo antigo. Deleta.
        await doc.ref.delete();
        console.log(`🗑️ Deletado lixo sem data: ${id}`);
      }
    }
    
    // 2. Remove documentos que não tem o sufixo de data (IDs estáticos)
    if (!id.includes('_202')) {
       await doc.ref.delete();
       console.log(`🗑️ Deletado ID estático (sem data): ${id}`);
    }
  }
  console.log("✨ Higienização concluída!");
}

cleanSdrStats();