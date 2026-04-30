import { db } from '../src/firebase.js';
import { CallProcessingOrchestrator } from '../src/services/call-processing.orchestrator.js';

async function testCall() {
  const callId = "108123543358"; 
  console.log(`Forcing reprocess of call ${callId}`);
  
  // Clear the lock and cache
  await db.collection('calls_analysis').doc(callId).update({
    processingStatus: 'QUEUED',
    processingWorkerId: null,
    analyzedAt: null,
    lastAnalysisVersion: null,
    lastTranscriptHash: null
  });

  const result = await CallProcessingOrchestrator.processCall(callId, "test_worker_123");
  console.log("Result:", result);
  process.exit(0);
}

testCall().catch(console.error);
