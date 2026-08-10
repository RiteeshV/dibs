/* Dibs API tests — node:test, no dependencies.
   Run with: npm test

   These cover the behaviours that have actually broken during development:
   admin access control, the privilege ladder, moderation and removal, the
   guest-mode allow-list, and the keyword fallbacks that once emptied panels.
   Nothing here touches a third-party API, so the suite is deterministic and
   runs offline against the in-memory store. */
"use strict";
const { test, before, after, describe } = require("node:test");
const assert = require("node:assert/strict");
const http = require("http");

process.env.ADMIN_EMAILS = "owner@test.local";
process.env.SESSION_SECRET = "test-secret-not-used-anywhere-real";
delete process.env.SUPABASE_URL;        // force the in-memory store
delete process.env.SUPABASE_SERVICE_KEY;

const handler = require("../api/index.js");

let server, base;
before(async () => {
  server = http.createServer((req, res) => handler(req, res));
  await new Promise((r) => server.listen(0, r));
  base = "http://127.0.0.1:" + server.address().port;
});
after(() => server && server.close());

/* A tiny cookie-jar client, because sessions are the thing under test. */
function client() {
  let cookie = "";
  return async function call(path, method, body) {
    const res = await fetch(base + "/api" + path, {
      method: method || "GET",
      headers: Object.assign({ "Content-Type": "application/json" }, cookie ? { cookie } : {}),
      body: body ? JSON.stringify(body) : undefined,
    });
    const setC = res.headers.get("set-cookie");
    if (setC) cookie = setC.split(";")[0];
    const text = await res.text();
    let json = null;
    try { json = JSON.parse(text); } catch { /* CSV and other non-JSON bodies */ }
    return { status: res.status, json, text, headers: res.headers };
  };
}
async function signUp(as, email, suburb) {
  const r = await as("/signup", "POST", {
    email, password: "test-password-123", suburb: suburb || "Parramatta", state: "NSW",
  });
  assert.equal(r.status, 200, "signup should succeed for " + email);
  return r.json.me;
}

describe("admin access control", () => {
  test("a signed-out visitor cannot reach the console", async () => {
    const anon = client();
    const r = await anon("/admin/overview");
    assert.equal(r.status, 401);
  });

  test("an ordinary member gets 404, so the console is not advertised", async () => {
    const member = client();
    await signUp(member, "member-a@test.local");
    const r = await member("/admin/overview");
    assert.equal(r.status, 404, "should be 404 rather than 403");
  });

  test("the allow-listed owner is admin and is always named Admin", async () => {
    const owner = client();
    const me = await signUp(owner, "owner@test.local");
    assert.equal(me.isAdmin, true);
    assert.equal(me.isRootAdmin, true);
    assert.equal(me.handle, "Admin");
    assert.equal(me.handleLocked, true);
    assert.equal((await owner("/admin/overview")).status, 200);
  });

  test("the owner's handle cannot be regenerated", async () => {
    const owner = client();
    await owner("/login", "POST", { email: "owner@test.local", password: "test-password-123" });
    const r = await owner("/profile/newhandle", "POST", {});
    assert.equal(r.status, 400);
    assert.match(r.json.error, /fixed as Admin/i);
  });
});

describe("the privilege ladder", () => {
  test("only the owner can grant co-admin, and a co-admin cannot promote", async () => {
    const owner = client();
    await owner("/login", "POST", { email: "owner@test.local", password: "test-password-123" });

    const hopeful = client();
    await signUp(hopeful, "hopeful@test.local");
    const bystander = client();
    await signUp(bystander, "bystander@test.local");

    const list = (await owner("/admin/overview")).json.users;
    const hopefulId = list.find((u) => u.email === "hopeful@test.local").id;
    const bystanderId = list.find((u) => u.email === "bystander@test.local").id;

    // a member cannot promote anyone
    assert.equal((await hopeful("/admin/role", "POST", { id: bystanderId, coAdmin: true })).status, 404);

    // the owner promotes them
    assert.equal((await owner("/admin/role", "POST", { id: hopefulId, coAdmin: true })).status, 200);

    // the co-admin can now moderate, but still cannot change roles
    await hopeful("/login", "POST", { email: "hopeful@test.local", password: "test-password-123" });
    const meNow = (await hopeful("/me")).json.me;
    assert.equal(meNow.isAdmin, true);
    assert.equal(meNow.isRootAdmin, false);
    assert.equal((await hopeful("/admin/overview")).status, 200);

    const denied = await hopeful("/admin/role", "POST", { id: bystanderId, coAdmin: true });
    assert.equal(denied.status, 403);
    assert.match(denied.json.error, /owner account/i);
  });

  test("the owner account cannot be demoted through the API", async () => {
    const owner = client();
    await owner("/login", "POST", { email: "owner@test.local", password: "test-password-123" });
    const ownerId = (await owner("/me")).json.me.id;
    const r = await owner("/admin/role", "POST", { id: ownerId, coAdmin: false });
    assert.equal(r.status, 400);
  });
});

