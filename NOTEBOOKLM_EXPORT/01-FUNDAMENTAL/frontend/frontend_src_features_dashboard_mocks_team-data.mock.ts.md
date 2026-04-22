# team-data.mock.ts

## Visão geral
- Caminho original: `frontend/src/features/dashboard/mocks/team-data.mock.ts`
- Domínio: **frontend**
- Prioridade: **01-FUNDAMENTAL**
- Tipo: **source-file**
- Criticidade: **supporting**
- Score de importância: **100**
- Entry point: **não**
- Arquivo central de fluxo: **sim**
- Linhas: **24**
- Imports detectados: **0**
- Exports detectados: **1**
- Funções/classes detectadas: **0**

## Resumo factual
Este arquivo foi classificado como source-file no domínio frontend. Criticidade: supporting. Prioridade: 01-FUNDAMENTAL. Exports detectados: teamDataMock. Temas relevantes detectados: calls, coaching, sdr, team.

## Dependências locais
_Nenhuma dependência local detectada_

## Dependências externas
_Nenhuma dependência externa detectada_

## Todos os imports detectados
_Nenhum import detectado_

## Exports detectados
- `teamDataMock`

## Funções e classes detectadas
_Nenhuma função/classe detectada_

## Endpoints detectados
_Nenhum padrão de endpoint detectado_

## Variáveis de ambiente detectadas
_Nenhuma variável de ambiente detectada_

## Temas relevantes
- `calls`
- `coaching`
- `sdr`
- `team`

## Indícios de framework/arquitetura
_Nenhum indício específico detectado_

## Código
```ts
export const teamDataMock = {
  kpis: {
    totalCalls: 142,
    avgScore: 68,
    approvalRate: 58,
  },
  leaderboard: {
    topPerformers: [
      { id: "sdr-2", name: "Maria Souza", score: 92 },
      { id: "sdr-3", name: "Pedro Santos", score: 85 },
    ],
    needsCoaching: [
      { id: "sdr-1", name: "João Silva", score: 55 },
      { id: "sdr-4", name: "Ana Costa", score: 48 },
    ]
  },
  spinDistribution: [
    { label: "Situação", value: 85 },
    { label: "Problema", value: 70 },
    { label: "Implicação", value: 45 },
    { label: "Necessidade", value: 30 },
  ]
}

```
