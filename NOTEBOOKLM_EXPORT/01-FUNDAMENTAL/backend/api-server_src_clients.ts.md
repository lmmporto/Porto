# clients.ts

## Visão geral
- Caminho original: `api-server/src/clients.ts`
- Domínio: **backend**
- Prioridade: **01-FUNDAMENTAL**
- Tipo: **client-config**
- Criticidade: **critical**
- Score de importância: **130**
- Entry point: **não**
- Arquivo central de fluxo: **sim**
- Linhas: **17**
- Imports detectados: **3**
- Exports detectados: **2**
- Funções/classes detectadas: **0**

## Resumo factual
Este arquivo foi classificado como client-config no domínio backend. Criticidade: critical. Prioridade: 01-FUNDAMENTAL. Exports detectados: gemini, hubspot. Dependências locais detectadas: ./config.js. Dependências externas detectadas: @google/genai, axios. Temas relevantes detectados: auth, hubspot, token. Indícios de framework/arquitetura: axios.

## Dependências locais
- `./config.js`

## Dependências externas
- `@google/genai`
- `axios`

## Todos os imports detectados
- `./config.js`
- `@google/genai`
- `axios`

## Exports detectados
- `gemini`
- `hubspot`

## Funções e classes detectadas
_Nenhuma função/classe detectada_

## Endpoints detectados
_Nenhum padrão de endpoint detectado_

## Variáveis de ambiente detectadas
_Nenhuma variável de ambiente detectada_

## Temas relevantes
- `auth`
- `hubspot`
- `token`

## Indícios de framework/arquitetura
- `axios`

## Código
```ts
import axios from 'axios';
import { GoogleGenAI } from '@google/genai';
import { CONFIG } from './config.js';

export const hubspot = axios.create({
  baseURL: 'https://api.hubapi.com',
  headers: {
    Authorization: `Bearer ${CONFIG.HUBSPOT_TOKEN}`,
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

export const gemini = CONFIG.GEMINI_API_KEY
  ? new GoogleGenAI({ apiKey: CONFIG.GEMINI_API_KEY })
  : null;

```
