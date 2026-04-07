import 'dotenv/config';
import { db } from '../firebase.js';

async function recuperarOuro() {
  console.log('⛏️ [RECUPERAÇÃO] Extraindo análise completa do rawResponse...');
  const snapshot = await db.collection('calls_analysis').where('processingStatus', '==', 'DONE').get();

  for (const doc of snapshot.docs) {
    const data = doc.data();
    if (data.rawResponse) {
      try {
        // Limpa o texto e transforma em objeto
        const cleanJson = data.rawResponse.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanJson);

        // 🚩 GRAVA TUDO NAS GAVETAS CERTAS
        await doc.ref.update({
          resumo: parsed.resumo,
          alertas: parsed.alertas,
          ponto_atencao: parsed.ponto_atencao,
          maior_dificuldade: parsed.maior_dificuldade,
          pontos_fortes: parsed.pontos_fortes,
          analise_escuta: parsed.analise_escuta,
          perguntas_sugeridas: parsed.perguntas_sugeridas,
          status_final: parsed.status_final,
          nota_spin: Number(parsed.nota_spin || 0)
        });
        console.log(`✅ [OK] Análise completa recuperada para Call: ${doc.id}`);
      } catch (e) {
        console.log(`❌ [ERRO] Falha ao processar texto da Call: ${doc.id}`);
      }
    }
  }
  console.log('✨ [FIM] Ouro recuperado com sucesso!');
}
recuperarOuro().catch(console.error);