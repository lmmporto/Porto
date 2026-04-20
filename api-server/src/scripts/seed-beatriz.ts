import 'dotenv/config';
import { db } from '../firebase.js';
import admin from 'firebase-admin';

const { FieldValue } = admin.firestore;

/**
 * ============================================================
 * AJUSTES SIMPLES
 * ============================================================
 */

/* Quantidade de SDRs fictícios */
const TOTAL_SDRS = 18;

/* Data usada no dashboard diário */
const DASHBOARD_DATE = '2026-04-17';

/**
 * ============================================================
 * GERADOR DE SDRs DE TESTE
 * ============================================================
 */

function random(min: number, max: number) {
  return Number((Math.random() * (max - min) + min).toFixed(2));
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min) + min);
}

function generateTestSdr(index: number) {
  return {
    id: `sdr_teste_${index}`,
    nome: `SDR Teste ${index}`,
    email: `sdr${index}@teste.com`,
    media_dominio: random(3, 10),
    media_dor: random(3, 10),
    ranking_score: random(6, 10),
    total_calls: randomInt(8, 40),
    duracao_media: `${randomInt(5, 12)}:${randomInt(10, 59)}`
  };
}

/**
 * ============================================================
 * DASHBOARD DATA
 * ============================================================
 */

const GLOBAL_SUMMARY = {
  total_calls: 240,
  total_revenue_opportunity: 920000,
  average_score: 8.21,

  recurrent_gaps: {
    "Pitch Prematuro": 14,
    "Falta de Investigação": 11,
    "Perguntas Superficiais": 9,
    "Pouca Exploração de Impacto": 6
  },

  top_strengths: {
    "Empatia": 20,
    "Boa Condução": 15,
    "Escuta Ativa": 12,
    "Abertura Forte": 9
  },

  duracao_media: "08:42",

  updatedAt: FieldValue.serverTimestamp()
};

const DAILY_SUMMARY = {
  date: DASHBOARD_DATE,

  total_calls: 37,
  total_revenue_opportunity: 180000,
  average_score: 8.44,

  recurrent_gaps: {
    "Pitch Prematuro": 6,
    "Falta de Investigação": 4,
    "Perguntas Superficiais": 3
  },

  top_strengths: {
    "Empatia": 8,
    "Boa Condução": 6,
    "Escuta Ativa": 4
  },

  duracao_media: "08:42",

  updatedAt: FieldValue.serverTimestamp()
};

/**
 * ============================================================
 * LIMPEZA
 * ============================================================
 */

async function clearCollection(collectionName: string) {
  const snapshot = await db.collection(collectionName).get();

  if (snapshot.empty) return;

  const batch = db.batch();

  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });

  await batch.commit();
}

/**
 * ============================================================
 * SEED SDRs
 * ============================================================
 */

async function seedSdrs() {
  console.log("🚀 Gerando SDRs fictícios...");

  for (let i = 1; i <= TOTAL_SDRS; i++) {
    const sdr = generateTestSdr(i);

    await db.collection("sdrs").doc(sdr.id).set({
      nome: sdr.nome,
      name: sdr.nome,

      email: sdr.email,
      ownerEmail: sdr.email,

      media_dominio: sdr.media_dominio,
      media_dor: sdr.media_dor,

      ranking_score: sdr.ranking_score,

      total_calls: sdr.total_calls,
      duracao_media: sdr.duracao_media,

      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    });

    console.log(
      `SDR criado → ${sdr.nome} | domínio ${sdr.media_dominio} | dor ${sdr.media_dor}`
    );
  }
}

/**
 * ============================================================
 * SEED DASHBOARD
 * ============================================================
 */

async function seedDashboard() {
  console.log("📊 Criando dashboard global...");

  await db.collection("dashboard_stats")
    .doc("global_summary")
    .set(GLOBAL_SUMMARY);

  console.log("📅 Criando dashboard diário...");

  await db.collection("dashboard_stats")
    .doc(DASHBOARD_DATE)
    .set(DAILY_SUMMARY);
}

/**
 * ============================================================
 * EXECUÇÃO
 * ============================================================
 */

async function runSeed() {

  console.log("🧹 Limpando SDRs antigos...");
  await clearCollection("sdrs");

  await seedSdrs();

  await seedDashboard();

  console.log("✅ Banco populado com dados de teste.");
}

runSeed();