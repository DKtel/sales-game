"use strict";

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Use POST" };
  }

  try {
    const { getStore } = await import("@netlify/blobs");

    // ⚠️ explicitně předáme siteID a token z env proměnných
    const store = getStore("entries", {
      siteID: process.env.BLOBS_SITE_ID,
      token: process.env.BLOBS_TOKEN,
    });

    const { entry } = JSON.parse(event.body || "{}");
    if (!entry || !entry.userId || !entry.productId) {
      return { statusCode: 400, body: "Missing entry.userId or entry.productId" };
    }

    const now = Date.now();
    const id = entry.id || `e_${now}_${Math.random().toString(36).slice(2)}`;
    const payload = { ...entry, id, createdAt: now };

    // načti dosavadní pole entries (když neexistuje, ber prázdné)
    let list = [];
    try {
      list = (await store.getJSON("entries")) || [];
    } catch (_) {
      list = [];
    }

    // přidej novou položku na začátek a ulož zpět
    list.unshift(payload);
    await store.setJSON("entries", list, {
      metadata: { updatedAt: new Date().toISOString() },
    });

    return {
      statusCode: 200,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ok: true, id }),
    };
  } catch (err) {
    return { statusCode: 500, body: "err: " + (err?.message || String(err)) };
  }
};
