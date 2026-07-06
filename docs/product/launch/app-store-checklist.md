# Phase 3 — Launch Prep Checklist

## Account + sync (build item)

- [ ] Enable iCloud/CloudKit + Sign in with Apple capabilities in the App ID (Apple Developer portal — founder).
- [ ] CloudKit schema mirrors `LibraryStore.Snapshot`: record types `Highlight`, `Note`, `Bookmark`, `Card`, `Study`, `SavedExplanation`, all in the **private** database.
- [ ] Sync design: local-first, last-writer-wins per record, `modifiedAt` field; conflicts on notes keep both copies ("conflicted copy"). No account is ever required for local use.
- [ ] Sign in with Apple only appears at the sync/subscription doors, never at launch.

## Subscription (build item + founder decision #9)

- [ ] Confirm pricing (placeholder $4.99/mo, $39.99/yr + 7-day trial on annual).
- [ ] App Store Connect: create subscription group "Versefold Plus", products `plus.monthly`, `plus.annual`.
- [ ] StoreKit 2 entitlement check gates: AI daily limits (higher tier), multiple active studies, full lens set. Reading, highlights, notes, cards stay free forever.
- [ ] Rights milestone: enabling ANY monetization triggers the NIV/AMP commercial-license requirement (see `docs/product/translation-rights.md`). Do not flip subscription on before licenses or NIV/AMP removal.

## Evaluation hardening

- [ ] Expand `backend/eval/corpus.json` with tester-reported failure cases.
- [ ] `npm run eval` green at `eval/thresholds.json` on the exact model+prompt versions shipping.
- [ ] Advisory reviewers sign off on the human-review queue (founder decision #16).
- [ ] Freeze `PROMPT_VERSION`s for the release; record in release notes.

## Accessibility

- [ ] VoiceOver pass over every P0 flow (labels exist in code; verify ordering and hints on device).
- [ ] Dynamic Type at largest accessibility sizes: reader, Unfold, studies, cards.
- [ ] Contrast: verify parchment/low-light themes meet WCAG AA for body text.
- [ ] Reduced Motion: confirm no parallax/large animated transitions remain.

## Performance targets (from plan §22)

- [ ] Cold launch to readable text < 2s on a mid-range device (bundled KJV path — measure with Instruments).
- [ ] First AI token < 2s p95 (measure server-side; `/metrics`).
- [ ] Full study generation < 30s p95 with progress UI.
- [ ] Crash-free sessions ≥ 99.8% (add crash reporting first — see analytics).

## App Store assets (founder + designer)

- [ ] App icon (brand book mark), 1024pt master.
- [ ] Screenshots: reader (ivory + dark), Unfold with Basis, study day, confession card, Library. Quiet copy: "Scripture first. Everything else quiet."
- [ ] App name "Versefold — Quiet Bible Study", subtitle, keywords, description (no comparative claims).
- [ ] Age rating questionnaire; category Reference or Lifestyle.
- [ ] App Privacy nutrition labels: matches privacy policy (device ID for app functionality only; no tracking).
- [ ] Review notes for Apple: explain AI feature, safety contract, and that AI content is labeled.

## Policies

- [ ] Legal review of `privacy-policy.md` and `terms-of-service.md`; publish at versefold.app/privacy and /terms.
- [ ] In-app links from Settings → About.

## Analytics + crash (privacy-respecting)

- [ ] Crash reporting: Apple's built-in MetricKit/Xcode Organizer first; add Sentry only if needed.
- [ ] Product analytics: privacy-first counters only (feature used, success/failure), no reading-behavior tracking, no third-party ad SDKs — consistent with the privacy policy.
- [ ] Server-side: `/metrics` already tracks AI usage/cost; add per-day rollups before launch.