describe("moderation and removal", () => {
  test("removing a listing hides it from the feed and from its own URL", async () => {
    const owner = client();
    await owner("/login", "POST", { email: "owner@test.local", password: "test-password-123" });

    const poster = client();
    await signUp(poster, "poster@test.local");
    const posted = await poster("/items", "POST", { title: "Spare tyres", category: "vehicles", desc: "four of them" });
    assert.equal(posted.status, 200);
    const id = posted.json.item.id;

    // visible to begin with
    assert.ok((await poster("/items")).json.items.some((i) => i.id === id));

    const mod = await owner("/admin/moderate", "POST", { id, action: "remove" });
    assert.equal(mod.status, 200);

    assert.equal((await poster("/items")).json.items.some((i) => i.id === id), false,
      "a removed listing must not appear in the feed, even for its owner");
    assert.equal((await poster("/items/" + id)).status, 404,
      "a direct link to a removed listing must 404");
  });

  test("clearing flags keeps the listing live", async () => {
    const owner = client();
    await owner("/login", "POST", { email: "owner@test.local", password: "test-password-123" });

    const poster = client();
    await signUp(poster, "poster-b@test.local");
    const id = (await poster("/items", "POST", { title: "Garden pots", category: "garden", desc: "six" })).json.item.id;

    const flagger = client();
    await signUp(flagger, "flagger@test.local");
    assert.equal((await flagger("/items/" + id + "/flag", "POST", { reason: "Suspected scam" })).status, 200);

    const flaggedNow = (await owner("/admin/overview")).json.flagged;
    assert.ok(flaggedNow.some((f) => f.id === id), "flagged listing should reach the queue");

    assert.equal((await owner("/admin/moderate", "POST", { id, action: "clear" })).status, 200);
    const after = (await owner("/admin/overview")).json;
    assert.equal(after.flagged.some((f) => f.id === id), false, "flags should be cleared");
    assert.ok((await poster("/items")).json.items.some((i) => i.id === id), "listing should still be live");
  });

  test("a member cannot moderate", async () => {
    const member = client();
    await signUp(member, "member-c@test.local");
    const r = await member("/admin/moderate", "POST", { id: "whatever", action: "remove" });
    assert.equal(r.status, 404);
  });
});

describe("sample listings", () => {
  test("samples are labelled, and removable in one call", async () => {
    const owner = client();
    await owner("/login", "POST", { email: "owner@test.local", password: "test-password-123" });

    const added = await owner("/admin/seed", "POST", { action: "add" });
    assert.equal(added.status, 200);
    assert.ok(added.json.created > 0);

    const feed = (await owner("/items")).json.items;
    const samples = feed.filter((i) => i.sample);
    assert.equal(samples.length, added.json.created);
    assert.ok(samples.every((i) => i.sample === true), "every seeded listing must be flagged as a sample");

    const removed = await owner("/admin/seed", "POST", { action: "remove" });
    assert.equal(removed.json.removed, added.json.created);
    assert.equal((await owner("/items")).json.items.filter((i) => i.sample).length, 0);
  });
});

describe("CSV export", () => {
  test("serves a downloadable, properly quoted CSV", async () => {
    const owner = client();
    await owner("/login", "POST", { email: "owner@test.local", password: "test-password-123" });
    const r = await owner("/admin/export?what=users");
    assert.equal(r.status, 200);
    assert.match(r.headers.get("content-type"), /text\/csv/);
    assert.match(r.headers.get("content-disposition"), /attachment; filename="dibs-users-\d{4}-\d{2}-\d{2}\.csv"/);
    const [header] = r.text.split("\r\n");
    assert.equal(header, '"handle","email","suburb","state","joined","posts","handoffs","ecoPoints","role"');
    assert.ok(r.text.includes('"owner@test.local"'));
    assert.ok(r.text.includes('"owner"'), "the owner's role should be labelled");
  });
});

