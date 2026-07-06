import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildServer } from "../src/server.js";
import { setGateway, type ModelGateway } from "../src/ai/gateway.js";

/**
 * End-to-end route tests with mocked external providers:
 * - Scripture fetches are mocked via global fetch interception (API.Bible shape)
 * - Model gateway is replaced with a deterministic fake
 */

const KJV_ID = "de4e12af7f28f599-01";

const fakePassages: Record<string, { reference: string; content: string }> = {
  "JHN.3.16": {
    reference: "John 3:16",
    content:
      "[16] For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.",
  },
  "JHN.3.17": { reference: "John 3:17", content: "[17] For God sent not his Son into the world to condemn the world." },
  "PSA.23.1": { reference: "Psalm 23:1", content: "[1] The LORD is my shepherd; I shall not want." },
  "DEU.28": {
    reference: "Deuteronomy 28",
    content:
      "[1] And it shall come to pass, if thou shalt hearken diligently.\n[2] And all these blessings shall come on thee.\n[5] Blessed shall be thy basket and thy store.",
  },
  // AMP-style: brackets inside verse text must not truncate verses.
  "PSA.1": {
    reference: "Psalm 1",
    content:
      "[1] Blessed [fortunate, prosperous, and favored by God] is the man who does not walk in the counsel of the wicked. [2] But his delight is in the law of the Lord, and on His law [His precepts and teachings] he [habitually] meditates day and night.",
  },
};

const realFetch = globalThis.fetch;

beforeAll(() => {
  globalThis.fetch = (async (url: string | URL | Request) => {
    const u = String(url);
    const match = u.match(/\/bibles\/([^/]+)\/passages\/([^?]+)/);
    if (match) {
      const passage = fakePassages[decodeURIComponent(match[2])];
      if (!passage) return new Response("not found", { status: 404 });
      return Response.json({
        data: {
          id: match[2],
          reference: passage.reference,
          content: passage.content,
          copyright: match[1] === KJV_ID ? "Public Domain" : "© Test Publisher",
          verseCount: 1,
        },
      });
    }
    return new Response("unexpected external call in test: " + u, { status: 500 });
  }) as typeof fetch;
});

afterAll(() => {
  globalThis.fetch = realFetch;
});

const fakeGateway: ModelGateway = {
  async complete(req) {
    if (req.schema?.name === "versefold_card_confessions") {
      return {
        text: JSON.stringify({
          confessions: [
            "I am loved by God, not because I earned it, but because he gave first.",
            "For God so loved the world, that he gave his only begotten Son", // verbatim slice — must be filtered
            "I choose to trust the Son today; my life is held in everlasting hands.",
          ],
        }),
        model: "fake-model-1",
        usage: { inputTokens: 40, outputTokens: 60 },
      };
    }
    if (req.schema?.name === "versefold_study_plan") {
      return {
        text: JSON.stringify({
          title: "Test Study",
          description: "A test.",
          days: [
            {
              dayNumber: 1,
              title: "Day one",
              primaryReading: "JHN.3.16",
              supportingReadings: ["PSA.23.1", "FAKE.99.99"],
              context: "Context.",
              centralTheme: "Love of God.",
              reflectionQuestions: ["Q1?", "Q2?"],
              prayerPrompt: "Pray.",
              practicalResponse: null,
            },
          ],
        }),
        model: "fake-model-1",
        usage: { inputTokens: 100, outputTokens: 200 },
      };
    }
    return {
      text: JSON.stringify({
        summary: "God's love gives eternal life through the Son.",
        blocks: [
          { kind: "interpretation", text: "The verse centers God's initiating love.", disputed: false },
          { kind: "reflection_question", text: "What does belief mean here?", disputed: false },
        ],
        references: ["JHN.3.16", "JHN.3.17", "FAKE.99.99"],
      }),
      model: "fake-model-1",
      usage: { inputTokens: 50, outputTokens: 80 },
    };
  },
  async moderate() {
    return { flagged: false };
  },
};

