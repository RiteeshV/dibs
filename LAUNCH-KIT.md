# 🏷️ Kerbit — Launch Kit

*The app formerly called Kerbside is now **Kerbit** — "Kerb it. Claim it. Or the truck takes it."*

Everything below is either ✅ already built and working, or a numbered step only you can do (each needs your own identity/payment card, which no one else can legally set up for you).

---

## ✅ Built and working right now

| Feature | Details |
|---|---|
| Brand | New name **Kerbit**, logo (`public/logo.svg` — claim-ticket "K" tag), favicon, tagline |
| Accounts | Email + password login, salted-hash passwords, 30-day sessions |
| Anonymity | Auto-generated handles (Kerb-Wombat-482 style), 🔄 regenerate anytime, users can never pick their own, no phone numbers ever |
| Posting | Title, description, category, up to 4 photos/videos (auto-resized), free or priced |
| Lifecycle | available → claimed (2-day hold) → collected, or auto-booked for the council truck on your pickup day |
| Australia-wide | Every user sets their own suburb + council day; feed toggles **📍 My suburb / 🇦🇺 All Australia** |
| Receipts | Priced handoffs automatically generate an official online receipt (unique number, both handles, amount, date) — viewable/printable/save-as-PDF from Profile → Receipts |
| Cross-posting | Per-platform: with API token → queued for auto-posting; without → one-tap share listing under your Kerbit handle + link |
| Safety | Flags ("not relevant/unsafe/scam" → instant observation, hidden from feed), double-flag protection, ratings, trust stamp after 3 handoffs, XSS-safe, no identity leakage in any API response |
| Legal | `/privacy` and `/terms` pages, store-submission ready, linked in-app |
| Notifications | In-app bell + live toasts for claims, flags, receipts, expiries |

Local run: double-click `Start-Kerbside.bat` → http://localhost:3000

---

## 🔑 The 5 steps only you can do (in order)

### 1. Permanent data — Supabase (free, ~3 min)
1. https://supabase.com → Sign up → New project.
2. SQL Editor → run:
```sql
create table ks_store (
  collection text not null,
  id text not null,
  data jsonb not null,
  primary key (collection, id)
);
```
3. Settings → API → copy **Project URL** and **service_role key**.
4. Give them to the app as environment variables `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` (in Vercel settings, and/or before `node local-server.js`). Also set `SESSION_SECRET` to any long random text.
→ The yellow "demo storage" banner disappears; nothing ever resets again.

### 2. Public URL — Vercel (free, ~3 min)
1. https://vercel.com → sign up.
2. `npm install -g vercel`, then in this folder: `vercel --prod`.
3. Add the three environment variables from step 1 in the Vercel dashboard → redeploy.
→ Anyone in Australia can now sign up at your URL. (Optional: buy a domain like kerbit.com.au ≈ $15/yr and attach it in Vercel.)

### 3. Real card payments — Stripe (free to start, ~15 min)
1. https://stripe.com → create account (needs your ID + bank account — this is a legal requirement for anyone handling money).
2. Get your secret key, add env var `STRIPE_SECRET` in Vercel.
3. The receipt system already stamps receipts "Paid in-app (Stripe)" when that key is present; ask Claude to wire the Checkout flow the day you have the key — it's a ~30-minute job on the existing plumbing.
Until then: prices are settled at handoff and Kerbit still issues the official online receipt.

### 4. Real Marketplace auto-posting — Meta (free, days–weeks for approval)
1. https://developers.facebook.com → create app → request Commerce/Catalog API access.
2. Paste the token into Profile → Platform connections → Marketplace.
→ Posts then auto-publish under your account. Gumtree/Freecycle/Olio have no public posting APIs — the built-in one-tap share is the honest path there.

### 5. Google Play launch ($25 once)
1. Privacy policy URL: you'll have one after step 2 (`your-url/privacy`) ✅
2. https://play.google.com/console → developer account ($25).
3. Wrap the app: `npx @bubblewrap/cli init --manifest=your-url/manifest.json` (or Capacitor) — the app is already mobile-first so it ships unchanged.
4. Play requires a closed test: 12 testers × 14 days — use your pilot users.
5. After Android is validated: Apple ($99/yr, needs a Mac).

---

## 📣 Suggested launch order
Week 1: steps 1+2, invite 10 Wentworthville households. Week 2–4: watch claim-rate & repeat posts, fix friction. Month 2: step 4 + surrounding suburbs. Month 3: steps 3+5 once usage is proven.

## 🧾 Where receipts live
Profile → Receipts → 🧾 View → browser Print/Save-as-PDF. Every receipt has a unique KB-xxxx number and identifies both parties only by their anonymous handles.

## 🆘 If something breaks
Double-click `Start-Kerbside.bat` (restarts everything). Test logins are in `ACCOUNTS.md`.
