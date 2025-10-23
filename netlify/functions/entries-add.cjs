"use strict";

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Use POST" };
  }

  try {
    const { getStore } = await import("@netlify/blobs");

    // ⚠️ RUČNÍ KONFIG BLOBS
    const store = getStore("entries", {
      siteID: process.env.BLOBS_SITE_ID,
      token: process.env.BLOBS_TOKEN,
    });

    const { entry } = JSON.parse(event.body || "{}");
    if (
      !entry ||
      !entry.userId ||
      !entry.productId ||
      !entry.date ||
      typeof entry.points !== "number"
    ) {
      return { statusCode: 400, body: "Missing required fields." };
    }

    const id =
      entry.id ||
      `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

    const raw = await store.get("entries");
    const list = raw ? JSON.parse(raw) : [];

    list.push({
      ...entry,
      id,
      createdAt: Date.now(),
    });

    await store.set("entries", JSON.stringify(list), {
      metadata: { updatedAt: Date.now() },
    });

    return {
      statusCode: 200,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ok: true, count: list.length }),
    };
  } catch (err) {
    return { statusCode: 500, body: "err: " + (err?.message || String(err)) };
  }
};
