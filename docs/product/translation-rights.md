# Translation Rights Policy

Rights are a release gate. Every translation carries its own machine-readable rights configuration in
[`backend/config/translations.json`](../../backend/config/translations.json), enforced server-side by the
rights middleware (`backend/src/rights.ts`) and mirrored to the app so restricted features are hidden, not broken.

## Capability flags (per translation)

| Flag | Meaning |
|------|---------|
| `display` | Verse/chapter text may be shown in the reader |
| `offlineStorage` | Full text may be bundled/stored on-device |
| `fullTextSearch` | Text may be indexed for keyword search |
| `passageExport` | Text may be copied/shared as text |
| `cardExport` | Text may be rendered into exported lock-screen images |
| `llmSend` | Text may be included in prompts to a third-party model |
| `embedding` | Text may be embedded / semantically indexed |
| `caching` | Server may cache responses (with `cacheTtlSeconds`, `0` = forever) |
| `attributionRequired` | The `copyright` string from the source MUST be displayed |
| `maxQuoteVerses` | Maximum contiguous verses quotable in one artifact (`null` = unlimited) |
| `territories` | Permitted territories (`["*"]` = worldwide) |

**Critical rule:** `display: true` implies nothing else. Each capability is independent.

## Current configuration (provisional — confirm against actual license terms)

| Capability | KJV (PD) | WEB (PD, assumed) | NIV (© Biblica) | AMP (© Lockman) |
|---|---|---|---|---|
| display | yes | yes | yes | yes |
| offlineStorage | yes | yes | **no** | **no** |
| fullTextSearch | yes | yes | server-side only | server-side only |
| passageExport | yes | yes | limited | limited |
| cardExport | yes | yes | **no** (until licensed) | **no** (until licensed) |
| llmSend | yes | yes | **no — reference only** | **no — reference only** |
| embedding | yes | yes | **no** | **no** |
| caching | forever | forever | short TTL | short TTL |
| attribution | rendered | rendered | **required** | **required** |

## Enforcement points

1. **Backend** — the rights middleware rejects any request that would violate a flag (e.g. `/v1/ai/explain` with a
   copyright `bibleId` retrieves the reference only, never the text).
2. **App** — the app fetches `/v1/translations` (config + flags) and gates UI affordances (e.g. hides
   "Create confession card" for NIV until licensed).
3. **Eval** — the evaluation suite includes cases asserting copyright text never appears in prompts.

## Non-translation rights to clear before use

Cross-reference dataset (TSK — verify PD), commentaries, lexicons, historic Christian writings (Historic Voices,
Phase 5), fonts (must permit app embedding), audio Bibles, card template artwork.

## Commercial trigger

The app launches non-commercial (no ads/IAP). The moment monetization is enabled, NIV/AMP become commercial
use: API.Bible Pro plan + per-Bible licenses are required. KJV/WEB remain free in all cases. Treat "turn on
monetization" as a licensing milestone, not a flag flip.
