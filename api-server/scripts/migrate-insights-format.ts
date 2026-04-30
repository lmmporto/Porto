import { db } from '../src/firebase.js';
import * as admin from 'firebase-admin';

const DRY_RUN = process.env.DRY_RUN === 'true';
const BATCH_SIZE = 400;
const COLLECTION = 'calls_analysis'; // Nome correto da coleção no Porto

type StrategicInsight = {
  label: string;
  value: string;
  type: 'positive' | 'negative' | 'neutral';
};

function normalizeInsights(raw: unknown): StrategicInsight[] {
  // Já está no formato correto
  if (Array.isArray(raw) && raw.length > 0 && typeof raw[0] === 'object' && raw[0] !== null) {
    return (raw as StrategicInsight[]).filter(
      (i) =>
        typeof i.label === 'string' &&
        typeof i.value === 'string' &&
        ['positive', 'negative', 'neutral'].includes(i.type)
    );
  }

  // Era string única — converte para neutral genérico
  if (typeof raw === 'string' && raw.trim().length > 0) {
    return [{ label: 'Insight histórico', value: raw.trim(), type: 'neutral' }];
  }

  // Era array de strings
  if (Array.isArray(raw) && raw.every((i) => typeof i === 'string')) {
    return (raw as string[])
      .filter((s) => s.trim().length > 0)
      .map((s) => ({ label: 'Insight histórico', value: s.trim(), type: 'neutral' as const }));
  }

  // Vazio ou formato desconhecido
  return [];
}

async function run() {
  console.log(`Iniciando migração de dados históricos... ${DRY_RUN ? '[MODO SIMULAÇÃO]' : '[MODO REAL]'}\n`);

  if (!db) {
    console.error('❌ Banco de dados não inicializado. Verifique as credenciais no .env');
    process.exit(1);
  }

  const snapshot = await db.collection(COLLECTION).get();
  const total = snapshot.docs.length;

  console.log(`Total de documentos encontrados: ${total}\n`);

  let processados = 0;
  let atualizados = 0;
  let semAlteracao = 0;
  let erros = 0;

  // Processa em blocos para respeitar limite do Firestore (500 ops por batch)
  for (let i = 0; i < snapshot.docs.length; i += BATCH_SIZE) {
    const lote = snapshot.docs.slice(i, i + BATCH_SIZE);
    const batch = db.batch();
    let loteComAlteracao = false;

    for (const doc of lote) {
      try {
        const data = doc.data();
        const update: Record<string, unknown> = {};

        // --- Normalizar insights_estrategicos ---
        const insightsNormalizados = normalizeInsights(data.insights_estrategicos);
        const precisaNormalizar =
          !Array.isArray(data.insights_estrategicos) ||
          (Array.isArray(data.insights_estrategicos) &&
            data.insights_estrategicos.some((i: unknown) => typeof i === 'string'));

        if (precisaNormalizar) {
          update.insights_estrategicos = insightsNormalizados;
        }

        // --- Adicionar score_proximo_passo se ausente ---
        if (
          data.score_proximo_passo === undefined ||
          data.score_proximo_passo === null
        ) {
          const dominio = data.score_dominio ?? 0;
          const dor = data.score_dor ?? 0;
          const inferido = Math.min(Math.max(0, 10 - dominio - dor), 2);
          update.score_proximo_passo = inferido;
        }

        // --- Adicionar campos ausentes com defaults seguros ---
        if (data.status_final === undefined) update.status_final = null;
        if (data.alertas === undefined) update.alertas = [];
        if (data.ponto_atencao === undefined) update.ponto_atencao = '';
        if (data.pontos_fortes === undefined) update.pontos_fortes = [];
        if (data.perguntas_sugeridas === undefined) update.perguntas_sugeridas = [];
        if (data.analise_escuta === undefined) update.analise_escuta = '';
        if (data.nome_do_lead === undefined) update.nome_do_lead = '';
        if (data.mensagem_final_sdr === undefined) update.mensagem_final_sdr = '';

        if (Object.keys(update).length > 0) {
          if (!DRY_RUN) {
            batch.update(doc.ref, update);
            loteComAlteracao = true;
          }
          atualizados++;
          if (DRY_RUN) {
            console.log(`[DRY RUN] Documento ${doc.id} seria atualizado:`, JSON.stringify(update));
          }
        } else {
          semAlteracao++;
        }

        processados++;
      } catch (err) {
        console.error(`Erro no documento ${doc.id}:`, err);
        erros++;
      }
    }

    if (loteComAlteracao && !DRY_RUN) {
      await batch.commit();
    }

    console.log(
      `Lote ${Math.floor(i / BATCH_SIZE) + 1} concluído — ` +
      `${processados}/${total} processados`
    );
  }

  console.log('\n--- Resultado Final ---');
  console.log(`Total processados:      ${processados}`);
  console.log(`Documentos atualizados: ${atualizados}`);
  console.log(`Sem alteração:           ${semAlteracao}`);
  console.log(`Erros:                   ${erros}`);
  console.log(`\nMigração concluída. ${DRY_RUN ? '(Nada foi gravado)' : ''}`);
  process.exit(0);
}

run().catch((err) => {
  console.error('Falha crítica na migração:', err);
  process.exit(1);
});
