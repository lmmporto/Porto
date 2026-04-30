import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ragConfig } from '../config/rag.config.js';

// Lazy initialization — evita crash no boot se env vars ainda não foram carregadas
let _supabase: SupabaseClient | null = null;
let _genAI: GoogleGenerativeAI | null = null;

function getSupabase(): SupabaseClient {
  if (!_supabase) {
    _supabase = createClient(ragConfig.supabaseUrl, ragConfig.supabaseServiceKey);
  }
  return _supabase;
}

function getGenAI(): GoogleGenerativeAI {
  if (!_genAI) {
    _genAI = new GoogleGenerativeAI(ragConfig.googleAiApiKey);
  }
  return _genAI;
}

export interface Chunk {
  id: string;
  article_id: string;
  content: string;
  similarity: number;
  article_title: string;
  article_url: string;
}

export const ragService = {
  // 1. Gera o embedding da pergunta
  async embedQuery(query: string): Promise<number[]> {
    const model = getGenAI().getGenerativeModel({ model: "gemini-embedding-001" });
    const result = await model.embedContent({
      content: { role: "user", parts: [{ text: query }] },
      outputDimensionality: 768
    });
    return result.embedding.values;
  },

  // 2. Busca chunks mais similares no Supabase
  async retrieveChunks(embedding: number[], topK: number = ragConfig.topK): Promise<Chunk[]> {
    const { data, error } = await getSupabase().rpc('match_chunks', {
      query_embedding: embedding,
      match_count: topK,
      similarity_threshold: ragConfig.similarityThreshold
    });

    if (error) {
      console.error('Erro na RPC match_chunks:', error);
      throw new Error('Falha ao buscar contextos no banco vetorial.');
    }

    return data || [];
  },

  // 3. Monta o prompt
  buildPrompt(query: string, chunks: Chunk[]): string {
    if (chunks.length === 0) {
      return `O usuário perguntou: "${query}".\n\nResponda dizendo que você não encontrou informação sobre isso nos artigos de ajuda.`;
    }

    const contextText = chunks.map((c, i) => `[Fonte ${i+1} - ${c.article_title}]: ${c.content}`).join('\n\n');

    return `Você é um assistente virtual de suporte ao cliente especializado em um sistema de gestão de chamadas.
Sua tarefa é responder à pergunta do usuário baseando-se EXCLUSIVAMENTE nos contextos de ajuda fornecidos abaixo.
Se a informação necessária não estiver no contexto, responda que você não encontrou informação sobre isso.

CONTEXTO DOS ARTIGOS DE AJUDA:
${contextText}

PERGUNTA DO USUÁRIO: ${query}

Responda de forma clara, educada e direta. Não mencione as "Fontes" no texto da sua resposta, pois a interface já mostrará os links originais.
`;
  },

  // 4. Gera a resposta com Gemini 2.5 Flash
  async generateAnswer(prompt: string): Promise<string> {
    const model = getGenAI().getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(prompt);
    return result.response.text();
  },

  // 5. Salva o histórico e retorna o ID
  async saveQuery(data: { userId?: string, query: string, response: string, chunkIds: string[] }): Promise<string> {
    const { data: insertedData, error } = await getSupabase()
      .from('chat_queries')
      .insert({
        user_id: data.userId || 'anonymous',
        query: data.query,
        response: data.response,
        chunk_ids: data.chunkIds
      })
      .select('id')
      .single();

    if (error) {
      console.error('Erro ao salvar chat_query:', error);
      return '';
    }

    return insertedData.id;
  },

  // 6. Salva o feedback (👍 ou 👎)
  async saveFeedback(data: { queryId: string, rating: number, comment?: string }) {
    const { error } = await getSupabase()
      .from('query_feedback')
      .insert({
        query_id: data.queryId,
        rating: data.rating,
        comment: data.comment || null
      });

    if (error) {
      console.error('Erro ao salvar feedback:', error);
      throw new Error('Falha ao registrar feedback.');
    }
  }
};
