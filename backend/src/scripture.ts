/**
 * Scripture content layer: API.Bible client + rights-aware caching.
 * This is the ONLY module allowed to fetch Bible text. AI code receives text
 * from here, never from model output.
 */
import { config } from "./config.js";
import { ScriptureCache } from "./cache.js";
import { getTranslation } from "./rights.js";

export interface Passage {
  passageId: string;
  reference: string;
  text: string;
  copyright: string;
  translation: string; // abbreviation
  verseCount: number;
}

const cache = new ScriptureCache(config.databasePath.replace(/\.db$/, "-scripture-cache.json"));

/** OSIS-style passage id sanity check, e.g. JHN.3.16 or JHN.3.16-JHN.3.21 or PSA.23 */
export const PASSAGE_ID_RE = /^[1-3]?[A-Z]{2,3}\.\d{1,3}(\.\d{1,3})?(-[1-3]?[A-Z]{2,3}\.\d{1,3}(\.\d{1,3})?)?$/;

export function isValidPassageId(id: string): boolean {
  return PASSAGE_ID_RE.test(id);
}

async function apiBible<T>(path: string): Promise<T> {
  const res = await fetch(`${config.apiBibleBase}${path}`, {
    headers: { "api-key": config.apiBibleKey },
  });
  if (!res.ok) {
    const err = new Error(`API.Bible ${res.status} for ${path}`);
    // 400/404 mean "not a real passage" and must stay distinguishable from
    // transient upstream failures (5xx/429 -> 502).
    (err as Error & { statusCode: number }).statusCode =
      res.status === 400 || res.status === 404 ? res.status : 502;
    throw err;
  }
  return (await res.json()) as T;
}

interface ApiBiblePassageResponse {
  data: {
    id: string;
    reference: string;
    content: string;
    copyright?: string;
    verseCount?: number;
  };
}

/**
 * Fetch a passage as clean text, cache-first. TTL comes from the translation's
 * rights policy (0 = cache forever for public domain).
 */
export async function getPassage(translationKey: string, passageId: string): Promise<Passage> {
  if (!isValidPassageId(passageId)) {
    throw Object.assign(new Error(`Invalid passage id '${passageId}'`), { statusCode: 400 });
  }
  const t = getTranslation(translationKey);
  const cacheKey = `passage:${t.bibleId}:${passageId}:text`;

  if (t.rights.caching) {
    const hit = cache.get<Passage>(cacheKey);
    if (hit) return hit;
  }

  const { data } = await apiBible<ApiBiblePassageResponse>(
    `/bibles/${t.bibleId}/passages/${passageId}` +
      `?content-type=text&include-verse-numbers=true&include-titles=false`
  );

  const passage: Passage = {
    passageId: data.id,
    reference: data.reference,
    text: String(data.content).trim(),
    copyright: String(data.copyright ?? "").trim(),
    translation: t.abbreviation,
    verseCount: data.verseCount ?? 0,
  };

  if (t.rights.caching) cache.set(cacheKey, passage, t.rights.cacheTtlSeconds);
  return passage;
}

export interface ChapterVerses {
  translation: string; // abbreviation
  reference: string;
  copyright: string;
  verses: Array<{ v: number; t: string }>;
}

/**
 * Fetch a full chapter parsed into individual verses, for the reader's
 * translation switcher. Reuses the passage cache (chapter id like "DEU.28");
 * the `[n]` markers come from include-verse-numbers=true.
 */
export async function getChapterVerses(
  translationKey: string,
  osis: string,
  chapter: number
): Promise<ChapterVerses> {
  const passage = await getPassage(translationKey, `${osis}.${chapter}`);

  const verses: Array<{ v: number; t: string }> = [];
  const re = /\[(\d+)\]([^[]*)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(passage.text)) !== null) {
    const text = m[2].replace(/\s+/g, " ").trim();
    if (text) verses.push({ v: Number(m[1]), t: text });
  }
  if (verses.length === 0) {
    // No markers (unexpected) — return the chapter as one block rather than nothing.
    verses.push({ v: 1, t: passage.text.replace(/\s+/g, " ").trim() });
  }

  return {
    translation: passage.translation,
    reference: passage.reference,
    copyright: passage.copyright,
    verses,
  };
}

/**
 * Existence check used by citation validation. Cached aggressively.
 * Distinguishes "definitely not a passage" (400/404 -> false) from transient
 * upstream failures (rate limits, 5xx, network), which throw so callers can
 * decide — a real reference must never be dropped because the source hiccuped.
 */
export async function passageExists(translationKey: string, passageId: string): Promise<boolean> {
  if (!isValidPassageId(passageId)) return false;
  try {
    await getPassage(translationKey, passageId);
    return true;
  } catch (err) {
    const status = (err as { statusCode?: number }).statusCode;
    if (status === 400 || status === 404) return false;
    throw err;
  }
}

export function cacheStats() {
  return { entries: cache.size };
}
