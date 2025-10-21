"use strict";

exports.handler = async () => {
  try {
    const { getStore } = await import("@netlify/blobs");

    // přihlášení do Blobs – hodnoty bere z Netlify env
    const store = getStore("seed", {
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
      body: JSON.stringify({ users, products }),
    };
  } catch (err) {
    return { statusCode: 500, body: "Error: " + (err?.message || String(err)) };
  }
};
