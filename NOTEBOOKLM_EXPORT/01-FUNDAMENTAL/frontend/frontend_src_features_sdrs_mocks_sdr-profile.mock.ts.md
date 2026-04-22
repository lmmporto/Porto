# sdr-profile.mock.ts

## Visão geral
- Caminho original: `frontend/src/features/sdrs/mocks/sdr-profile.mock.ts`
- Domínio: **frontend**
- Prioridade: **01-FUNDAMENTAL**
- Tipo: **source-file**
- Criticidade: **supporting**
- Score de importância: **100**
- Entry point: **não**
- Arquivo central de fluxo: **sim**
- Linhas: **39**
- Imports detectados: **1**
- Exports detectados: **2**
- Funções/classes detectadas: **0**

## Resumo factual
Este arquivo foi classificado como source-file no domínio frontend. Criticidade: supporting. Prioridade: 01-FUNDAMENTAL. Exports detectados: SdrProfile, sdrProfileMock. Dependências locais detectadas: @/features/calls/mocks/calls-list.mock. Temas relevantes detectados: calls, insights, sdr, stats.

## Dependências locais
- `@/features/calls/mocks/calls-list.mock`

## Dependências externas
_Nenhuma dependência externa detectada_

## Todos os imports detectados
- `@/features/calls/mocks/calls-list.mock`

## Exports detectados
- `SdrProfile`
- `sdrProfileMock`

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
- `stats`

## Indícios de framework/arquitetura
_Nenhum indício específico detectado_

## Código
```ts
import { CallListItem } from "@/features/calls/mocks/calls-list.mock"

export type SdrProfile = {
  id: string
  name: string
  role: string
  tenure: string
  stats: {
    avgSpinScore: number
    totalCalls: number
    approvalRate: number
  }
  insights: {
    strengths: string[]
    gaps: string[]
  }
  history: CallListItem[]
}

export const sdrProfileMock: SdrProfile = {
  id: "sdr-1",
  name: "João Silva",
  role: "SDR Pleno",
  tenure: "1 ano e 2 meses",
  stats: {
    avgSpinScore: 78,
    totalCalls: 45,
    approvalRate: 82,
  },
  insights: {
    strengths: ["Excelente Rapport", "Identificação rápida de problemas técnicos"],
    gaps: ["Aprofundamento em implicações financeiras", "Fechamento de próximos passos"]
  },
  history: [
    { id: "call-123", clientName: "TechCorp Solutions", sdrName: "João Silva", date: "24/10/2023", duration: "14:32", score: 78, status: "Analisada" },
    { id: "call-125", clientName: "StartUp Inc", sdrName: "João Silva", date: "25/10/2023", duration: "22:10", score: 45, status: "Analisada" },
  ]
}

```
