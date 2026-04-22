# health.ts

## Visão geral
- Caminho original: `api-server/src/routes/health.ts`
- Domínio: **backend**
- Prioridade: **01-FUNDAMENTAL**
- Tipo: **route**
- Criticidade: **critical**
- Score de importância: **150**
- Entry point: **sim**
- Arquivo central de fluxo: **sim**
- Linhas: **9**
- Imports detectados: **1**
- Exports detectados: **1**
- Funções/classes detectadas: **0**

## Resumo factual
Este arquivo foi classificado como route no domínio backend. Criticidade: critical. Prioridade: 01-FUNDAMENTAL. Exports detectados: router. Padrões de endpoint detectados: GET /healthz. Dependências externas detectadas: express. Temas relevantes detectados: health. Indícios de framework/arquitetura: express.

## Dependências locais
_Nenhuma dependência local detectada_

## Dependências externas
- `express`

## Todos os imports detectados
- `express`

## Exports detectados
- `router`

## Funções e classes detectadas
_Nenhuma função/classe detectada_

## Endpoints detectados
- `GET /healthz`

## Variáveis de ambiente detectadas
_Nenhuma variável de ambiente detectada_

## Temas relevantes
- `health`

## Indícios de framework/arquitetura
- `express`

## Código
```ts
import { Router, type IRouter } from "express";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  res.json({ status: "ok" });
});

export default router;
```
