#!/usr/bin/env node
/**
 * Builds the semantic-search index over the bundled public-domain KJV
 * (rights: kjv.embedding = true). One-time (re-run only if the text or
 * embedding model changes).
 *
 * Output: backend/index/kjv-embeddings.bin  (Int8, unit-normalized * 127)
 *         backend/index/kjv-embeddings.json (refs + meta)
 *
 * Usage: OPENAI_API_KEY=... node scripts/build-embeddings.mjs
 */
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const MODEL = "text-embedding-3-small";
const DIMS = 256;
const BATCH = 500;

const key = process.env.OPENAI_API_KEY;
if (!key) {
  console.error("Set OPENAI_API_KEY and re-run.");
  process.exit(1);
}

const here = dirname(fileURLToPath(import.meta.url));
const kjvDir = join(here, "../../ios/Versefold/Resources/kjv");
const outDir = join(here, "../index");
mkdirSync(outDir, { recursive: true });

// Collect all verses in canonical order.
const index = JSON.parse(readFileSync(join(kjvDir, "index.json"), "utf8"));
const verses = [];
for (const bookMeta of index.books) {
  const book = JSON.parse(readFileSync(join(kjvDir, `${bookMeta.osis}.json`), "utf8"));
  for (const chapter of book.chapters) {
    for (const v of chapter.verses) {
      verses.push({ ref: `${book.osis}.${chapter.chapter}.${v.v}`, text: v.t });
    }
  }
}
console.log(`Embedding ${verses.length} verses (${MODEL}, ${DIMS} dims)...`);

const vectors = new Int8Array(verses.length * DIMS);
for (let start = 0; start < verses.length; start += BATCH) {
  const batch = verses.slice(start, start + BATCH);
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: MODEL, dimensions: DIMS, input: batch.map((v) => v.text) }),
  });
  if (!res.ok) throw new Error(`Embeddings API ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const { data } = await res.json();
  for (let i = 0; i < data.length; i++) {
    const emb = data[i].embedding;
    // Unit-normalize, quantize to int8 (dot product then approximates cosine).
    let norm = 0;
    for (const x of emb) norm += x * x;
    norm = Math.sqrt(norm) || 1;
    for (let d = 0; d < DIMS; d++) {
      vectors[(start + i) * DIMS + d] = Math.max(-127, Math.min(127, Math.round((emb[d] / norm) * 127)));
    }
  }
  process.stdout.write(`\r${Math.min(start + BATCH, verses.length)}/${verses.length}`);
}

writeFileSync(join(outDir, "kjv-embeddings.bin"), Buffer.from(vectors.buffer));
writeFileSync(
  join(outDir, "kjv-embeddings.json"),
  JSON.stringify({ model: MODEL, dims: DIMS, count: verses.length, refs: verses.map((v) => v.ref) })
);
console.log(`\nDone -> backend/index/ (${(vectors.length / 1024 / 1024).toFixed(1)} MB binary)`);
