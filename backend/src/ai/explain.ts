/**
 * Passage explanation ("Unfold") and scoped ask — the core AI experience.
 * Pipeline: rights gate -> scripture retrieval -> moderation -> model ->
 * citation validation -> labeled blocks. Copyright translations are handled
 * reference-only per the rights policy.
 */
import { config } from "../config.js";
import { getPassage, type Passage } from "../scripture.js";
import { getTranslation, mayLlmSend } from "../rights.js";
import { getGateway } from "./gateway.js";
import { SYSTEM_PROMPT, PROMPT_VERSION, buildExplainInput, type Lens } from "./prompts.js";
import { EXPLANATION_SCHEMA, type Explanation } from "./schema.js";
import { validateCitations } from "./citations.js";
import { ScriptureCache } from "../cache.js";

/**
 * Unfold response cache. The same verse unfolded through the same lens is the
 * same answer — popular passages become instant instead of a full model run.
 * Requests carrying a personal question always bypass it.
 */
const explainCache = new ScriptureCache(
  config.databasePath.replace(/\.db$/, "-explain-cache.json")
);
const EXPLAIN_CACHE_TTL_SECONDS = 7 * 24 * 3600;

function explainCacheKey(opts: {
  translationKey: string;
  passageId: string;
  lens: Lens;
  depth?: "standard" | "deeper";
}): string {
  return [
    "explain",
    PROMPT_VERSION,
    config.models.explain,
    opts.translationKey,
    opts.passageId,
    opts.lens,
    opts.depth ?? "standard",
  ].join(":");
}

export interface ExplainResult {
  explanation: Explanation;
  passage: Passage; // exact text from the Scripture source — the app renders THIS, never model text
  droppedReferences: string[];
  promptVersion: string;
  modelVersion: string;
  usage: { inputTokens: number; outputTokens: number };
  groundedOnText: boolean; // false when rights forced reference-only grounding
}

export interface ExplainOptions {
  translationKey: string;
  passageId: string;
  lens: Lens;
  userQuestion?: string;
  depth?: "standard" | "deeper";
  /** Raw model-output deltas, forwarded while the model writes (SSE path). */
  onDelta?: (delta: string) => void;
}

export async function explainPassage(opts: ExplainOptions): Promise<ExplainResult> {
  const t = getTranslation(opts.translationKey);

  // Cache: only question-free unfolds are cacheable (they're deterministic in
  // meaning), and copyrighted passage text may only be cached per its rights.
  const cacheable = !opts.userQuestion;
  const cacheKey = explainCacheKey(opts);
  if (cacheable) {
    const hit = explainCache.get<ExplainResult>(cacheKey);
    if (hit) {
      // A cache hit costs no tokens; report zero usage so metering stays true.
      return { ...hit, usage: { inputTokens: 0, outputTokens: 0 } };
    }
  }

  // The passage the reader sees always comes from the source in their chosen translation.
  const displayPassage = await getPassage(opts.translationKey, opts.passageId);

  // Rights gate for prompt grounding: copyright text never enters the prompt.
  const groundedOnText = mayLlmSend(opts.translationKey);
  const promptPassage = groundedOnText
    ? displayPassage
    : await getPassage("kjv", opts.passageId); // PD fallback text for grounding

  let crisisCare = false;
  if (opts.userQuestion) {
    const moderation = await getGateway().moderate(opts.userQuestion);
    if (moderation.flagged) {
      const categories = Object.entries(moderation.categories ?? {})
        .filter(([, hit]) => hit)
        .map(([name]) => name);
      const onlySelfHarm = categories.length > 0 && categories.every((c) => c.startsWith("self-harm"));
      if (onlySelfHarm) {
        // A person in distress gets care, not a rejection (safety contract §7).
        crisisCare = true;
      } else {
        const err = new Error("This question can't be processed. Please rephrase it.");
        (err as Error & { statusCode: number }).statusCode = 422;
        throw err;
      }
    }
  }

  let input = buildExplainInput({
    reference: promptPassage.reference,
    passageId: promptPassage.passageId,
    translation: groundedOnText ? t.abbreviation : "KJV",
    passageText: promptPassage.text,
    lens: opts.lens,
    userQuestion: opts.userQuestion,
    depth: opts.depth,
  });
  if (crisisCare) {
    input +=
      "\n\nIMPORTANT: The reader may be in personal distress or crisis. Respond with genuine warmth and care, " +
      "stay with what the passage says, gently encourage them to reach out right now to a trusted person, pastor, " +
      "or professional (including a crisis line if they are in danger), and do not lecture or moralize.";
  }

  // Benchmarked 2026-07-16: the explain model matches the study model on
  // unfold quality at 2.4x the speed, so every depth runs on it now.
  const response = await getGateway().complete({
    model: config.models.explain,
    system: SYSTEM_PROMPT,
    input,
    schema: EXPLANATION_SCHEMA as unknown as {
      name: string;
      strict: boolean;
      schema: Record<string, unknown>;
    },
    onDelta: opts.onDelta,
  });

  let explanation: Explanation;
  try {
    explanation = JSON.parse(response.text) as Explanation;
  } catch {
    const err = new Error("Model returned an unreadable response; nothing was saved.");
    (err as Error & { statusCode: number }).statusCode = 502;
    throw err;
  }

  // Validate every reference against the PD source; drop invalid ones.
  const report = await validateCitations("kjv", explanation.references, { requireAtLeastOne: true });
  explanation.references = report.valid;

  const result: ExplainResult = {
    explanation,
    passage: displayPassage,
    droppedReferences: report.dropped,
    promptVersion: PROMPT_VERSION,
    modelVersion: response.model,
    usage: response.usage,
    groundedOnText,
  };

  if (cacheable) {
    // Copyrighted passage text is cached no longer than its rights allow.
    const ttl = t.publicDomain
      ? EXPLAIN_CACHE_TTL_SECONDS
      : Math.min(EXPLAIN_CACHE_TTL_SECONDS, t.rights.cacheTtlSeconds);
    if (t.publicDomain || t.rights.caching) explainCache.set(cacheKey, result, ttl);
  }

  return result;
}
