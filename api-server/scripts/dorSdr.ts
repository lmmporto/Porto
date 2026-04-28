import fs from 'node:fs';
import path from 'node:path';
import admin from 'firebase-admin';
import { db } from '../src/firebase.js';

enum GapCategory {
  EXPLORACAO_DOR = 'EXPLORACAO_DOR',
  CONTROLE_CONVERSA = 'CONTROLE_CONVERSA',
  PROXIMO_PASSO = 'PROXIMO_PASSO',
  RAPPORT = 'RAPPORT',
  OBJECOES = 'OBJECOES',
  QUALIFICACAO = 'QUALIFICACAO',
  FIT_PRODUTO = 'FIT_PRODUTO',
}

type MigrationMode = 'migrate' | 'rollback';

type GapExtractionSource =
  | 'MAIOR_DIFICULDADE'
  | 'INSIGHT_NEGATIVE'
  | 'SCORE_DOR'
  | 'SCORE_DOMINIO'
  | 'ANALISE_ESCUTA'
  | 'PLAYBOOK_DIAGNOSTICO';

interface ExtractedGap {
  category: GapCategory;
  source: GapExtractionSource;
  evidence: string;
  signals: number;
}

interface RollbackEntry {
  callDocId: string;
  callId: string | null;
  previousGapCategories: unknown;
  previousMigration: unknown;
  newGapCategories: GapCategory[];
  migratedAtIso: string;
}

const COLLECTION = process.env.CALLS_COLLECTION || 'calls_analysis';
const DRY_RUN = process.env.DRY_RUN !== 'false';
const LIMIT = Number(process.env.LIMIT || 20);
const ONLY_CALL_ID = process.env.ONLY_CALL_ID || '';
const MODE: MigrationMode = process.env.MODE === 'rollback' ? 'rollback' : 'migrate';
const ROLLBACK_FILE = process.env.ROLLBACK_FILE || path.resolve(process.cwd(), 'gap-categories-rollback.jsonl');
const MIGRATION_VERSION = 'gap_categories_v1_rule_engine';
const BATCH_SIZE = Math.min(Number(process.env.BATCH_SIZE || 100), 500);

function assertSafeEnv(): void {
  if (!Number.isFinite(LIMIT) || LIMIT <= 0) {
    throw new Error('LIMIT precisa ser um número maior que zero. Exemplo: LIMIT=20');
  }

  if (LIMIT > 500 && DRY_RUN) {
    console.warn('⚠️ DRY_RUN com LIMIT alto. Ok, mas revise a saída com cuidado.');
  }

  if (LIMIT > 500 && !process.env.CONFIRM_LARGE_RUN) {
    throw new Error('Para LIMIT > 500, defina CONFIRM_LARGE_RUN=true.');
  }
}

function normalizeText(value: unknown): string {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function compactEvidence(value: unknown): string {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 220);
}

function matchGap(raw: unknown): GapCategory | null {
  const text = normalizeText(raw);

  if (!text) return null;

  if (
    text.includes('dor') ||
    text.includes('impacto') ||
    text.includes('problema') ||
    text.includes('necessidade') ||
    text.includes('exploracao') ||
    text.includes('aprofund') ||
    text.includes('superficial') ||
    text.includes('spin')
  ) {
    return GapCategory.EXPLORACAO_DOR;
  }

  if (
    text.includes('controle') ||
    text.includes('conducao') ||
    text.includes('conduzir') ||
    text.includes('reativ') ||
    text.includes('passiv') ||
    text.includes('perdeu') ||
    text.includes('direcion') ||
    text.includes('dominio')
  ) {
    return GapCategory.CONTROLE_CONVERSA;
  }

  if (
    text.includes('proximo passo') ||
    text.includes('proxima etapa') ||
    text.includes('agenda') ||
    text.includes('agendar') ||
    text.includes('reuniao') ||
    text.includes('compromisso') ||
    text.includes('follow') ||
    text.includes('retorno') ||
    text.includes('avanco') ||
    text.includes('avancar')
  ) {
    return GapCategory.PROXIMO_PASSO;
  }

  if (
    text.includes('rapport') ||
    text.includes('conexao') ||
    text.includes('empatia') ||
    text.includes('confianca') ||
    text.includes('relacionamento') ||
    text.includes('acolhimento')
  ) {
    return GapCategory.RAPPORT;
  }

  if (
    text.includes('objecao') ||
    text.includes('objecoes') ||
    text.includes('resistencia') ||
    text.includes('bloqueio') ||
    text.includes('preco') ||
    text.includes('caro') ||
    text.includes('concorrente') ||
    text.includes('sem interesse')
  ) {
    return GapCategory.OBJECOES;
  }

  if (
    text.includes('qualificacao') ||
    text.includes('qualificar') ||
    text.includes('perfil') ||
    text.includes('cenario') ||
    text.includes('momento') ||
    text.includes('potencial') ||
    text.includes('tamanho') ||
    text.includes('fit do lead')
  ) {
    return GapCategory.QUALIFICACAO;
  }

  if (
    text.includes('produto') ||
    text.includes('solucao') ||
    text.includes('ferramenta') ||
    text.includes('fit produto') ||
    text.includes('aderencia') ||
    text.includes('valor') ||
    text.includes('beneficio')
  ) {
    return GapCategory.FIT_PRODUTO;
  }

  return null;
}

