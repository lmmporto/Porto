/**
 * Mock local de uma SDRCall completa.
 * Usado apenas para teste offline da página de análise.
 * Acesse via: /dashboard/calls/demo
 *
 * Shape alinhado a SDRCall + campos de análise Gemini de src/types/index.ts.
 * NUNCA importar em código de produção — apenas na página de chamada como fallback.
 */

export const MOCK_CALL = {
  id: "demo",
  callId: "demo-call-001",
  hubspotCallId: "demo-hubspot-001",
  portalId: "1554114",

  title: "Qualificação — Gustavo Mendes / TradeMax Importações",
  contactName: "Gustavo Mendes",
  ownerName: "Ana Beatriz Costa",
  ownerEmail: "ana.costa@nibo.com.br",
  teamId: "team-alpha",
  teamName: "Time Alpha",

  durationMs: 487000, // ~8 min
  recordingUrl: null,

  nota_spin: 7.4,
  status_final: "ATENCAO" as const,
  processingStatus: "DONE" as const,
  rota: "ROTA_A",
  source: "HUBSPOT" as const,

  // Simula Firestore Timestamp
  callTimestamp: { _seconds: Math.floor(Date.now() / 1000) - 3600 },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  analyzedAt: new Date().toISOString(),

  // ── Campos de análise Gemini ─────────────────────────────────────────────

  resumo:
    "A SDR conduziu uma conversa de qualificação com o decisor correto. Demonstrou bom domínio do produto e conseguiu mapear a dor principal do cliente — a falta de visibilidade sobre o caixa projetado. Porém, não explorou as implicações financeiras do problema nem gerou urgência suficiente para avançar para a próxima etapa. A call terminou sem um compromisso claro de follow-up.",

  ponto_atencao:
    "Aprofundar as implicações financeiras da falta de previsão de caixa antes de apresentar solução — o cliente não sentiu urgência real para agir agora.",

  maior_dificuldade:
    "Transição da fase Problema para Implicação: a SDR identificou a dor mas não conectou o custo concreto do problema ao risco de deixar para depois.",

  pontos_fortes: [
    "Abriu a call com pergunta de situação bem calibrada, gerando engajamento imediato do decisor.",
    "Demonstrou escuta ativa ao retomar o ponto do cliente sobre 'controle de fornecedores' sem interromper.",
    "Apresentou o produto em menos de 90 segundos sem jargão técnico excessivo.",
    "Manteve tom consultivo ao longo de toda a conversa — nenhum momento de pressão desnecessária.",
    "Fez pergunta de confirmação antes do fechamento, validando o entendimento do cliente.",
  ],

  analise_escuta:
    "A SDR demonstrou boa capacidade de escuta ativa na maior parte da call. Em dois momentos críticos (02:15 e 05:40) o cliente mencionou preocupações secundárias que foram reconhecidas verbalmente mas não exploradas como oportunidade de aprofundamento.\n\nA velocidade de fala foi adequada e não houve sobreposição de fala. O silêncio estratégico foi bem utilizado após a pergunta de situação (01:20), permitindo que o cliente desenvolvesse o contexto por conta própria.\n\nOportunidade de melhoria: após a resposta do cliente em 04:30 ('a gente realmente não tem visibilidade...'), a SDR poderia ter pausado e explorado o impacto emocional dessa afirmação antes de continuar com o roteiro.",

  // Formato: "[MM:SS] | SDR: trecho... | Mentor: recomendação..."
  playbook_detalhado: [
    "[01:45] | SDR: \"Então você usa planilha pra controlar o fluxo de caixa?\" | Mentor: Boa pergunta de situação — mas aproveite a resposta para imediatamente perguntar há quanto tempo é assim e se isso já causou algum problema pontual. Isso abre a fase Problema de forma mais natural e com menor resistência do prospect.",
    "[03:20] | SDR: \"Entendo, a gente resolve exatamente isso.\" | Mentor: Cuidado com a antecipação da solução — o cliente ainda não verbalizou a dor com suas próprias palavras. Reformule: 'Quando isso acontece, qual é o primeiro impacto que você sente?' Isso mantém o foco no Problema e gera o insumo para a fase de Implicação.",
    "[04:52] | SDR: \"Nosso módulo de fluxo permite projeção de até 12 meses.\" | Mentor: Benefício apresentado muito cedo. O prospect não disse que precisava de 12 meses — disse que não tinha visibilidade. Alinhe o benefício à dor específica: 'Você mencionou que não sabe o que vai chegar em 30 dias. E se você pudesse ver isso 90 dias antes, como mudaria sua decisão de compra de estoque?'",
    "[06:10] | SDR: \"O que você acha de marcarmos uma demo?\" | Mentor: Pergunta de compromisso prematura. O cliente nunca reconheceu explicitamente o custo do problema. Antes de pedir a demo, feche a implicação: 'Com base no que você me contou, estimando quanto esse problema já custou no último semestre, faz sentido resolver isso agora ou pode esperar?' A resposta dará a abertura natural para a demo.",
    "[07:30] | SDR: \"Posso te mandar um e-mail com mais informações.\" | Mentor: Evite encerrar com e-mail — é o caminho de menor comprometimento. Substitua por: 'Prefiro garantir um horário de 30 minutos na sua agenda para você ver o sistema ao vivo com o seu próprio cenário. Qual seria o melhor dia essa semana?' Isso mantém o controle do ciclo de vendas na sua mão.",
  ],

  alertas: [],
};
