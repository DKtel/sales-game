// Protected: saves users + products (requires ADMIN_TOKEN). Uses dynamic import for ESM.
exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Use POST" };
  }

  const token = event.headers["x-admin-token"];
  if (!token || token !== process.env.ADMIN_TOKEN) {
    return { statusCode: 401, body: "Unauthorized" };
  }

  try {
    const { getStore } = await import("@netlify/blobs"); // ⬅️ místo require()
    const { users = [], products = [] } = JSON.parse(event.body || "{}");
    const store = getStore("seed");
    await store.set("users", users, { metadata: { updatedAt: Date.now() } });
    await store.set("products", products, { metadata: { updatedAt: Date.now() } });
    return { statusCode: 200, headers: { "content-type": "application/json" }, body: JSON.stringify({ ok: true }) };
  } catch (e) {
    return { statusCode: 500, body: `Error: ${e.message}` };
  }
};
