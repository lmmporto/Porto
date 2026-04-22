# gap-detail.mock.ts

## Visão geral
- Caminho original: `frontend/src/features/gaps/mocks/gap-detail.mock.ts`
- Domínio: **frontend**
- Prioridade: **01-FUNDAMENTAL**
- Tipo: **source-file**
- Criticidade: **supporting**
- Score de importância: **100**
- Entry point: **não**
- Arquivo central de fluxo: **sim**
- Linhas: **27**
- Imports detectados: **1**
- Exports detectados: **2**
- Funções/classes detectadas: **0**

## Resumo factual
Este arquivo foi classificado como source-file no domínio frontend. Criticidade: supporting. Prioridade: 01-FUNDAMENTAL. Exports detectados: GapDetailData, gapDetailMock. Dependências locais detectadas: @/features/calls/mocks/calls-list.mock. Temas relevantes detectados: calls, sdr.

## Dependências locais
- `@/features/calls/mocks/calls-list.mock`

## Dependências externas
_Nenhuma dependência externa detectada_

## Todos os imports detectados
- `@/features/calls/mocks/calls-list.mock`

## Exports detectados
- `GapDetailData`
- `gapDetailMock`

## Funções e classes detectadas
_Nenhuma função/classe detectada_

## Endpoints detectados
_Nenhum padrão de endpoint detectado_

## Variáveis de ambiente detectadas
_Nenhuma variável de ambiente detectada_

## Temas relevantes
- `calls`
- `sdr`

## Indícios de framework/arquitetura
_Nenhum indício específico detectado_

## Código
```ts
import { CallListItem } from "@/features/calls/mocks/calls-list.mock"

export type GapDetailData = {
  id: string
  name: string
  description: string
  impact: string
  incidence: number
  mostAffectedSDRs: { name: string; count: number }[]
  exampleCalls: CallListItem[]
}

export const gapDetailMock: GapDetailData = {
  id: "implication-questions",
  name: "Baixa exploração de Implicação",
  description: "As perguntas de Implicação (I do SPIN) conectam a dor do cliente ao impacto negativo no negócio. Sem elas, o cliente percebe o problema, mas não sente urgência em resolvê-lo.",
  impact: "SDRs que não exploram implicações frequentemente perdem o controle da oportunidade no estágio de diagnóstico, resultando em ciclos de vendas longos.",
  incidence: 72,
  mostAffectedSDRs: [
    { name: "João Silva", count: 12 },
    { name: "Ana Costa", count: 8 },
  ],
  exampleCalls: [
    { id: "call-123", clientName: "TechCorp Solutions", sdrName: "João Silva", date: "24/10/2023", duration: "14:32", score: 78, status: "Analisada" },
  ]
}

```
