// netlify/functions/entries-del.cjs
/* Smaže záznam podle id z Netlify Blobs (store: "sales-game", key: "entries.json").
   Idempotentní: i když položka neexistuje, vrátí ok:true (notFound:true). */

const STORE_NAME = "sales-game";
const ENTRIES_KEY = "entries.json";

const json = (status, obj) => ({
  statusCode: status,
  headers: { "content-type": "application/json; charset=utf-8" },
  body: JSON.stringify(obj),
});

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return json(405, { ok: false, error: "Method Not Allowed" });
    }

    let body = {};
    try {
      body = JSON.parse(event.body || "{}");
    } catch {
      return json(400, { ok: false, error: "Invalid JSON body" });
    }

    const id = String(body.id || "").trim();
    if (!id) return json(400, { ok: false, error: "Missing 'id'" });

    const { createClient } = await import("@netlify/blobs");

    const client = createClient({
      siteID: process.env.BLOBS_SITE_ID,
      token: process.env.BLOBS_TOKEN,
    });

    const store = client.store(STORE_NAME);
    const current =
      (await store.get(ENTRIES_KEY, { type: "json" }).catch(() => null)) || [];

    if (!Array.isArray(current)) {
      return json(500, { ok: false, error: "Entries blob has invalid format" });
    }

    const exists = current.some((e) => e && e.id === id);
    const next = exists ? current.filter((e) => e && e.id !== id) : current;

    if (exists) {
      await store.set(ENTRIES_KEY, JSON.stringify(next, null, 2), {
        contentType: "application/json",
      });
    }

    // Idempotentní chování: i když neexistuje, je to "OK".
    return json(200, { ok: true, deleted: exists, notFound: !exists, remaining: next.length });
  } catch (err) {
    return json(500, { ok: false, error: String(err && err.message || err) });
  }
};