describe("Versefold backend routes", () => {
  const app = buildServer();
  // Unique per run so persisted quota/usage state never bleeds between runs.
  const device = { "x-versefold-device": `test-device-${Date.now()}` };

  beforeAll(() => setGateway(fakeGateway));

  it("serves health and rights-filtered translations", async () => {
    const health = await app.inject({ method: "GET", url: "/health" });
    expect(health.statusCode).toBe(200);

    const tr = await app.inject({ method: "GET", url: "/v1/translations" });
    const body = tr.json();
    expect(body.translations.kjv.rights.llmSend).toBe(true);
  });

  it("serves scripture with attribution via the proxy", async () => {
    const res = await app.inject({ method: "GET", url: "/v1/scripture/kjv/JHN.3.16" });
    expect(res.statusCode).toBe(200);
    const { passage } = res.json();
    expect(passage.text).toContain("For God so loved the world");
    expect(passage.copyright).toBe("Public Domain");
  });

  it("serves a chapter parsed into verses for the translation switcher", async () => {
    const res = await app.inject({ method: "GET", url: "/v1/scripture/niv/chapter/DEU/28" });
    expect(res.statusCode).toBe(200);
    const { chapter } = res.json();
    expect(chapter.verses).toEqual([
      { v: 1, t: "And it shall come to pass, if thou shalt hearken diligently." },
      { v: 2, t: "And all these blessings shall come on thee." },
      { v: 5, t: "Blessed shall be thy basket and thy store." },
    ]);
    expect(chapter.copyright).toBe("© Test Publisher"); // attribution flows through
    expect(chapter.translation).toBe("NIV");
  });

  it("keeps AMP-style bracketed amplifications inside verse text", async () => {
    const res = await app.inject({ method: "GET", url: "/v1/scripture/amp/chapter/PSA/1" });
    expect(res.statusCode).toBe(200);
    const { chapter } = res.json();
    expect(chapter.verses).toHaveLength(2);
    expect(chapter.verses[0].t).toBe(
      "Blessed [fortunate, prosperous, and favored by God] is the man who does not walk in the counsel of the wicked."
    );
    expect(chapter.verses[1].t).toContain("[His precepts and teachings] he [habitually] meditates");
  });

  it("rejects chapter requests for unknown translations", async () => {
    const res = await app.inject({ method: "GET", url: "/v1/scripture/esv/chapter/DEU/28" });
    expect(res.statusCode).toBe(404);
  });

  it("requires device identity on AI routes", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/v1/ai/explain",
      payload: { translation: "kjv", passageId: "JHN.3.16" },
    });
    expect(res.statusCode).toBe(401);
  });

  it("explains a passage, drops invalid citations, returns exact source text", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/v1/ai/explain",
      headers: device,
      payload: { translation: "kjv", passageId: "JHN.3.16", lens: "plain_language", save: true },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    // Scripture rendered from source, not model
    expect(body.passage.text).toContain("For God so loved the world");
    // Fabricated reference dropped by citation validation
    expect(body.basis.references).toEqual(["JHN.3.16", "JHN.3.17"]);
    expect(body.basis.dropped).toContain("FAKE.99.99");
    // Labeled content kinds present
    expect(body.explanation.blocks[0].kind).toBe("interpretation");
    expect(body.promptVersion).toBe("explain-v1");
    expect(body.artifactId).toBeDefined();
  });

  it("generates a study, validates day readings, saves durable artifact", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/v1/ai/study",
      headers: device,
      payload: { source: "JHN.3.16", sourceType: "passage", days: 3, minutesPerDay: 15, depth: "standard" },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.plan.days[0].primaryReading).toBe("JHN.3.16");
    expect(body.plan.days[0].supportingReadings).toEqual(["PSA.23.1"]); // FAKE dropped
    expect(body.artifactId).toBeDefined();

    const list = await app.inject({ method: "GET", url: "/v1/artifacts", headers: device });
    expect(list.json().artifacts.length).toBeGreaterThanOrEqual(2);
  });

  it("crafts card confessions, filtering verbatim verse slices", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/v1/ai/card",
      headers: device,
      payload: { translation: "kjv", passageId: "JHN.3.16" },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.confessions).toHaveLength(2); // verbatim option dropped
    expect(body.confessions[0]).toContain("I am loved");
    expect(body.passage.text).toContain("For God so loved the world");
  });

  it("refuses card crafting for rights-restricted translations", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/v1/ai/card",
      headers: device,
      payload: { translation: "niv", passageId: "JHN.3.16" },
    });
    expect(res.statusCode).toBe(451);
  });

  it("deletes AI history on request (user data deletable)", async () => {
    const res = await app.inject({ method: "DELETE", url: "/v1/artifacts", headers: device });
    expect(res.statusCode).toBe(200);
    expect(res.json().deleted).toBeGreaterThanOrEqual(2);

    const list = await app.inject({ method: "GET", url: "/v1/artifacts", headers: device });
    expect(list.json().artifacts).toHaveLength(0);
  });

  it("rejects study params outside product bounds", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/v1/ai/study",
      headers: device,
      payload: { source: "JHN.3.16", sourceType: "passage", days: 5, minutesPerDay: 15, depth: "standard" },
    });
    expect(res.statusCode).toBe(400);
  });
});
