import { db } from '../src/firebase.js';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Script para fazer o dump completo (backup) do banco de dados Firestore.
 * Executa de forma recursiva para capturar tanto as coleções raízes
 * quanto as subcoleções (como o histórico dos SDRs).
 */

async function exportDocument(docRef: FirebaseFirestore.DocumentReference, docData: any): Promise<any> {
  const collections = await docRef.listCollections();
  const subcollectionsData: Record<string, any> = {};
  
  for (const col of collections) {
    subcollectionsData[col.id] = await exportCollection(col);
  }

  // Remove undefined/__subcollections__ se não houver nenhuma
  if (Object.keys(subcollectionsData).length > 0) {
    return {
      ...docData,
      __subcollections__: subcollectionsData
    };
  }

  return docData;
}

async function exportCollection(collectionRef: FirebaseFirestore.CollectionReference): Promise<any> {
  const snapshot = await collectionRef.get();
  const data: Record<string, any> = {};
  
  for (const doc of snapshot.docs) {
    data[doc.id] = await exportDocument(doc.ref, doc.data());
  }
  
  return data;
}

async function runBackup() {
  console.log('📦 Iniciando backup do Firestore...');
  const collections = await db.listCollections();
  const backupData: Record<string, any> = {};

  for (const col of collections) {
    console.log(`🔄 Exportando coleção raiz: ${col.id}...`);
    backupData[col.id] = await exportCollection(col);
    console.log(`✅ Coleção ${col.id} exportada.`);
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(process.cwd(), 'backups');
  
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir);
  }

  const filePath = path.join(backupDir, `firestore_backup_${timestamp}.json`);
  
  fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2), 'utf-8');
  console.log(`\n🎉 Backup concluído com sucesso!`);
  console.log(`📁 Arquivo salvo em: ${filePath}`);
  
  process.exit(0);
}

runBackup().catch((error) => {
  console.error('❌ Erro durante o backup:', error);
  process.exit(1);
});
