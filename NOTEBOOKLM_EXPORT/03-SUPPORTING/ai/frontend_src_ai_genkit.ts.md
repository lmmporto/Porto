# genkit.ts

## Visão geral
- Caminho original: `frontend/src/ai/genkit.ts`
- Domínio: **ai**
- Prioridade: **03-SUPPORTING**
- Tipo: **source-file**
- Criticidade: **supporting**
- Score de importância: **52**
- Entry point: **não**
- Arquivo central de fluxo: **não**
- Linhas: **8**
- Imports detectados: **2**
- Exports detectados: **1**
- Funções/classes detectadas: **0**

## Resumo factual
Este arquivo foi classificado como source-file no domínio ai. Criticidade: supporting. Prioridade: 03-SUPPORTING. Exports detectados: ai. Dependências externas detectadas: @genkit-ai/google-genai, genkit. Indícios de framework/arquitetura: ai-flow.

## Dependências locais
_Nenhuma dependência local detectada_

## Dependências externas
- `@genkit-ai/google-genai`
- `genkit`

## Todos os imports detectados
- `@genkit-ai/google-genai`
- `genkit`

## Exports detectados
- `ai`

## Funções e classes detectadas
_Nenhuma função/classe detectada_

## Endpoints detectados
_Nenhum padrão de endpoint detectado_

## Variáveis de ambiente detectadas
_Nenhuma variável de ambiente detectada_

## Temas relevantes
_Nenhuma palavra-chave relevante detectada_

## Indícios de framework/arquitetura
- `ai-flow`

## Código
```ts
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-2.5-flash',
});

```
