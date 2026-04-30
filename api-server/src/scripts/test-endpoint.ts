async function testEndpoint() {
  const endpoint = 'http://localhost:3000/api/help-chat/perguntar';

  const questions = [
    "Como faço para transferir uma chamada?",
    "Quais relatórios eu consigo ver sobre minhas ligações?",
    "Quem é o dono da empresa e qual a receita anual?"
  ];

  for (const q of questions) {
    console.log(`\n\n--- PERGUNTA: "${q}" ---`);
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q, userId: 'tester-123' })
      });

      const data = await response.json();
      console.log('RESPOSTA:\n' + data.answer);
      console.log('\nFONTES:', data.sources?.map((s: any) => s.title).join(', ') || 'Nenhuma fonte');
      console.log('TEMPO (ms):', data.processingMs);

    } catch (err) {
      console.error('Erro ao chamar API:', err);
    }
  }
}

testEndpoint();
