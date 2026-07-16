/**
 * Guided study generation. Strong model, structured output, every day's
 * readings citation-validated. Saved as a durable artifact by the route —
 * never recomputed on view. No streak concepts exist anywhere in the schema.
 *
 * Generation is SPLIT for speed: one outline call shapes the whole arc
 * (titles, primary readings, themes), then every day is filled by its own
 * small call, all in parallel. Wall time is roughly outline + one day,
 * instead of one giant sequential plan (which timed out on 14-day plans).
 */
import { config } from "../config.js";
import { getPassage } from "../scripture.js";
import { getGateway } from "./gateway.js";
import { SYSTEM_PROMPT } from "./prompts.js";
import {
  STUDY_OUTLINE_SCHEMA,
  STUDY_DAY_SCHEMA,
  type StudyOutline,
  type StudyDayFill,
  type StudyPlan,
  type StudyDay,
} from "./schema.js";
import { validateCitations, normalizeReference } from "./citations.js";

const STUDY_PROMPT_VERSION = "study-v2"; // v2: outline + per-day split generation

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

const OSIS_RULE =
  `Every reading MUST be a full OSIS reference with standard 3-letter book codes, ` +
  `e.g. "JHN.3.16", "PSA.23", or "ROM.8.28-ROM.8.30" (ranges repeat the book and chapter). ` +
  `Only cite Bible references you are confident exist.`;

/** Schema field names are structure, not prose — some models echo them. */
const LABEL_RULE =
  `JSON field names are structural only. Never begin any text value with a label ` +
  `like "interpretation:", "context:", "reflection_question:", or "prayer_prompt:".`;

const LABEL_PREFIX =
  /^(?:interpretation|historical_context|application|reflection_question|prayer_prompt|practical_response|context|central_theme|paraphrase|ai_study_note)\s*:\s*/i;

function stripLabel(text: string): string {
  return text.replace(LABEL_PREFIX, "").trim();
}

function parseOrThrow<T>(text: string, what: string): T {
  try {
    return JSON.parse(text) as T;
  } catch {
    const err = new Error(`${what} returned an unreadable response; nothing was saved.`);
    (err as Error & { statusCode: number }).statusCode = 502;
    throw err;
  }
}

