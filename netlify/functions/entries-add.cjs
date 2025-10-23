"use strict";

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Use POST" };
  }

  try {
    const { getStore } = await import("@netlify/blobs");
    const store = getStore("seed", {
      siteID: process.env.BLOBS_SITE_ID,
      token: process.env.BLOBS_TOKEN,
    });

    const { entry = {} } = JSON.parse(event.body || "{}");
    if (!entry.userId || !entry.productId || !entry.date) {
      return { statusCode: 400, body: "Missing fields" };
    }

    const { randomUUID } = await import("node:crypto").catch(() => ({ randomUUID: null }));
    const saved = {
      id: entry.id || (randomUUID ? randomUUID() : (Math.random().toString(36).slice(2) + Date.now().toString(36))),
      createdAt: entry.createdAt || Date.now(),
      userId: entry.userId,
      productId: entry.productId,
      quantity: Number(entry.quantity) || 0,
      date: String(entry.date),
      note: String(entry.note || ""),
      points: Number(entry.points) || 0,
    };

    const current = (await store.get("entries", { type: "json" })) || [];
    const next = Array.isArray(current) ? [saved, ...current] : [saved];
    await store.set("entries", next, { metadata: { updatedAt: Date.now() } });

    return {
      statusCode: 200,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ok: true, entry: saved }),
    };
  } catch (err) {
    return { statusCode: 500, body: "err: " + (err?.message || String(err)) };
  }
};
