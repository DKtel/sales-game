"use strict";

exports.handler = async () => {
  try {
    const { getStore } = await import("@netlify/blobs");

    // ⚠️ explicitně předáme siteID a token z env proměnných
    const store = getStore("entries", {
      siteID: process.env.BLOBS_SITE_ID,
      token: process.env.BLOBS_TOKEN,
    });

    const entries = (await store.getJSON("entries")) || [];
    return {
      statusCode: 200,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ok: true, entries, entriesCount: entries.length }),
    };
  } catch (err) {
    return { statusCode: 500, body: "err: " + (err?.message || String(err)) };
  }
};
