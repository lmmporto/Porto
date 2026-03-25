import { FieldValue } from "firebase-admin/firestore";
import { db } from "../firebase.js";
import { CONFIG } from "../config.js";
import { sleep } from "../utils.js";
import { fetchCall } from "./hubspot.js"; // Precisamos buscar o link do áudio de novo
import { transcribeRecordingFromHubSpot, analyzeCallWithGemini } from "./analysis.service.js";

const CALLS_PARA_REFAZER = [
  "106285182134", "106609585940", "106610043399", "106638915124", 
  "106639502863", "106646338103", "106653865390", "106654030501", 
  "106654435603", "106654660754", "106698095490", "106707104815", 
  "106707231323", "106734989139", "106735274270", "106735422501", 
  "106735533644", "106764160119", "106770584632", "106770626048", 
  "106770868141", "106770964340", "106771116395", "106779607041", 
  "106820432958", "106820734319", "106820835898", "106821064060", 
  "106821222724", "106821358221", "106829679123", "106869055387", 
  "106869127553", "106869171761", "106869263872"
];

export async function rodarRepescagem() {
  console.log(`\n🚀 [MODO RESGATE] Iniciando reavaliação de ${CALLS_PARA_REFAZER.length} calls.`);

  for (const callId of CALLS_PARA_REFAZER) {
    try {
      console.log(`\n⏳ Processando Call ID: ${callId}...`);
      
      const docRef = db.collection(CONFIG.CALLS_COLLECTION).doc(callId);
      const docSnap = await docRef.get();
      const dbData = docSnap.data() || {};

      let transcript = dbData.transcript;

      // Se não tem a transcrição no banco, vamos ter que buscar no HubSpot e transcrever
      if (!transcript) {
        console.log(`[AVISO] Texto não encontrado no DB. Buscando áudio no HubSpot...`);
        const callFromHubspot = await fetchCall(callId);
        transcript = await transcribeRecordingFromHubSpot(callFromHubspot);
      }

      if (!transcript) {
        console.log(`[ERRO] ❌ Não foi possível obter transcrição para a Call ${callId}. Pulando.`);
        continue;
      }

      const ownerDetailsFake = {
        ownerName: dbData.ownerName || "Não identificado",
        teamName: dbData.teamName || "Sem equipe"
      };

      const callDataFake = {
        id: callId,
        durationMs: dbData.durationMs || 0,
        transcript: transcript
      };

      const { analysis, rawPrompt, rawResponse } = await analyzeCallWithGemini(callDataFake as any, ownerDetailsFake as any);

      await docRef.set({
        transcript: transcript, // AGORA VAMOS SALVAR O TEXTO PARA NÃO PERDER MAIS!
        status_final: analysis.status_final,
        nota_spin: Number(analysis.nota_spin || 0),
        resumo: analysis.resumo,
        alertas: analysis.alertas,
        ponto_atencao: analysis.ponto_atencao,
        maior_dificuldade: analysis.maior_dificuldade,
        pontos_fortes: analysis.pontos_fortes,
        perguntas_sugeridas: analysis.perguntas_sugeridas || [],
        analise_escuta: analysis.analise_escuta || "",
        rawPrompt,
        rawResponse,
        reavaliadaComNovoPromptEm: FieldValue.serverTimestamp() 
      }, { merge: true });

      console.log(`[SUCESSO] ✅ Call ${callId} atualizada com nota ${analysis.nota_spin}`);
      
      await sleep(3000);

    } catch (error: any) {
      console.error(`[ERRO] Falha na Call ${callId}:`, error.message);
    }
  }
}
rodarRepescagem();