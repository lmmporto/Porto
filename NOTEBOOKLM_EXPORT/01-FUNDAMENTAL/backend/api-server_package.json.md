# package.json

## Visão geral
- Caminho original: `api-server/package.json`
- Domínio: **backend**
- Prioridade: **01-FUNDAMENTAL**
- Tipo: **package-config**
- Criticidade: **important**
- Score de importância: **118**
- Entry point: **sim**
- Arquivo central de fluxo: **sim**
- Linhas: **41**
- Imports detectados: **0**
- Exports detectados: **0**
- Funções/classes detectadas: **0**

## Resumo factual
Este arquivo foi classificado como package-config no domínio backend. Criticidade: important. Prioridade: 01-FUNDAMENTAL. Temas relevantes detectados: admin, auth, firebase, parser, session. Indícios de framework/arquitetura: express, firebase, axios.

## Dependências locais
_Nenhuma dependência local detectada_

## Dependências externas
_Nenhuma dependência externa detectada_

## Todos os imports detectados
_Nenhum import detectado_

## Exports detectados
_Nenhum export detectado_

## Funções e classes detectadas
_Nenhuma função/classe detectada_

## Endpoints detectados
_Nenhum padrão de endpoint detectado_

## Variáveis de ambiente detectadas
_Nenhuma variável de ambiente detectada_

## Temas relevantes
- `admin`
- `auth`
- `firebase`
- `parser`
- `session`

## Indícios de framework/arquitetura
- `express`
- `firebase`
- `axios`

## Código
```json
{
  "name": "api-server",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "cross-env NODE_ENV=development tsx ./src/index.ts",
    "build": "tsx ./src/build.ts",
    "start": "node dist/index.cjs",
    "typecheck": "tsc -p tsconfig.json --noEmit"
  },
  "dependencies": {
    "@google/genai": "^1.0.1",
    "@google/generative-ai": "^0.24.1",
    "axios": "^1.10.0",
    "cookie-parser": "^1.4.7",
    "cors": "^2",
    "dotenv": "^16.5.0",
    "drizzle-orm": "^0.45.1",
    "express": "^5",
    "express-session": "^1.19.0",
    "firebase-admin": "^13.4.0",
    "ngrok": "5.0.0-beta.2",
    "node-cache": "^5.1.2",
    "passport": "^0.7.0",
    "passport-google-oauth20": "^2.0.0"
  },
  "devDependencies": {
    "@types/cookie-parser": "^1.4.10",
    "@types/cors": "^2.8.19",
    "@types/express": "^5.0.6",
    "@types/express-session": "^1.18.2",
    "@types/node": "^25.5.0",
    "@types/passport": "^1.0.17",
    "@types/passport-google-oauth20": "^2.0.17",
    "cross-env": "^7.0.3",
    "esbuild": "^0.27.3",
    "tsx": "^4.21.0",
    "typescript": "^6.0.2"
  }
}
```
