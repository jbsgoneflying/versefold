# Phase 5 — Expansion Briefs

Each brief is scoped enough to start; none begins before its gate clears.

## 1. Additional translations

Gate: rights confirmed per translation/territory. Path: add an entry to
`backend/config/translations.json` with honest capability flags, run
`npm run validate-sources`, and the whole stack (rights gate, app UI gating) picks it up.
Candidates: WEB (PD, bundleable — verify status), ESV/NASB/NKJV (commercial licenses).

## 2. Widgets (WidgetKit)

Verse-of-my-choosing lock-screen and home-screen widgets rendered from the user's saved
cards — deterministic, PD/card-export-permitted translations only (rights flag `cardExport`).
Reuses `ScriptureCardView`. No AI in widgets. Add a WidgetKit extension target to
`ios/project.yml` (`app.versefold.ios.widgets`), App Group for the shared library store.

## 3. iPad and Mac (Catalyst or native)

Reader-first layout: two-column (text + study panel) on wide screens. The stores are already
UI-independent; work is in adaptive SwiftUI layout. Gate: iPhone experience stable post-launch.

## 4. Historic Voices (GATED — do not build before all three clear)

Gates: (a) legal — source texts verified public domain in launch territories;
(b) theological — advisory reviewers approve framing and the specific corpus;
(c) product — transparent-attribution UX validated with testers ("drawn from the writings
of…", never impersonation, never fabricated quotes).
Design: retrieval over a curated PD corpus (e.g. Matthew Henry, Spurgeon — verify rights);
responses cite the actual source passage; a distinct content kind `historic_voice` renders
with its own styling; the safety contract's impersonation clause still applies (no first-person
persona).

## 5. Audio

Licensed audio Bibles (API.Bible audio endpoints where licensed) or TTS for PD text only
(rights flag needed: `ttsRender`). Background playback, sleep timer, quiet player UI.
Gate: licensing per audio Bible; TTS voice quality bar.

## 6. Advanced study tools

- Cross-references: TSK dataset (verify PD), shipped as a bundled index keyed by OSIS ref.
- Original-language hints: Strong's-tagged PD resources; render as quiet inline chips.
- Semantic search over PD translations: embeddings (rights flag `embedding` already exists);
  backend vector index; "find the passage about…" queries.
- Reading plans (canonical/chronological): static data, no AI required.

## Sequencing recommendation

Widgets → additional PD translation (WEB) → iPad → audio → advanced tools → Historic Voices
(last: highest sensitivity, needs the most review).
