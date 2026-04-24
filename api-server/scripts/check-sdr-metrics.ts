import { db } from '../src/firebase.js';

async function main() {
  const email = 'mariana.freitas@nibo.com.br';
  const cleanId = email.replace(/\./g, '_');
  const doc = await db.collection('sdrs').doc(cleanId).get();
  console.log(JSON.stringify(doc.data(), null, 2));
  
  const globalDoc = await db.collection('stats').doc('global_summary').get();
  console.log("Global Summary:", JSON.stringify(globalDoc.data(), null, 2));
  
  process.exit(0);
}
main();
