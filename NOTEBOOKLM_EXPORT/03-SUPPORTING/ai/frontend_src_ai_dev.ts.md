# dev.ts

## Visão geral
- Caminho original: `frontend/src/ai/dev.ts`
- Domínio: **ai**
- Prioridade: **03-SUPPORTING**
- Tipo: **source-file**
- Criticidade: **supporting**
- Score de importância: **52**
- Entry point: **não**
- Arquivo central de fluxo: **não**
- Linhas: **6**
- Imports detectados: **4**
- Exports detectados: **0**
- Funções/classes detectadas: **0**

## Resumo factual
Este arquivo foi classificado como source-file no domínio ai. Criticidade: supporting. Prioridade: 03-SUPPORTING. Dependências locais detectadas: @/ai/flows/extract-key-points.ts, @/ai/flows/summarize-call.ts, @/ai/flows/transcribe-call.ts. Dependências externas detectadas: dotenv. Temas relevantes detectados: summarize, transcribe. Indícios de framework/arquitetura: ai-flow.

## Dependências locais
- `@/ai/flows/extract-key-points.ts`
- `@/ai/flows/summarize-call.ts`
- `@/ai/flows/transcribe-call.ts`

## Dependências externas
- `dotenv`

## Todos os imports detectados
- `@/ai/flows/extract-key-points.ts`
- `@/ai/flows/summarize-call.ts`
- `@/ai/flows/transcribe-call.ts`
- `dotenv`

## Exports detectados
_Nenhum export detectado_

## Funções e classes detectadas
_Nenhuma função/classe detectada_

## Endpoints detectados
_Nenhum padrão de endpoint detectado_

## Variáveis de ambiente detectadas
_Nenhuma variável de ambiente detectada_

## Temas relevantes
- `summarize`
- `transcribe`

## Indícios de framework/arquitetura
- `ai-flow`

## Código
```ts
import { config } from 'dotenv';
config();

import '@/ai/flows/summarize-call.ts';
import '@/ai/flows/extract-key-points.ts';
import '@/ai/flows/transcribe-call.ts';
```
