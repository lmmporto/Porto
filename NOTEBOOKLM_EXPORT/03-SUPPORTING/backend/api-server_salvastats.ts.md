# salvastats.ts

## Visão geral
- Caminho original: `api-server/salvastats.ts`
- Domínio: **backend**
- Prioridade: **03-SUPPORTING**
- Tipo: **source-file**
- Criticidade: **supporting**
- Score de importância: **50**
- Entry point: **não**
- Arquivo central de fluxo: **não**
- Linhas: **30**
- Imports detectados: **2**
- Exports detectados: **0**
- Funções/classes detectadas: **1**

## Resumo factual
Este arquivo foi classificado como source-file no domínio backend. Criticidade: supporting. Prioridade: 03-SUPPORTING. Funções/classes detectadas: auditStats. Dependências locais detectadas: ../firebase.js. Dependências externas detectadas: dotenv/config. Temas relevantes detectados: calls, email, firebase, ranking, sdr, stats. Indícios de framework/arquitetura: firebase.

## Dependências locais
- `../firebase.js`

## Dependências externas
- `dotenv/config`

## Todos os imports detectados
- `../firebase.js`
- `dotenv/config`

## Exports detectados
_Nenhum export detectado_

## Funções e classes detectadas
- `auditStats`

## Endpoints detectados
_Nenhum padrão de endpoint detectado_

## Variáveis de ambiente detectadas
_Nenhuma variável de ambiente detectada_

## Temas relevantes
- `calls`
- `email`
- `firebase`
- `ranking`
- `sdr`
- `stats`

## Indícios de framework/arquitetura
- `firebase`

## Código
```ts

import 'dotenv/config';
import { db } from "../firebase.js";

async function auditStats() {
  console.log("🔍 Auditando coleção 'sdr_stats'...");
  
  const snapshot = await db.collection('sdr_stats')
    .orderBy('averageScore', 'desc')
    .get();

  if (snapshot.empty) {
    console.log("❌ Coleção 'sdr_stats' está vazia!");
    return;
  }

  console.log(`✅ Encontrados ${snapshot.size} SDRs no ranking.`);
  
  snapshot.docs.forEach((doc, i) => {
    const data = doc.data();
    console.log(`
    ${i + 1}. Nome: ${data.ownerName}
       E-mail: ${data.ownerEmail}
       Nota Média: ${data.averageScore}
       Total Chamadas: ${data.totalCalls}
    -----------------------------------`);
  });
}

auditStats().catch(console.error);
```