export async function generateStudy(
  req: StudyRequest,
  onProgress?: (daysReady: number, totalDays: number) => void
): Promise<StudyResult> {
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

  const usage = { inputTokens: 0, outputTokens: 0 };
  const gateway = getGateway();

  // --- 1. The outline: the whole arc in one fast, small call -----------------
  const outlineInput = [
    anchor,
    ``,
    `Design the ARC of a ${req.days}-day guided study. Return only the outline:`,
    `an overall title, a one-or-two sentence description, and for each day a`,
    `day number, a short title, ONE primary reading (OSIS reference), and a`,
    `one-sentence central theme.`,
    `- The reader has about ${req.minutesPerDay} minutes per day; choose readings that fit.`,
    `- Depth: ${req.depth}.${req.lens ? ` Lens: ${req.lens}.` : ""}`,
    `- Exactly ${req.days} days. Do not repeat the same primary reading across days.`,
    `- ${OSIS_RULE}`,
    `- Do not include streaks, scores, or completion pressure.`,
    `- ${LABEL_RULE}`,
  ].join("\n");

  const outlineResponse = await gateway.complete({
    model: config.models.study,
    system: SYSTEM_PROMPT,
    input: outlineInput,
    schema: STUDY_OUTLINE_SCHEMA as unknown as { name: string; strict: boolean; schema: Record<string, unknown> },
    maxOutputTokens: 1500,
  });
  usage.inputTokens += outlineResponse.usage.inputTokens;
  usage.outputTokens += outlineResponse.usage.outputTokens;

  const outline = parseOrThrow<StudyOutline>(outlineResponse.text, "Study outline generation");
  if (outline.days.length === 0) {
    const err = new Error("Study outline came back empty; nothing was saved. Please try again.");
    (err as Error & { statusCode: number }).statusCode = 502;
    throw err;
  }
  // Trust content over numbering: renumber sequentially, cap at the request.
  const outlineDays = outline.days.slice(0, req.days).map((d, i) => ({ ...d, dayNumber: i + 1 }));
  const totalDays = outlineDays.length;
  let daysReady = 0;
  onProgress?.(0, totalDays);

  // --- 2. Fill every day in parallel ------------------------------------------
  const dayTitles = outlineDays.map((d) => `Day ${d.dayNumber}: ${d.title}`).join("; ");

  async function fillDay(day: (typeof outlineDays)[number]): Promise<StudyDay> {
    // Ground the day in its actual primary reading text when we can fetch it.
    let readingBlock = `Primary reading: ${day.primaryReading}`;
    try {
      const p = await getPassage("kjv", normalizeReference(day.primaryReading));
      readingBlock = `Primary reading ${p.reference} (KJV):\n"""${p.text}"""`;
    } catch {
      // Unfetchable outline reading: the model works from the reference alone
      // and citation validation below will promote a supporting reading.
    }

    const input = [
      `You are filling in one day of a guided study titled "${outline.title}".`,
      `Full arc for context: ${dayTitles}.`,
      ``,
      `Today is Day ${day.dayNumber} of ${totalDays}: "${day.title}"`,
      `Central theme: ${day.centralTheme}`,
      readingBlock,
      ``,
      `Write this day's content. The reader has about ${req.minutesPerDay} minutes; depth: ${req.depth}.${req.lens ? ` Lens: ${req.lens}.` : ""}`,
      `- Up to 3 supporting readings (OSIS references) that genuinely deepen today's reading.`,
      `- A brief context paragraph, 2-4 reflection questions, a short prayer prompt,`,
      `  and optionally one practical response.`,
      `- ${OSIS_RULE}`,
      `- Do not include streaks, scores, or completion pressure.`,
      `- ${LABEL_RULE}`,
    ].join("\n");

    const attempt = () =>
      gateway.complete({
        model: config.models.study,
        system: SYSTEM_PROMPT,
        input,
        schema: STUDY_DAY_SCHEMA as unknown as { name: string; strict: boolean; schema: Record<string, unknown> },
        maxOutputTokens: 1200,
      });

    // One quiet retry: a single flaky day must not sink a whole plan.
    let response;
    try {
      response = await attempt();
    } catch {
      response = await attempt();
    }
    usage.inputTokens += response.usage.inputTokens;
    usage.outputTokens += response.usage.outputTokens;

    const fill = parseOrThrow<StudyDayFill>(response.text, `Study day ${day.dayNumber} generation`);

    daysReady += 1;
    onProgress?.(daysReady, totalDays);

    return {
      dayNumber: day.dayNumber,
      title: stripLabel(day.title),
      primaryReading: day.primaryReading,
      supportingReadings: fill.supportingReadings,
      context: stripLabel(fill.context),
      centralTheme: stripLabel(day.centralTheme),
      reflectionQuestions: fill.reflectionQuestions.map(stripLabel),
      prayerPrompt: stripLabel(fill.prayerPrompt),
      practicalResponse: fill.practicalResponse ? stripLabel(fill.practicalResponse) : null,
    };
  }

  const days = await Promise.all(outlineDays.map(fillDay));

  const plan: StudyPlan = {
    title: stripLabel(outline.title),
    description: stripLabel(outline.description),
    days,
  };

  // --- 3. Validate every reading across every day, all days in parallel ------
  // Drop invalid supporting refs. If a day's PRIMARY reading is invalid,
  // promote its first valid supporting reading instead of rejecting the whole
  // plan — only give up when a day has no valid reading at all.
  const dropped: string[] = [];
  await Promise.all(
    plan.days.map(async (day) => {
      const [primary, supporting] = await Promise.all([
        validateCitations("kjv", [day.primaryReading]),
        validateCitations("kjv", day.supportingReadings),
      ]);
      dropped.push(...supporting.dropped);

      if (primary.valid.length > 0) {
        day.primaryReading = primary.valid[0];
        day.supportingReadings = supporting.valid;
      } else if (supporting.valid.length > 0) {
        dropped.push(...primary.dropped);
        day.primaryReading = supporting.valid[0];
        day.supportingReadings = supporting.valid.slice(1);
      } else {
        const err = new Error(
          `Generated study day ${day.dayNumber} had no valid readings; nothing was saved. Please try again.`
        );
        (err as Error & { statusCode: number }).statusCode = 502;
        throw err;
      }
    })
  );

  return {
    plan,
    droppedReferences: dropped,
    promptVersion: STUDY_PROMPT_VERSION,
    modelVersion: outlineResponse.model,
    usage,
  };
}
