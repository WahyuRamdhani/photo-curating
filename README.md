# Photo Curator

Curate hundreds of photos in a Google Drive folder down to a shortlist (default
target 50-100), scored against a shoot brief — with **zero required API cost**.

It runs entirely under your own Google account: you connect via OAuth and pick
a folder with Google Picker, so the app only ever sees that folder, not your
whole Drive. Nothing is downloaded to a server — thumbnails are streamed
straight into your browser and processed there.

## How it works

1. **Connect & pick a folder** — Google OAuth (scoped to `drive.file`) + Google
   Picker. You approve access to exactly one folder, revocable anytime from
   your Google Account settings.
2. **Local first-pass filter (free, runs in your browser)** — flags photos
   that are: not landscape, blurry, eyes closed/blinking, or near-duplicates of
   a sharper shot (burst shots). Also tags obvious avoid-list items (water
   bottles, food) using an on-device object detector. No image data leaves
   your browser for this stage.
3. **Smart scoring (optional, free tier)** — sends the shortlist's thumbnails
   to Gemini's free tier to score against the shoot brief (professionalism,
   framing style, candid/posed eye-contact rules, selfie-in-group detection).
   Skippable if you'd rather review manually — diversity/representation is
   intentionally left to your judgement either way, not auto-classified. If
   you're sharing this app with others, each person can paste in their own
   free Gemini key (stored only in their browser) so smart scoring counts
   against *their* quota, not a shared one — see below.
4. **Review & export** — grid view with keep/reject overrides and a running
   count toward your target. Exporting copies the selected files into a new
   "Selected" folder inside the source folder via a Drive-to-Drive copy — no
   local download involved.

## Setup (one-time, free)

1. Create a project at [console.cloud.google.com](https://console.cloud.google.com).
2. Enable the **Google Drive API** and **Google Picker API**.
3. Under *APIs & Services > Credentials*, create:
   - An **OAuth 2.0 Client ID** (type: Web application). Add your dev URL
     (e.g. `http://localhost:3000`) to *Authorized JavaScript origins*.
   - An **API key**.
4. Copy `.env.local.example` to `.env.local` and fill in
   `NEXT_PUBLIC_GOOGLE_CLIENT_ID` and `NEXT_PUBLIC_GOOGLE_API_KEY`.
5. Smart scoring needs a Gemini key, but *whose* key is a choice:
   - **Sharing the app with others?** Leave `GEMINI_API_KEY` blank. Everyone
     pastes their own free key (from
     [aistudio.google.com/apikey](https://aistudio.google.com/apikey)) into
     the app when they use smart scoring — each person's usage counts
     against their own quota, and no shared secret needs to be deployed at
     all.
   - **Just using it yourself?** Set `GEMINI_API_KEY` in `.env.local` and
     `NEXT_PUBLIC_HAS_SERVER_GEMINI_KEY=true`, and you won't need to paste a
     key into the app each time.

## Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Notes

- Free-tier Gemini has low rate limits, so smart scoring runs sequentially
  with a delay between calls — expect it to take a while on a large
  shortlist. Skipping it and reviewing manually is always an option.
- The shoot brief the smart-scoring stage is prompted with lives in
  `src/lib/gemini/criteria.ts` — edit it if the criteria change.
- Thresholds for blur/duplicate detection live in `src/lib/cv/blur.ts` and
  `src/lib/cv/dhash.ts` if the first-pass filter feels too strict or loose.
