// netlify/functions/entries-del.cjs
/* Smazání záznamu (idempotentní) + diagnostika:
   - GET  ?diag=1 -> vrátí stav env (bez mazání)
   - POST { id }  -> smaže položku s daným id ze souboru entries.json
   - snese oba tvary dat: [] i { entries: [] }
*/

const STORE_NAME = "sales-game";
const ENTRIES_KEY = "entries.json";

const json = (status, data) => ({
  statusCode: status,
  headers: { "content-type": "application/json; charset=utf-8" },
  body: JSON.stringify(data),
});

async function getCreateClient() {
  // Bezpečné získání createClient i v různých module export tvarech
  const m = await import("@netlify/blobs");
  return m.createClient || (m.default && m.default.createClient);
}

exports.handler = async (event) => {
  try {
    // Diagnostika
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

    const createClient = await getCreateClient();
    if (typeof createClient !== "function") {
      return json(500, { ok: false, error: "createClient export not found" });
    }

    const client = createClient({
      siteID: process.env.BLOBS_SITE_ID,
      token: process.env.BLOBS_TOKEN,
    });
    const store = client.store(STORE_NAME);

    // Načti aktuální data
    let current = await store.get(ENTRIES_KEY, { type: "json" }).catch(() => null);
    let shape = "array";
    if (Array.isArray(current)) {
      // ok
    } else if (current && Array.isArray(current.entries)) {
      shape = "object";
      current = current.entries;
    } else {
      current = [];
      shape = "array";
    }

    const existed = current.some((e) => e && e.id === id);
    const filtered = existed ? current.filter((e) => e && e.id !== id) : current;

    // Zápis jen pokud se změnilo
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
