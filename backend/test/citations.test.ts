import { describe, it, expect } from "vitest";
import { isValidPassageId } from "../src/scripture.js";
import { normalizeReference } from "../src/ai/citations.js";

describe("reference normalization (model shorthand)", () => {
  it("expands verse-range shorthand to full OSIS", () => {
    expect(normalizeReference("PSA.23.1-6")).toBe("PSA.23.1-PSA.23.6");
    expect(normalizeReference("psa.23.1-6")).toBe("PSA.23.1-PSA.23.6");
    expect(normalizeReference("ROM.8.28-30")).toBe("ROM.8.28-ROM.8.30");
  });

  it("expands chapter.verse-chapter.verse shorthand", () => {
    expect(normalizeReference("EXO.14.21-14.31")).toBe("EXO.14.21-EXO.14.31");
  });

  it("parses prose-style references", () => {
    expect(normalizeReference("Luke 15:11-32")).toBe("LUK.15.11-LUK.15.32");
    expect(normalizeReference("1 Corinthians 8:1")).toBe("1CO.8.1");
    expect(normalizeReference("Philippians 4:13")).toBe("PHP.4.13");
    expect(normalizeReference("Psalm 23")).toBe("PSA.23");
    expect(normalizeReference("John 3:16-21")).toBe("JHN.3.16-JHN.3.21");
    expect(normalizeReference("Revelation 20:1-6")).toBe("REV.20.1-REV.20.6");
  });

  it("canonicalizes book-code aliases and collapses self-ranges", () => {
    expect(normalizeReference("LK.15.11-LK.15.32")).toBe("LUK.15.11-LUK.15.32");
    expect(normalizeReference("RE.20.1-RE.20.6")).toBe("REV.20.1-REV.20.6");
    expect(normalizeReference("PS.23.1")).toBe("PSA.23.1");
    expect(normalizeReference("MAT.24.15-MAT.24.15")).toBe("MAT.24.15");
    expect(normalizeReference("1SA.15.1")).toBe("1SA.15.1");
  });

  it("normalizes unicode dashes and passes through full form", () => {
    expect(normalizeReference("PSA.23.1\u2013PSA.23.6")).toBe("PSA.23.1-PSA.23.6");
    expect(normalizeReference("JHN.3.16")).toBe("JHN.3.16");
    expect(normalizeReference("ROM.8.28-ROM.8.30")).toBe("ROM.8.28-ROM.8.30");
  });
});

describe("OSIS passage id validation (citation shape gate)", () => {
  it("accepts valid ids", () => {
    for (const id of ["JHN.3.16", "PSA.119.105", "GEN.1", "1CO.13.4-1CO.13.7", "REV.20.1-REV.20.6", "2TI.3.16"]) {
      expect(isValidPassageId(id), id).toBe(true);
    }
  });

  it("rejects malformed and injected ids", () => {
    for (const id of [
      "John 3:16",
      "JHN..16",
      "JHN.3.16; DROP TABLE",
      "../etc/passwd",
      "JOHN.3.16", // book codes are 2-3 letters after optional digit
      "",
      "JHN.3.16-",
    ]) {
      expect(isValidPassageId(id), id).toBe(false);
    }
  });
});
