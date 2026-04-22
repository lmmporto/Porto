# sdr-registro.ts

## Visão geral
- Caminho original: `api-server/src/routes/sdr-registro.ts`
- Domínio: **backend**
- Prioridade: **01-FUNDAMENTAL**
- Tipo: **route**
- Criticidade: **critical**
- Score de importância: **150**
- Entry point: **sim**
- Arquivo central de fluxo: **sim**
- Linhas: **21**
- Imports detectados: **3**
- Exports detectados: **1**
- Funções/classes detectadas: **0**

## Resumo factual
Este arquivo foi classificado como route no domínio backend. Criticidade: critical. Prioridade: 01-FUNDAMENTAL. Exports detectados: router. Padrões de endpoint detectados: GET /. Dependências locais detectadas: ../firebase.js, ../middleware/requireAdmin.js. Dependências externas detectadas: express. Temas relevantes detectados: admin, email, firebase, sdr. Indícios de framework/arquitetura: express, firebase.

## Dependências locais
- `../firebase.js`
- `../middleware/requireAdmin.js`

## Dependências externas
- `express`

## Todos os imports detectados
- `../firebase.js`
- `../middleware/requireAdmin.js`
- `express`

## Exports detectados
- `router`

## Funções e classes detectadas
_Nenhuma função/classe detectada_

## Endpoints detectados
- `GET /`

## Variáveis de ambiente detectadas
_Nenhuma variável de ambiente detectada_

## Temas relevantes
- `admin`
- `email`
- `firebase`
- `sdr`

## Indícios de framework/arquitetura
- `express`
- `firebase`

## Código
```ts
// backend/src/routes/sdr-registry.ts
import { Router } from 'express';
import { db } from '../firebase.js';
import { requireAdmin } from '../middleware/requireAdmin.js';

const router = Router();

router.get('/', requireAdmin, async (req, res) => {
  try {
    const snapshot = await db.collection('sdr_registry').get();
    const sdrs = snapshot.docs.map(doc => ({
      name: doc.data().name,
      email: doc.data().email
    }));
    res.json({ sdrs });
  } catch (error) {
    res.status(500).json({ error: 'Falha ao buscar registro de SDRs' });
  }
});

export default router;
```
