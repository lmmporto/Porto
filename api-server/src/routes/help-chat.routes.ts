import { Router, Request, Response } from 'express';
import { ragService } from '../services/rag.service.js';

const router = Router();

// Endpoint do chatbot RAG
router.post('/perguntar', async (req: Request, res: Response): Promise<any> => {
  const startTime = Date.now();

  try {
    const { query, userId } = req.body;

    // Validação de input
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return res.status(400).json({ error: 'A pergunta (query) não pode estar vazia.' });
    }

    if (query.length > 500) {
      return res.status(400).json({ error: 'A pergunta não pode exceder 500 caracteres.' });
    }

    // 1. Embedding da pergunta
    const embedding = await ragService.embedQuery(query);

    // 2. Busca de chunks
    const chunks = await ragService.retrieveChunks(embedding);

    // 3. Montar Prompt
    const prompt = ragService.buildPrompt(query, chunks);

    // 4. Gerar resposta com LLM
    const answer = await ragService.generateAnswer(prompt);

    // 5. Salvar histórico
    const chunkIds = chunks.map(c => c.id);
    const queryId = await ragService.saveQuery({
      userId,
      query,
      response: answer,
      chunkIds
    });

    const processingMs = Date.now() - startTime;

    // Formatando as fontes (sem duplicar artigos)
    // O banco já traz article_title e article_url
    const uniqueArticleIds = Array.from(new Set(chunks.map(c => c.article_id)));
    const sources = uniqueArticleIds.map(articleId => {
      const chunk = chunks.find(c => c.article_id === articleId)!;
      return {
        id: chunk.article_id,
        title: chunk.article_title,
        url: chunk.article_url,
        content: chunk.content
      };
    });

    return res.json({
      answer,
      sources,
      queryId,
      processingMs
    });

  } catch (error: any) {
    console.error('Erro na rota /perguntar:', error);
    return res.status(500).json({ error: 'Ocorreu um erro interno ao processar sua pergunta.', details: error.message || String(error) });
  }
});

// Endpoint para salvar feedback (👍 ou 👎)
router.post('/feedback', async (req: Request, res: Response): Promise<any> => {
  try {
    const { queryId, rating, comment } = req.body;

    if (!queryId || (rating !== 1 && rating !== -1)) {
      return res.status(400).json({ error: 'Parâmetros inválidos. Necessário queryId e rating (1 ou -1).' });
    }

    await ragService.saveFeedback({ queryId, rating, comment });
    return res.json({ success: true });
  } catch (error: any) {
    console.error('Erro na rota /feedback:', error);
    return res.status(500).json({ error: 'Ocorreu um erro interno ao salvar feedback.' });
  }
});

export default router;
