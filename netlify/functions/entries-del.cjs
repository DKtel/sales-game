/* Smazání záznamu z Netlify Blobs.
   - GET  ?diag=1  -> diagnostika prostředí
   - POST { id }   -> smaže záznam (idempotentně)
*/
const blobsMod = require("@netlify/blobs");

const createClient =
  blobsMod.createClient || (blobsMod.default && blobsMod.default.createClient);

const STORE_NAME = "sales-game";
const ENTRIES_KEY = "entries.json";

const json = (status, data) => ({
  statusCode: status,
  headers: { "content-type": "application/json; charset=utf-8" },
  body: JSON.stringify(data),
});

exports.handler = async (event) => {
  try {
    // Diagnostika
    if (event.httpMethod === "GET" && event.queryStringParameters?.diag) {
      return json(200, {
        ok:
          !!process.env.BLOBS_SITE_ID &&
          !!process.env.BLOBS_TOKEN &&
          !!createClient,
        hasSiteID: !!process.env.BLOBS_SITE_ID,
        siteIDLen: (process.env.BLOBS_SITE_ID || "").length,
        hasToken: !!process.env.BLOBS_TOKEN,
        tokenLen: (process.env.BLOBS_TOKEN || "").length,
        hasCreateClient: !!createClient,
        node: process.version,
      });
    }

    if (event.httpMethod !== "POST") {
      return json(405, { ok: false, error: "Method Not Allowed" });
    }

    if (!createClient) {
      return json(500, { ok: false, error: "createClient export not found" });
    }

    // vstup
    let body = {};
    try {
      body = JSON.parse(event.body || "{}");
    } catch {
      return json(400, { ok: false, error: "Invalid JSON body" });
    }
    const id = String(body.id || "").trim();
    if (!id) return json(400, { ok: false, error: "Missing 'id'" });

    // klient + store
    const client = createClient({
      siteID: process.env.BLOBS_SITE_ID,
      token: process.env.BLOBS_TOKEN,
    });
    const store = client.store(STORE_NAME);

    // načti existující záznamy (podpora obou tvarů: [] nebo {entries:[]})
    let data = await store.get(ENTRIES_KEY, { type: "json" }).catch(() => null);
    let shape = "array";
    if (Array.isArray(data)) {
      // ok
    } else if (data && Array.isArray(data.entries)) {
      shape = "object";
      data = data.entries;
    } else {
      data = [];
    }

    const existed = data.some((e) => e && e.id === id);
    const after = existed ? data.filter((e) => e && e.id !== id) : data;

    if (existed) {
      const out = shape === "object" ? { entries: after } : after;
      await store.set(ENTRIES_KEY, JSON.stringify(out, null, 2), {
        contentType: "application/json",
      });
    }

    return json(200, {
      ok: true,
      deleted: existed,
      notFound: !existed,
      remaining: after.length,
    });
  } catch (err) {
    return json(500, { ok: false, error: String(err?.message || err) });
  }
};
