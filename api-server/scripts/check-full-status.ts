import { db } from '../src/firebase.js';

async function main() {
  const doc = await db.collection('calls_analysis').doc('108493460994').get();
  const data = doc.data();
  console.log(JSON.stringify(data, null, 2));
  process.exit(0);
}
main();
