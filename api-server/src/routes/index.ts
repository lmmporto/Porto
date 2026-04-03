import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import callsRouter from "./calls.js";
import statsRouter from "./stats.js"; // 🚩 Garante a conexão com o arquivo de saldos

const router: IRouter = Router();

// --- Registro das Rotas ---

// Rota de monitoramento do Render (healthz)
router.use(healthRouter);

// 🚩 AJUSTE: Monta o callsRouter no caminho base "/calls"
// Assim, router.get("/") dentro de calls.ts vira "/api/calls"
router.use("/calls", callsRouter);

// 🚩 AJUSTE: Monta o statsRouter no caminho base "/stats"
// Assim, router.get("/summary") dentro de stats.ts vira "/api/stats/summary"
router.use("/stats", statsRouter);

export default router;