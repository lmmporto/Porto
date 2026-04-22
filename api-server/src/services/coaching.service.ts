import { db } from '../firebase.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export class CoachingService {
  /**
   * Copia o estado atual do SDR para a subcoleção history
   */
  static async createWeeklySnapshot(sdrId: string): Promise<void> {
    try {
      const sdrRef = db.collection('sdrs').doc(sdrId);
      const sdrDoc = await sdrRef.get();
      
      if (!sdrDoc.exists) return;

      const data = sdrDoc.data();
      const timestamp = new Date().toISOString();

      await sdrRef.collection('history').doc(timestamp).set({
        ...data,
        snapshotAt: new Date()
      });

      console.log(`[COACHING] Snapshot evolutivo criado para o SDR: ${sdrId}`);
    } catch (error) {
      console.error(`[COACHING] Erro ao criar snapshot para ${sdrId}:`, error);
    }
  }

  /**
   * Compara o estado atual com o último snapshot e gera narrativa evolutiva
   */
  static async updateCoachingSummary(sdrId: string): Promise<void> {
    try {
      const sdrRef = db.collection('sdrs').doc(sdrId);
      const sdrDoc = await sdrRef.get();
      if (!sdrDoc.exists) return;

      const currentData = sdrDoc.data() || {};

      // Busca o último snapshot
      const historySnap = await sdrRef.collection('history')
        .orderBy('snapshotAt', 'desc')
        .limit(1)
        .get();

      if (historySnap.empty) {
        console.log(`[COACHING] Sem histórico anterior para comparar. SDR: ${sdrId}`);
        return;
      }

      const previousData = historySnap.docs[0].data();

      const prompt = `
        Você é um Diretor de Vendas mentorando um SDR. Analise a evolução dele.[DADOS DA SEMANA ANTERIOR]
        Nota SPIN: ${previousData.nota_spin || 0}
        Gaps Frequentes: ${JSON.stringify(previousData.recurrent_gaps || {})}

        [DADOS DA SEMANA ATUAL]
        Nota SPIN: ${currentData.nota_spin || 0}
        Gaps Frequentes: ${JSON.stringify(currentData.recurrent_gaps || {})}

        Gere um JSON estrito respondendo:
        1. A evolução narrativa (foco no que melhorou e no que ainda é ponto de atenção, tom encorajador).
        2. Um array com até 3 pontos que melhoraram (ex: notas que subiram, gaps que sumiram).
        3. Um array com até 3 pontos de atenção (gaps que pioraram ou continuam fortes).

        Formato obrigatório:
        {
          "evolucao_narrativa": "string",
          "melhorias": ["string"],
          "atencao": ["string"]
        }
      `;

      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash', generationConfig: { responseMimeType: "application/json" } });
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      const aiAnalysis = JSON.parse(responseText);

      await sdrRef.set({
        evolucao_narrativa: aiAnalysis.evolucao_narrativa,
        melhorias: aiAnalysis.melhorias,
        atencao: aiAnalysis.atencao,
        nota_anterior: previousData.nota_spin || 0,
        ultima_comparacao: new Date().toISOString()
      }, { merge: true });

      console.log(`[COACHING] Resumo de evolução atualizado para: ${sdrId}`);
    } catch (error) {
      console.error(`[COACHING] Erro na análise comparativa para ${sdrId}:`, error);
    }
  }
}
