async function sanitizeStats() {
  const snapshot = await db.collection('sdr_stats').get();
  const map = new Map();

  // 1. Agrupa tudo por e-mail
  for (const doc of snapshot.docs) {
    const data = doc.data();
    if (!data.ownerEmail) continue; // Pula quem não tem e-mail

    const email = data.ownerEmail.toLowerCase().trim();
    if (!map.has(email)) {
      map.set(email, { ...data, id: doc.id });
    } else {
      // Soma os dados dos duplicados
      const existing = map.get(email);
      existing.totalCalls += (data.totalCalls || 0);
      existing.totalScore += (data.totalScore || 0);
      existing.averageScore = existing.totalScore / existing.totalCalls;
      await doc.ref.delete(); // Deleta o duplicado
    }
  }

  // 2. Salva os únicos e limpos
  for (const [email, data] of map) {
    if (isNaN(data.averageScore)) data.averageScore = 0;
    await db.collection('sdr_stats').doc(email.replace(/[^a-zA-Z0-9]/g, "_")).set(data);
  }
  console.log("✅ Base saneada com sucesso!");
}