import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import callsRouter from "./calls.js";
import statsRouter from "./stats.js"; // 🚩 Garante a conexão com o arquivo de saldos

const router: IRouter = Router();

// --- Registro das Rotas ---

// Rota de monitoramento do Render (healthz)
router.use(healthRouter);

// Rotas de listagem e detalhe de chamadas (/api/calls)
router.use(callsRouter);

// Rota do "Cofre" (/api/stats/summary)
router.use(statsRouter);

export default router;