function addGap(
  bucket: Map<GapCategory, ExtractedGap>,
  category: GapCategory | null,
  source: GapExtractionSource,
  evidence: unknown
): void {
  if (!category) return;

  const existing = bucket.get(category);
  if (existing) {
    existing.signals++;
    return;
  }

  bucket.set(category, {
    category,
    source,
    evidence: compactEvidence(evidence),
    signals: 1,
  });
}

function extractGaps(call: FirebaseFirestore.DocumentData): ExtractedGap[] {
  const gaps = new Map<GapCategory, ExtractedGap>();

  if (Array.isArray(call.maior_dificuldade)) {
    for (const item of call.maior_dificuldade) {
      addGap(gaps, matchGap(item), 'MAIOR_DIFICULDADE', item);
    }
  }

  if (Array.isArray(call.insights_estrategicos)) {
    for (const insight of call.insights_estrategicos) {
      if (insight?.type === 'negative') {
        addGap(gaps, matchGap(`${insight.label || ''} ${insight.value || ''}`), 'INSIGHT_NEGATIVE', insight.label || insight.value);
      }
    }
  }

  if (typeof call.score_dor === 'number' && call.score_dor < 5) {
    addGap(gaps, GapCategory.EXPLORACAO_DOR, 'SCORE_DOR', `score_dor=${call.score_dor}`);
  }

  if (typeof call.score_dominio === 'number' && call.score_dominio < 5) {
    addGap(gaps, GapCategory.CONTROLE_CONVERSA, 'SCORE_DOMINIO', `score_dominio=${call.score_dominio}`);
  }

  if (typeof call.analise_escuta === 'string') {
    addGap(gaps, matchGap(call.analise_escuta), 'ANALISE_ESCUTA', call.analise_escuta);
  }

  if (Array.isArray(call.playbook_detalhado)) {
    for (const item of call.playbook_detalhado) {
      const evidence = `${item?.diagnostico_curto || ''} ${item?.diagnostico_expandido || ''} ${item?.recomendacao || ''}`;
      addGap(gaps, matchGap(evidence), 'PLAYBOOK_DIAGNOSTICO', evidence);
    }
  }

  // Ordenar por número de sinais (frequência) decrescente
  return Array.from(gaps.values()).sort((a, b) => b.signals - a.signals);
}

function getCallId(data: FirebaseFirestore.DocumentData, docId: string): string | null {
  return data.callId ? String(data.callId) : data.id ? String(data.id) : docId || null;
}

function appendRollbackEntry(entry: RollbackEntry): void {
  fs.appendFileSync(ROLLBACK_FILE, `${JSON.stringify(entry)}\n`, 'utf8');
}

async function loadTargetDocs(): Promise<FirebaseFirestore.QueryDocumentSnapshot[]> {
  let query: FirebaseFirestore.Query = db.collection(COLLECTION);

  if (ONLY_CALL_ID) {
    query = query.where('callId', '==', ONLY_CALL_ID).limit(1);
  } else {
    query = query.limit(LIMIT);
  }

  const snapshot = await query.get();
  return snapshot.docs;
}

