"use strict";

exports.handler = async () => {
  try {
    const { getStore } = await import("@netlify/blobs");
    const store = getStore("seed", {
      siteID: process.env.BLOBS_SITE_ID,
      token: process.env.BLOBS_TOKEN,
    });

    const entries = (await store.get("entries", { type: "json" })) || [];
    return {
      statusCode: 200,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ok: true, entriesCount: entries.length, entries }),
    };
  } catch (err) {
    return { statusCode: 500, body: "err: " + (err?.message || String(err)) };
  }
};