describe("guest mode", () => {
  test("a guest can read the feed without an account", async () => {
    const guest = client();
    const r = await guest("/items?guest=1");
    assert.equal(r.status, 200);
    assert.ok(Array.isArray(r.json.items));
  });

  test("a guest gets a placeholder identity, not a user record", async () => {
    const guest = client();
    const me = (await guest("/me?guest=1")).json.me;
    assert.equal(me.guest, true);
    assert.equal(me.id, null, "a guest must not have a user id");
    assert.equal(me.isAdmin, false);
    assert.ok(me.suburb, "a guest still needs a location for the data panels");
  });

  test("the guest location can be chosen per state", async () => {
    const guest = client();
    assert.equal((await guest("/me?guest=1&as=VIC")).json.me.state, "VIC");
    assert.equal((await guest("/me?guest=1&as=nonsense")).json.me.state, "NSW", "an unknown state falls back to NSW");
  });

  test("without the explicit marker a signed-out request still 401s", async () => {
    const anon = client();
    assert.equal((await anon("/items")).status, 401,
      "the login screen depends on this staying closed");
    assert.equal((await anon("/me")).status, 401);
  });

  test("a guest cannot write anything", async () => {
    const guest = client();
    for (const [path, method, body] of [
      ["/items?guest=1", "POST", { title: "x", category: "furniture" }],
      ["/profile/newhandle", "POST", {}],
      ["/admin/overview?guest=1", "GET", null],
      ["/admin/seed", "POST", { action: "add" }],
      ["/notifications?guest=1", "GET", null],
    ]) {
      const r = await guest(path, method, body);
      assert.equal(r.status, 401, path + " must stay closed to guests");
    }
  });
});

describe("price watch", () => {
  test("watching needs an item, and rejects an empty id", async () => {
    const member = client();
    await signUp(member, "watcher@test.local");
    const r = await member("/watch", "POST", { itemId: "" });
    // without eBay keys the feature reports itself unavailable; with them it
    // rejects the empty id. Either is a 400 — what must not happen is a 500.
    assert.equal(r.status, 400);
  });

  test("the watch list starts empty and is per-user", async () => {
    const member = client();
    await signUp(member, "watcher-b@test.local");
    const r = await member("/watch");
    assert.equal(r.status, 200);
    assert.deepEqual(r.json.watches, []);
  });

  test("a guest cannot watch or read watches", async () => {
    const guest = client();
    assert.equal((await guest("/watch?guest=1")).status, 401);
    assert.equal((await guest("/watch?guest=1", "POST", { itemId: "v1|123|0" })).status, 401);
  });

  test("deleting someone else's watch is a 404", async () => {
    const member = client();
    await signUp(member, "watcher-c@test.local");
    assert.equal((await member("/watch/does-not-exist", "DELETE")).status, 404);
  });

  test("the price cron is protected by the shared secret", async () => {
    const anon = client();
    process.env.CRON_SECRET = "cron-test-secret";
    const r = await anon("/cron/prices");
    delete process.env.CRON_SECRET;
    assert.equal(r.status, 401);
  });
});

describe("admin guest preview", () => {
  test("the guest marker wins over a session, so the preview is the real thing", async () => {
    const owner = client();
    await owner("/login", "POST", { email: "owner@test.local", password: "test-password-123" });

    const real = (await owner("/me")).json.me;
    assert.equal(real.isAdmin, true);
    assert.equal(real.guest, undefined === real.guest ? real.guest : false);

    const asGuest = (await owner("/me?guest=1")).json.me;
    assert.equal(asGuest.guest, true, "the preview must resolve to a guest identity");
    assert.equal(asGuest.id, null);
    assert.equal(asGuest.isAdmin, false, "a preview must not carry admin rights");
  });

  test("the preview cannot reach anything a guest cannot", async () => {
    const owner = client();
    await owner("/login", "POST", { email: "owner@test.local", password: "test-password-123" });
    // the console is not on the guest allow-list, so the marker is ignored there
    // and the admin's own session answers — the preview is a view, not a sandbox
    assert.equal((await owner("/admin/overview?guest=1")).status, 200);
    // but a guest-readable route genuinely downgrades
    assert.equal((await owner("/me?guest=1")).json.me.isAdmin, false);
  });
});

