"use strict";

exports.handler = async () => {
  try {
    const { getStore } = await import("@netlify/blobs");

    const store = getStore({
      name: "seed",
      siteID: process.env.BLOBS_SITE_ID,
      token: process.env.BLOBS_TOKEN,
    });

    // ✅ Čti jako JSON (bez vlastního JSON.parse)
    const users =
      (await store.get("users", { type: "json" })) ??
      []; // případně await store.getJSON("users")
    const products =
      (await store.get("products", { type: "json" })) ?? [];

    return {
      statusCode: 200,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ok: true,
        usersCount: Array.isArray(users) ? users.length : 0,
        productsCount: Array.isArray(products) ? products.length : 0,
        users,
        products,
      }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { "content-type": "text/plain" },
      body: `Error: ${err?.message || String(err)}`,
    };
  }
};
