import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import callsRouter from "./calls.js";
import statsRouter from "./stats.js"; // 🚩 IMPORTANTE: Extensão .js para compatibilidade ESM

const router: IRouter = Router();

// --- Registro das Rotas ---

// Rota de monitoramento do Render (healthz)
router.use(healthRouter);

// 🚩 AJUSTE: Monta o callsRouter no caminho base "/calls"
// Endpoints dentro de calls.ts serão prefixados com /calls
router.use("/calls", callsRouter);

// 🚩 AJUSTE: Monta o statsRouter no caminho base "/stats"
// Endpoints dentro de stats.ts serão prefixados com /stats (ex: /stats/summary)
router.use("/stats", statsRouter);

export default router;