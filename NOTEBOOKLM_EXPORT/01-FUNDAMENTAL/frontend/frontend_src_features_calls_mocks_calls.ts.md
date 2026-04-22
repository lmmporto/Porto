# calls.ts

## Visão geral
- Caminho original: `frontend/src/features/calls/mocks/calls.ts`
- Domínio: **frontend**
- Prioridade: **01-FUNDAMENTAL**
- Tipo: **source-file**
- Criticidade: **supporting**
- Score de importância: **100**
- Entry point: **não**
- Arquivo central de fluxo: **sim**
- Linhas: **27**
- Imports detectados: **1**
- Exports detectados: **1**
- Funções/classes detectadas: **0**

## Resumo factual
Este arquivo foi classificado como source-file no domínio frontend. Criticidade: supporting. Prioridade: 01-FUNDAMENTAL. Exports detectados: MOCK_CALLS. Dependências locais detectadas: @/types/call. Temas relevantes detectados: calls, sdr.

## Dependências locais
- `@/types/call`

## Dependências externas
_Nenhuma dependência externa detectada_

## Todos os imports detectados
- `@/types/call`

## Exports detectados
- `MOCK_CALLS`

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
import { Call } from "@/types/call";

export const MOCK_CALLS: Call[] = [
  {
    id: "1",
    sdrId: "sdr-1",
    sdrName: "Ricardo Alves",
    clientName: "TechSolutions S.A.",
    date: "2023-10-24",
    score: 9.2,
    duration: "12:45",
    route: "A",
    main_product: "Nibo WhatsApp"
  },
  {
    id: "2",
    sdrId: "sdr-2",
    sdrName: "Beatriz Silva",
    clientName: "Global Logistics",
    date: "2023-10-24",
    score: 5.4,
    duration: "08:12",
    route: "B",
    main_product: "Nibo Obrigações Plus"
  }
];

```
