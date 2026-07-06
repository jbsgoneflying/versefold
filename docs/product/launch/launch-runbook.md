# Phase 4 — Public Launch Runbook

## Controlled rollout

1. App Store phased release ON (7-day automatic ramp: 1% → 2% → 5% → 10% → 20% → 50% → 100%).
2. Keep the TestFlight ring alive as the canary for the next build.
3. Halt criteria (pause phased release immediately if any occur):
   - Crash-free sessions < 99.5%
   - AI error rate > 5% over 1h (watch server logs / `/metrics`)
   - Any credible report of AI text presented as Scripture (severity R2 — treat as an incident)
   - Daily OpenAI spend > 3x forecast

## Cost monitoring

- `/metrics` (localhost-only via nginx) exposes total + per-day tokens, requests, unique devices.
- OpenAI dashboard: set a hard monthly budget cap and email alerts at 50/80/100% (founder).
- API.Bible: Starter plan is 5,000 calls/month — the permanent cache means steady-state usage
  should be near zero for KJV (bundled) and low for NIV/AMP (24h TTL). Alert if > 3,000 calls
  mid-month; upgrade plan or raise TTLs.
- Unit economics check each week: tokens/device/day vs. the assumption in founder decision #10;
  adjust free-tier limits before costs run.

## Model + prompt monitoring

- Every artifact records `promptVersion` + `modelVersion` — regressions are attributable.
- Weekly: run `npm run eval` against the live model; diff `report.json` vs the release baseline.
- Any provider model deprecation: pin replacement in env (`MODEL_EXPLAIN` etc.), run eval,
  then deploy. Never let the provider silently move the default.

## Feedback triage (public)

- Sources: in-app feedback, App Store reviews, support email.
- Labels: bug / confusion / theology-concern / feature / rights-concern.
- SLA: theology-concern and rights-concern to advisory reviewers within 48h; crashes same-day.
- Weekly release train while stabilizing; slower after.

## Rights compliance in production

- Verify attribution renders on every NIV/AMP surface (spot-check monthly).
- Quarterly: re-read API.Bible terms for changes; verify no copyright text appears in any
  logged prompt (grep server logs; the rights gate should make this impossible).
- Before ANY monetization flip: NIV/AMP commercial licenses signed or translations removed.

## Conversion + health measurement (privacy-respecting)

Track counts only, no per-user reading behavior:
- Activation: first-session reader reached (target: seconds after install).
- Engagement: weekly returning readers; study day completion rate (no streak mechanics).
- AI trust: explanation helpful/unhelpful votes; citation-drop rate from `/metrics` logs.
- Conversion (when subscription is on): free → trial → paid by cohort, monthly.
- North star from the plan: readers who return to Scripture week after week — not minutes in app.
