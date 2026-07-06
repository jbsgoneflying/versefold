import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

export interface TranslationRights {
  display: boolean;
  offlineStorage: boolean;
  fullTextSearch: boolean;
  passageExport: boolean;
  cardExport: boolean;
  llmSend: boolean;
  embedding: boolean;
  caching: boolean;
  cacheTtlSeconds: number;
  attributionRequired: boolean;
  maxQuoteVerses: number | null;
  territories: string[];
}

export interface Translation {
  name: string;
  abbreviation: string;
  bibleId: string;
  publicDomain: boolean;
  rights: TranslationRights;
}

const here = dirname(fileURLToPath(import.meta.url));

const raw = JSON.parse(
  readFileSync(join(here, "../config/translations.json"), "utf8")
) as { translations: Record<string, Translation> };

export const translations: Record<string, Translation> = raw.translations;

export const config = {
  port: Number(process.env.PORT ?? 8787),
  apiBibleKey: process.env.API_BIBLE_KEY ?? "",
  openaiKey: process.env.OPENAI_API_KEY ?? "",
  databasePath: process.env.DATABASE_PATH ?? join(here, "../data/versefold.db"),
  models: {
    classify: process.env.MODEL_CLASSIFY ?? "gpt-5.4-nano",
    explain: process.env.MODEL_EXPLAIN ?? "gpt-5.4-mini",
    study: process.env.MODEL_STUDY ?? "gpt-5.5",
  },
  apiBibleBase: "https://rest.api.bible/v1",
  openaiBase: process.env.OPENAI_BASE ?? "https://api.openai.com/v1",
};
