import {
  Router,
  type IRouter,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import { db } from "../firebase.js";
import { CONFIG } from "../config.js";
import { processCall } from "../services/processCall.js";
import { searchCallsInHubSpot } from "../services/hubspot.js";

const router: IRouter = Router();

function requireWebhookSecret(req: Request, res: Response, next: NextFunction) {
  const headerSecret = req.headers["x-webhook-secret"];
  const querySecret = req.query.secret;

  const normalizedHeaderSecret = Array.isArray(headerSecret)
    ? headerSecret[0]
    : headerSecret;
  const normalizedQuerySecret = Array.isArray(querySecret)
    ? querySecret[0]
    : querySecret;

  const providedSecret = normalizedHeaderSecret || normalizedQuerySecret || "";
  const expectedSecret = process.env.WEBHOOK_SECRET || "";

  console.log("[WEBHOOK AUTH]", {
    hasHeaderSecret: Boolean(normalizedHeaderSecret),
    hasQuerySecret: Boolean(normalizedQuerySecret),
    providedMatches: String(providedSecret) === String(expectedSecret),
  });

  if (String(providedSecret) !== String(expectedSecret)) {
    res.status(401).json({ success: false, error: "Webhook não autorizado" });
    return;
  }

  next();
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }

  res.status(401).json({
    success: false,
    error: "Não autenticado",
  });
}

async function analyzeCallHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const rawCallId = req.body?.callId || req.query?.callId;
    const callId = String(rawCallId || "").trim();

    if (!callId) {
      res.status(400).json({ success: false, error: "callId não informado" });
      return;
    }

    const result = await processCall(callId);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

async function analyzeCallsSearchHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const limitParam = Math.min(
      Number(
        req.body?.limit || req.query?.limit || CONFIG.TEST_CALLS_DEFAULT_LIMIT,
      ),
      CONFIG.TEST_CALLS_MAX_LIMIT,
    );

    const results = await searchCallsInHubSpot({ limit: limitParam });
    const processResults = [];

    for (const item of results) {
      try {
        const doc = await db
          .collection(CONFIG.CALLS_COLLECTION)
          .doc(String(item.id))
          .get();

        if (doc.exists && doc.data()?.processingStatus === "DONE") {
          continue;
        }

        processResults.push(await processCall(String(item.id)));
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        processResults.push({ callId: item.id, success: false, error: msg });
      }
    }

    res.json({ success: true, processed: processResults });
  } catch (error) {
    next(error);
  }
}

async function hubspotWebhookHandler(req: Request, res: Response) {
  try {
    const body = req.body;

    console.log("[WEBHOOK] body recebido:", JSON.stringify(body));

    const callId =
      body?.callId ||
      body?.objectId ||
      (Array.isArray(body) ? body[0]?.objectId : undefined);

    const normalizedCallId = String(callId || "").trim();

    if (!normalizedCallId) {
      console.error("[WEBHOOK] callId não encontrado no body");
      res.status(200).json({
        success: true,
        ignored: true,
        reason: "callId não encontrado",
      });
      return;
    }

    res.status(200).json({
      success: true,
      received: true,
      callId: normalizedCallId,
    });

    setImmediate(async () => {
      try {
        console.log(
          `[WEBHOOK] Processamento assíncrono iniciado para call ${normalizedCallId}`,
        );

        const result = await processCall(normalizedCallId);

        console.log(
          `[WEBHOOK] Processamento concluído para call ${normalizedCallId}`,
          result,
        );
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        const stack = error instanceof Error ? error.stack : undefined;

        console.error(
          `[WEBHOOK] Falha ao processar call ${normalizedCallId}: ${msg}`,
        );

        if (stack) {
          console.error(stack);
        }
      }
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;

    console.error(`[WEBHOOK] erro no handler: ${msg}`);

    if (stack) {
      console.error(stack);
    }

    if (!res.headersSent) {
      res.status(200).json({
        success: true,
        ignored: true,
        reason: "erro interno no handler",
      });
    }
  }
}

router.get(
  "/calls",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const limit = Math.min(Number(req.query.limit || 30), 100);

      const snapshot = await db
        .collection(CONFIG.CALLS_COLLECTION)
        .where("processingStatus", "==", "DONE")
        .limit(limit)
        .get();

      let calls = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          callId: data.callId || doc.id,
          title: data.title || "Ligação sem título",
          ownerId: data.ownerId || null,
          ownerName: data.ownerName || "Owner não identificado",
          ownerUserId: data.ownerUserId || null,
          teamId: data.teamId || null,
          teamName: data.teamName || "Sem equipe",
          durationMs: Number(data.durationMs || 0),
          recordingUrl: data.recordingUrl || null,
          analyzedAt: data.analyzedAt
            ? data.analyzedAt.toDate().toISOString()
            : null,
          status_final: data.status_final || "NAO_IDENTIFICADO",
          nota_spin: Number(data.nota_spin || 0),
          resumo: data.resumo || "Sem resumo disponível",
          alertas: Array.isArray(data.alertas) ? data.alertas : [],
          ponto_atencao: data.ponto_atencao || "",
          maior_dificuldade: data.maior_dificuldade || "",
          pontos_fortes: Array.isArray(data.pontos_fortes)
            ? data.pontos_fortes
            : [],
        };
      });

      calls = calls.sort((a, b) => {
        const dateA = new Date(a.analyzedAt || 0).getTime();
        const dateB = new Date(b.analyzedAt || 0).getTime();
        return dateB - dateA;
      });

      res.json(calls);
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  "/test-call-ids",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ids: string[] = req.body?.ids;

      if (!Array.isArray(ids) || ids.length === 0) {
        res
          .status(400)
          .json({ error: 'Campo "ids" deve ser um array não vazio.' });
        return;
      }

      const results = [];

      for (const id of ids) {
        try {
          const doc = await db
            .collection(CONFIG.CALLS_COLLECTION)
            .doc(String(id))
            .get();

          if (doc.exists && doc.data()?.processingStatus === "DONE") {
            results.push({
              callId: id,
              skipped: true,
              reason: "JA_PROCESSADO",
            });
            continue;
          }

          results.push(await processCall(String(id)));
        } catch (error: unknown) {
          const msg = error instanceof Error ? error.message : String(error);
          results.push({ callId: id, success: false, error: msg });
        }
      }

      res.json({ success: true, total: ids.length, processed: results });
    } catch (error) {
      next(error);
    }
  },
);

router.post("/hubspot-webhook", requireWebhookSecret, hubspotWebhookHandler);
router.post("/analyze-call", requireAuth, analyzeCallHandler);
router.post("/analyze-calls-search", requireAuth, analyzeCallsSearchHandler);

export default router;