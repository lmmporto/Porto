import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

async function probeAudio() {
  const callId = "108028575601";
  const token = process.env.HUBSPOT_TOKEN;
  const url = `https://api-na1.hubspot.com/recording/auth/provider/hublets/v1/external-url-retriever/getAuthRecording/portal/1554114/engagement/${callId}`;

  if (!token) {
    console.error("❌ Erro: HUBSPOT_TOKEN não encontrado no .env");
    return;
  }

  console.log(`📡 Sondando Headers para a chamada: ${callId}...`);

  try {
    // Fazemos um HEAD (apenas cabeçalhos) seguindo redirecionamentos
    const response = await axios.head(url, {
      headers: { Authorization: `Bearer ${token}` },
      maxRedirects: 5,
      validateStatus: () => true // Não quebra se der 401/403, queremos ver o erro
    });

    console.log("\n=================================");
    console.log("📊 RELATÓRIO DE CONEXÃO:");
    console.log(`📌 Status Code: ${response.status} ${response.statusText}`);
    console.log(`📁 Content-Type: ${response.headers['content-type']}`);
    console.log(`⚖️  Content-Length: ${response.headers['content-length']} bytes`);
    
    const isHtml = String(response.headers['content-type']).includes('text/html');
    const size = parseInt(response.headers['content-length'] || '0');

    if (response.status === 200 && !isHtml && size > 1000) {
      console.log("✅ CAMINHO LIVRE: O servidor consegue baixar o áudio real.");
    } else if (isHtml) {
      console.log("❌ BLOQUEIO: O HubSpot devolveu uma página HTML (provavelmente erro de login/permissão).");
    } else {
      console.log("⚠️ ALERTA: Resposta suspeita. O arquivo pode estar vazio ou o token é insuficiente.");
    }
    console.log("=================================\n");

  } catch (error: any) {
    console.error("❌ Erro fatal na sonda:", error.message);
  }
}

probeAudio();