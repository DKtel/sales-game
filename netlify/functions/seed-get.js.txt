// Public: returns users + products from Netlify Blobs (ESM via dynamic import)
exports.handler = async () => {
  try {
    const { getStore } = await import("@netlify/blobs"); // ⬅️ místo require()
    const store = getStore("seed");
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
