import { db } from '../firebase.js';

async function listRegistry() {
  const snap = await db.collection('sdr_registry').get();
  snap.docs.forEach(d => {
    console.log(`ID: ${d.id} | Data: ${JSON.stringify(d.data())}`);
  });
  process.exit(0);
}
listRegistry();
