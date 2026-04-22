# limpeza.js

## Visão geral
- Caminho original: `api-server/limpeza.js`
- Domínio: **backend**
- Prioridade: **03-SUPPORTING**
- Tipo: **source-file**
- Criticidade: **supporting**
- Score de importância: **50**
- Entry point: **não**
- Arquivo central de fluxo: **não**
- Linhas: **53**
- Imports detectados: **2**
- Exports detectados: **0**
- Funções/classes detectadas: **1**

## Resumo factual
Este arquivo foi classificado como source-file no domínio backend. Criticidade: supporting. Prioridade: 03-SUPPORTING. Funções/classes detectadas: cleanStains. Dependências locais detectadas: ./src/config.ts, ./src/firebase.ts. Temas relevantes detectados: calls, firebase. Indícios de framework/arquitetura: firebase.

## Dependências locais
- `./src/config.ts`
- `./src/firebase.ts`

## Dependências externas
_Nenhuma dependência externa detectada_

## Todos os imports detectados
- `./src/config.ts`
- `./src/firebase.ts`

## Exports detectados
_Nenhum export detectado_

## Funções e classes detectadas
- `cleanStains`

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
```js
import { db } from './src/firebase.ts';
import { CONFIG } from './src/config.ts';; // Importando para pegar o nome correto da coleção

async function cleanStains() {
  console.log("-----------------------------------------");
  console.log("🧹 INICIANDO LIMPEZA DE NOTAS INDEVIDAS");
  console.log("-----------------------------------------");

  let countCorrigidos = 0;

  try {
    // 1. Limpar as chamadas que caíram na ROTA C (NAO_SE_APLICA)
    const rotaCSnapshot = await db.collection(CONFIG.CALLS_COLLECTION)
      .where('status_final', '==', 'NAO_SE_APLICA')
      .get();

    console.log(`🔍 Encontradas ${rotaCSnapshot.size} chamadas descartadas (Rota C).`);
    
    for (const doc of rotaCSnapshot.docs) {
      if (doc.data().nota_spin === 0) {
        await doc.ref.update({ nota_spin: null });
        console.log(`✅ ID ${doc.id} limpo (Rota C).`);
        countCorrigidos++;
      }
    }

    // 2. Limpar as chamadas que foram puladas por terem menos de 1 minuto (SKIPPED)
    const skippedSnapshot = await db.collection(CONFIG.CALLS_COLLECTION)
      .where('processingStatus', '==', 'SKIPPED_SHORT_CALL')
      .get();

    console.log(`\n🔍 Encontradas ${skippedSnapshot.size} chamadas ignoradas por tempo curto.`);
    
    for (const doc of skippedSnapshot.docs) {
      if (doc.data().nota_spin === 0) {
        await doc.ref.update({ nota_spin: null });
        console.log(`✅ ID ${doc.id} limpo (Tempo Curto).`);
        countCorrigidos++;
      }
    }

    console.log("\n-----------------------------------------");
    console.log(`✨ LIMPEZA CONCLUÍDA! ${countCorrigidos} manchas removidas do histórico.`);
    console.log("-----------------------------------------");
    process.exit(0);

  } catch (error) {
    console.error("❌ ERRO DURANTE A LIMPEZA:", error);
    process.exit(1);
  }
}

cleanStains();
```
