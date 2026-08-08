/* Kerbside API — zero-dependency Node serverless function (Vercel).
   Data layer: Supabase (PostgREST, one generic table) when env vars are set,
   otherwise an in-memory demo store (data may reset on cold starts). */
"use strict";
const crypto = require("crypto");

/* Session signing key. Falls back to a per-process random value rather than a
   hardcoded constant — a published constant would let anyone forge session
   cookies on a deployment that forgot to set SESSION_SECRET. The tradeoff is
   that sessions don't survive a restart locally, which is fine for dev. */
const SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString("hex");
if (!process.env.SESSION_SECRET) console.warn("SESSION_SECRET not set — using a random per-process key; sessions will not survive a restart.");
/* Accept either name: SUPABASE_SERVICE_KEY when the variables are set by hand,
   or SUPABASE_SERVICE_ROLE_KEY as injected by Vercel's Supabase integration. */
const SUPA_URL = (process.env.SUPABASE_URL || "").replace(/\/$/, "");
const SUPA_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const HAS_DB = !!(SUPA_URL && SUPA_KEY);
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const EBAY_CLIENT_ID = process.env.EBAY_CLIENT_ID || "";
const EBAY_CLIENT_SECRET = process.env.EBAY_CLIENT_SECRET || "";
const HAS_EBAY = !!(EBAY_CLIENT_ID && EBAY_CLIENT_SECRET);
const DOMAIN_CLIENT_ID = process.env.DOMAIN_CLIENT_ID || "";
const DOMAIN_CLIENT_SECRET = process.env.DOMAIN_CLIENT_SECRET || "";
const HAS_DOMAIN = !!(DOMAIN_CLIENT_ID && DOMAIN_CLIENT_SECRET);

const CLAIM_HOLD_DAYS = 2;
const FLAGS_TO_OBSERVE = 2;
const INSTANT_OBSERVE_REASONS = ["Not relevant / inappropriate", "Unsafe item", "Suspected scam"];
const MAX_MEDIA = 4;
const MAX_IMAGE_B64 = 420 * 1024;      // ~300KB binary
const MAX_VIDEO_B64 = 3.6 * 1024 * 1024; // ~2.6MB binary

/* Eco Points — a gamified points system, not real/redeemable rewards */
const ECO_POINTS = { handoffPoster: 15, handoffClaimer: 10, truckdone: 5 };
const ECO_TIERS = [
  { min: 0, name: "Newbie", icon: "" },
  { min: 50, name: "Local", icon: "" },
  { min: 150, name: "Big Deal", icon: "" },
  { min: 350, name: "Legend", icon: "" },
  { min: 700, name: "GOAT", icon: "" },
];
function tierFor(points) {
  let cur = ECO_TIERS[0], next = ECO_TIERS[1] || null;
  for (let i = 0; i < ECO_TIERS.length; i++) {
    if (points >= ECO_TIERS[i].min) { cur = ECO_TIERS[i]; next = ECO_TIERS[i + 1] || null; }
  }
  return { name: cur.name, icon: cur.icon, next: next ? { name: next.name, icon: next.icon, pointsToGo: next.min - points } : null };
}

/* ---------------- Generic store ---------------- */
// Demo store (per-instance memory)
const g = globalThis;
if (!g.__ksMem) g.__ksMem = { users: {}, items: {}, notifs: {}, receipts: {}, meta: {} };
for (const c of ["users", "items", "notifs", "receipts", "meta"]) if (!g.__ksMem[c]) g.__ksMem[c] = {};

/* When the configured database becomes unreachable (project deleted, paused, DNS
   failure, outage) we fall back to the in-memory store and report dbMode "demo"
   so the client shows its existing "data may reset" banner — degraded but honest
   and still usable, rather than failing every request with an opaque 500.
   Degradation is time-boxed rather than permanent: after DB_RETRY_MS we try the
   real database again, so a transient outage self-heals without a redeploy. */
const DB_RETRY_MS = 60 * 1000;
let dbDownUntil = 0;
function isNetworkFailure(err) {
  const code = err && err.cause && err.cause.code;
  return err instanceof TypeError || ["ENOTFOUND", "ECONNREFUSED", "ETIMEDOUT", "EAI_AGAIN", "ECONNRESET"].includes(code);
}
function markDbDown() { dbDownUntil = Date.now() + DB_RETRY_MS; }
function dbLive() { return HAS_DB && Date.now() >= dbDownUntil; }

