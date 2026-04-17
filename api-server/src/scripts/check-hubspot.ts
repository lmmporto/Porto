// backend/src/scripts/check-hubspot.ts
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';

// Carrega o .env da raiz do projeto
dotenv.config();

async function checkCall() {
  const callId = "107811340418"; // O ID que estamos investigando
  const token = process.env.HUBSPOT_TOKEN;

  if (!token) {
    console.error("❌ Erro: HUBSPOT_TOKEN não encontrado no .env");
    return;
  }

  console.log(`📡 Consultando HubSpot para a chamada: ${callId}...`);

  try {
    const url = `https://api.hubapi.com/crm/v3/objects/calls/${108028575601}?properties=hs_call_transcript,hs_call_recording_url,hs_call_duration,hs_call_title`;
    
    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const props = response.data.properties;

    console.log("\n=================================");
    console.log("🔍 RESULTADO DA INVESTIGAÇÃO:");
    console.log(`📌 Título: ${props.hs_call_title || 'Sem título'}`);
    console.log(`⏱️ Duração: ${props.hs_call_duration}ms`);
    
    if (props.hs_call_transcript) {
      console.log("✅ TRANSCRIPÇÃO ENCONTRADA!");
      console.log(`📝 Tamanho do texto: ${props.hs_call_transcript.length} caracteres`);
      console.log("📄 Início do texto:", props.hs_call_transcript.substring(0, 100) + "...");
    } else {
      console.log("❌ TRANSCRIPÇÃO VAZIA (hs_call_transcript está nulo ou inexistente)");
    }

    if (props.hs_call_recording_url) {
      console.log("✅ URL DE ÁUDIO ENCONTRADA!");
    } else {
      console.log("❌ URL DE ÁUDIO NÃO ENCONTRADA!");
    }
    console.log("=================================\n");

  } catch (error: any) {
    console.error("❌ Erro na API do HubSpot:", error.response?.status, error.response?.data || error.message);
  }
}

checkCall();
//