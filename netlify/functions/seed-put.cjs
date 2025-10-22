"use strict";

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Use POST" };
  }

  const admin = event.headers["x-admin-token"];
  if (!admin || admin !== process.env.ADMIN_TOKEN) {
    return { statusCode: 401, body: "Unauthorized" };
  }

  try {
    const { getStore } = await import("@netlify/blobs");
    // ← env proměnné BLOBS_SITE_ID a BLOBS_TOKEN se použijí automaticky
    const store = getStore("seed");

    const { users = [], products = [] } = JSON.parse(event.body || "{}");

    await store.set("users", users, { metadata: { updatedAt: Date.now() } });
    await store.set("products", products, { metadata: { updatedAt: Date.now() } });

    return {
      statusCode: 200,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ok: true })
    };
  } catch (err) {
    return { statusCode: 500, body: `Error: ${String(err?.message || err)}` };
  }
};
