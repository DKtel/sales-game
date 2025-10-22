// /netlify/functions/seed-get.cjs
exports.handler = async () => {
  try {
    // ESM balíček natahujeme dynamicky z CJS
    const { getStore } = await import("@netlify/blobs");

    // explicitní konfigurace proti chybě „The environment has not been configured…“
    const store = getStore({
      name: "seed",
      siteID: process.env.BLOBS_SITE_ID,
      token: process.env.BLOBS_TOKEN
    });

    const users = (await store.get("users", { type: "json" })) || [];
    const products = (await store.get("products", { type: "json" })) || [];

    return {
      statusCode: 200,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ok: true, usersCount: users.length, productsCount: products.length })
    };
  } catch (e) {
    return { statusCode: 500, body: `err: ${e.message}` };
  }
};
