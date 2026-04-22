# index.ts

## Visão geral
- Caminho original: `api-server/src/index.ts`
- Domínio: **backend**
- Prioridade: **01-FUNDAMENTAL**
- Tipo: **bootstrap**
- Criticidade: **critical**
- Score de importância: **150**
- Entry point: **sim**
- Arquivo central de fluxo: **sim**
- Linhas: **28**
- Imports detectados: **2**
- Exports detectados: **0**
- Funções/classes detectadas: **0**

## Resumo factual
Este arquivo foi classificado como bootstrap no domínio backend. Criticidade: critical. Prioridade: 01-FUNDAMENTAL. Dependências locais detectadas: ./app.js, ./services/worker.service.js. Variáveis de ambiente detectadas: PORT. Temas relevantes detectados: worker.

## Dependências locais
- `./app.js`
- `./services/worker.service.js`

## Dependências externas
_Nenhuma dependência externa detectada_

## Todos os imports detectados
- `./app.js`
- `./services/worker.service.js`

## Exports detectados
_Nenhum export detectado_

## Funções e classes detectadas
_Nenhuma função/classe detectada_

## Endpoints detectados
_Nenhum padrão de endpoint detectado_

## Variáveis de ambiente detectadas
- `PORT`

## Temas relevantes
- `worker`

## Indícios de framework/arquitetura
_Nenhum indício específico detectado_

## Código
```ts
import app from "./app.js";
import { startWorker } from "./services/worker.service.js";

const port = Number(process.env.PORT) || 3000;

// 🏛️ ARQUITETO: Adicionamos ouvintes globais para evitar que o 502 aconteça por erros bobos
process.on('unhandledRejection', (reason) => {
  console.error('⚠️ Unhandled Rejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('⚠️ Uncaught Exception:', err);
  // Não matamos o processo imediatamente para o Render não dar 502 instantâneo
});

app.listen(port, "0.0.0.0", () => {
  console.log(`🚀 SERVER ONLINE NA PORTA ${port}`);
  
  // O Worker só inicia se o servidor estiver de pé
  try {
    if (typeof startWorker === "function") {
      startWorker();
      console.log("👷 Worker iniciado.");
    }
  } catch (e) {
    console.error("❌ Falha ao iniciar Worker, mas o servidor continuará de pé.");
  }
});
```
