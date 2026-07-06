# UX Flows (Phase 0 sign-off set)

Navigation: three tabs — **Read** (default), **Studies**, **Library** — plus Settings via a secondary control.
No Home/Discover tab. Search lives inside Read. Full flow specs (entry/steps/success/empty/error/offline/a11y/
analytics/privacy) are in the product plan §21; this file is the implementation checklist per flow.

| # | Flow | P | Implemented by |
|---|------|---|----------------|
| 1 | First launch → first verse (no account, bundled KJV, skippable onboarding) | P0 | `ios: ReaderView` + bundle |
| 2 | Resume last reading location on relaunch | P0 | `ReaderStore.lastLocation` |
| 3 | Navigate book/chapter via picker | P0 | `BookPickerView` |
| 4 | Search word or reference in-reader | P0 | `SearchView` (local index for PD) |
| 5 | Highlight a verse (local-first) | P0 | `LibraryStore.addHighlight` |
| 6 | Contextual action sheet on selection (primary: Unfold, Highlight, Note, Save, Copy/Share; More: Explain simply, Explore context, See structure, Cross-references, Ask, Create study, Create card) | P0 | `PassageActionSheet` |
| 7 | Ask for a simple explanation (lens picker → streamed answer + Basis) | P0 | `UnfoldView` + `/v1/ai/explain` |
| 8 | Go deeper on an explanation | P0 | `UnfoldView.deepen` |
| 9 | Ask a follow-up, scoped; out-of-scope offers explicit broaden | P0 | `AskView` + `/v1/ai/ask` |
| 10 | Create a 3-day study (duration/time/depth/lens → background gen → saved artifact) | P0 | `StudyBuilderView` + `/v1/ai/study` |
| 11 | Resume next study day (no streak) | P0 | `StudiesView` |
| 12 | Pause and resume a study without penalty | P0 | `StudyDetailView` |
| 13 | Create a confession card (deterministic render; AI-assist optional) | P0 | `CardComposerView` |
| 14 | Export a card to Photos / share sheet | P0 | `CardExporter` (ImageRenderer) |
| 15 | Add a private note (never sent to model without consent) | P0 | `NoteEditorView` |
| 16 | Find a previous highlight in Library → jump to verse | P0 | `LibraryView` |
| 17 | Enable sync (Sign in with Apple → CloudKit) | P1 | Phase 3 |
| 18 | Delete AI history (local + backend artifacts) | P0 | `SettingsView` + `DELETE /v1/artifacts` |
| 19 | AI unavailable → soft fail, reading unaffected | P0 | `AIClient` error states |
| 20 | Licensing-restricted feature → hidden/disabled with brief explanation | P0 | rights flags from `/v1/translations` |

## Reader principles (binding)

Fast launch to text; serif Scripture typography with quiet verse numbers; paragraph + poetry layouts; warm
ivory / parchment / dark / low-light themes; Dynamic Type, VoiceOver, Reduced Motion; Focus mode; translation
attribution always reachable; no toolbars/banners/AI chrome around the text; the reader is complete with AI off.

## Empty/error/loading tone

Calm, instructive, guilt-free. "No studies yet — select a passage and choose Create study." AI failures never
block reading. Streaming for interactive answers; background jobs with progress for study generation.
