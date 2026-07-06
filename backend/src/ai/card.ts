/**
 * Confession-card assist. Ancient practice: "meditate" in Joshua 1:8 / Psalm 1:2
 * (Hebrew hagah) is to mutter — to keep the word on your lips through the day.
 * This crafts short first-person confessions built on the passage's MEANING.
 * The verse on the card always comes verbatim from the Scripture source;
 * these confessions live in the card's separate, labeled personal section
 * and are editable by the reader before use.
 */
import { config } from "../config.js";
import { getPassage, type Passage } from "../scripture.js";
import { assertRight } from "../rights.js";
import { getGateway } from "./gateway.js";
import { SYSTEM_PROMPT } from "./prompts.js";
import { CARD_SCHEMA, type CardConfessions } from "./schema.js";

export const CARD_PROMPT_VERSION = "card-v1";

export interface CardAssistResult {
  passage: Passage;
  confessions: string[];
  promptVersion: string;
  modelVersion: string;
  usage: { inputTokens: number; outputTokens: number };
}

export async function craftConfessions(opts: {
  translationKey: string;
  passageId: string;
  focus?: string; // optional personal emphasis, e.g. "trusting God with my job"
}): Promise<CardAssistResult> {
  // Cards require export rights AND prompt-grounding rights (KJV/WEB today).
  assertRight(opts.translationKey, "cardExport");
  assertRight(opts.translationKey, "llmSend");

  const passage = await getPassage(opts.translationKey, opts.passageId);

  if (opts.focus) {
    const { flagged } = await getGateway().moderate(opts.focus);
    if (flagged) {
      const err = new Error("This focus can't be processed. Please rephrase it.");
      (err as Error & { statusCode: number }).statusCode = 422;
      throw err;
    }
  }

  const input = [
    `Passage: ${passage.reference} (${passage.translation})`,
    `Passage text (authoritative, provided by the app):`,
    `"""${passage.text}"""`,
    ``,
    `Task: Write exactly 3 short personal confessions a reader can meditate on and quietly`,
    `mutter through the day, each built on this passage's meaning and intent.`,
    `Rules:`,
    `- First person, present tense, under 30 words each.`,
    `- Faithful to what the passage actually says — no promises it doesn't make.`,
    `- Do NOT quote or paraphrase the verse itself; the verse appears above the confession on the card.`,
    `- Never speak as God or put words in God's mouth. The reader speaks TO or ABOUT God.`,
    `- Quiet, honest, rooted tone. No hype, no name-it-claim-it language.`,
    ...(opts.focus ? [``, `The reader's personal focus: "${opts.focus}" — weave it in only where the text genuinely speaks to it.`] : []),
  ].join("\n");

  const response = await getGateway().complete({
    model: config.models.explain,
    system: SYSTEM_PROMPT,
    input,
    schema: CARD_SCHEMA as unknown as { name: string; strict: boolean; schema: Record<string, unknown> },
    maxOutputTokens: 800,
  });

  let parsed: CardConfessions;
  try {
    parsed = JSON.parse(response.text) as CardConfessions;
  } catch {
    const err = new Error("Confession crafting returned an unreadable response.");
    (err as Error & { statusCode: number }).statusCode = 502;
    throw err;
  }

  // Guard: a confession must never be a verbatim slice of the verse.
  const verseWords = passage.text.replace(/\[\d+\]/g, "").toLowerCase();
  const confessions = parsed.confessions
    .map((c) => c.trim())
    .filter((c) => c.length > 0 && !verseWords.includes(c.toLowerCase()));

  if (confessions.length === 0) {
    const err = new Error("Confession crafting failed; please try again.");
    (err as Error & { statusCode: number }).statusCode = 502;
    throw err;
  }

  return {
    passage,
    confessions,
    promptVersion: CARD_PROMPT_VERSION,
    modelVersion: response.model,
    usage: response.usage,
  };
}