async function migrate(): Promise<void> {
  assertSafeEnv();

  console.log('🚀 Migração segura de gap_categories');
  console.log({ COLLECTION, DRY_RUN, LIMIT, ONLY_CALL_ID: ONLY_CALL_ID || null, ROLLBACK_FILE, BATCH_SIZE });

  const docs = await loadTargetDocs();
  let batch = db.batch();
  let batchCount = 0;
  let scanned = 0;
  let skippedAlreadyMigrated = 0;
  let skippedNoGap = 0;
  let prepared = 0;
  let committed = 0;

  for (const doc of docs) {
    scanned++;
    const data = doc.data();
    const callId = getCallId(data, doc.id);

    if (Array.isArray(data.gap_categories) && data.gap_categories.length > 0) {
      skippedAlreadyMigrated++;
      console.log(`⏭️  ${doc.id} já tem gap_categories. Pulando.`);
      continue;
    }

    const extracted = extractGaps(data);
    const categories = extracted.map((gap) => gap.category);

    if (categories.length === 0) {
      skippedNoGap++;
      console.log(`⚪ ${doc.id} sem gap detectado.`);
      continue;
    }

    const rollbackEntry: RollbackEntry = {
      callDocId: doc.id,
      callId,
      previousGapCategories: data.gap_categories ?? null,
      previousMigration: data.migration ?? null,
      newGapCategories: categories,
      migratedAtIso: new Date().toISOString(),
    };

    console.log('----------------------------------------');
    console.log(`📞 doc=${doc.id} callId=${callId}`);
    console.log('Antigo maior_dificuldade:', JSON.stringify(data.maior_dificuldade || []));
    console.log('Novo gap_categories:', JSON.stringify(categories));
    console.log('Evidências:', JSON.stringify(extracted));

    prepared++;

    if (DRY_RUN) continue;

    appendRollbackEntry(rollbackEntry);

    batch.set(
      doc.ref,
      {
        gap_categories: categories,
        gap_category_evidence: extracted,
        migration: {
          ...(typeof data.migration === 'object' && data.migration ? data.migration : {}),
          gapCategoriesVersion: MIGRATION_VERSION,
          gapCategoriesSource: 'RULE_ENGINE',
          gapCategoriesMigratedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
      },
      { merge: true }
    );

    batchCount++;

    if (batchCount >= BATCH_SIZE) {
      await batch.commit();
      committed += batchCount;
      console.log(`✅ Commit parcial: ${committed}`);
      batch = db.batch();
      batchCount = 0;
    }
  }

  if (!DRY_RUN && batchCount > 0) {
    await batch.commit();
    committed += batchCount;
  }

  console.log('========================================');
  console.log('🏁 Migração finalizada');
  console.log({ scanned, prepared, committed, skippedAlreadyMigrated, skippedNoGap, dryRun: DRY_RUN });

  if (DRY_RUN) {
    console.log('🧪 DRY_RUN=true: nenhuma escrita foi feita. Rode DRY_RUN=false quando validar a amostra.');
  } else {
    console.log(`🛡️ Rollback local salvo em: ${ROLLBACK_FILE}`);
  }
}

async function rollback(): Promise<void> {
  assertSafeEnv();

  if (!fs.existsSync(ROLLBACK_FILE)) {
    throw new Error(`Arquivo de rollback não encontrado: ${ROLLBACK_FILE}`);
  }

  const lines = fs.readFileSync(ROLLBACK_FILE, 'utf8').split('\n').filter(Boolean).slice(0, LIMIT);
  let batch = db.batch();
  let batchCount = 0;
  let prepared = 0;
  let committed = 0;

  console.log('↩️ Rollback de gap_categories');
  console.log({ COLLECTION, DRY_RUN, LIMIT, ROLLBACK_FILE });

  for (const line of lines) {
    const entry = JSON.parse(line) as RollbackEntry;
    const ref = db.collection(COLLECTION).doc(entry.callDocId);

    console.log(`↩️ doc=${entry.callDocId} callId=${entry.callId}`);
    prepared++;

    if (DRY_RUN) continue;

    const payload: Record<string, unknown> = {
      gap_categories: admin.firestore.FieldValue.delete(),
      gap_category_evidence: admin.firestore.FieldValue.delete(),
      'migration.gapCategoriesVersion': admin.firestore.FieldValue.delete(),
      'migration.gapCategoriesSource': admin.firestore.FieldValue.delete(),
      'migration.gapCategoriesMigratedAt': admin.firestore.FieldValue.delete(),
    };

    if (Array.isArray(entry.previousGapCategories)) {
      payload.gap_categories = entry.previousGapCategories;
    }

    if (entry.previousMigration && typeof entry.previousMigration === 'object') {
      payload.migration = entry.previousMigration;
    }

    batch.set(ref, payload, { merge: true });
    batchCount++;

    if (batchCount >= BATCH_SIZE) {
      await batch.commit();
      committed += batchCount;
      console.log(`✅ Rollback parcial: ${committed}`);
      batch = db.batch();
      batchCount = 0;
    }
  }

  if (!DRY_RUN && batchCount > 0) {
    await batch.commit();
    committed += batchCount;
  }

  console.log('========================================');
  console.log('🏁 Rollback finalizado');
  console.log({ prepared, committed, dryRun: DRY_RUN });
}

async function main(): Promise<void> {
  if (MODE === 'rollback') {
    await rollback();
    return;
  }

  await migrate();
}

main().catch((error) => {
  console.error('❌ Erro no script:', error);
  process.exitCode = 1;
});
