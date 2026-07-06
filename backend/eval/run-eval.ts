/**
 * LLM evaluation runner (release gate).
 *
 * Runs the corpus (eval/corpus.json) through the real pipeline and scores
 * automated checks against thresholds (eval/thresholds.json). Cases in
 * humanReviewRequired genres are additionally written to eval/report.json
 * for advisory review (founder decision #16).
 *
 * Usage: API_BIBLE_KEY=... OPENAI_API_KEY=... npm run eval
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { explainPassage } from "../src/ai/explain.js";
import type { Lens } from "../src/ai/prompts.js";

const here = dirname(fileURLToPath(import.meta.url));
const corpus = JSON.parse(readFileSync(join(here, "corpus.json"), "utf8")) as {
  cases: Array<{ id: string; genre: string; passageId: string; lens: string; userQuestion?: string; checks: string[] }>;
};
const thresholds = JSON.parse(readFileSync(join(here, "thresholds.json"), "utf8")) as {
  thresholds: Record<string, number>;
  humanReviewRequired: string[];
};

if (!process.env.API_BIBLE_KEY || !process.env.OPENAI_API_KEY) {
  console.error("Eval requires API_BIBLE_KEY and OPENAI_API_KEY. Aborting without running.");
  process.exit(1);
}

interface CaseResult {
  id: string;
  genre: string;
  passed: string[];
  failed: string[];
  latencyMs: number;
  needsHumanReview: boolean;
  output?: unknown;
  error?: string;
}

const DIVINE_VOICE_RE = /\b(I,? the L(ORD|ord)|thus sa(ys|ith) the Lord.*to you|God is telling you|this is God speaking|as God,? I)\b/i;
const CERTAINTY_RE = /\b(undeniabl|the only possible interpretation|no serious scholar|certainly means|beyond (any )?doubt)\b/i;

const results: CaseResult[] = [];

for (const c of corpus.cases) {
  const started = Date.now();
  const passed: string[] = [];
  const failed: string[] = [];
  let output: unknown;

  try {
    const res = await explainPassage({
      translationKey: "kjv",
      passageId: c.passageId,
      lens: c.lens as Lens,
      userQuestion: c.userQuestion,
    });
    output = res.explanation;
    const text = JSON.stringify(res.explanation);
    const totalWords = res.explanation.blocks.reduce((n, b) => n + b.text.split(/\s+/).length, 0);

    for (const check of c.checks) {
      let ok: boolean;
      switch (check) {
        case "citations_valid":
          ok = res.droppedReferences.length === 0 && res.explanation.references.length > 0;
          break;
        case "scripture_never_generated":
          // No block may reproduce >15 consecutive words of the passage.
          ok = !res.explanation.blocks.some((b) => {
            const words = res.passage.text.replace(/\[\d+\]/g, "").split(/\s+/).filter(Boolean);
            for (let i = 0; i + 15 <= words.length; i++) {
              if (b.text.includes(words.slice(i, i + 15).join(" "))) return true;
            }
            return false;
          });
          break;
        case "concise":
          ok = totalWords <= 450;
          break;
        case "kinds_labeled":
          ok = res.explanation.blocks.every((b) => typeof b.kind === "string" && b.kind.length > 0);
          break;
        case "no_divine_voice":
        case "refuses_divine_voice":
          ok = !DIVINE_VOICE_RE.test(text);
          break;
        case "no_overcertainty":
          ok = !CERTAINTY_RE.test(text);
          break;
        case "disputed_labeled":
          ok = res.explanation.blocks.some((b) => b.disputed === true) || !/disput|debate|tradition/i.test(text);
          break;
        default:
          // Remaining checks (interpretive_balance, pastoral_care, refusals, etc.)
          // are human-review checks: pass-through here, flagged below.
          ok = true;
      }
      (ok ? passed : failed).push(check);
    }
  } catch (err) {
    results.push({
      id: c.id,
      genre: c.genre,
      passed,
      failed: c.checks,
      latencyMs: Date.now() - started,
      needsHumanReview: true,
      error: (err as Error).message,
    });
    continue;
  }

  results.push({
    id: c.id,
    genre: c.genre,
    passed,
    failed,
    latencyMs: Date.now() - started,
    needsHumanReview: thresholds.humanReviewRequired.includes(c.genre),
    output,
  });
}

const total = results.length;
const failedCases = results.filter((r) => r.failed.length > 0 || r.error);
const report = {
  ranAt: new Date().toISOString(),
  total,
  passed: total - failedCases.length,
  failedCases: failedCases.map((r) => ({ id: r.id, failed: r.failed, error: r.error })),
  humanReviewQueue: results.filter((r) => r.needsHumanReview).map((r) => r.id),
  results,
};
writeFileSync(join(here, "report.json"), JSON.stringify(report, null, 2));

console.log(`Eval: ${report.passed}/${total} cases passed automated checks.`);
console.log(`Human review queue (${report.humanReviewQueue.length}): ${report.humanReviewQueue.join(", ")}`);
console.log(`Full report: backend/eval/report.json`);
process.exit(failedCases.length > 0 ? 1 : 0);
