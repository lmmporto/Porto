import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import callsRouter from "./calls.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(callsRouter);

export default router;
