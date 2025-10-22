"use strict";

exports.handler = async (event) => {
  // pouze POST
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Use POST" };
  }

  // jednoduché „admin“ ověření
  const admin = event.headers["x-admin-token"];
  if (!admin || admin !== process.env.ADMIN_TOKEN) {
    return { statusCode: 401, body: "Unauthorized" };
  }

  try {
    const { getStore } = await import("@netlify/blobs");

    // ⚠️ použij env proměnné – nic nedávej natvrdo
    const store = getStore({
      name: "seed",
      siteID: process.env.BLOBS_SITE_ID,
      token: process.env.BLOBS_TOKEN,
    });

    const { users = [], products = [] } = JSON.parse(event.body || "{}");

    // ✅ Ukládej jako JSON (ne prostý .set s objektem)
    await store.setJSON("users", users, { metadata: { updatedAt: Date.now() } });
    await store.setJSON("products", products, {
      metadata: { updatedAt: Date.now() },
    });

    return {
      statusCode: 200,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ok: true,
        saved: { users: users.length, products: products.length },
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
