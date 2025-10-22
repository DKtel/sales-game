"use strict";

exports.handler = async (event) => {
  // povol jen POST
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Use POST" };
  }

  // jednoduché “admin heslo” přes hlavičku
  const admin = event.headers["x-admin-token"];
  if (!admin || admin !== process.env.ADMIN_TOKEN) {
    return { statusCode: 401, body: "Unauthorized" };
  }

  try {
    const { getStore } = await import("@netlify/blobs");

    // ⬇️ explicitní konfigurace přes env proměnné z Netlify
    const store = getStore({
      name: "seed",
      siteID: process.env.BLOBS_SITE_ID,
      token: process.env.BLOBS_TOKEN,
    });

    const { users = [], products = [] } = JSON.parse(event.body || "{}");

    await store.set("users", users, { type: "json" });
    await store.set("products", products, { type: "json" });

    return {
      statusCode: 200,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ok: true,
        users: users.length,
        products: products.length,
      }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: String(err?.message || err),
    };
  }
};
