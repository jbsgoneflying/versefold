# Versefold — Founder Decision Log

Status values: `ADOPTED (default)` = recommended default adopted provisionally, founder may override; `FOUNDER` = requires explicit founder sign-off before the listed phase exits.

| # | Decision | Default adopted | Status | Resolve by |
|---|----------|-----------------|--------|------------|
| 1 | Initial translation | KJV (rights-cleared, public domain). WEB evaluated as modern PD alternative; both bundled-capable. | ADOPTED (default) | Phase 0 |
| 2 | Initial launch territories | US first; expand after rights review per territory. | FOUNDER | Phase 3 |
| 3 | Default theological posture | Text-first, broadly historic Christian, transparent about denominational differences. Encoded in the LLM safety contract. | ADOPTED (default) | Phase 0 |
| 4 | Accounts optional | Yes. Reading, highlights, notes work with no account. Account only for sync/subscription. | ADOPTED (default) | Phase 0 |
| 5 | Cloud sync provider | CloudKit for user data; backend Postgres for entitlements + AI artifacts. | ADOPTED (default) | Phase 1 |
| 6 | Authentication method | Sign in with Apple. | ADOPTED (default) | Phase 1 |
| 7 | Backend platform | Node/TypeScript + Fastify; droplet + nginx for beta; managed Postgres/Redis + containers at scale. | ADOPTED (default) | Phase 0 |
| 8 | LLM provider strategy | OpenAI (Responses API) behind provider-agnostic gateway with fallback slots. | ADOPTED (default) | Phase 0 |
| 9 | Subscription model + pricing | Freemium; monthly + annual with trial on annual. Pricing placeholder $4.99/mo / $39.99/yr — ASSUMPTION, not committed. | FOUNDER | Phase 3 |
| 10 | AI usage limits | Free: 10 explanations/day, 1 active generated study. Subscriber: 100/day soft cap. ASSUMPTION values — tune with real cost data. | FOUNDER | Phase 2/3 |
| 11 | Private notes as AI context | OFF by default; explicit per-use consent required. Never silent. | ADOPTED (default) | Phase 2 |
| 12 | Study reminders in beta | Included, disabled by default, user-scheduled only. | ADOPTED (default) | Phase 2 |
| 13 | Historic Voices | Stays on roadmap, Phase 5, gated by legal + theological + product review. | ADOPTED (default) | Before Phase 5 |
| 14 | Cross-references in first beta | Not P0. P1 with a validated public-domain dataset (TSK — PD status is an ASSUMPTION to verify). | ADOPTED (default) | Phase 1 |
| 15 | iPad at launch | No. iPhone-first; iPad Phase 5. | ADOPTED (default) | Phase 3 |
| 16 | Pastoral/theological review process | Named advisory reviewers + review checklist required before AI ships to beta testers. Founder to name reviewers. | FOUNDER | Phase 1 exit |

## Founder-only actions this repo cannot perform

These are tracked here so no phase silently depends on them:

1. Apple Developer Program enrollment ($99/yr) — required for TestFlight (Phase 2) and App Store (Phase 4).
2. Accepting the Xcode license on this Mac (`sudo xcodebuild -license`) — required to build the iOS app locally.
3. API.Bible dashboard: copy the exact `bible_id`s for the three selected Bibles into `backend/config/translations.json` (script provided: `backend/scripts/validate-sources.mjs`).
4. OpenAI account + API key with billing limits set.
5. Naming pastoral/theological reviewers (decision 16).
6. Signing any commercial license for NIV/AMP if/when monetization turns on.
7. Legal review of privacy policy + terms before public launch.
