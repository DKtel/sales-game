"use strict";

exports.handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: "Use GET" };
  }

  // ---- Netlify Blobs config (nutné) ----
  const siteID = (process.env.BLOBS_SITE_ID || "").trim();
  const token  = (process.env.BLOBS_TOKEN   || "").trim();

  if (!siteID || !token) {
    return {
      statusCode: 500,
      body: "Missing BLOBS_SITE_ID / BLOBS_TOKEN env vars",
    };
  }

  try {
    const { getStore } = await import("@netlify/blobs");
    const store = getStore("entries", { siteID, token });

    // Vytáhni všechny blob klíče pod prefixem "entries/"
    const listed = await store.list({ prefix: "entries/" });

    const items = [];
    for (const b of listed.blobs || []) {
      const res = await store.get(b.key);
      const txt = await res.text();
      try {
        items.push(JSON.parse(txt));
      } catch {
        // ignoruj poškozený záznam
      }
    }

    // Seřaď nejnovější nahoře
    items.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    return {
      statusCode: 200,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ok: true, count: items.length, items }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: "err: " + (err?.message || String(err)),
    };
  }
};
