"use strict";

exports.handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: "Use GET" };
  }

  try {
    const { createClient } = await import("@netlify/blobs");

    const siteID = process.env.BLOBS_SITE_ID;
    const token  = process.env.BLOBS_TOKEN;
    if (!siteID || !token) {
      throw new Error("Missing BLOBS_SITE_ID or BLOBS_TOKEN env.");
    }

    const client = createClient({ siteID, token });
    const store  = client.store("entries");

    const raw = await store.get("entries");
    const entries = raw ? JSON.parse(raw) : [];

    return {
      statusCode: 200,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ok: true, entries, count: entries.length })
    };
  } catch (err) {
    return { statusCode: 500, body: "err: " + (err?.message || String(err)) };
  }
};
