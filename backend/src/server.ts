import Fastify from "fastify";
import { config } from "./config.js";
import { publicTranslationConfig, assertRight, RightsError } from "./rights.js";
import { getPassage, getChapterVerses, cacheStats } from "./scripture.js";
import { explainPassage } from "./ai/explain.js";
import { partialExplanation } from "./ai/partial.js";
import { generateStudy, type StudyRequest } from "./ai/study.js";
import { craftConfessions } from "./ai/card.js";
import { searchByMeaning, semanticIndexReady } from "./semantic.js";
import { LENSES, type Lens } from "./ai/prompts.js";
import { Store } from "./store.js";

const store = new Store(config.databasePath.replace(/\.db$/, "-store.json"));

// Founder decision #10: quota disabled during founder testing (provider-side
// hard budget caps are the backstop). Set AI_DAILY_LIMIT before wider beta.
const FREE_DAILY_AI_REQUESTS = Number(process.env.AI_DAILY_LIMIT ?? Infinity);

export function buildServer() {
  const app = Fastify({ logger: true });

  // --- device identity -------------------------------------------------------
  // Anonymous device id header for quotas + artifact ownership. The App Attest
  // assertion header slot is reserved here; enforcement lands with TestFlight
  // distribution (docs/product/launch/app-store-checklist.md).
  app.addHook("preHandler", async (req, reply) => {
    if (
      req.url.startsWith("/v1/ai") ||
      req.url.startsWith("/v1/artifacts") ||
      req.url.startsWith("/v1/feedback") ||
      req.url.startsWith("/v1/search")
    ) {
      const deviceId = req.headers["x-versefold-device"];
      if (typeof deviceId !== "string" || deviceId.length < 8 || deviceId.length > 128) {
        return reply.code(401).send({ error: "Missing or invalid device identity." });
      }
    }
  });

  const deviceOf = (req: { headers: Record<string, unknown> }) =>
    String(req.headers["x-versefold-device"]);

  const enforceQuota = (deviceId: string) => {
    const today = store.usageToday(deviceId);
    if ((today?.requests ?? 0) >= FREE_DAILY_AI_REQUESTS) {
      const err = new Error(
        "Daily study limit reached. Reading is always available — the study layer resets tomorrow."
      );
      (err as Error & { statusCode: number }).statusCode = 429;
      throw err;
    }
  };

  // --- health + metrics ------------------------------------------------------
  app.get("/health", async () => ({ ok: true, scriptureCache: cacheStats() }));

  app.get("/metrics", async () => ({
    usage: store.totalUsage(),
    daily: store.dailyUsage(),
    scriptureCache: cacheStats(),
  }));

  // --- translations (rights-filtered, drives app UI gating) -------------------
  app.get("/v1/translations", async () => ({ translations: publicTranslationConfig() }));

  // --- scripture proxy ---------------------------------------------------------
  app.get<{ Params: { translation: string; passageId: string } }>(
    "/v1/scripture/:translation/:passageId",
    async (req) => {
      assertRight(req.params.translation, "display");
      const passage = await getPassage(req.params.translation, req.params.passageId);
      return { passage };
    }
  );

  // Chapter as parsed verses — powers the reader's translation switcher.
  // Display-only right required; licensed text is cached per rights TTL and
  // never stored on device (the app keeps a session cache only).
  app.get<{ Params: { translation: string; osis: string; chapter: string } }>(
    "/v1/scripture/:translation/chapter/:osis/:chapter",
    async (req, reply) => {
      assertRight(req.params.translation, "display");
      const chapterNum = Number(req.params.chapter);
      if (!Number.isInteger(chapterNum) || chapterNum < 1 || chapterNum > 176) {
        return reply.code(400).send({ error: "Invalid chapter number." });
      }
      const chapter = await getChapterVerses(req.params.translation, req.params.osis, chapterNum);
      return { chapter };
    }
  );

  // --- AI: explain / unfold ----------------------------------------------------
  app.post<{
    Body: {
      translation: string;
      passageId: string;
      lens?: string;
      question?: string;
      depth?: "standard" | "deeper";
      save?: boolean;
    };
  }>("/v1/ai/explain", async (req) => {
    const deviceId = deviceOf(req);
    enforceQuota(deviceId);

    const lens = (req.body.lens ?? "plain_language") as Lens;
    if (!LENSES.includes(lens)) {
      const err = new Error(`Unknown lens '${req.body.lens}'`);
      (err as Error & { statusCode: number }).statusCode = 400;
      throw err;
    }

    const result = await explainPassage({
      translationKey: req.body.translation,
      passageId: req.body.passageId,
      lens,
      userQuestion: req.body.question,
      depth: req.body.depth,
    });

    store.recordUsage(deviceId, result.usage.inputTokens, result.usage.outputTokens);

    let artifactId: string | undefined;
    if (req.body.save) {
      artifactId = store.saveArtifact({
        deviceId,
        type: req.body.question ? "ask" : "explanation",
        promptVersion: result.promptVersion,
        modelVersion: result.modelVersion,
        payload: { explanation: result.explanation, passage: result.passage, lens },
      }).id;
    }

    return {
      passage: result.passage, // exact Scripture from source — render this
      explanation: result.explanation, // labeled AI blocks — render distinctly
      basis: { references: result.explanation.references, dropped: result.droppedReferences },
      grounding: result.groundedOnText ? "passage_text" : "reference_only_pd_fallback",
      promptVersion: result.promptVersion,
      modelVersion: result.modelVersion,
      artifactId,
    };
  });

  // Streaming unfold: same pipeline and same final payload as /v1/ai/explain,
  // but delivered over SSE — `partial` events carry readable text while the
  // model writes, and the terminal `complete` event carries the full validated
  // response. Cache hits emit `complete` immediately.
  app.post<{
    Body: {
      translation: string;
      passageId: string;
      lens?: string;
      question?: string;
      depth?: "standard" | "deeper";
      save?: boolean;
    };
  }>("/v1/ai/explain/stream", async (req, reply) => {
    const deviceId = deviceOf(req);
    enforceQuota(deviceId);

    const lens = (req.body.lens ?? "plain_language") as Lens;
    if (!LENSES.includes(lens)) {
      return reply.code(400).send({ error: `Unknown lens '${req.body.lens}'` });
    }

    reply.hijack();
    reply.raw.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // nginx: do not buffer this response
    });
    const send = (event: string, data: unknown) => {
      reply.raw.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    let accumulated = "";
    let lastEmit = 0;
    try {
      const result = await explainPassage({
        translationKey: req.body.translation,
        passageId: req.body.passageId,
        lens,
        userQuestion: req.body.question,
        depth: req.body.depth,
        onDelta: (delta) => {
          accumulated += delta;
          const now = Date.now();
          if (now - lastEmit < 250) return; // ~4 partials/sec is plenty for reading
          lastEmit = now;
          const partial = partialExplanation(accumulated);
          if (partial) send("partial", partial);
        },
      });

      store.recordUsage(deviceId, result.usage.inputTokens, result.usage.outputTokens);

      let artifactId: string | undefined;
      if (req.body.save) {
        artifactId = store.saveArtifact({
          deviceId,
          type: req.body.question ? "ask" : "explanation",
          promptVersion: result.promptVersion,
          modelVersion: result.modelVersion,
          payload: { explanation: result.explanation, passage: result.passage, lens },
        }).id;
      }

      send("complete", {
        passage: result.passage,
        explanation: result.explanation,
        basis: { references: result.explanation.references, dropped: result.droppedReferences },
        grounding: result.groundedOnText ? "passage_text" : "reference_only_pd_fallback",
        promptVersion: result.promptVersion,
        modelVersion: result.modelVersion,
        artifactId,
      });
    } catch (err) {
      app.log.error({ err }, "streaming explain failed");
      send("error", { message: err instanceof Error ? err.message : "Unfold failed. Please try again." });
    } finally {
      reply.raw.end();
    }
  });

  // --- AI: guided study ----------------------------------------------------------
  app.post<{ Body: StudyRequest }>("/v1/ai/study", async (req) => {
    const deviceId = deviceOf(req);
    enforceQuota(deviceId);

    const { days, minutesPerDay } = req.body;
    if (![3, 7, 14].includes(days) || minutesPerDay < 5 || minutesPerDay > 120) {
      const err = new Error("Study must be 3, 7, or 14 days with 5-120 minutes per day.");
      (err as Error & { statusCode: number }).statusCode = 400;
      throw err;
    }

    const result = await generateStudy(req.body);
    store.recordUsage(deviceId, result.usage.inputTokens, result.usage.outputTokens);

    // Studies are always durable artifacts (never recomputed on view).
    const artifact = store.saveArtifact({
      deviceId,
      type: "study",
      promptVersion: result.promptVersion,
      modelVersion: result.modelVersion,
      payload: { plan: result.plan, request: req.body },
    });

    return { artifactId: artifact.id, plan: result.plan, dropped: result.droppedReferences };
  });

  // Background study builds: POST answers immediately with a job id so the
  // reader can keep reading while the study is written; the app polls the GET
  // until the plan is ready (or the build fails).
  app.post<{ Body: StudyRequest }>("/v1/ai/study/jobs", async (req, reply) => {
    const deviceId = deviceOf(req);
    enforceQuota(deviceId);

    const { days, minutesPerDay } = req.body;
    if (![3, 7, 14].includes(days) || minutesPerDay < 5 || minutesPerDay > 120) {
      return reply.code(400).send({ error: "Study must be 3, 7, or 14 days with 5-120 minutes per day." });
    }

    const job = store.createStudyJob(deviceId, days);
    const body = req.body;

    void (async () => {
      try {
        const result = await generateStudy(body, (daysReady, totalDays) => {
          store.updateStudyJob(job.id, { daysReady, totalDays });
        });
        store.recordUsage(deviceId, result.usage.inputTokens, result.usage.outputTokens);
        const artifact = store.saveArtifact({
          deviceId,
          type: "study",
          promptVersion: result.promptVersion,
          modelVersion: result.modelVersion,
          payload: { plan: result.plan, request: body },
        });
        store.updateStudyJob(job.id, {
          status: "complete",
          daysReady: result.plan.days.length,
          totalDays: result.plan.days.length,
          artifactId: artifact.id,
          plan: result.plan,
          dropped: result.droppedReferences,
        });
      } catch (err) {
        app.log.error({ err, jobId: job.id }, "study job failed");
        store.updateStudyJob(job.id, {
          status: "failed",
          error: err instanceof Error ? err.message : "Study generation failed. Please try again.",
        });
      }
    })();

    return reply.code(202).send({ jobId: job.id, totalDays: days });
  });

  app.get<{ Params: { id: string } }>("/v1/ai/study/jobs/:id", async (req, reply) => {
    const job = store.getStudyJob(req.params.id);
    if (!job || job.deviceId !== deviceOf(req)) {
      return reply.code(404).send({ error: "Study job not found." });
    }
    return {
      jobId: job.id,
      status: job.status,
      daysReady: job.daysReady,
      totalDays: job.totalDays,
      artifactId: job.artifactId,
      plan: job.plan,
      dropped: job.dropped,
      error: job.error,
    };
  });

  // --- semantic search (by meaning, over PD KJV embeddings) -----------------------
  // Cheap (one embedding call, fractions of a cent) — deliberately outside the
  // AI quota so exploratory search always feels free and fast.
  app.post<{ Body: { query: string; limit?: number } }>("/v1/search/semantic", async (req, reply) => {
    const query = req.body?.query?.trim();
    if (!query || query.length < 3 || query.length > 200) {
      return reply.code(400).send({ error: "Query must be 3-200 characters." });
    }
    if (!semanticIndexReady()) {
      return reply.code(503).send({ error: "Semantic search is warming up. Word search still works." });
    }
    const limit = Math.min(Math.max(req.body.limit ?? 12, 1), 25);
    const hits = await searchByMeaning(query, limit);
    return { hits };
  });

  // --- AI: confession-card assist ------------------------------------------------
  app.post<{ Body: { translation?: string; passageId: string; focus?: string } }>(
    "/v1/ai/card",
    async (req) => {
      const deviceId = deviceOf(req);
      enforceQuota(deviceId);

      const result = await craftConfessions({
        translationKey: req.body.translation ?? "kjv",
        passageId: req.body.passageId,
        focus: req.body.focus?.trim() || undefined,
      });

      store.recordUsage(deviceId, result.usage.inputTokens, result.usage.outputTokens);

      return {
        passage: result.passage,
        confessions: result.confessions,
        promptVersion: result.promptVersion,
        modelVersion: result.modelVersion,
      };
    }
  );

  // --- artifacts (user-owned: list, export, delete) --------------------------------
  app.get("/v1/artifacts", async (req) => ({ artifacts: store.listArtifacts(deviceOf(req)) }));

  app.delete("/v1/artifacts", async (req) => ({
    deleted: store.deleteArtifacts(deviceOf(req)),
  }));

  // --- feedback (private beta) -------------------------------------------------------
  app.post<{ Body: { message: string; context?: string } }>("/v1/feedback", async (req, reply) => {
    if (!req.body?.message?.trim()) return reply.code(400).send({ error: "Empty feedback." });
    const item = store.saveFeedback(deviceOf(req), req.body.message.trim(), req.body.context);
    return { received: item.id };
  });

  // --- error shaping -----------------------------------------------------------------
  app.setErrorHandler((err: Error & { statusCode?: number }, _req, reply) => {
    const status = err instanceof RightsError ? 451 : (err.statusCode ?? 500);
    app.log.error({ err }, "request failed");
    reply.code(status).send({ error: err.message });
  });

  return app;
}

// Start only when run directly (not under tests).
if (process.argv[1] && process.argv[1].endsWith("server.ts")) {
  const app = buildServer();
  app.listen({ port: config.port, host: "0.0.0.0" }).catch((err) => {
    app.log.error(err);
    process.exit(1);
  });
}
