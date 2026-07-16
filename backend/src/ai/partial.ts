/**
 * Best-effort parsing of INCOMPLETE structured-output JSON, so the SSE unfold
 * endpoint can show the reader real sentences while the model is still
 * writing. Display-only: the final validated response always replaces
 * anything derived here.
 */

/** Close any open strings/objects/arrays and try to parse. Null when hopeless. */
export function parsePartialJson(text: string): unknown | null {
  const start = text.indexOf("{");
  if (start === -1) return null;
  let body = text.slice(start);

  for (let attempt = 0; attempt < 4; attempt++) {
    const repaired = repair(body);
    if (repaired !== null) {
      try {
        return JSON.parse(repaired);
      } catch {
        // fall through to trim and retry
      }
    }
    // Cut back to just before the last comma — drops a half-written key or
    // dangling token and tries again on a strictly smaller prefix.
    const cut = body.lastIndexOf(",");
    if (cut <= 0) return null;
    body = body.slice(0, cut);
  }
  return null;
}

function repair(body: string): string | null {
  let inString = false;
  let escape = false;
  const stack: string[] = [];

  for (const ch of body) {
    if (escape) {
      escape = false;
      continue;
    }
    if (inString) {
      if (ch === "\\") escape = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === "{") stack.push("}");
    else if (ch === "[") stack.push("]");
    else if (ch === "}" || ch === "]") {
      if (stack.pop() !== ch) return null; // malformed beyond repair
    }
  }

  let repaired = body;
  if (escape) repaired = repaired.slice(0, -1); // drop a trailing lone backslash
  if (inString) repaired += '"';
  repaired = repaired.replace(/,\s*$/, "");
  repaired = repaired.replace(/:\s*$/, ": null");
  // A dangling literal prefix (tru / fal / nul / 12.) can't be closed — bail
  // to the trim path by producing invalid JSON and letting parse fail.
  while (stack.length > 0) repaired += stack.pop();
  return repaired;
}

export interface PartialExplanation {
  summary?: string;
  blocks?: Array<{ kind: string; text: string; disputed: boolean }>;
}

/** Extract whatever readable explanation content exists in a partial response. */
export function partialExplanation(text: string): PartialExplanation | null {
  const parsed = parsePartialJson(text) as {
    summary?: unknown;
    blocks?: unknown;
  } | null;
  if (!parsed || typeof parsed !== "object") return null;

  const out: PartialExplanation = {};
  if (typeof parsed.summary === "string" && parsed.summary.length > 0) {
    out.summary = parsed.summary;
  }
  if (Array.isArray(parsed.blocks)) {
    const blocks = parsed.blocks
      .filter(
        (b): b is { kind: string; text: string; disputed?: boolean } =>
          !!b && typeof b === "object" &&
          typeof (b as { kind?: unknown }).kind === "string" &&
          typeof (b as { text?: unknown }).text === "string" &&
          ((b as { text: string }).text.length > 0)
      )
      .map((b) => ({ kind: b.kind, text: b.text, disputed: b.disputed === true }));
    if (blocks.length > 0) out.blocks = blocks;
  }
  return out.summary || out.blocks ? out : null;
}
