# ai-insights.mock.ts

## Visão geral
- Caminho original: `frontend/src/features/insights/mocks/ai-insights.mock.ts`
- Domínio: **frontend**
- Prioridade: **01-FUNDAMENTAL**
- Tipo: **source-file**
- Criticidade: **supporting**
- Score de importância: **100**
- Entry point: **não**
- Arquivo central de fluxo: **sim**
- Linhas: **13**
- Imports detectados: **0**
- Exports detectados: **1**
- Funções/classes detectadas: **0**

## Resumo factual
Este arquivo foi classificado como source-file no domínio frontend. Criticidade: supporting. Prioridade: 01-FUNDAMENTAL. Exports detectados: aiInsightsMock. Temas relevantes detectados: calls, insights, sdr.

## Dependências locais
_Nenhuma dependência local detectada_

## Dependências externas
_Nenhuma dependência externa detectada_

## Todos os imports detectados
_Nenhum import detectado_

## Exports detectados
- `aiInsightsMock`

## Funções e classes detectadas
_Nenhuma função/classe detectada_

## Endpoints detectados
_Nenhum padrão de endpoint detectado_

## Variáveis de ambiente detectadas
_Nenhuma variável de ambiente detectada_

## Temas relevantes
- `calls`
- `insights`
- `sdr`

## Indícios de framework/arquitetura
_Nenhum indício específico detectado_

## Código
```ts
export const aiInsightsMock = {
  trends:[
    { label: "Perguntas de Implicação", value: "+15%", status: "up" },
    { label: "Tempo em 'Situação'", value: "-10%", status: "down" },
    { label: "Conversão de Agendamento", value: "+5%", status: "up" },
  ],
  recommendations:[
    { title: "Treinamento Recomendado", description: "O time B está estagnado em 'Necessidade de Solução'. Sugiro um workshop prático de 30min focado em SPIN-N.", type: "info" },
    { title: "Alerta de Performance", description: "O SDR João Silva teve uma queda súbita de 20% no score nas últimas 3 calls. Recomendo uma conversa de 1:1.", type: "warning" },
  ],
  patterns: "A equipe está gastando 40% mais tempo na fase de 'Situação' do que o necessário, o que está encurtando o tempo disponível para explorar dores reais."
}

```