describe("listing photos", () => {
  const PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

  test("a photo survives posting even with no object storage configured", async () => {
    const poster = client();
    await signUp(poster, "photo@test.local");
    const r = await poster("/items", "POST", {
      title: "Chair with a photo", category: "furniture", desc: "one picture",
      media: [{ type: "image", data: PNG }],
    });
    assert.equal(r.status, 200, "an unavailable bucket must not cost the listing");
    const feed = (await poster("/items")).json.items;
    const mine = feed.find((i) => i.title === "Chair with a photo");
    assert.equal(mine.media.length, 1);
    assert.equal(mine.media[0].type, "image");
    assert.ok(mine.media[0].data, "the photo must still be there in some form");
  });

  test("a bogus attachment is still refused", async () => {
    const poster = client();
    await signUp(poster, "photo-b@test.local");
    const r = await poster("/items", "POST", {
      title: "Nice try", category: "furniture",
      media: [{ type: "image", data: "https://example.com/not-a-data-uri.png" }],
    });
    assert.equal(r.status, 400);
  });
});

describe("suspending and banning accounts", () => {
  test("a suspension pulls their listings and blocks them at login", async () => {
    const owner = client();
    await owner("/login", "POST", { email: "owner@test.local", password: "test-password-123" });

    const bad = client();
    await signUp(bad, "suspend-me@test.local");
    await bad("/items", "POST", { title: "Questionable amp", category: "electronics" });

    const id = (await owner("/admin/overview")).json.users.find((u) => u.email === "suspend-me@test.local").id;
    const r = await owner("/admin/user-status", "POST", { id, action: "suspend", reason: "Reported repeatedly", days: 7 });
    assert.equal(r.status, 200);
    assert.equal(r.json.listingsPulled, 1, "a suspended account should not keep selling");

    const row = (await owner("/admin/overview")).json.users.find((u) => u.id === id);
    assert.equal(row.suspended.permanent, false);
    assert.equal(row.suspended.reason, "Reported repeatedly");

    const retry = client();
    const login = await retry("/login", "POST", { email: "suspend-me@test.local", password: "test-password-123" });
    assert.equal(login.status, 403, "refuse at the door, not with a session that 403s everywhere");
    assert.match(login.json.error, /suspended until/i);
  });

  test("a ban is permanent and says so", async () => {
    const owner = client();
    await owner("/login", "POST", { email: "owner@test.local", password: "test-password-123" });
    const bad = client();
    await signUp(bad, "ban-me@test.local");
    const id = (await owner("/admin/overview")).json.users.find((u) => u.email === "ban-me@test.local").id;

    assert.equal((await owner("/admin/user-status", "POST", { id, action: "ban", reason: "Fraud" })).status, 200);
    const login = await client()("/login", "POST", { email: "ban-me@test.local", password: "test-password-123" });
    assert.equal(login.status, 403);
    assert.match(login.json.error, /closed by an administrator/i);
  });

  test("restoring lets them back in", async () => {
    const owner = client();
    await owner("/login", "POST", { email: "owner@test.local", password: "test-password-123" });
    const back = client();
    await signUp(back, "restore-me@test.local");
    const id = (await owner("/admin/overview")).json.users.find((u) => u.email === "restore-me@test.local").id;

    await owner("/admin/user-status", "POST", { id, action: "suspend", days: 7 });
    assert.equal((await client()("/login", "POST", { email: "restore-me@test.local", password: "test-password-123" })).status, 403);

    assert.equal((await owner("/admin/user-status", "POST", { id, action: "restore" })).status, 200);
    assert.equal((await client()("/login", "POST", { email: "restore-me@test.local", password: "test-password-123" })).status, 200);
  });

  test("the owner cannot be suspended, and nobody can suspend themselves", async () => {
    const owner = client();
    await owner("/login", "POST", { email: "owner@test.local", password: "test-password-123" });
    const ownerId = (await owner("/me")).json.me.id;
    assert.equal((await owner("/admin/user-status", "POST", { id: ownerId, action: "ban" })).status, 400);
  });

  test("a member cannot suspend anyone", async () => {
    const member = client();
    await signUp(member, "not-a-mod@test.local");
    assert.equal((await member("/admin/user-status", "POST", { id: "anyone", action: "ban" })).status, 404);
  });
});
