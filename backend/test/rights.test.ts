import { describe, it, expect } from "vitest";
import { assertRight, mayLlmSend, publicTranslationConfig, RightsError } from "../src/rights.js";

describe("translation rights gate", () => {
  it("permits public-domain KJV everything", () => {
    expect(() => assertRight("kjv", "display")).not.toThrow();
    expect(() => assertRight("kjv", "llmSend")).not.toThrow();
    expect(() => assertRight("kjv", "cardExport")).not.toThrow();
    expect(() => assertRight("kjv", "offlineStorage")).not.toThrow();
    expect(mayLlmSend("kjv")).toBe(true);
  });

  it("blocks copyright NIV from LLM prompts, card export, offline, embedding", () => {
    expect(() => assertRight("niv", "llmSend")).toThrow(RightsError);
    expect(() => assertRight("niv", "cardExport")).toThrow(RightsError);
    expect(() => assertRight("niv", "offlineStorage")).toThrow(RightsError);
    expect(() => assertRight("niv", "embedding")).toThrow(RightsError);
    expect(mayLlmSend("niv")).toBe(false);
  });

  it("still permits NIV display and passage export", () => {
    expect(() => assertRight("niv", "display")).not.toThrow();
    expect(() => assertRight("niv", "passageExport")).not.toThrow();
  });

  it("404s unknown translations", () => {
    expect(() => assertRight("nope", "display")).toThrow(/Unknown translation/);
  });

  it("public config exposes resolved translations with rights flags, never leaks bibleId", () => {
    const pub = publicTranslationConfig();
    expect(pub.kjv).toBeDefined();
    expect(pub.niv).toBeDefined();
    expect(pub.niv.rights.llmSend).toBe(false);
    expect(pub.niv.rights.cardExport).toBe(false);
    expect(JSON.stringify(pub)).not.toContain("bibleId");
  });
});
