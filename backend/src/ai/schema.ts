/**
 * Structured Output JSON schemas (OpenAI Responses API, strict mode).
 * Content kinds are the product's content-category contract: the UI renders
 * each kind distinctly and they must never blur.
 */

export const CONTENT_KINDS = [
  "scripture_reference",
  "paraphrase",
  "historical_context",
  "interpretation",
  "application",
  "reflection_question",
  "prayer_prompt",
  "ai_study_note",
] as const;
export type ContentKind = (typeof CONTENT_KINDS)[number];

export interface ExplanationBlock {
  kind: ContentKind;
  text: string;
  disputed: boolean;
}

export interface Explanation {
  summary: string;
  blocks: ExplanationBlock[];
  references: string[]; // OSIS ids, validated post-hoc against the Scripture source
}

export const EXPLANATION_SCHEMA = {
  name: "versefold_explanation",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["summary", "blocks", "references"],
    properties: {
      summary: {
        type: "string",
        description: "Two to four sentence plain summary of the passage's meaning.",
      },
      blocks: {
        type: "array",
        maxItems: 8,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["kind", "text", "disputed"],
          properties: {
            kind: { type: "string", enum: [...CONTENT_KINDS] },
            text: { type: "string" },
            disputed: {
              type: "boolean",
              description: "True when the block presents an interpretation that is meaningfully disputed across traditions.",
            },
          },
        },
      },
      references: {
        type: "array",
        maxItems: 12,
        items: {
          type: "string",
          description:
            "OSIS-style Bible reference. Single verse: JHN.3.16. Range: repeat the full book.chapter.verse on both sides of the dash, e.g. ROM.8.28-ROM.8.30 (never ROM.8.28-30).",
        },
      },
    },
  },
} as const;

export interface CardConfessions {
  confessions: string[];
}

/**
 * Confession-card assist: short first-person confessions built on the
 * passage's meaning — for meditating on and muttering through the day.
 * These render in the card's clearly-labeled personal section, never as Scripture.
 */
export const CARD_SCHEMA = {
  name: "versefold_card_confessions",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["confessions"],
    properties: {
      confessions: {
        type: "array",
        minItems: 3,
        maxItems: 3,
        items: {
          type: "string",
          description:
            "A short first-person, present-tense confession (under 30 words) faithful to the passage's meaning. Not a quotation of the verse and not words placed in God's mouth.",
        },
      },
    },
  },
} as const;

export interface StudyDay {
  dayNumber: number;
  title: string;
  primaryReading: string; // OSIS ref
  supportingReadings: string[];
  context: string;
  centralTheme: string;
  reflectionQuestions: string[];
  prayerPrompt: string;
  practicalResponse: string | null;
}

export interface StudyPlan {
  title: string;
  description: string;
  days: StudyDay[];
}

export const STUDY_SCHEMA = {
  name: "versefold_study_plan",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["title", "description", "days"],
    properties: {
      title: { type: "string" },
      description: { type: "string" },
      days: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: [
            "dayNumber",
            "title",
            "primaryReading",
            "supportingReadings",
            "context",
            "centralTheme",
            "reflectionQuestions",
            "prayerPrompt",
            "practicalResponse",
          ],
          properties: {
            dayNumber: { type: "integer" },
            title: { type: "string" },
            primaryReading: { type: "string" },
            supportingReadings: { type: "array", maxItems: 4, items: { type: "string" } },
            context: { type: "string" },
            centralTheme: { type: "string" },
            reflectionQuestions: { type: "array", minItems: 2, maxItems: 4, items: { type: "string" } },
            prayerPrompt: { type: "string" },
            practicalResponse: { type: ["string", "null"] },
          },
        },
      },
    },
  },
} as const;