async function supa(method, path, body) {
  let res;
  try {
    res = await fetch(SUPA_URL + "/rest/v1/" + path, {
      method,
      headers: {
        apikey: SUPA_KEY,
        Authorization: "Bearer " + SUPA_KEY,
        "Content-Type": "application/json",
        Prefer: method === "POST" ? "resolution=merge-duplicates,return=minimal" : "return=minimal",
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    if (isNetworkFailure(err)) {
      if (dbLive()) console.error("Database unreachable — falling back to in-memory store.", err.message);
      markDbDown();
      const e = new Error("DB_UNREACHABLE"); e.dbUnreachable = true; throw e;
    }
    throw err;
  }
  if (!res.ok) throw new Error("DB error " + res.status + ": " + (await res.text()).slice(0, 300));
  if (method === "GET") return res.json();
  return null;
}

const db = {
  async get(coll, id) {
    if (!dbLive()) return g.__ksMem[coll][id] || null;
    try {
      const rows = await supa("GET", `ks_store?collection=eq.${coll}&id=eq.${encodeURIComponent(id)}&select=data`);
      return rows.length ? rows[0].data : null;
    } catch (e) { if (e.dbUnreachable) return g.__ksMem[coll][id] || null; throw e; }
  },
  async list(coll) {
    if (!dbLive()) return Object.values(g.__ksMem[coll]);
    try {
      const rows = await supa("GET", `ks_store?collection=eq.${coll}&select=data&limit=1000`);
      return rows.map((r) => r.data);
    } catch (e) { if (e.dbUnreachable) return Object.values(g.__ksMem[coll]); throw e; }
  },
  async put(coll, id, data) {
    if (!dbLive()) { g.__ksMem[coll][id] = data; return; }
    try {
      await supa("POST", "ks_store?on_conflict=collection,id", [{ collection: coll, id, data }]);
    } catch (e) { if (e.dbUnreachable) { g.__ksMem[coll][id] = data; return; } throw e; }
  },
  async del(coll, id) {
    if (!dbLive()) { delete g.__ksMem[coll][id]; return; }
    try {
      await supa("DELETE", `ks_store?collection=eq.${coll}&id=eq.${encodeURIComponent(id)}`);
    } catch (e) { if (e.dbUnreachable) { delete g.__ksMem[coll][id]; return; } throw e; }
  },
};

/* ---------------- Helpers ---------------- */
const uid = (p) => (p || "k") + Date.now().toString(36) + crypto.randomBytes(4).toString("hex");
const now = () => Date.now();

function hashPass(pw, salt) {
  return crypto.scryptSync(String(pw), salt, 64).toString("hex");
}
function sign(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto.createHmac("sha256", SECRET).update(body).digest("base64url");
  return body + "." + sig;
}
function verify(token) {
  if (!token || token.indexOf(".") < 0) return null;
  const [body, sig] = token.split(".");
  const good = crypto.createHmac("sha256", SECRET).update(body).digest("base64url");
  try {
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(good))) return null;
  } catch { return null; }
  try {
    const p = JSON.parse(Buffer.from(body, "base64url").toString());
    if (p.exp && p.exp < now()) return null;
    return p;
  } catch { return null; }
}
function getCookie(req, name) {
  const c = req.headers.cookie || "";
  const m = c.match(new RegExp("(?:^|;\\s*)" + name + "=([^;]+)"));
  return m ? decodeURIComponent(m[1]) : null;
}

/* ---------------- Login throttling ----------------
   Slows password guessing: after LOGIN_MAX_FAILS wrong attempts for the same
   IP+email, that pair is locked out for LOGIN_LOCK_MS.

   Honest caveat: this lives in per-instance memory, so on serverless an
   attacker spread across many cold instances gets more attempts than the
   nominal limit. It still raises the cost of a naive brute-force by orders of
   magnitude with zero added latency or database writes (a DB-backed counter
   would turn every failed login into a write, which is its own DoS vector).
   A network-level WAF is the right complement for a determined attacker. */
const LOGIN_MAX_FAILS = 5;
const LOGIN_LOCK_MS = 15 * 60 * 1000;
if (!g.__ksRate) g.__ksRate = new Map();

function clientIp(req) {
  const fwd = req.headers["x-forwarded-for"];
  if (fwd) return String(fwd).split(",")[0].trim();
  return (req.socket && req.socket.remoteAddress) || "unknown";
}
function throttleKey(req, email) { return clientIp(req) + "|" + String(email || "").toLowerCase(); }

function loginLockedFor(key) {
  const e = g.__ksRate.get(key);
  if (!e) return 0;
  if (e.until && e.until > now()) return e.until - now();
  if (e.until && e.until <= now()) g.__ksRate.delete(key);
  return 0;
}
function noteLoginFailure(key) {
  // opportunistic prune so the map can't grow without bound
  if (g.__ksRate.size > 5000) {
    for (const [k, v] of g.__ksRate) if (!v.until || v.until <= now()) g.__ksRate.delete(k);
  }
  const e = g.__ksRate.get(key) || { fails: 0, until: 0 };
  e.fails += 1;
  if (e.fails >= LOGIN_MAX_FAILS) { e.until = now() + LOGIN_LOCK_MS; e.fails = 0; }
  g.__ksRate.set(key, e);
}
function clearLoginFailures(key) { g.__ksRate.delete(key); }

const ANIMALS = ["Wombat","Koala","Magpie","Echidna","Dingo","Possum","Kooka","Wallaby","Quokka","Ibis","Galah","Bilby"];
function anonHandle() {
  return ANIMALS[Math.floor(Math.random() * ANIMALS.length)] + "-" + (100 + Math.floor(Math.random() * 900));
}
function nextWeekdayOnOrAfter(fromTs, weekday) {
  const d = new Date(fromTs);
  d.setUTCHours(0, 0, 0, 0);
  const diff = (weekday - d.getUTCDay() + 7) % 7;
  d.setUTCDate(d.getUTCDate() + diff);
  return d.getTime();
}
function addHistory(item, label, alert) {
  item.history = item.history || [];
  item.history.push({ at: now(), label, alert: !!alert });
}
async function notify(userId, text, itemId) {
  const id = uid("n");
  await db.put("notifs", id, { id, userId, text, itemId: itemId || null, read: false, at: now() });
}

/* ---------------- Google Sign-In (ID token verification, no client secret needed) ---------------- */
let googleJWKSCache = null, googleJWKSCacheAt = 0;
async function getGoogleJWKS(forceFresh) {
  if (!forceFresh && googleJWKSCache && now() - googleJWKSCacheAt < 3600000) return googleJWKSCache;
  const res = await fetch("https://www.googleapis.com/oauth2/v3/certs");
  if (!res.ok) throw new Error("Couldn't fetch Google signing keys");
  googleJWKSCache = await res.json();
  googleJWKSCacheAt = now();
  return googleJWKSCache;
}
function b64urlJSON(part) {
  return JSON.parse(Buffer.from(part, "base64url").toString("utf8"));
}
async function verifyGoogleIdToken(idToken) {
  const parts = String(idToken || "").split(".");
  if (parts.length !== 3) throw new Error("Malformed token");
  const [headerB64, payloadB64, sigB64] = parts;
  const header = b64urlJSON(headerB64);
  const payload = b64urlJSON(payloadB64);
  if (header.alg !== "RS256") throw new Error("Unexpected signing algorithm");
  let jwks = await getGoogleJWKS(false);
  let key = (jwks.keys || []).find((k) => k.kid === header.kid);
  if (!key) { jwks = await getGoogleJWKS(true); key = (jwks.keys || []).find((k) => k.kid === header.kid); }
  if (!key) throw new Error("Unknown signing key");
  const keyObject = crypto.createPublicKey({ key: { kty: key.kty, n: key.n, e: key.e }, format: "jwk" });
  const verifier = crypto.createVerify("RSA-SHA256");
  verifier.update(headerB64 + "." + payloadB64);
  verifier.end();
  if (!verifier.verify(keyObject, Buffer.from(sigB64, "base64url"))) throw new Error("Bad signature");
  if (!payload.exp || payload.exp * 1000 < now()) throw new Error("Token expired");
  if (payload.aud !== GOOGLE_CLIENT_ID) throw new Error("Token not issued for this app");
  if (payload.iss !== "accounts.google.com" && payload.iss !== "https://accounts.google.com") throw new Error("Bad issuer");
  if (!payload.email || !payload.email_verified) throw new Error("Email not verified with Google");
  return payload;
}

/* ---------------- eBay AU Browse API (real in-app search results) ---------------- */
let ebayTokenCache = null, ebayTokenExpAt = 0;
async function getEbayToken() {
  if (ebayTokenCache && now() < ebayTokenExpAt - 60000) return ebayTokenCache;
  const basic = Buffer.from(EBAY_CLIENT_ID + ":" + EBAY_CLIENT_SECRET).toString("base64");
  const res = await fetch("https://api.ebay.com/identity/v1/oauth2/token", {
    method: "POST",
    headers: { Authorization: "Basic " + basic, "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials&scope=" + encodeURIComponent("https://api.ebay.com/oauth/api_scope"),
  });
  if (!res.ok) throw new Error("eBay auth failed: " + res.status);
  const j = await res.json();
  ebayTokenCache = j.access_token;
  ebayTokenExpAt = now() + (j.expires_in || 7200) * 1000;
  return ebayTokenCache;
}
async function searchEbay(query) {
  const token = await getEbayToken();
  const url = "https://api.ebay.com/buy/browse/v1/item_summary/search?q=" + encodeURIComponent(query) + "&limit=6&filter=" + encodeURIComponent("itemLocationCountry:AU");
  const res = await fetch(url, {
    headers: { Authorization: "Bearer " + token, "X-EBAY-C-MARKETPLACE-ID": "EBAY_AU" },
  });
  if (!res.ok) throw new Error("eBay search failed: " + res.status);
  const j = await res.json();
  return (j.itemSummaries || []).slice(0, 6).map((it) => ({
    title: it.title,
    price: it.price ? (it.price.value + " " + it.price.currency) : null,
    image: it.image ? it.image.imageUrl : null,
    url: it.itemWebUrl,
    condition: it.condition || null,
  }));
}

/* ---------------- Domain.com.au Listings API (real in-app property results) ----------------
   Licensed access via Domain's developer program — not scraping. OAuth2 client_credentials,
   scope api_listings_read. Results are shown inline; the listing itself lives on Domain. */
let domainTokenCache = null, domainTokenExpAt = 0;
async function getDomainToken() {
  if (domainTokenCache && now() < domainTokenExpAt - 60000) return domainTokenCache;
  const basic = Buffer.from(DOMAIN_CLIENT_ID + ":" + DOMAIN_CLIENT_SECRET).toString("base64");
  const res = await fetch("https://auth.domain.com.au/v1/connect/token", {
    method: "POST",
    headers: { Authorization: "Basic " + basic, "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials&scope=" + encodeURIComponent("api_listings_read"),
  });
  if (!res.ok) throw new Error("Domain auth failed: " + res.status);
  const j = await res.json();
  domainTokenCache = j.access_token;
  domainTokenExpAt = now() + (j.expires_in || 3600) * 1000;
  return domainTokenCache;
}
async function searchDomain({ listingType, suburb, state, maxPrice }) {
  const token = await getDomainToken();
  const loc = { state: state || "", includeSurroundingSuburbs: true };
  if (suburb) loc.suburb = suburb;
  const body = {
    listingType: listingType === "Rent" ? "Rent" : "Sale",
    locations: [loc],
    pageSize: 6,
  };
  if (maxPrice) body.maxPrice = maxPrice;
  const res = await fetch("https://api.domain.com.au/v1/listings/residential/_search", {
    method: "POST",
    headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Domain search failed: " + res.status);
  const rows = await res.json();
  return (Array.isArray(rows) ? rows : [])
    .filter((r) => r && r.listing)
    .slice(0, 6)
    .map((r) => {
      const l = r.listing, pd = l.propertyDetails || {}, media = l.media || [];
      return {
        title: pd.displayableAddress || "Property listing",
        price: (l.priceDetails && l.priceDetails.displayPrice) || null,
        image: media.length && media[0].url ? media[0].url : null,
        url: l.listingSlug ? "https://www.domain.com.au/" + l.listingSlug : "https://www.domain.com.au",
        beds: typeof pd.bedrooms === "number" ? pd.bedrooms : null,
        baths: typeof pd.bathrooms === "number" ? pd.bathrooms : null,
        carspaces: typeof pd.carspaces === "number" ? pd.carspaces : null,
      };
    });
}

/* Public view of a user (never leaks email/phone/real identity) */
function publicUser(u) {
  return { handle: u.handle, suburb: u.suburb, trusted: (u.handoffs || 0) >= 3 };
}

/* Categories with no council-truck mechanic — cars, property, jobs and services don't get put on the kerb */
var NON_KERB_CATS = ["vehicles", "property_rent", "property_sale", "classifieds", "jobs", "services"];
var AU_STATE_CODES = ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"];

/* Status auto-transitions — the core business rule */
async function resolveItem(item, ownerProfile) {
  let changed = false;
  if (item.status === "claimed" && item.claim && now() >= item.claim.expiresAt) {
    addHistory(item, item.claim.byHandle + " didn't collect in time — claim expired, back on the kerb", true);
    await notify(item.userId, "A claim on “" + item.title + "” expired — it's back up.", item.id);
    if (item.claim.byId) await notify(item.claim.byId, "Your claim on “" + item.title + "” expired.", item.id);
    item.claim = null;
    item.status = "available";
    changed = true;
  }
  if (item.status === "available" && NON_KERB_CATS.indexOf(item.category) === -1) {
    const wd = ownerProfile ? ownerProfile.pickupWeekday : 3;
    const pickup = nextWeekdayOnOrAfter(item.postedAt + 86400000, wd);
    const msToPickup = pickup - now();
    if (!item.truckReminderSent && msToPickup > 0 && msToPickup <= 86400000) {
      item.truckReminderSent = true;
      addHistory(item, "Reminder sent — truck day is within 24 hours");
      await notify(item.userId, "Truck day for “" + item.title + "” is within 24 hours — still time for a neighbour to claim it, or put it out for the council.", item.id);
      changed = true;
    }
    if (now() >= pickup) {
      item.status = "booked_for_truck";
      addHistory(item, "Nobody claimed it in time — auto-booked for the council truck", true);
      await notify(item.userId, "“" + item.title + "” wasn't claimed — it's booked for the truck.", item.id);
      changed = true;
    }
  }
  return changed;
}
function underObservation(item) {
  if (item.status === "collected" || item.status === "collected_by_truck") return false;
  const flags = item.flags || [];
  if (flags.length >= FLAGS_TO_OBSERVE) return true;
  return flags.some((f) => INSTANT_OBSERVE_REASONS.includes(f.reason));
}

/* ---------------- Request handling ---------------- */
async function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (c) => {
      data += c;
      if (data.length > 8 * 1024 * 1024) { reject(new Error("Payload too large")); req.destroy(); }
    });
    req.on("end", () => {
      try { resolve(data ? JSON.parse(data) : {}); } catch { resolve({}); }
    });
    req.on("error", reject);
  });
}
function send(res, code, obj, cookie) {
  const headers = { "Content-Type": "application/json" };
  if (cookie) headers["Set-Cookie"] = cookie;
  res.writeHead(code, headers);
  res.end(JSON.stringify(obj));
}
function sessionCookie(token) {
  return "ks_session=" + encodeURIComponent(token) + "; HttpOnly; Path=/; Max-Age=2592000; SameSite=Lax";
}

module.exports = async function handler(req, res) {
  try {
    const url = new URL(req.url, "http://x");
    const path = url.pathname.replace(/^\/api/, "").replace(/\/$/, "") || "/";
    const method = req.method;
    const body = method === "POST" || method === "PUT" ? await readBody(req) : {};

    // ---- auth-free routes ----
    if (path === "/health") return send(res, 200, { ok: true, dbMode: dbLive() ? "supabase" : "demo" });

    /* Keep-warm. Free-tier databases pause or get deleted after a period with no
       traffic (Supabase pauses at ~1 week). A daily Vercel cron hits this and
       performs a real round-trip write+read so the provider sees genuine activity
       — a plain HTTP ping to the app would not touch the database at all. */
    if (path === "/cron/keepwarm") {
      const cronSecret = process.env.CRON_SECRET || "";
      if (cronSecret && req.headers.authorization !== "Bearer " + cronSecret)
        return send(res, 401, { error: "Unauthorized." });
      const probeId = "keepwarm";
      dbDownUntil = 0; // clear any cooldown so this always probes the real database
      try {
        await db.put("meta", probeId, { id: probeId, lastPing: now() });
        const back = await db.get("meta", probeId);
        return send(res, 200, { ok: true, dbMode: dbLive() ? "supabase" : "demo", roundTrip: !!back, at: back && back.lastPing });
      } catch (err) {
        console.error("Keep-warm failed:", err.message);
        return send(res, 500, { ok: false, dbMode: dbLive() ? "supabase" : "demo", error: "Keep-warm round-trip failed." });
      }
    }

    if (path === "/config" && method === "GET")
      return send(res, 200, { googleClientId: GOOGLE_CLIENT_ID || null, ebayEnabled: HAS_EBAY, domainEnabled: HAS_DOMAIN });

    // eBay Marketplace Account Deletion notifications (required to enable the keyset).
    // GET = eBay's endpoint-validation challenge; POST = deletion notices (we store no eBay
    // user data, so acknowledging with 200 is the entire obligation).
    if (path === "/ebay-notifications") {
      const vt = process.env.EBAY_VERIFICATION_TOKEN || "";
      if (method === "GET") {
        const cc = url.searchParams.get("challenge_code") || "";
        const endpoint = (process.env.PUBLIC_BASE_URL || "https://kerbside-kappa.vercel.app") + "/api/ebay-notifications";
        const hash = crypto.createHash("sha256").update(cc + vt + endpoint).digest("hex");
        return send(res, 200, { challengeResponse: hash });
      }
      if (method === "POST") return send(res, 200, { ok: true });
    }

    if (path === "/oauth/google" && method === "POST") {
      if (!GOOGLE_CLIENT_ID) return send(res, 400, { error: "Google sign-in isn't connected yet." });
      let payload;
      try { payload = await verifyGoogleIdToken(body.credential); }
      catch { return send(res, 401, { error: "Google sign-in failed — please try again." }); }
      const email = String(payload.email).trim().toLowerCase();
      const users = await db.list("users");
      let user = users.find((u) => u.oauthGoogleSub === payload.sub) || users.find((u) => u.email === email);
      let isNew = false;
      if (user) {
        if (!user.oauthGoogleSub) user.oauthGoogleSub = payload.sub;
      } else {
        isNew = true;
        user = {
          id: uid("u"), email, salt: null, passHash: null, oauthGoogleSub: payload.sub,
          handle: anonHandle(),
          name: String(payload.name || "").slice(0, 30) || null,
          suburb: "Wentworthville", state: "NSW", pickupWeekday: 3,
          handoffs: 0, truckSaved: 0, ratings: [], ecoPoints: 0,
          platformTokens: {}, createdAt: now(),
        };
        await notify(user.id, "Welcome to Dibs! You appear to neighbours only as " + user.handle + " — your email and identity are never shown.", null);
      }
      await db.put("users", user.id, user);
      const token = sign({ uid: user.id, exp: now() + 30 * 86400000 });
      return send(res, 200, { ok: true, me: meView(user), isNew }, sessionCookie(token));
    }

    if (path === "/signup" && method === "POST") {
      const email = String(body.email || "").trim().toLowerCase();
      const password = String(body.password || "");
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return send(res, 400, { error: "Enter a valid email." });
      if (password.length < 6) return send(res, 400, { error: "Password must be at least 6 characters." });
      const users = await db.list("users");
      if (users.some((u) => u.email === email)) return send(res, 409, { error: "That email is already registered — log in instead." });
      const salt = crypto.randomBytes(16).toString("hex");
      const user = {
        id: uid("u"), email, salt, passHash: hashPass(password, salt),
        handle: anonHandle(),
        name: String(body.name || "").slice(0, 30) || null,
        suburb: String(body.suburb || "Wentworthville").slice(0, 40),
        state: AU_STATE_CODES.includes(body.state) ? body.state : "NSW",
        pickupWeekday: Number.isInteger(body.pickupWeekday) ? Math.max(0, Math.min(6, body.pickupWeekday)) : 3,
        handoffs: 0, truckSaved: 0, ratings: [], ecoPoints: 0,
        platformTokens: {}, createdAt: now(),
      };
      await db.put("users", user.id, user);
      const token = sign({ uid: user.id, exp: now() + 30 * 86400000 });
      await notify(user.id, "Welcome to Dibs! You appear to neighbours only as " + user.handle + " — your email and identity are never shown.", null);
      return send(res, 200, { ok: true, me: meView(user) }, sessionCookie(token));
    }

    if (path === "/login" && method === "POST") {
      const email = String(body.email || "").trim().toLowerCase();
      const rateKey = throttleKey(req, email);
      const lockedMs = loginLockedFor(rateKey);
      if (lockedMs > 0) {
        const mins = Math.ceil(lockedMs / 60000);
        return send(res, 429, { error: "Too many failed attempts. Try again in " + mins + " minute" + (mins === 1 ? "" : "s") + "." });
      }
      const users = await db.list("users");
      const user = users.find((u) => u.email === email);
      if (!user) { noteLoginFailure(rateKey); return send(res, 401, { error: "Wrong email or password." }); }
      if (!user.passHash) return send(res, 401, { error: "This account uses Google sign-in — tap “Continue with Google” instead." });
      if (hashPass(String(body.password || ""), user.salt) !== user.passHash) {
        noteLoginFailure(rateKey);
        return send(res, 401, { error: "Wrong email or password." });
      }
      clearLoginFailures(rateKey);
      const token = sign({ uid: user.id, exp: now() + 30 * 86400000 });
      return send(res, 200, { ok: true, me: meView(user) }, sessionCookie(token));
    }

    if (path === "/logout" && method === "POST")
      return send(res, 200, { ok: true }, "ks_session=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax");

    // ---- authed routes ----
    const sess = verify(getCookie(req, "ks_session"));
    const me = sess ? await db.get("users", sess.uid) : null;
    if (!me) return send(res, 401, { error: "Not logged in." });

    if (path === "/me" && method === "GET") return send(res, 200, { me: meView(me), dbMode: dbLive() ? "supabase" : "demo" });

    if (path === "/search/ebay" && method === "GET") {
      if (!HAS_EBAY) return send(res, 400, { error: "eBay search isn't connected yet." });
      const q = String(url.searchParams.get("q") || "").trim().slice(0, 80);
      if (!q) return send(res, 400, { error: "Search for something first." });
      try {
        const results = await searchEbay(q);
        return send(res, 200, { results });
      } catch {
        return send(res, 502, { error: "Couldn't reach eBay — try again." });
      }
    }

    if (path === "/search/domain" && method === "GET") {
      if (!HAS_DOMAIN) return send(res, 400, { error: "Domain property search isn't connected yet." });
      const listingType = url.searchParams.get("type") === "Rent" ? "Rent" : "Sale";
      // "all Australia" scope drops the suburb and searches the whole state
      const scopeAll = url.searchParams.get("scope") === "all";
      const suburb = scopeAll ? "" : String(url.searchParams.get("suburb") || me.suburb || "").slice(0, 40);
      const state = String(url.searchParams.get("state") || me.state || "NSW").slice(0, 3);
      const maxPrice = Number(url.searchParams.get("maxPrice")) || 0;
      try {
        const results = await searchDomain({ listingType, suburb, state, maxPrice });
        return send(res, 200, { results });
      } catch {
        return send(res, 502, { error: "Couldn't reach Domain — try again." });
      }
    }

    if (path === "/profile" && method === "PUT") {
      if (body.name !== undefined) me.name = String(body.name || "").slice(0, 30) || null;
      if (body.suburb) me.suburb = String(body.suburb).slice(0, 40);
      if (AU_STATE_CODES.includes(body.state)) me.state = body.state;
      if (Number.isInteger(body.pickupWeekday)) me.pickupWeekday = Math.max(0, Math.min(6, body.pickupWeekday));
      if (body.platformTokens && typeof body.platformTokens === "object") {
        for (const k of ["Marketplace", "Gumtree", "Freecycle", "Olio"])
          if (typeof body.platformTokens[k] === "string") me.platformTokens[k] = body.platformTokens[k].slice(0, 300);
      }
      await db.put("users", me.id, me);
      return send(res, 200, { ok: true, me: meView(me) });
    }

    if (path === "/profile/newhandle" && method === "POST") {
      let h = anonHandle();
      while (h === me.handle) h = anonHandle();
      me.handle = h;
      await db.put("users", me.id, me);
      await notify(me.id, "A new anonymous handle was generated for you: " + h + ". Your old posts now show this handle too.", null);
      return send(res, 200, { ok: true, me: meView(me) });
    }

    if (path === "/items" && method === "GET") {
      const [items, users] = await Promise.all([db.list("items"), db.list("users")]);
      const byId = Object.fromEntries(users.map((u) => [u.id, u]));
      for (const it of items) if (await resolveItem(it, byId[it.userId])) await db.put("items", it.id, it);
      const out = items
        .filter((it) => it.userId === me.id || !underObservation(it))
        .map((it) => itemView(it, me, byId[it.userId]))
        .sort((a, b) => b.postedAt - a.postedAt);
      return send(res, 200, { items: out });
    }

    if (path === "/items" && method === "POST") {
      const title = String(body.title || "").trim().slice(0, 70);
      if (!title) return send(res, 400, { error: "Give it a short title." });
      let media = Array.isArray(body.media) ? body.media.slice(0, MAX_MEDIA) : [];
      for (const m of media) {
        if (!m || (m.type !== "image" && m.type !== "video") || typeof m.data !== "string" || m.data.indexOf("data:") !== 0)
          return send(res, 400, { error: "Bad media attachment." });
        if (m.type === "image" && m.data.length > MAX_IMAGE_B64) return send(res, 400, { error: "A photo is too large — try again." });
        if (m.type === "video" && m.data.length > MAX_VIDEO_B64) return send(res, 400, { error: "Videos must be under ~2.5MB for the pilot." });
      }
      const price = Math.max(0, Math.min(2000000, Number(body.price) || 0));
      const platforms = (Array.isArray(body.platforms) ? body.platforms : []).filter((p) => ["Marketplace", "Gumtree", "Freecycle", "Olio"].includes(p));
      const category = String(body.category || "other").slice(0, 20);
      const conciergeAddress = String(body.conciergeAddress || "").trim().slice(0, 200);
      const concierge = !!body.concierge && NON_KERB_CATS.indexOf(category) === -1 && /\d/.test(conciergeAddress)
        ? { requested: true, address: conciergeAddress, requestedAt: now() }
        : null;
      const item = {
        id: uid("i"), userId: me.id,
        title, desc: String(body.desc || "").slice(0, 240),
        category,
        media, platforms, price, concierge,
        postedAt: now(), status: "available", claim: null, flags: [], rating: null, history: [],
      };
      addHistory(item, "Posted to Dibs by " + me.handle);
      if (concierge) addHistory(item, "Dibs Concierge requested — flagged for manual council-pickup coordination");
      if (platforms.length) {
        const withToken = platforms.filter((p) => me.platformTokens[p]);
        const without = platforms.filter((p) => !me.platformTokens[p]);
        if (withToken.length) addHistory(item, "Queued for auto-posting to " + withToken.join(", ") + " (token connected)");
        if (without.length) addHistory(item, "Share-ready listing prepared for " + without.join(", ") + " — post with one tap from the item card");
      }
      if (price > 0) addHistory(item, "Listed at $" + price);
      await db.put("items", item.id, item);
      return send(res, 200, { ok: true, item: itemView(item, me, me) });
    }

    // /items/:id/<action>
    const m = path.match(/^\/items\/([^/]+)(?:\/([a-z]+))?$/);
    if (m) {
      const item = await db.get("items", m[1]);
      if (!item) return send(res, 404, { error: "That listing no longer exists." });
      const owner = await db.get("users", item.userId);
      if (await resolveItem(item, owner)) await db.put("items", item.id, item);
      const action = m[2];

      if (method === "DELETE" && !action) {
        if (item.userId !== me.id) return send(res, 403, { error: "Not your listing." });
        await db.del("items", item.id);
        return send(res, 200, { ok: true });
      }
      if (method !== "POST") return send(res, 405, { error: "Bad method." });

      if (action === "claim") {
        if (item.userId === me.id) return send(res, 400, { error: "You can't claim your own listing." });
        if (underObservation(item)) return send(res, 400, { error: "This listing is under observation and can't be claimed right now." });
        if (item.status !== "available") {
          const why = item.status === "claimed" ? "someone claimed it first" : item.status === "booked_for_truck" ? "it's already booked for the truck" : "it's no longer available";
          addHistory(item, "A claim attempt failed — " + why, true);
          await db.put("items", item.id, item);
          return send(res, 409, { error: "Couldn't claim — " + why + "." });
        }
        item.status = "claimed";
        item.claim = { byId: me.id, byHandle: me.handle, at: now(), expiresAt: now() + CLAIM_HOLD_DAYS * 86400000 };
        addHistory(item, "Claimed by " + me.handle + " (collect within " + CLAIM_HOLD_DAYS + " days)");
        await db.put("items", item.id, item);
        await notify(item.userId, me.handle + " claimed “" + item.title + "” — arrange the handoff in the app.", item.id);
        return send(res, 200, { ok: true });
      }

      if (action === "handoff") {
        if (item.userId !== me.id) return send(res, 403, { error: "Only the poster can confirm the handoff." });
        if (item.status !== "claimed") return send(res, 400, { error: "Nothing to hand off." });
        item.status = "collected";
        addHistory(item, "Handoff confirmed — the listing is closed");
        me.handoffs = (me.handoffs || 0) + 1;
        me.ecoPoints = (me.ecoPoints || 0) + ECO_POINTS.handoffPoster;
        if (item.claim && item.claim.byId) {
          const claimer = await db.get("users", item.claim.byId);
          if (claimer) { claimer.ecoPoints = (claimer.ecoPoints || 0) + ECO_POINTS.handoffClaimer; await db.put("users", claimer.id, claimer); }
        }
        let receipt = null;
        if (item.price > 0 && item.claim) {
          receipt = {
            id: "KB-" + Date.now().toString(36).toUpperCase() + crypto.randomBytes(2).toString("hex").toUpperCase(),
            itemId: item.id, title: item.title, amount: item.price,
            posterId: me.id, posterHandle: me.handle,
            claimerId: item.claim.byId || null, claimerHandle: item.claim.byHandle || null,
            suburb: me.suburb, at: now(),
            method: process.env.STRIPE_SECRET ? "Paid in-app (Stripe)" : "Paid at handoff — recorded by Dibs",
          };
          await db.put("receipts", receipt.id, receipt);
          addHistory(item, "Online receipt " + receipt.id + " generated for $" + item.price);
          if (item.claim.byId) await notify(item.claim.byId, "Receipt " + receipt.id + " for “" + item.title + "” ($" + item.price + ") is in your Profile.", item.id);
          await notify(me.id, "Receipt " + receipt.id + " for “" + item.title + "” ($" + item.price + ") is in your Profile.", item.id);
        }
        await db.put("users", me.id, me);
        await db.put("items", item.id, item);
        if (item.claim && item.claim.byId) await notify(item.claim.byId, "Handoff of “" + item.title + "” confirmed. You can rate it now.", item.id);
        return send(res, 200, { ok: true, receipt });
      }

      if (action === "truckdone") {
        if (item.userId !== me.id) return send(res, 403, { error: "Not your listing." });
        if (item.status !== "booked_for_truck") return send(res, 400, { error: "This listing isn't booked for the truck." });
        item.status = "collected_by_truck";
        addHistory(item, "Collected by the council truck");
        me.truckSaved = (me.truckSaved || 0) + 1;
        me.ecoPoints = (me.ecoPoints || 0) + ECO_POINTS.truckdone;
        await db.put("users", me.id, me);
        await db.put("items", item.id, item);
        return send(res, 200, { ok: true });
      }

      if (action === "flag") {
        const reason = String(body.reason || "Other").slice(0, 60);
        item.flags = item.flags || [];
        if (item.flags.some((f) => f.byId === me.id)) return send(res, 400, { error: "You've already flagged this listing." });
        item.flags.push({ byId: me.id, reason, at: now() });
        addHistory(item, "Flagged: " + reason, true);
        const obs = underObservation(item);
        if (obs) {
          addHistory(item, "Moved to observation — hidden from the feed pending review", true);
          await notify(item.userId, "“" + item.title + "” was flagged (" + reason + ") and moved to observation. Fix the listing or contact support.", item.id);
        } else {
          await notify(item.userId, "“" + item.title + "” received a flag: " + reason, item.id);
        }
        await db.put("items", item.id, item);
        return send(res, 200, { ok: true, observation: obs });
      }

      if (action === "rate") {
        const r = Math.round(Number(body.rating));
        if (!(r >= 1 && r <= 5)) return send(res, 400, { error: "Rate 1 to 5." });
        const isPoster = item.userId === me.id;
        const isClaimer = item.claim && item.claim.byId === me.id;
        if (!isPoster && !isClaimer) return send(res, 403, { error: "Only the two sides of the handoff can rate it." });
        if (item.status !== "collected" && item.status !== "collected_by_truck") return send(res, 400, { error: "Rate after the handoff is done." });
        item.rating = r;
        addHistory(item, "Handoff rated " + r + "/5 by " + me.handle);
        await db.put("items", item.id, item);
        const other = isPoster ? (item.claim && item.claim.byId) : item.userId;
        if (other) {
          const ou = await db.get("users", other);
          if (ou) { ou.ratings = ou.ratings || []; ou.ratings.push(r); await db.put("users", other, ou); }
        }
        return send(res, 200, { ok: true });
      }
      return send(res, 404, { error: "Unknown action." });
    }

    if (path === "/receipts" && method === "GET") {
      const all = await db.list("receipts");
      const mine = all.filter((r) => r.posterId === me.id || r.claimerId === me.id).sort((a, b) => b.at - a.at);
      return send(res, 200, { receipts: mine });
    }

    if (path === "/leaderboard" && method === "GET") {
      const users = await db.list("users");
      const top = users
        .filter((u) => (u.suburb || "").toLowerCase() === (me.suburb || "").toLowerCase() && (u.ecoPoints || 0) > 0)
        .sort((a, b) => (b.ecoPoints || 0) - (a.ecoPoints || 0))
        .slice(0, 5)
        .map((u) => ({ handle: u.handle, ecoPoints: u.ecoPoints || 0, tier: tierFor(u.ecoPoints || 0), trusted: (u.handoffs || 0) >= 3, mine: u.id === me.id }));
      return send(res, 200, { suburb: me.suburb, leaderboard: top });
    }

    if (path === "/notifications" && method === "GET") {
      const all = await db.list("notifs");
      const mine = all.filter((n) => n.userId === me.id).sort((a, b) => b.at - a.at).slice(0, 50);
      return send(res, 200, { notifications: mine, unread: mine.filter((n) => !n.read).length });
    }
    if (path === "/notifications/read" && method === "POST") {
      const all = await db.list("notifs");
      for (const n of all) if (n.userId === me.id && !n.read) { n.read = true; await db.put("notifs", n.id, n); }
      return send(res, 200, { ok: true });
    }

    return send(res, 404, { error: "Not found." });
  } catch (err) {
    console.error("Dibs API error:", err);
    return send(res, 500, { error: "Something went wrong on the server — try again." });
  }
};

/* ---------------- View shapers ---------------- */
function meView(u) {
  const avg = u.ratings && u.ratings.length ? u.ratings.reduce((a, b) => a + b, 0) / u.ratings.length : null;
  return {
    id: u.id, email: u.email, handle: u.handle, name: u.name, suburb: u.suburb, state: u.state || "NSW",
    pickupWeekday: u.pickupWeekday, handoffs: u.handoffs || 0, truckSaved: u.truckSaved || 0,
    trusted: (u.handoffs || 0) >= 3, avgRating: avg,
    platformsConnected: Object.keys(u.platformTokens || {}).filter((k) => u.platformTokens[k]),
    ecoPoints: u.ecoPoints || 0, tier: tierFor(u.ecoPoints || 0),
  };
}
function itemView(it, me, owner) {
  const mine = it.userId === me.id;
  const ownerWd = owner ? owner.pickupWeekday : 3;
  return {
    id: it.id, title: it.title, desc: it.desc, category: it.category,
    media: it.media || [], platforms: it.platforms || [], price: it.price || 0,
    postedAt: it.postedAt, status: it.status,
    pickupAt: nextWeekdayOnOrAfter(it.postedAt + 86400000, ownerWd),
    mine,
    poster: owner ? publicUser(owner) : { handle: "Neighbour", suburb: "", trusted: false },
    claim: it.claim ? { byHandle: it.claim.byHandle, expiresAt: it.claim.expiresAt, byMe: it.claim.byId === me.id } : null,
    flags: (it.flags || []).length,
    observation: underObservation(it),
    flaggedByMe: (it.flags || []).some((f) => f.byId === me.id),
    rating: it.rating,
    history: mine || (it.claim && it.claim.byId === me.id) ? it.history : (it.history || []).filter((h) => !h.alert),
    concierge: mine && it.concierge ? it.concierge : null,
  };
}
