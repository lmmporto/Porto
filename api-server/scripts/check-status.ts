import { db } from '../src/firebase.js';
import { CONFIG } from '../src/config.js';

async function checkStatus() {
  const callId = '108493460994';
  const doc = await db.collection(CONFIG.CALLS_COLLECTION || 'calls_analysis').doc(callId).get();
  if (doc.exists) {
    console.log(`STATUS: ${doc.data().processingStatus}`);
  } else {
    console.log('NOT FOUND');
  }
  process.exit(0);
}

checkStatus();
