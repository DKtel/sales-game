"use strict";

exports.handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: "Use GET" };
  }

  try {
    const { getStore } = await import("@netlify/blobs");

    // >>> DŮLEŽITÉ: předat siteID + token <<<
    const store = getStore("entries", {
      siteID: process.env.BLOBS_SITE_ID,
      token: process.env.BLOBS_TOKEN,
    });

    let entries = [];
    try {
      const txt = await store.get("entries");
      if (txt) entries = JSON.parse(txt);
    } catch {}

    const q = event.queryStringParameters || {};
    let list = entries;
    if (q.userId) list = list.filter((e) => e.userId === q.userId);

    list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    return {
      statusCode: 200,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ok: true, count: list.length, entries: list }),
    };
  } catch (err) {
    return { statusCode: 500, body: "err: " + (err.message || String(err)) };
  }
};
