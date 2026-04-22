# call-detail.mock.ts

## Visão geral
- Caminho original: `frontend/src/features/calls/mocks/call-detail.mock.ts`
- Domínio: **frontend**
- Prioridade: **01-FUNDAMENTAL**
- Tipo: **source-file**
- Criticidade: **supporting**
- Score de importância: **100**
- Entry point: **não**
- Arquivo central de fluxo: **sim**
- Linhas: **76**
- Imports detectados: **0**
- Exports detectados: **3**
- Funções/classes detectadas: **0**

## Resumo factual
Este arquivo foi classificado como source-file no domínio frontend. Criticidade: supporting. Prioridade: 01-FUNDAMENTAL. Exports detectados: CallDetailData, CoachingEvent, callDetailMock. Temas relevantes detectados: analysis, coaching, crm, sdr, summary.

## Dependências locais
_Nenhuma dependência local detectada_

## Dependências externas
_Nenhuma dependência externa detectada_

## Todos os imports detectados
_Nenhum import detectado_

## Exports detectados
- `CallDetailData`
- `CoachingEvent`
- `callDetailMock`

## Funções e classes detectadas
_Nenhuma função/classe detectada_

## Endpoints detectados
_Nenhum padrão de endpoint detectado_

## Variáveis de ambiente detectadas
_Nenhuma variável de ambiente detectada_

## Temas relevantes
- `analysis`
- `coaching`
- `crm`
- `sdr`
- `summary`

## Indícios de framework/arquitetura
_Nenhum indício específico detectado_

## Código
```ts
export type CoachingEvent = {
  id: string
  timestamp: string
  type: "praise" | "improvement" | "attention"
  speaker: "SDR" | "Cliente"
  snippet: string
  aiRecommendation: string
}

export type CallDetailData = {
  id: string
  sdrName: string
  clientName: string
  date: string
  duration: string
  overallScore: number
  status: string
  executiveSummary: string
  biggestDifficulty: string
  recommendedAction: string
  mainSuccesses: string[]
  listeningAnalysis: {
    sdr: number
    client: number
  }
  coachingEvents: CoachingEvent[]
}

export const callDetailMock: CallDetailData = {
  id: "call-123",
  sdrName: "João Silva",
  clientName: "TechCorp Solutions",
  date: "24 de Outubro, 2023",
  duration: "14:32",
  overallScore: 78,
  status: "Analisado",
  executiveSummary: "A call teve um bom início com rapport bem estabelecido. O SDR conseguiu identificar a dor principal (lentidão no sistema), mas falhou em aprofundar as implicações financeiras dessa dor antes de apresentar a solução.",
  biggestDifficulty: "Falta de exploração das consequências (Implication do SPIN). O SDR pulou direto do Problema para a Solução.",
  recommendedAction: "Na próxima call, ao identificar um problema, faça pelo menos duas perguntas sobre como esse problema afeta o dia a dia e o faturamento do cliente antes de falar do produto.",
  mainSuccesses:[
    "Rapport inicial rápido e natural.",
    "Identificação clara do problema técnico.",
    "Agendamento dos próximos passos garantido no final."
  ],
  listeningAnalysis: {
    sdr: 65,
    client: 35
  },
  coachingEvents:[
    {
      id: "c1",
      timestamp: "02:15",
      type: "praise",
      speaker: "SDR",
      snippet: "Vi no seu LinkedIn que vocês acabaram de abrir uma filial em SP, parabéns! Como está sendo esse desafio?",
      aiRecommendation: "Excelente quebra de gelo. Usar informações prévias demonstra preparo e gera conexão imediata."
    },
    {
      id: "c2",
      timestamp: "05:40",
      type: "attention",
      speaker: "Cliente",
      snippet: "É, toda sexta o servidor não aguenta e cai.",
      aiRecommendation: "O cliente entregou uma dor clara aqui. Em vez de perguntar qual CRM eles usam logo em seguida, você deveria ter perguntado: 'E qual o impacto financeiro quando o servidor cai na sexta-feira?'"
    },
    {
      id: "c3",
      timestamp: "11:20",
      type: "improvement",
      speaker: "SDR",
      snippet: "Ah, para isso nós temos um módulo de automação que faz exatamente isso em 2 cliques...",
      aiRecommendation: "Apresentação prematura de solução. Você começou a falar das features antes de consolidar o tamanho da dor do cliente. Lembre-se de focar no problema primeiro."
    },
  ],
}

```
