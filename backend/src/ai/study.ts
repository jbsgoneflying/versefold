/**
 * Guided study generation. Strong model, structured output, every day's
 * readings citation-validated. Saved as a durable artifact by the route —
 * never recomputed on view. No streak concepts exist anywhere in the schema.
 */
import { config } from "../config.js";
import { getPassage } from "../scripture.js";
import { getGateway } from "./gateway.js";
import { SYSTEM_PROMPT } from "./prompts.js";
import { STUDY_SCHEMA, type StudyPlan } from "./schema.js";
import { validateCitations } from "./citations.js";

const STUDY_PROMPT_VERSION = "study-v1";

export interface StudyRequest {
  source: string; // OSIS passage/chapter/book id OR a theme phrase
  sourceType: "passage" | "theme";
  days: 3 | 7 | 14;
  minutesPerDay: number;
  depth: "gentle" | "standard" | "deeper";
  lens?: string;
}

export interface StudyResult {
  plan: StudyPlan;
  droppedReferences: string[];
  promptVersion: string;
  modelVersion: string;
  usage: { inputTokens: number; outputTokens: number };
}

export async function generateStudy(req: StudyRequest): Promise<StudyResult> {
  let anchor = "";
  if (req.sourceType === "passage") {
    const p = await getPassage("kjv", req.source);
    anchor = `Anchor passage ${p.reference} (KJV):\n"""${p.text}"""`;
  } else {
    const { flagged } = await getGateway().moderate(req.source);
    if (flagged) {
      const err = new Error("This study topic can't be processed. Please rephrase it.");
      (err as Error & { statusCode: number }).statusCode = 422;
      throw err;
    }
    anchor = `Theme requested by the reader: "${req.source}"`;
  }

  const input = [
    anchor,
    ``,
    `Create a ${req.days}-day guided study. Constraints:`,
    `- The reader has about ${req.minutesPerDay} minutes per day; size each day accordingly.`,
    `- Depth: ${req.depth}.${req.lens ? ` Lens: ${req.lens}.` : ""}`,
    `- Each day: one primary reading (OSIS reference), up to 3 supporting readings, brief context,`,
    `  a central theme, 2-4 reflection questions, a short prayer prompt, and optionally one practical response.`,
    `- Only cite Bible references you are confident exist. Do not include streaks, scores, or completion pressure.`,
  ].join("\n");

  const response = await getGateway().complete({
    model: config.models.study,
    system: SYSTEM_PROMPT,
    input,
    schema: STUDY_SCHEMA as unknown as { name: string; strict: boolean; schema: Record<string, unknown> },
    maxOutputTokens: 6000,
  });

  let plan: StudyPlan;
  try {
    plan = JSON.parse(response.text) as StudyPlan;
  } catch {
    const err = new Error("Study generation returned an unreadable response; nothing was saved.");
    (err as Error & { statusCode: number }).statusCode = 502;
    throw err;
  }

  // Validate every reading across every day; drop invalid supporting refs,
  // reject the plan if any PRIMARY reading is invalid (a study day without
  // its reading is not a study day).
  const dropped: string[] = [];
  for (const day of plan.days) {
    const primary = await validateCitations("kjv", [day.primaryReading]);
    if (primary.valid.length === 0) {
      const err = new Error(
        `Generated study day ${day.dayNumber} cited an invalid primary reading; plan rejected.`
      );
      (err as Error & { statusCode: number }).statusCode = 502;
      throw err;
    }
    day.primaryReading = primary.valid[0];
    const supporting = await validateCitations("kjv", day.supportingReadings);
    day.supportingReadings = supporting.valid;
    dropped.push(...supporting.dropped);
  }

  return {
    plan,
    droppedReferences: dropped,
    promptVersion: STUDY_PROMPT_VERSION,
    modelVersion: response.model,
    usage: response.usage,
  };
}
