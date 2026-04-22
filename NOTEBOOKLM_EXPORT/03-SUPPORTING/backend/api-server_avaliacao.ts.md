# avaliacao.ts

## Visão geral
- Caminho original: `api-server/avaliacao.ts`
- Domínio: **backend**
- Prioridade: **03-SUPPORTING**
- Tipo: **source-file**
- Criticidade: **supporting**
- Score de importância: **50**
- Entry point: **não**
- Arquivo central de fluxo: **não**
- Linhas: **81**
- Imports detectados: **4**
- Exports detectados: **0**
- Funções/classes detectadas: **1**

## Resumo factual
Este arquivo foi classificado como source-file no domínio backend. Criticidade: supporting. Prioridade: 03-SUPPORTING. Funções/classes detectadas: runRecovery. Dependências locais detectadas: ./src/config.js, ./src/firebase.js, ./src/services/processCall.js. Dependências externas detectadas: node:process. Temas relevantes detectados: calls, firebase. Indícios de framework/arquitetura: firebase.

## Dependências locais
- `./src/config.js`
- `./src/firebase.js`
- `./src/services/processCall.js`

## Dependências externas
- `node:process`

## Todos os imports detectados
- `./src/config.js`
- `./src/firebase.js`
- `./src/services/processCall.js`
- `node:process`

## Exports detectados
_Nenhum export detectado_

## Funções e classes detectadas
- `runRecovery`

## Endpoints detectados
_Nenhum padrão de endpoint detectado_

## Variáveis de ambiente detectadas
_Nenhuma variável de ambiente detectada_

## Temas relevantes
- `calls`
- `firebase`

## Indícios de framework/arquitetura
- `firebase`

## Código
```ts
import { loadEnvFile } from 'node:process';
// Carrega o .env automaticamente no Node 20.6+
loadEnvFile(); 

import { db } from "./src/firebase.js";
import { processCall } from "./src/services/processCall.js";
import { CONFIG } from "./src/config.js";

async function runRecovery() {
  console.log("-----------------------------------------");
  console.log("🚀 INICIANDO VARREDURA: FILTRO DE RECUPERAÇÃO");
  console.log("-----------------------------------------");

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  try {
    // Buscamos tudo de hoje para filtrar no código (mais seguro para debug)
    const snapshot = await db.collection(CONFIG.CALLS_COLLECTION)
      .where("updatedAt", ">=", startOfToday)
      .get();

    console.log(`📊 Total de documentos encontrados hoje: ${snapshot.size}`);

    const toProcess = snapshot.docs.filter(doc => {
      const data = doc.data();
      
      // 1. Tratamento de Duração (Aceita segundos ou milissegundos)
      const rawDuration = Number(data.duration || 0);
      // Se for > 120000, entendemos como ms. Se for entre 120 e 10000, entendemos como segundos.
      const isLongEnough = rawDuration >= 120000 || (rawDuration >= 120 && rawDuration < 10000);

      // 2. Checagem de nota mais abrangente (pega null, undefined e string vazia)
      const hasNota = !!data.nota_spin && data.nota_spin.toString().trim() !== "";
      
      // 3. Status de processamento
      const isDone = data.processingStatus === "DONE";

      const valid = isLongEnough && !hasNota;

      // LOG DE DIAGNÓSTICO (Para você ver no terminal por que ele pula)
      if (!valid && rawDuration > 0) {
          // Só logamos se tiver alguma duração, para não poluir o terminal
          // console.log(`[SKIP] ID: ${doc.id} | Dur: ${rawDuration} | TemNota: ${hasNota} | Status: ${data.processingStatus}`);
      }

      return valid;
    });

    console.log(`📋 Pendentes Reais (>= 2min e sem nota): ${toProcess.length} chamadas.`);
    console.log("-----------------------------------------");

    if (toProcess.length === 0) {
        console.log("💡 Nenhuma chamada pendente encontrada com os critérios atuais.");
        console.log("Verifique se o campo no Firestore é 'duration' e se a nota está em 'nota_spin'.");
    }

    for (const doc of toProcess) {
      const data = doc.data();
      const durDisplay = data.duration >= 1000 ? (data.duration / 1000).toFixed(0) : data.duration;
      
      console.log(`\n🔄 Reprocessando: ${doc.id} (Duração: ${durDisplay}s)`);
      
      try {
        const result = await processCall(doc.id);
        console.log(`✅ Resultado: ${result?.reason || "ANÁLISE_CONCLUÍDA"}`);
      } catch (err) {
        console.error(`❌ Erro no ID ${doc.id}:`, err instanceof Error ? err.message : err);
      }
    }

    console.log("\n✨ VARREDURA FINALIZADA!");
    process.exit(0);

  } catch (error) {
    console.error("❌ Erro fatal na varredura:", error);
    process.exit(1);
  }
}

runRecovery();
```
