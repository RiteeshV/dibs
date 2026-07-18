# Kerbside — Setup Guide

A full multi-user app: login, anonymous handles, posting with photos/video, claims, truck-day auto-booking, flags → observation, and in-app notifications. Tested end-to-end.

## 1. Run on your PC (30 seconds)

Install Node.js from https://nodejs.org if you don't have it, then:

```
cd kerbside
node local-server.js
```

Open http://localhost:3000 — create an account and use it. Others on your Wi-Fi can open `http://<your-PC-IP>:3000`.

## 2. Put it on the internet (public URL, ~3 minutes)

The Vercel connector in this session didn't have permission to create projects, so do it once yourself:

1. Go to https://vercel.com and sign up (free, use your Google account).
2. Install the CLI: `npm install -g vercel`
3. In the `kerbside` folder run: `vercel --prod`
   (press Enter to accept all defaults)
4. It prints a URL like `https://kerbside.vercel.app` — that's your live app. Share it; anyone can sign up and use it.

*(Alternative without CLI: push the folder to GitHub and click "Import" on vercel.com.)*

Until you do step 3, the app shows a yellow "demo storage" banner — accounts and posts work but can occasionally reset, because Vercel's free functions have no built-in disk.

## 3. Make data permanent (free database, ~2 minutes)

1. Go to https://supabase.com → New project (free tier).
2. In the Supabase dashboard open **SQL Editor** and run:

```sql
create table ks_store (
  collection text not null,
  id text not null,
  data jsonb not null,
  primary key (collection, id)
);
```

3. In Supabase: **Settings → API** — copy the **Project URL** and the **service_role key**.
4. In Vercel: your project → **Settings → Environment Variables**, add:
   - `SUPABASE_URL` = your project URL
   - `SUPABASE_SERVICE_KEY` = the service_role key
   - `SESSION_SECRET` = any long random text (keeps logins valid across restarts)
5. Redeploy (`vercel --prod` again). The yellow banner disappears — data is now permanent.

The same env vars work for the local server too:
`SUPABASE_URL=... SUPABASE_SERVICE_KEY=... node local-server.js`

## 4. What's built vs. what needs external approval

| Feature | Status |
|---|---|
| Login / signup, sessions | ✅ Built |
| Anonymous identity (no phone, no tracking — handle like `Kerb-Wombat-482`) | ✅ Built |
| Post items with up to 4 photos/videos (photos auto-resized, video ≤2.5MB) | ✅ Built |
| Claim → handoff → rate lifecycle, claim expiry after 2 days | ✅ Built |
| Auto-book for council truck on pickup day | ✅ Built |
| Flags: "not relevant/unsafe/scam" → **straight to observation** (hidden); 2 of any flags → observation; poster notified | ✅ Built |
| In-app notifications (bell tab + live toasts) | ✅ Built |
| Cross-posting: one-tap share (copies formatted listing under your Kerbside handle + link, opens the platform's post page) | ✅ Built |
| Cross-posting: true auto-post with API tokens | 🔌 Token fields ready in Profile; real posting needs *your* developer accounts — Meta Commerce API approval for Marketplace (weeks), and Gumtree/Freecycle/Olio don't offer public posting APIs, so share-links stay the honest path there |
| Anonymous relay phone numbers | Deliberately replaced: all contact is in-app, so no numbers exist to leak — safer and free (a Twilio number relay can be added later if you ever need calls) |
| Real council booking | Manual for the pilot (per the brief): the "booked for truck" list *is* your daily worklist to submit to the council form |

## 5. Path to app stores (later)

The web app is mobile-first and installable-feeling already. For Google Play: wrap it with Capacitor (`npx cap add android`) or as a TWA — the whole app keeps working unchanged since it's a web front + API. You'll need the $25 Play account, a privacy policy URL (write it before submission — most common rejection), and Play's 12-tester/14-day closed test.

## 6. Auto-rectified drawbacks (things fixed proactively)

- **Self-claiming blocked** — you can't claim your own tag to fake trust stats.
- **Double-flagging blocked** — one flag per user per item, so one person can't force observation alone (except via the serious reasons, which are meant to hide instantly).
- **Claim squatting fixed** — claims auto-expire after 2 days and the item returns to the feed, with both sides notified.
- **Race conditions handled** — claiming an already-claimed/trucked item fails with a clear reason and is logged in the tag's tracking trail.
- **Media abuse limited** — photos resized client-side, videos capped, max 4 attachments, server re-validates sizes.
- **Privacy leaks prevented** — the API never sends other users' emails or IDs to the browser; alert-level history lines are only visible to the two parties involved.
- **XSS-safe** — all user text is escaped before rendering.
