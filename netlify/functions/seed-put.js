"use strict";

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Use POST" };
  }

  const admin = event.headers["x-admin-token"];
  if (!admin || admin !== process.env.ADMIN_TOKEN) {
    return { statusCode: 401, body: "Unauthorized" };
  }

  try {
    const { getStore } = await import("@netlify/blobs");

    const store = getStore("seed", {
      siteID: 17481814-8832-47ab-a781-217500258999,
      token: nfp_nBJ8ZPSpn9ven36KFxcshzxdaNS5yfncd4l2,
    });

    const { users = [], products = [] } = JSON.parse(event.body || "{}");
    await store.set("users", users, { metadata: { updatedAt: Date.now() } });
    await store.set("products", products, { metadata: { updatedAt: Date.now() } });

    return {
      statusCode: 200,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ok: true }),
    };
  } catch (err) {
    return { statusCode: 500, body: "Error: " + (err?.message || String(err)) };
  }
};
