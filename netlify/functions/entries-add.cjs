"use strict";

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Use POST" };
  }

  try {
    const { getStore } = await import("@netlify/blobs");

    // >>> DŮLEŽITÉ: předat siteID + token <<<
    const store = getStore("entries", {
      siteID: process.env.BLOBS_SITE_ID,
      token: process.env.BLOBS_TOKEN,
    });

    const { entry } = JSON.parse(event.body || "{}") || {};
    if (
      !entry ||
      !entry.userId ||
      !entry.productId ||
      !entry.date ||
      typeof entry.points !== "number"
    ) {
      return { statusCode: 400, body: "Invalid entry payload" };
    }

    const now = Date.now();
    const full = {
      id: entry.id || `e-${now}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: now,
      ...entry,
    };

    // načti existující záznamy
    let entries = [];
    try {
      const txt = await store.get("entries");
      if (txt) entries = JSON.parse(txt);
    } catch {}

    // ulož nový záznam na začátek
    entries.unshift(full);

    await store.set("entries", JSON.stringify(entries), {
      metadata: { updatedAt: now },
    });

    return {
      statusCode: 200,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ok: true, saved: full }),
    };
  } catch (err) {
    return { statusCode: 500, body: "err: " + (err.message || String(err)) };
  }
};
