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
- **Adzuna** — Australian job ads, suburb- or nationwide-scoped, rendered as text-led cards with salary and contract type.
- **Domain.com.au** — a complete Listings API integration (OAuth2, cached tokens, suburb/state-scoped residential search). Access is gated behind a commercial agreement, so it ships **disabled and degrades gracefully** to branded source links rather than erroring. See "Honest status" below.

**Graceful degradation as a design rule.** Every external integration is feature-flagged off a `/config` endpoint. Missing credentials never surface as an error to the user — the UI falls back to a different, still-useful state.

**Privacy by construction.** Users only ever appear to each other as a generated handle (`Wombat-482`). Real names, emails and phone numbers are never exposed; the app never asks for a phone number at all. Item detail maps are geocoded to **suburb level only** — never the exact address. The optional council-pickup feature stores a street address visible solely to the poster.

**Client-side smart search.** Free text like `car under 15000` is parsed locally into a price ceiling plus a category guess (via a keyword synonym map), then results are scored and ranked. No server round-trip, no third-party service.

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
```

## Honest status

This is a portfolio project, and it's worth being straight about what is and isn't live:

- **eBay integration is fully working in production** — real listings, verified end-to-end.
- **Domain integration is complete but inactive.** The code, OAuth flow and rendering all work and are deployed; credentials authenticate successfully (`200` on token). The Agents & Listings package requires a registered business and a commercial agreement with Domain, so the search endpoint returns `403` and the app falls back to source links. It's kept in the codebase deliberately — handling an unavailable dependency cleanly is part of the design.
- **Job listings are built and ship disabled**, pending a free Adzuna developer key. Unlike Domain, that key needs no business registration, so this one is a signup away.
- **realestate.com.au, Carsales and Seek** are intentionally *not* scraped. None expose a public listings API, and scraping them would breach their terms and break constantly. They appear as clearly-labelled outbound links instead.
- Payments are not implemented; priced handoffs generate a receipt record only.

## Layout

```
api/index.js       # entire backend — routes, auth, OAuth clients, data layer
public/app.js      # entire frontend — views, state, rendering
public/styles.css  # design system
public/index.html  # shell
local-server.js    # dev server wrapping the serverless handler
```
