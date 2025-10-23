"use strict";

exports.handler = async (event) => {
  // Pomocný diagnostický ping: /.netlify/functions/entries-add?diag=1
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

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Use POST" };
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return { statusCode: 400, body: "Bad JSON" };
  }

  const entry = body.entry || {};
  if (
    !entry.userId ||
    !entry.productId ||
    typeof entry.quantity !== "number" ||
    !entry.date ||
    typeof entry.points !== "number"
  ) {
    return { statusCode: 400, body: "Invalid payload" };
  }

  // ---- Netlify Blobs explicit config (NEZKRACOVAT) ----
  const siteID = String(process.env.BLOBS_SITE_ID || "");
  const token  = String(process.env.BLOBS_TOKEN || "");

  if (!siteID || !token) {
    return { statusCode: 500, body: "Missing BLOBS_SITE_ID / BLOBS_TOKEN env vars" };
  }

  try {
    const mod = await import("@netlify/blobs");
    const store = mod.getStore("entries", { siteID: siteID, token: token });

    const id = `e_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const record = {
      id,
      createdAt: Date.now(),
      userId: String(entry.userId),
      productId: String(entry.productId),
      quantity: Number(entry.quantity),
      date: String(entry.date),
      note: String(entry.note || ""),
      points: Number(entry.points)
    };

    await store.set(`entries/${id}.json`, JSON.stringify(record), {
      metadata: { type: "entry", createdAt: new Date().toISOString() }
    });

    return {
      statusCode: 200,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ok: true, id })
    };
  } catch (err) {
    return { statusCode: 500, body: "err: " + (err?.message || String(err)) };
  }
};
