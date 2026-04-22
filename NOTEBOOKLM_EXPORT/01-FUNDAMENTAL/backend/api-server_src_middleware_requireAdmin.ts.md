# requireAdmin.ts

## Visão geral
- Caminho original: `api-server/src/middleware/requireAdmin.ts`
- Domínio: **backend**
- Prioridade: **01-FUNDAMENTAL**
- Tipo: **middleware**
- Criticidade: **critical**
- Score de importância: **130**
- Entry point: **não**
- Arquivo central de fluxo: **sim**
- Linhas: **18**
- Imports detectados: **2**
- Exports detectados: **1**
- Funções/classes detectadas: **1**

## Resumo factual
Este arquivo foi classificado como middleware no domínio backend. Criticidade: critical. Prioridade: 01-FUNDAMENTAL. Exports detectados: requireAdmin. Funções/classes detectadas: requireAdmin. Dependências locais detectadas: ../utils/auth.js. Dependências externas detectadas: express. Temas relevantes detectados: admin, auth, email. Indícios de framework/arquitetura: express.

## Dependências locais
- `../utils/auth.js`

## Dependências externas
- `express`

## Todos os imports detectados
- `../utils/auth.js`
- `express`

## Exports detectados
- `requireAdmin`

## Funções e classes detectadas
- `requireAdmin`

## Endpoints detectados
_Nenhum padrão de endpoint detectado_

## Variáveis de ambiente detectadas
_Nenhuma variável de ambiente detectada_

## Temas relevantes
- `admin`
- `auth`
- `email`

## Indícios de framework/arquitetura
- `express`

## Código
```ts
import { Request, Response, NextFunction } from "express";
import { checkIfAdmin } from "../utils/auth.js";

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ error: "Unauthenticated" });
  }

  const user = req.user as { email: string };
  const isAdmin = await checkIfAdmin(user.email);

  if (!isAdmin) {
    return res.status(403).json({ error: "Forbidden" });
  }

  next();
}

```
