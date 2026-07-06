/**
 * Semantic verse search over the public-domain KJV embedding index
 * (built by scripts/build-embeddings.mjs; rights: kjv.embedding = true).
 * Query is embedded at request time; matching is an int8 dot-product scan —
 * ~31k x 256 ops, a few milliseconds.
 */
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { config } from "./config.js";

const here = dirname(fileURLToPath(import.meta.url));
const binPath = join(here, "../index/kjv-embeddings.bin");
const metaPath = join(here, "../index/kjv-embeddings.json");

interface IndexMeta {
  model: string;
  dims: number;
  count: number;
  refs: string[];
}

let meta: IndexMeta | null = null;
let vectors: Int8Array | null = null;

function loadIndex(): boolean {
  if (meta && vectors) return true;
  if (!existsSync(binPath) || !existsSync(metaPath)) return false;
  meta = JSON.parse(readFileSync(metaPath, "utf8")) as IndexMeta;
  const buf = readFileSync(binPath);
  vectors = new Int8Array(buf.buffer, buf.byteOffset, buf.byteLength);
  return true;
}

export function semanticIndexReady(): boolean {
  return loadIndex();
}

async function embedQuery(query: string, model: string, dims: number): Promise<Float32Array> {
  const res = await fetch(`${config.openaiBase}/embeddings`, {
    method: "POST",
    headers: { Authorization: `Bearer ${config.openaiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, dimensions: dims, input: query }),
  });
  if (!res.ok) {
    const err = new Error(`Embedding provider error ${res.status}`);
    (err as Error & { statusCode: number }).statusCode = 502;
    throw err;
  }
  const data = (await res.json()) as { data: Array<{ embedding: number[] }> };
  const raw = data.data[0].embedding;
  let norm = 0;
  for (const x of raw) norm += x * x;
  norm = Math.sqrt(norm) || 1;
  return Float32Array.from(raw, (x) => x / norm);
}

export interface SemanticHit {
  ref: string;
  score: number;
}

/** Exported for unit tests: top-k dot-product scan; returns row indices + approx cosine. */
export function topK(
  query: Float32Array,
  matrix: Int8Array,
  count: number,
  dims: number,
  k: number
): Array<{ index: number; score: number }> {
  const hits: Array<{ index: number; score: number }> = [];
  for (let i = 0; i < count; i++) {
    let dot = 0;
    const base = i * dims;
    for (let d = 0; d < dims; d++) dot += query[d] * matrix[base + d];
    const score = dot / 127; // undo quantization scale -> approx cosine
    if (hits.length < k) {
      hits.push({ index: i, score });
      if (hits.length === k) hits.sort((a, b) => a.score - b.score);
    } else if (score > hits[0].score) {
      hits[0] = { index: i, score };
      hits.sort((a, b) => a.score - b.score);
    }
  }
  return hits.sort((a, b) => b.score - a.score);
}

export async function searchByMeaning(query: string, limit = 12): Promise<SemanticHit[]> {
  if (!loadIndex() || !meta || !vectors) {
    const err = new Error("Semantic index not built yet.");
    (err as Error & { statusCode: number }).statusCode = 503;
    throw err;
  }
  const q = await embedQuery(query, meta.model, meta.dims);
  return topK(q, vectors, meta.count, meta.dims, limit).map(({ index, score }) => ({
    ref: meta!.refs[index],
    score: Math.round(score * 1000) / 1000,
  }));
}
