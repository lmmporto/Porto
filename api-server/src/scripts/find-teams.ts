import { db } from '../firebase.js';

async function findTeams() {
  const snap = await db.collection('sdr_registry').get();
  const withTeam = snap.docs.filter(d => d.data().team || d.data().squad || d.data().teamName);
  console.log(`Encontrados ${withTeam.length} SDRs com equipe.`);
  withTeam.forEach(d => {
    console.log(`SDR: ${d.id} | Equipe: ${d.data().team || d.data().squad || d.data().teamName}`);
  });
  process.exit(0);
}
findTeams();
