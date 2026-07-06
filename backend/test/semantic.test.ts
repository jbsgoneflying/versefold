import { describe, it, expect } from "vitest";
import { topK } from "../src/semantic.js";

describe("semantic top-k scan", () => {
  // 4 rows, 4 dims: unit-ish int8 vectors along different axes
  const dims = 4;
  const matrix = new Int8Array([
    127, 0, 0, 0, // row 0: x-axis
    0, 127, 0, 0, // row 1: y-axis
    90, 90, 0, 0, // row 2: diagonal xy
    0, 0, 127, 0, // row 3: z-axis
  ]);

  it("ranks by cosine similarity to the query", () => {
    const query = Float32Array.from([1, 0, 0, 0]); // pure x
    const hits = topK(query, matrix, 4, dims, 2);
    expect(hits[0].index).toBe(0); // exact direction wins
    expect(hits[1].index).toBe(2); // diagonal second
    expect(hits[0].score).toBeCloseTo(1.0, 1);
  });

  it("returns at most k results in descending order", () => {
    const query = Float32Array.from([0.7, 0.7, 0, 0]);
    const hits = topK(query, matrix, 4, dims, 3);
    expect(hits).toHaveLength(3);
    expect(hits[0].score).toBeGreaterThanOrEqual(hits[1].score);
    expect(hits[1].score).toBeGreaterThanOrEqual(hits[2].score);
    expect(hits[0].index).toBe(2); // diagonal matches diagonal query best
  });

  it("orthogonal vectors score near zero", () => {
    const query = Float32Array.from([0, 0, 0, 1]);
    const hits = topK(query, matrix, 4, dims, 4);
    expect(hits.every((h) => h.index === 3 || Math.abs(h.score) < 0.01)).toBe(true);
  });
});
