// Public: vrací všechny prodeje z Netlify Blobs
exports.handler = async () => {
  try {
    const { getStore } = await import("@netlify/blobs");
    const store = getStore("seed"); // souborový "bucket" stejně jako pro users/products
    const entries = (await store.get("entries", { type: "json" })) || [];
    return {
      statusCode: 200,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ok: true, entries }),
    };
  } catch (e) {
    return { statusCode: 500, body: `Error: ${e.message}` };
  }
};
