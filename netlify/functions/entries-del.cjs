/* Smazání záznamu z Netlify Blobs.
   - GET  ?diag=1  -> diagnostika env
   - POST { id }   -> smaže záznam
*/
const { createClient } = require("@netlify/blobs");

const STORE_NAME = "sales-game";
const ENTRIES_KEY = "entries.json";

const json = (status, data) => ({
  statusCode: status,
  headers: { "content-type": "application/json; charset=utf-8" },
  body: JSON.stringify(data),
});

exports.handler = async (event) => {
  try {
    // Diagnostika prostředí
    if (event.httpMethod === "GET" && event.queryStringParameters?.diag) {
      const hasSiteID = !!process.env.BLOBS_SITE_ID;
      const hasToken = !!process.env.BLOBS_TOKEN;
      return json(200, {
        ok: hasSiteID && hasToken,
        hasSiteID,
        siteIDLen: (process.env.BLOBS_SITE_ID || "").length,
        hasToken,
        tokenLen: (process.env.BLOBS_TOKEN || "").length,
        node: process.version,
      });
    }

    if (event.httpMethod !== "POST") {
      return json(405, { ok: false, error: "Method Not Allowed" });
    }

    let body = {};
    try { body = JSON.parse(event.body || "{}"); }
    catch { return json(400, { ok: false, error: "Invalid JSON body" }); }

    const id = String(body.id || "").trim();
    if (!id) return json(400, { ok: false, error: "Missing 'id'" });

    // Netlify Blobs klient (stejně jako u add/list)
    const client = createClient({
      siteID: process.env.BLOBS_SITE_ID,
      token: process.env.BLOBS_TOKEN,
    });
    const store = client.store(STORE_NAME);

    // Načti stávající data
    let data = await store.get(ENTRIES_KEY, { type: "json" }).catch(() => null);
    let shape = "array";
    if (Array.isArray(data)) {
      // OK
    } else if (data && Array.isArray(data.entries)) {
      shape = "object";
      data = data.entries;
    } else {
      data = [];
    }

    const existed = data.some((e) => e && e.id === id);
    const filtered = existed ? data.filter((e) => e && e.id !== id) : data;

    // Zapiš jen když se něco mění
    if (existed) {
      const out = shape === "object" ? { entries: filtered } : filtered;
      await store.set(ENTRIES_KEY, JSON.stringify(out, null, 2), {
        contentType: "application/json",
      });
    }

    return json(200, {
      ok: true,
      deleted: existed,
      notFound: !existed,
      remaining: filtered.length,
    });
  } catch (err) {
    return json(500, { ok: false, error: String(err?.message || err) });
  }
};
