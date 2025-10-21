// ✅ seed-get.js — public funkce pro čtení dat ze serveru

export const handler = async () => {
  try {
    // místo require() použijeme ESM import (Netlify to vyžaduje)
    const { getStore } = await import("@netlify/blobs");

    // 💡 explicitní konfigurace s proměnnými z Netlify Environment
    const store = getStore({
      name: "seed",
      siteID: 17481814-8832-47ab-a781-217500258999,
      token: nfp_nBJ8ZPSpn9ven36KFxcshzxdaNS5yfncd4l2,
    });

    // čtení dat z úložiště
    const users = (await store.get("users", { type: "json" })) || [];
    const products = (await store.get("products", { type: "json" })) || [];

    // vrácení JSONu
    return {
      statusCode: 200,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ users, products }),
    };
  } catch (e) {
    return { statusCode: 500, body: `Error: ${e.message}` };
  }
};
