// Protected: saves users + products to Netlify Blobs (requires ADMIN_TOKEN)
const { getStore } = require("@netlify/blobs");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Use POST" };
  }
  const token = event.headers["x-admin-token"];
  if (!token || token !== process.env.ADMIN_TOKEN) {
    return { statusCode: 401, body: "Unauthorized" };
  }

  try {
    const { users = [], products = [] } = JSON.parse(event.body || "{}");
    const store = getStore("seed");
    await store.set("users", users, { metadata: { updatedAt: Date.now() } });
    await store.set("products", products, { metadata: { updatedAt: Date.now() } });
    return { statusCode: 200, headers: { "content-type": "application/json" }, body: JSON.stringify({ ok: true }) };
  } catch (e) {
    return { statusCode: 500, body: `Error: ${e.message}` };
  }
};
