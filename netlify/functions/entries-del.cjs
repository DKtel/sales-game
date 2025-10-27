/* Smazání prodejního záznamu z Netlify Blobs.
   - GET  ?diag=1           -> diagnostika
   - POST { id: "..." }     -> smaže záznam, vrátí aktualizovaný seznam
*/
const blobsMod = require("@netlify/blobs");

const STORE_NAME = "sales-game";
const ENTRIES_KEY = "entries.json";

const json = (status, data) => ({
  statusCode: status,
  headers: {
    "content-type": "application/json; charset=utf-8",
    // aby se nikdy nevracel z cache
    "cache-control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  },
  body: JSON.stringify(data),
});

// univerzální získání store (podporuje různé exporty balíčku)
function getStoreSafe() {
  const hasGetStore =
    typeof blobsMod.getStore === "function" ||
    (blobsMod.default && typeof blobsMod.default.getStore === "function");

  const hasCreateClient =
    typeof blobsMod.createClient === "function" ||
    (blobsMod.default && typeof blobsMod.default.createClient === "function");

  if (hasGetStore) {
    const getStore =
      blobsMod.getStore || (blobsMod.default && blobsMod.default.getStore);
    return getStore({
      name: STORE_NAME,
      siteID: process.env.BLOBS_SITE_ID,
      token: process.env.BLOBS_TOKEN,
    });
  }

  if (hasCreateClient) {
    const createClient =
      blobsMod.createClient ||
      (blobsMod.default && blobsMod.default.createClient);
    const client = createClient({
      siteID: process.env.BLOBS_SITE_ID,
      token: process.env.BLOBS_TOKEN,
    });
    return client.store(STORE_NAME);
  }

  return null;
}

exports.handler = async (event) => {
  try {
    // Diagnostika
    if (event.httpMethod === "GET" && event.queryStringParameters?.diag) {
      return json(200, {
        ok:
          !!process.env.BLOBS_SITE_ID &&
          !!process.env.BLOBS_TOKEN &&
          !!getStoreSafe(),
        hasSiteID: !!process.env.BLOBS_SITE_ID,
        siteIDLen: (process.env.BLOBS_SITE_ID || "").length,
        hasToken: !!process.env.BLOBS_TOKEN,
        tokenLen: (process.env.BLOBS_TOKEN || "").length,
        hasGetStore:
          typeof blobsMod.getStore === "function" ||
          (blobsMod.default && typeof blobsMod.default.getStore === "function"),
        hasCreateClient:
          typeof blobsMod.createClient === "function" ||
          (blobsMod.default &&
            typeof blobsMod.default.createClient === "function"),
        node: process.version,
      });
    }

    if (event.httpMethod !== "POST") {
      return json(405, { ok: false, error: "Method Not Allowed" });
    }

    // Vstup
    let body = {};
    try {
      body = JSON.parse(event.body || "{}");
    } catch {
      return json(400, { ok: false, error: "Invalid JSON body" });
    }
    const id = String(body.id || "").trim();
    if (!id) return json(400, { ok: false, error: "Missing 'id'" });

    const store = getStoreSafe();
    if (!store) return json(500, { ok: false, error: "No blobs client available" });

    // Načti entries (podpora [] i {entries:[]})
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

    // Ulož, pouze pokud se něco změnilo
    if (existed) {
      const out = shape === "object" ? { entries: after } : after;
      await store.set(ENTRIES_KEY, JSON.stringify(out, null, 2), {
        contentType: "application/json",
      });
    }

    // pošleme rovnou nový seznam (ve tvaru "entries": [...])
    return json(200, {
      ok: true,
      deleted: existed,
      notFound: !existed,
      entries: after,
    });
  } catch (err) {
    return json(500, { ok: false, error: String(err?.message || err) });
  }
};
