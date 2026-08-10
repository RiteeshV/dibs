# Dibs

**Call dibs before the truck does.**

An Australian marketplace that unifies things normally scattered across five different apps — secondhand goods, free kerbside finds, vehicles, rentals, jobs and services — into a single feed.

**Live:** https://dibs-au.vercel.app

---

## The idea

Australian councils run scheduled hard-rubbish collections. Perfectly usable furniture gets left on the kerb and taken by a truck because the person throwing it out and the person who wants it never find each other in time.

Dibs puts a clock on that. You post an item; neighbours can claim it; if nobody does by your council's collection day, it's automatically marked for the truck. Around that core mechanic sits a broader marketplace — vehicles, property, jobs and services — plus live listings pulled in from external sources so you don't have to check four other sites.

## Notable engineering

**Zero-dependency backend.** The entire API is one Node serverless function with no npm packages — auth, session signing, OAuth2 clients, JWT verification and the database layer are all built on Node's standard library. `package.json` has no runtime dependencies.

**Google Sign-In verified from scratch.** Rather than pulling in `google-auth-library`, ID tokens are verified manually: fetch Google's JWKS, match the key by `kid`, rebuild the RSA public key with `crypto.createPublicKey({ format: "jwk" })`, and verify the RS256 signature — then check `aud`, `iss`, `exp` and `email_verified`. Roughly 30 lines in `api/index.js`.

**Live external listings.** Category selection triggers an inline "From the web" panel:
- **eBay AU** — OAuth2 client-credentials against the Browse API, returning real listings with images and prices, optionally scoped to a marketplace category so a vehicle search returns cars rather than car parts. Includes the Marketplace Account Deletion notification endpoint eBay requires before a production keyset is enabled (SHA-256 challenge–response).
- **Adzuna + Jobicy** — job ads as text-led cards with salary, contract type and posting age, limited to ads at most 45 days old. Both run as first-class sources and merge: Adzuna supplies suburb-scoped local roles, Jobicy remote roles open to Australia. Each keeps a quota of the panel, because sorting local-first and slicing would hand the whole page to whichever source returns most. The heading states which it is showing.
- **Google Places / OpenStreetMap** — local trades and services. Places is used when a key is present (ratings, addresses); otherwise it falls back to OpenStreetMap via Nominatim + Overpass, which needs no key at all, so this category always has real data. Results are de-duplicated round-robin by trade so one category can't fill the panel. Places photos are deliberately not used — their URLs embed the API key.
- **ABS** — official quarterly median sale prices (`RES_DWELL`), used for property when Domain isn't connected. Free, no key, no ABN.
- **Domain.com.au** — a complete Listings API integration (OAuth2, cached tokens, suburb/state-scoped residential search). Access is gated behind a commercial agreement, so it ships **disabled and degrades gracefully** to branded source links rather than erroring. See "Honest status" below.

**Graceful degradation as a design rule.** Every external integration is feature-flagged off a `/config` endpoint. Missing credentials never surface as an error to the user — the UI falls back to a different, still-useful state.

**Privacy by construction.** Users only ever appear to each other as a generated handle (`Wombat-482`). Real names, emails and phone numbers are never exposed; the app never asks for a phone number at all. Item detail maps are geocoded to **suburb level only** — never the exact address. The optional council-pickup feature stores a street address visible solely to the poster.

**Client-side smart search.** Free text like `car under 15000` is parsed locally into a price ceiling plus a category guess (via a keyword synonym map), then results are scored and ranked. No server round-trip, no third-party service.

**Admin console.** Root admins come from `ADMIN_EMAILS`, never a flag on the user record, so the privilege ladder terminates outside anything a request can reach. Co-admins are granted in-app but only by a root admin. Non-admins get 404 rather than 403, so the console is not advertised. Covers user list, council-pickup queue, flagged-listing moderation, CSV export and sample listings.

**Guest mode.** A signed-out visitor can browse the feed and every external data panel. The guest is a synthetic user with no id and no record, so ownership checks can never match one, and the allow-list is GET-only and enumerated. The marker is explicit rather than inferred, so an unmarked signed-out request still lands on the login screen. Admins can preview the real guest view — the same code path, not a mock-up.

