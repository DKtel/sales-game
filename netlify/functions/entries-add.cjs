"use strict";

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Use POST" };
  }

  // Bezpečné parsování payloadu
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

    // Vytvoř vlastní ID + doplň serverové sloupce
    const id = `e_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const record = {
      id,
      createdAt: Date.now(),
      ...entry,
    };

    // Ulož jako JSON (bezpečné explicitní serializování)
    await store.set(`entries/${id}.json`, JSON.stringify(record), {
      metadata: { type: "entry", createdAt: new Date().toISOString() },
    });

    return {
      statusCode: 200,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ok: true, id }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: "err: " + (err?.message || String(err)),
    };
  }
};
