import { db } from '../src/firebase.js';

const DRY_RUN = process.env.DRY_RUN === 'true';
const BATCH_SIZE = 400;
const COLLECTION = 'sdr_registry';

async function run() {
  console.log(`Iniciando adição do campo extension... ${DRY_RUN ? '[MODO SIMULAÇÃO]' : '[MODO REAL]'}\n`);

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

  for (let i = 0; i < snapshot.docs.length; i += BATCH_SIZE) {
    const lote = snapshot.docs.slice(i, i + BATCH_SIZE);
    const batch = db.batch();
    let loteComAlteracao = false;

    for (const doc of lote) {
      try {
        const data = doc.data();
        const update: Record<string, unknown> = {};

        if (data.extension === undefined) {
          update.extension = null;
        }

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
  console.log(`\nAdição de campo concluída. ${DRY_RUN ? '(Nada foi gravado)' : ''}`);
  process.exit(0);
}

run().catch((err) => {
  console.error('Falha crítica na operação:', err);
  process.exit(1);
});
