# calls-list.mock.ts

## Visão geral
- Caminho original: `frontend/src/features/calls/mocks/calls-list.mock.ts`
- Domínio: **frontend**
- Prioridade: **01-FUNDAMENTAL**
- Tipo: **source-file**
- Criticidade: **supporting**
- Score de importância: **100**
- Entry point: **não**
- Arquivo central de fluxo: **sim**
- Linhas: **60**
- Imports detectados: **0**
- Exports detectados: **3**
- Funções/classes detectadas: **0**

## Resumo factual
Este arquivo foi classificado como source-file no domínio frontend. Criticidade: supporting. Prioridade: 01-FUNDAMENTAL. Exports detectados: CallListItem, CallStatus, callsListMock. Temas relevantes detectados: calls, sdr.

## Dependências locais
_Nenhuma dependência local detectada_

## Dependências externas
_Nenhuma dependência externa detectada_

## Todos os imports detectados
_Nenhum import detectado_

## Exports detectados
- `CallListItem`
- `CallStatus`
- `callsListMock`

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
export type CallStatus = "Analisada" | "Processando" | "Falha"

export type CallListItem = {
  id: string
  clientName: string
  sdrName: string
  date: string
  duration: string
  score: number | null
  status: CallStatus
}

export const callsListMock: CallListItem[] =[
  {
    id: "call-123",
    clientName: "TechCorp Solutions",
    sdrName: "João Silva",
    date: "24/10/2023",
    duration: "14:32",
    score: 78,
    status: "Analisada",
  },
  {
    id: "call-124",
    clientName: "Global Industries",
    sdrName: "Maria Souza",
    date: "24/10/2023",
    duration: "08:15",
    score: 92,
    status: "Analisada",
  },
  {
    id: "call-125",
    clientName: "StartUp Inc",
    sdrName: "João Silva",
    date: "25/10/2023",
    duration: "22:10",
    score: 45,
    status: "Analisada",
  },
  {
    id: "call-126",
    clientName: "Mega Retail",
    sdrName: "Pedro Santos",
    date: "25/10/2023",
    duration: "12:05",
    score: null,
    status: "Processando",
  },
  {
    id: "call-127",
    clientName: "Finance Group",
    sdrName: "Maria Souza",
    date: "26/10/2023",
    duration: "05:50",
    score: null,
    status: "Falha",
  },
]

```
