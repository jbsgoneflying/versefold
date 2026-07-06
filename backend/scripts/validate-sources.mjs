#!/usr/bin/env node
/**
 * Content-source validation (Phase 0).
 *
 * Verifies, using YOUR API.Bible key:
 *   1. The key authenticates against https://rest.api.bible/v1/bibles
 *   2. Which of the configured translations (backend/config/translations.json) resolve to real bible_ids
 *   3. That a sample passage fetch works for each resolvable translation
 *   4. Prints candidate bible_ids for any translation still marked TODO
 *
 * Usage:  API_BIBLE_KEY=xxxx node scripts/validate-sources.mjs
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const API = "https://rest.api.bible/v1";
const key = process.env.API_BIBLE_KEY;
if (!key) {
  console.error("Set API_BIBLE_KEY (from your API.Bible dashboard) and re-run.");
  process.exit(1);
}

const here = dirname(fileURLToPath(import.meta.url));
const config = JSON.parse(readFileSync(join(here, "../config/translations.json"), "utf8"));

const get = async (path) => {
  const res = await fetch(`${API}${path}`, { headers: { "api-key": key } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${path}`);
  return res.json();
};

const { data: bibles } = await get("/bibles");
console.log(`Key OK. Account has access to ${bibles.length} Bibles.\n`);

for (const [slug, t] of Object.entries(config.translations)) {
  const needsId = t.bibleId.startsWith("TODO");
  if (needsId) {
    const candidates = bibles.filter((b) =>
      `${b.name} ${b.abbreviation ?? ""}`.toLowerCase().includes(t.abbreviation.toLowerCase())
    );
    console.log(`[${slug}] bibleId is TODO. Candidates:`);
    for (const c of candidates) console.log(`   ${c.id}  ${c.name} (${c.abbreviation ?? "?"})`);
    if (!candidates.length) console.log("   (none found - check dashboard Additional Bibles)");
    continue;
  }
  try {
    const sample = await get(
      `/bibles/${t.bibleId}/verses/JHN.3.16?content-type=text&include-verse-numbers=false`
    );
    const text = String(sample.data.content).trim().slice(0, 60);
    console.log(`[${slug}] OK ${t.bibleId} -> "${text}..."`);
    if (sample.data.copyright) console.log(`   attribution: ${String(sample.data.copyright).trim().slice(0, 80)}`);
  } catch (err) {
    console.log(`[${slug}] FAILED for ${t.bibleId}: ${err.message}`);
  }
}
console.log("\nDone. Copy any corrected bible_ids into backend/config/translations.json.");
