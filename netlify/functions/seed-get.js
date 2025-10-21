// ✅ Public: returns users + products from Netlify Blobs
export const handler = async () => {
  try {
    // použij ESM import, ne require()
    const { getStore } = await import("@netlify/blobs");

    // 💡 explicitní konfigurace s ručně zadaným siteID a tokenem
    const store = getStore({
      name: "seed",
      siteID: "17481814-8832-47ab-a781-217500258999", // <-- v uvozovkách
      token: "nfp_nBJ8ZPSpn9ven36KFxcshzxdaNS5yfncd4l2", // <-- v uvozovkách
    });

    const users = (await store.get("users", { type: "json" })) || [];
    const products = (await store.get("products", { type: "json" })) || [];

    return {
      statusCode: 200,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ users, products }),
    };
  } catch (e) {
    return { statusCode: 500, body: `Error: ${e.message}` };
  }
};
