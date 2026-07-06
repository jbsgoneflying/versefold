# Versefold iOS

Native SwiftUI app. Scripture first: opens to the reader at your last location, no feed, no account required.

## One-time setup (founder actions)

```bash
# 1. Accept the Xcode license (required once on this Mac)
sudo xcodebuild -license accept

# 2. Install XcodeGen and generate the project
brew install xcodegen
cd ios && xcodegen generate

# 3. Open and run
open Versefold.xcodeproj
```

The bundled KJV (public domain) lives in `Versefold/Resources/kjv/` — regenerate with
`node scripts/fetch-kjv.mjs` if needed. Bundling is permitted by the rights policy
(`backend/config/translations.json`).

## Backend connection

The app talks only to the Versefold backend (no third-party keys in the app).
Default: `http://localhost:8787` (see `AIClient.baseURL`). For device testing point it
at your Mac's LAN IP or the deployed `https://api.versefold.app`.

Run the backend locally:

```bash
cd backend
cp .env.example .env   # add API_BIBLE_KEY + OPENAI_API_KEY
npm install && npm run dev
```

## What's implemented (private-beta scope)

- Reader: bundled offline KJV, book/chapter picker, swipe chapter navigation, search
  (keyword + reference jump), themes (ivory/parchment/dark/low-light), text size,
  line spacing, quiet verse numbers, focus mode (double-tap), last-read position,
  attribution footer, VoiceOver labels, Dynamic-Type-friendly sizing.
- Contextual passage actions on verse selection: Unfold, Highlight, Add note,
  Create study, Create confession card, Ask, Copy.
- Unfold/Ask: lens picker, streamed-in explanation with labeled content kinds,
  "Interpretations differ" badges, Basis (validated references), go-deeper, save to Library.
- Studies: builder (3/7/14 days, minutes/day, depth), durable saved plans, day list with
  reflections/prayer/personal notes, pause/resume/complete — no streaks anywhere.
- Cards: deterministic renderer, four brand themes, exact Scripture + attribution,
  clearly separated personal confession, export to Photos, share sheet, save to Library.
- Library: highlights, private notes, bookmarks, cards, AI artifacts (labeled).
- Settings: reader preferences, export my data, delete AI history (device + server),
  delete everything, private-beta feedback.

## Not yet (per plan phases)

CloudKit sync + Sign in with Apple (Phase 3), subscription (Phase 3), App Attest
enforcement (with TestFlight), widgets/iPad/Mac/audio/Historic Voices (Phase 5).
