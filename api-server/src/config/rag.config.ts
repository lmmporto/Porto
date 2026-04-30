// As variáveis são carregadas pelo config.ts principal via dotenv.config()
// Não precisamos carregar novamente aqui.

export const ragConfig = {
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  googleAiApiKey: process.env.GOOGLE_AI_API_KEY || '',
  chunkSize: parseInt(process.env.RAG_CHUNK_SIZE || '500', 10),
  chunkOverlap: parseInt(process.env.RAG_CHUNK_OVERLAP || '50', 10),
  topK: parseInt(process.env.RAG_TOP_K || '5', 10),
  similarityThreshold: parseFloat(process.env.RAG_SIMILARITY_THRESHOLD || '0.75'),
};

export function validateRagConfig() {
  const missing: string[] = [];

  if (!ragConfig.supabaseUrl) missing.push('SUPABASE_URL');
  if (!ragConfig.supabaseServiceKey) missing.push('SUPABASE_SERVICE_ROLE_KEY');

  // Verifica se chave não existe ou ainda é o placeholder
  if (!ragConfig.googleAiApiKey || ragConfig.googleAiApiKey.includes('cole_sua_api_key_do_google_aqui')) {
    missing.push('GOOGLE_AI_API_KEY');
  }

  if (missing.length > 0) {
    throw new Error(`[RAG Config Error] Falha de validação. Variáveis faltando ou não configuradas: ${missing.join(', ')}`);
  }

  console.log('✅ RAG Config carregada e validada com sucesso.');
}