**Price watch.** Track any eBay listing and a daily cron records one price point. Current, low, high, change since you started and a sparkline — all observed, never predicted. There is deliberately no "cheapest month to buy": with days of history that would be invention dressed as analysis.

**Media storage.** Listing photos go to Supabase Storage with URLs in the row, rather than base64 inside it. Best-effort: if storage is unavailable the data URI is kept, because a photo that cannot be filed is not a reason to lose a listing.

**Degrading honestly.** Every third-party source has a defined failure mode. OpenStreetMap's public endpoint is raced across mirrors, cached in the database so it survives cold starts, serves stale data rather than nothing, and when it is genuinely down the panel says so and offers outbound links instead of rendering an error. Adzuna's recency filter is dropped on rejection rather than costing the local job feed.

## Stack

| | |
|---|---|
| Backend | Node serverless function (Vercel), zero dependencies |
| Frontend | Vanilla JS, no framework or build step |
| Database | Supabase (PostgREST) as a generic key-value store, with in-memory fallback |
| Auth | Signed HMAC session cookies; scrypt password hashing; Google OAuth |
| External APIs | eBay Browse API, Domain Listings API, OpenStreetMap/Nominatim |

No bundler, no transpiler. `public/` is served as-is.

## Running locally

```bash
npm install
npm run dev        # http://localhost:3000
```

Runs with an in-memory store and external integrations disabled — no configuration needed.

To enable the optional pieces, set any of:

```
SESSION_SECRET            # falls back to a random per-process key
SUPABASE_URL              # persistent storage (otherwise in-memory)
SUPABASE_SERVICE_KEY
GOOGLE_CLIENT_ID          # enables Google Sign-In
EBAY_CLIENT_ID            # enables inline eBay results
EBAY_CLIENT_SECRET
EBAY_VERIFICATION_TOKEN
DOMAIN_CLIENT_ID          # enables inline Domain property results
DOMAIN_CLIENT_SECRET
ADZUNA_APP_ID             # enables inline job listings
ADZUNA_APP_KEY
GOOGLE_PLACES_API_KEY     # optional; services fall back to OpenStreetMap without it
JOOBLE_API_KEY            # optional; a third job source, merged with the rest
ADMIN_EMAILS              # comma-separated; who gets the admin console
CRON_SECRET               # protects the scheduled jobs
```

## Tests

```bash
npm test
```

25 cases on `node:test`, no dependencies, no network. They cover the things that
have actually broken during development rather than hypotheticals: admin access
returning 404 not 403, the owner/co-admin privilege ladder, the locked owner
handle, moderation and the removal filter, sample labelling, CSV shape, the
guest allow-list, price-watch guards, and photo posting surviving an
unconfigured bucket.

## Honest status

This is a portfolio project, and it's worth being straight about what is and isn't live:

- **eBay integration is fully working in production** — real listings, verified end-to-end.
- **Domain integration is complete but inactive.** The code, OAuth flow and rendering all work and are deployed; credentials authenticate successfully (`200` on token). The Agents & Listings package requires a registered business and a commercial agreement with Domain, so the search endpoint returns `403` and the app falls back to source links. It's kept in the codebase deliberately — handling an unavailable dependency cleanly is part of the design.
- **Jobs show remote roles by default.** With no key configured the source is Jobicy, which is remote-only; the panel says "Remote roles open to Australia" rather than implying it has local listings. A free Adzuna key (no ABN, no card) upgrades the category to suburb-scoped local ads with salaries.
- **Property shows official ABS medians, not live listings.** That is a deliberate substitution, not a mock: live listings need a Domain commercial agreement, so the panel shows what places actually sold for instead of pretending to have listings it doesn't.
- **realestate.com.au, Carsales, Seek and Airtasker** are intentionally *not* scraped. None expose a public listings API, and scraping them would breach their terms and break constantly. They appear as clearly-labelled outbound links instead.
- Payments are not implemented; priced handoffs generate a receipt record only.

## Layout

```
api/index.js       # entire backend — routes, auth, OAuth clients, data layer
public/app.js      # entire frontend — views, state, rendering
public/styles.css  # design system
public/index.html  # shell
local-server.js    # dev server wrapping the serverless handler
```
