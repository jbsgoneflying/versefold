# Phase 2 — Private Beta Runbook

## What is built and verified (in this repo)

| Area | Status |
|---|---|
| Core reader (bundled KJV, themes, sizes, search, pickers, focus mode, attribution) | Built; verified in simulator |
| Local library (highlights, private notes, bookmarks, cards, AI artifacts) | Built |
| Guided studies (3/7/14-day builder, durable plans, pause/resume, no streaks) | Built |
| Card creation + export (deterministic render, Photos, share sheet) | Built |
| Basic AI (Unfold/Ask with lenses, labeled kinds, Basis, citation validation) | Built; backend tests green |
| Feedback channel (`POST /v1/feedback` + Settings form) | Built |
| Reliability (AI soft-fail never blocks reading, retry, quota messaging) | Built |
| Privacy (export my data, delete AI history device+server, delete all) | Built |
| Rights controls (server rights gate, 451 responses, rights-filtered `/v1/translations`) | Built; tested |

## Founder steps to reach testers

1. **Apple Developer Program** — enroll ($99/yr). Needed for TestFlight.
2. **Xcode license** on this Mac: `sudo xcodebuild -license accept`.
3. **Backend live**: add DNS A record `api.versefold.app` → droplet, then on the droplet
   install `deploy/nginx/api.versefold.conf` and `deploy/versefold-api.service`, create
   `/var/www/versefold-api/.env` with real keys, run certbot. The GitHub Actions workflow
   already rsyncs `backend/` and restarts the service on every push to main.
4. **Point the app at production**: set `AIClient.baseURL` to `https://api.versefold.app`.
5. **App Attest**: enable the App Attest capability in the App ID, then enforce assertions
   on `/v1/ai/*` (the device-identity middleware in `backend/src/server.ts` is the slot).
   Do this before widening the tester pool — it is the AI cost-protection layer.
6. **Archive + upload**: Xcode → Product → Archive → TestFlight. Internal testers first
   (up to 100, instant), then external (App Review required for the beta build).
7. **Run the evaluation corpus** with real keys before inviting testers:
   `cd backend && API_BIBLE_KEY=… OPENAI_API_KEY=… npm run eval` — thresholds in
   `eval/thresholds.json` must pass, and the human-review queue must be reviewed by the
   named advisors (founder decision #16).
8. **Validate translation ids**: `npm run validate-sources` (fills NIV/AMP `bible_id`s).

## Beta exit criteria (from the product plan)

- A tester can move from reading to unfolding to saving without instructions.
- AI failures never block reading (verified in code; confirm with testers).
- Zero incidents of AI text presented as Scripture (eval + tester reports).
- Study return rate and explanation helpfulness trend positive in feedback.

## Weekly beta cadence

Triage `store.feedback` (via `/metrics` + store file) Mon/Thu → label {bug, confusion,
theology-concern, feature} → theology-concern items go to the advisory reviewers within
48h → fixes ship weekly via TestFlight.
