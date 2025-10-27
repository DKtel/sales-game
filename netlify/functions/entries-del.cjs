// netlify/functions/entries-del.cjs
/* Smazání prodejního záznamu podle id z Netlify Blobs.
   - Idempotentní (když záznam není, vrací ok:true, notFound:true).
   - Umí oba tvary uloženého JSONu: [] nebo { entries: [] }.
   - Přidán diagnostický režim: GET ?diag=1 vrátí stav env. */

const STORE_NAME = "sales-game";
const ENTRIES_KEY = "entries.json";

const json = (status, data) => ({
  statusCode: status,
  headers: { "content-type": "application/json; charset=utf-8" },
  body: JSON.stringify(data),
});

exports.handler = async (event) => {
  try {
    // Diagnostika: GET /.netlify/functions/entries-del?diag=1
    if (event.httpMethod === "GET" && event.queryStringParameters?.diag) {
      const okSite = !!process.env.BLOBS_SITE_ID;
      const okToken = !!process.env.BLOBS_TOKEN;
      return json(200, {
        ok: okSite && okToken,
        hasSiteID: okSite,
        siteIDLen: (process.env.BLOBS_SITE_ID || "").length,
        hasToken: okToken,
        tokenLen: (process.env.BLOBS_TOKEN || "").length,
        node: process.version,
      });
    }

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

    // Načti současný obsah – toleruj prázdno i rozbitá data
    let current = await store.get(ENTRIES_KEY, { type: "json" }).catch(() => null);
    let shape = "array"; // "array" | "object"

    if (Array.isArray(current)) {
      // ok
    } else if (current && Array.isArray(current.entries)) {
      shape = "object";
      current = current.entries;
    } else {
      // Nesmysl / prázdno -> ber jako prázdné pole
      current = [];
      shape = "array";
    }

    const existed = current.some((e) => e && e.id === id);
    const filtered = existed ? current.filter((e) => e && e.id !== id) : current;

    // Zapisuj jen pokud se něco změnilo
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
    return json(500, { ok: false, error: String(err && err.message || err) });
  }
};
