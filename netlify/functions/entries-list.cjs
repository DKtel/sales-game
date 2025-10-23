"use strict";

exports.handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: "Use GET" };
  }

  try {
    const { getStore } = await import("@netlify/blobs");

    // ⚠️ RUČNÍ KONFIG BLOBS
    const store = getStore("entries", {
      siteID: process.env.BLOBS_SITE_ID,
      token: process.env.BLOBS_TOKEN,
    });

    const raw = await store.get("entries");
    const entries = raw ? JSON.parse(raw) : [];

    return {
      statusCode: 200,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ok: true, entries, count: entries.length }),
    };
  } catch (err) {
    return { statusCode: 500, body: "err: " + (err?.message || String(err)) };
  }
};
