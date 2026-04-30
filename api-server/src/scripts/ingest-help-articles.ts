import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';
import { ragConfig, validateRagConfig } from '../config/rag.config';

// 1. Validar e carregar configurações
validateRagConfig();

const supabase = createClient(ragConfig.supabaseUrl, ragConfig.supabaseServiceKey);
const genAI = new GoogleGenerativeAI(ragConfig.googleAiApiKey);

// 5 artigos mock realistas sobre gestão de chamadas
const mockArticles = [
  {
    title: 'Como transferir uma chamada para outro ramal',
    url: '/help/transferencia-chamada',
    content: 'Para transferir uma chamada durante o atendimento, clique no botão "Transferir" localizado no painel superior da tela de ligação. Em seguida, digite o número do ramal desejado ou pesquise pelo nome do colaborador na lista de contatos. Você pode optar por uma "Transferência Cega" (direciona a ligação imediatamente) ou "Transferência Assistida" (permite falar com o outro ramal antes de transferir o cliente). Se o ramal estiver ocupado, a chamada retornará para você em 30 segundos.'
  },
  {
    title: 'Configurando o Correio de Voz (Voicemail)',
    url: '/help/configurar-voicemail',
    content: 'O correio de voz permite que os clientes deixem mensagens quando você não pode atender. Para ativá-lo, acesse Configurações > Preferências de Chamada > Correio de Voz. Você pode gravar uma mensagem personalizada clicando no botão do microfone. Recomendamos incluir seu nome, horário de atendimento e solicitar que o cliente deixe o número de contato. As mensagens de voz recebidas ficarão disponíveis na aba "Mensagens" do seu painel principal, onde você pode ouvi-las ou deletá-las.'
  },
  {
    title: 'Relatórios de Desempenho e Métricas de Chamadas',
    url: '/help/relatorios-desempenho',
    content: 'A aba "Relatórios" fornece insights valiosos sobre sua performance. O "Tempo Médio de Atendimento (TMA)" mostra a duração média das suas ligações, sendo o ideal manter entre 3 e 5 minutos para otimização de tempo. A métrica "Taxa de Resolução na Primeira Chamada (FCR)" indica a porcentagem de problemas resolvidos sem necessidade de ligações de retorno. Você pode filtrar esses relatórios por dia, semana ou mês, e exportá-los para Excel clicando no ícone de download no canto superior direito.'
  },
  {
    title: 'Problemas comuns de áudio: microfone não funciona',
    url: '/help/troubleshooting-audio',
    content: 'Se o cliente não consegue ouvi-lo, primeiro verifique se o botão "Mute" (mudo) não está ativado no seu headset ou no painel de chamada. Em seguida, acesse as Configurações de Áudio do seu navegador clicando no ícone de cadeado na barra de endereço e certifique-se de que a permissão de Microfone está definida como "Permitir". Se o problema persistir, teste desconectar e conectar o headset novamente. Recomendamos usar o Google Chrome para maior estabilidade nas ligações via web.'
  },
  {
    title: 'Adicionando notas e tags durante uma ligação',
    url: '/help/notas-e-tags',
    content: 'Para manter o histórico do cliente atualizado, é essencial registrar notas durante ou logo após a chamada. Enquanto a ligação estiver ativa, use a barra lateral direita para digitar suas anotações no campo "Notas da Chamada". Além disso, você pode adicionar "Tags" (etiquetas) para classificar o assunto, como #SuporteTecnico, #Vendas ou #Reclamacao. Salvar essas informações ajuda a equipe a ter contexto caso o cliente volte a ligar. Lembre-se de sempre clicar em "Salvar" antes de encerrar a aba do cliente.'
  }
];

// Função para dividir o texto em chunks
function chunkText(text: string, size: number, overlap: number): string[] {
  const paragraphs = text.split('\n').filter(p => p.trim().length > 0);
  const chunks: string[] = [];

  let currentChunk = '';

  for (const paragraph of paragraphs) {
    if (currentChunk.length + paragraph.length <= size) {
      currentChunk += paragraph + '\n';
    } else {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
      }
      currentChunk = paragraph + '\n';
    }
  }
  if (currentChunk) chunks.push(currentChunk.trim());

  const finalChunks: string[] = [];
  for (const c of chunks) {
    if (c.length > size) {
      let i = 0;
      while (i < c.length) {
        finalChunks.push(c.substring(i, i + size));
        i += size - overlap;
      }
    } else {
      finalChunks.push(c);
    }
  }

  return finalChunks;
}

// Função para gerar embeddings via Google AI
async function generateEmbedding(text: string): Promise<number[]> {
  // Inicializando o modelo
  const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });

  // Enviando um objeto de requisição com outputDimensionality focado em 768
  const result = await model.embedContent({
    content: { role: "user", parts: [{ text }] },
    outputDimensionality: 768
  });

  return result.embedding.values;
}

// Função para salvar no Supabase
async function saveToSupabase(article: any, chunks: string[]) {
  // 1. Salvar o artigo
  const { data: articleData, error: articleError } = await supabase
    .from('help_articles')
    .insert({
      title: article.title,
      url: article.url,
      raw_content: article.content
    })
    .select('id')
    .single();

  if (articleError) {
    throw new Error(`Erro ao salvar artigo ${article.title}: ${articleError.message}`);
  }

  const articleId = articleData.id;
  let chunksSaved = 0;

  // 2. Processar e salvar chunks
  for (let i = 0; i < chunks.length; i++) {
    const chunkText = chunks[i];

    try {
      const embedding = await generateEmbedding(chunkText);

      const { error: chunkError } = await supabase
        .from('help_chunks')
        .insert({
          article_id: articleId,
          chunk_index: i,
          content: chunkText,
          embedding: embedding
        });

      if (chunkError) {
        console.error(`Erro ao salvar chunk ${i} do artigo ${article.title}: ${chunkError.message}`);
      } else {
        chunksSaved++;
      }
    } catch (err) {
      console.error(`Erro ao gerar embedding pro chunk ${i} do artigo ${article.title}:`, err);
    }
  }

  return chunksSaved;
}

// Função principal de orquestração
async function main() {
  console.log('🚀 Iniciando ingestão de artigos de ajuda...');

  let totalArticles = 0;
  let totalChunks = 0;

  // Processamento do array local
  for (const article of mockArticles) {
    console.log(`\nProcessando: "${article.title}"...`);

    const chunks = chunkText(article.content, ragConfig.chunkSize, ragConfig.chunkOverlap);
    console.log(`- Dividido em ${chunks.length} chunks.`);

    try {
      const savedCount = await saveToSupabase(article, chunks);
      console.log(`- ✅ ${savedCount} chunks gerados e salvos com sucesso.`);

      totalArticles++;
      totalChunks += savedCount;
    } catch (err) {
      console.error(`- ❌ Falha ao processar artigo:`, err);
    }
  }

  console.log(`\n🎉 Processamento concluído!`);
  console.log(`✓ ${totalArticles} artigos processados, ${totalChunks} chunks salvos no banco de dados.`);
}

main().catch(console.error);