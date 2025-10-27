// netlify/functions/entries-del.cjs

// Konfigurace – musí sedět s entries-add / entries-list
const STORE_NAME = "sales-game";
const ENTRIES_KEY = "entries.json";

// Pomocná odpověď
const json = (statusCode, obj) => ({
  statusCode,
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
    if (!id) {
      return json(400, { ok: false, error: "Missing 'id' in body" });
    }

    // @netlify/blobs je ESM – v CJS použijeme dynamický import
    const { createClient } = await import("@netlify/blobs");

    const client = createClient({
      siteID: process.env.BLOBS_SITE_ID,
      token: process.env.BLOBS_TOKEN,
    });

    const store = client.store(STORE_NAME);

    // Načti stávající pole záznamů
    const current =
      (await store.get(ENTRIES_KEY, { type: "json" }).catch(() => null)) || [];
    if (!Array.isArray(current)) {
      return json(500, { ok: false, error: "Entries blob has invalid format" });
    }

    // Pokud záznam neexistuje, vrátíme 404 (není to fatální, ale dává smysl)
    const exists = current.some((e) => e && e.id === id);
    if (!exists) {
      return json(404, { ok: false, error: "Entry not found" });
    }

    const next = current.filter((e) => e && e.id !== id);

    await store.set(ENTRIES_KEY, JSON.stringify(next, null, 2), {
      contentType: "application/json",
    });

    return json(200, { ok: true, deleted: id, remaining: next.length });
  } catch (err) {
    return json(500, { ok: false, error: String(err && err.message || err) });
  }
};
