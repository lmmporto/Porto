import { db } from '../firebase.js';

async function assignTeams() {
  const elite = [
    'amaranta.vieira@nibo.com.br',
    'andriel.mateus@nibo.com.br',
    'bruno.rezende@nibo.com.br',
    'elder.fernando@nibo.com.br',
    'italo.xavier@nibo.com.br',
    'mateus.braga@nibo.com.br'
  ];

  for (const email of elite) {
    await db.collection('sdr_registry').doc(email).set({
      team: 'Time Lucas'
    }, { merge: true });
    console.log(`Assigned ${email} to Time Lucas`);
  }
  process.exit(0);
}
assignTeams();
