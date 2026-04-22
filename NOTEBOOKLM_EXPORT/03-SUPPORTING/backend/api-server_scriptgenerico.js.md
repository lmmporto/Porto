# scriptgenerico.js

## Visão geral
- Caminho original: `api-server/scriptgenerico.js`
- Domínio: **backend**
- Prioridade: **03-SUPPORTING**
- Tipo: **source-file**
- Criticidade: **supporting**
- Score de importância: **50**
- Entry point: **não**
- Arquivo central de fluxo: **não**
- Linhas: **100**
- Imports detectados: **1**
- Exports detectados: **0**
- Funções/classes detectadas: **1**

## Resumo factual
Este arquivo foi classificado como source-file no domínio backend. Criticidade: supporting. Prioridade: 03-SUPPORTING. Funções/classes detectadas: fullScan. Dependências locais detectadas: ./src/firebase.js. Temas relevantes detectados: analysis, calls, dashboard, firebase, ranking, sdr, stats. Indícios de framework/arquitetura: firebase.

## Dependências locais
- `./src/firebase.js`

## Dependências externas
_Nenhuma dependência externa detectada_

## Todos os imports detectados
- `./src/firebase.js`

## Exports detectados
_Nenhum export detectado_

## Funções e classes detectadas
- `fullScan`

## Endpoints detectados
_Nenhum padrão de endpoint detectado_

## Variáveis de ambiente detectadas
_Nenhuma variável de ambiente detectada_

## Temas relevantes
- `analysis`
- `calls`
- `dashboard`
- `firebase`
- `ranking`
- `sdr`
- `stats`

## Indícios de framework/arquitetura
- `firebase`

## Código
```js
import { db } from './src/firebase.js';

async function fullScan() {
  console.log("🧹 Iniciando VARREDURA COMPLETA do histórico...");

  try {
    // 1. Busca TUDO de uma vez (1 leitura por documento existente)
    // Se você tem 1.200 docs, gasta 1.200 leituras. É seguro para sua cota de 50k.
    const snapshot = await db.collection('calls_analysis').get();

    if (snapshot.empty) {
      console.log("❌ Nenhuma ligação encontrada.");
      return;
    }

    console.log(`📊 Encontrados ${snapshot.size} registros. Processando métricas...`);

    const dailyStats = {};

    snapshot.forEach(doc => {
      const data = doc.data();
      
      // Define a data (AAAA-MM-DD)
      const dateObj = data.analyzedAt?.toDate() || data.updatedAt?.toDate() || new Date();
      const dateStr = dateObj.toISOString().split('T')[0];

      // Inicializa o dia no nosso mapa se não existir
      if (!dailyStats[dateStr]) {
        dailyStats[dateStr] = {
          total_calls: 0,
          connected_calls: 0,
          analyzed_calls: 0,
          sum_notes: 0,
          valid_calls_for_media: 0,
          count_aprovado: 0,
          count_atencao: 0,
          count_reprovado: 0,
          sdr_ranking: {}
        };
      }

      const day = dailyStats[dateStr];
      const sdrName = data.ownerName || "Desconhecido";

      // --- Métrica 1: Volume Total ---
      day.total_calls++;

      // --- Métrica 2: Atendidas (Conexão ou Duração > 0) ---
      if (data.wasConnected || (data.durationMs && data.durationMs > 0)) {
        day.connected_calls++;
      }

      // --- Métrica 3: Performance (Apenas se foi analisada com nota) ---
      if (data.processingStatus === 'DONE') {
        day.analyzed_calls++;
        
        const isRotaC = data.status_final === 'NAO_SE_APLICA';
        const nota = Number(data.nota_spin || 0);

        if (!isRotaC) {
          day.valid_calls_for_media++;
          day.sum_notes += nota;
        }

        // Contadores de Status
        if (data.status_final === 'APROVADO') day.count_aprovado++;
        if (data.status_final === 'ATENCAO') day.count_atencao++;
        if (data.status_final === 'REPROVADO') day.count_reprovado++;

        // Ranking SDR
        if (!day.sdr_ranking[sdrName]) {
          day.sdr_ranking[sdrName] = { total: 0, valid_count: 0, sum_notes: 0 };
        }
        day.sdr_ranking[sdrName].total++;
        if (!isRotaC) {
          day.sdr_ranking[sdrName].valid_count++;
          day.sdr_ranking[sdrName].sum_notes += nota;
        }
      }
    });

    // 2. Grava os resultados no Cofre (1 escrita por dia encontrado)
    console.log("💾 Gravando resumos no Cofre...");
    for (const [date, stats] of Object.entries(dailyStats)) {
      await db.collection('dashboard_stats').doc(date).set({
        ...stats,
        date,
        updatedAt: new Date()
      });
      console.log(`✅ Dia ${date} consolidado.`);
    }

    console.log("\n✨ VARREDURA FINALIZADA COM SUCESSO!");

  } catch (error) {
    console.error("❌ Erro na varredura:", error.message);
  }
}

fullScan();
```
