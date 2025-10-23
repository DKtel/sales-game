"use strict";

exports.handler = async () => {
  const SITE = process.env.BLOBS_SITE_ID || "";
  const TOKEN = process.env.BLOBS_TOKEN || "";
  if (!SITE || !TOKEN) {
    return {
      statusCode: 500,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ok: false,
        error: "Missing Netlify Blobs credentials",
        BLOBS_SITE_ID: !!SITE,
        BLOBS_TOKEN: !!TOKEN,
      }),
    };
  }

  try {
    const { getStore } = await import("@netlify/blobs");
    const store = getStore("seed", { siteID: SITE, token: TOKEN });

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
