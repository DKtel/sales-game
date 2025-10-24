"use strict";

exports.handler = async (event) => {
  // Pomocná diagnostika: /.netlify/functions/entries-list?diag=1
  if (event.httpMethod === "GET" && (event.queryStringParameters?.diag === "1")) {
    const siteID = String(process.env.BLOBS_SITE_ID || "");
    const token  = String(process.env.BLOBS_TOKEN || "");
    return {
      statusCode: 200,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ok: true,
        hasSiteID: !!siteID, siteIDLen: siteID.length,
        hasToken: !!token, tokenLen: token.length,
        tokenPreview: token ? token.slice(0, 6) + "…" + token.slice(-4) : "",
        node: process.version
      })
    };
  }

  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: "Use GET" };
  }

  const siteID = String(process.env.BLOBS_SITE_ID || "");
  const token  = String(process.env.BLOBS_TOKEN || "");
  if (!siteID || !token) {
    return { statusCode: 500, body: "Missing BLOBS_SITE_ID / BLOBS_TOKEN env vars" };
  }

  try {
    const mod = await import("@netlify/blobs");
    const store = mod.getStore("entries", { siteID: siteID, token: token });

    const listed = await store.list({ prefix: "entries/" });
    const items = [];
    for (const b of listed.blobs || []) {
      const res = await store.get(b.key);
      const txt = await res.text();
      try { items.push(JSON.parse(txt)); } catch { /* ignore */ }
    }
    items.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    return {
      statusCode: 200,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ok: true, count: items.length, items })
    };
  } catch (err) {
    return { statusCode: 500, body: "err: " + (err?.message || String(err)) };
  }
};
