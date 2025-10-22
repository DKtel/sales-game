"use strict";

exports.handler = async () => {
  try {
    const { getStore } = await import("@netlify/blobs");

    // ⬇️ explicitní konfigurace přes env proměnné z Netlify
    const store = getStore({
      name: "seed",
      siteID: process.env.BLOBS_SITE_ID,
      token: process.env.BLOBS_TOKEN,
    });

    const users =
      (await store.get("users", { type: "json" })) || [];
    const products =
      (await store.get("products", { type: "json" })) || [];

    return {
      statusCode: 200,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ok: true,
        usersCount: users.length,
        productsCount: products.length,
      }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: String(err?.message || err),
    };
  }
};
