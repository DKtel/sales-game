export const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Use POST" };
  }

  // stejný header, jak používá tvoje appka (x-admin-token)
  const adminHeader = event.headers["x-admin-token"];
  if (!adminHeader || adminHeader !== process.env.ADMIN_TOKEN) {
    return { statusCode: 401, body: "Unauthorized" };
  }

  try {
    const { getStore } = await import("@netlify/blobs");

    // ✅ opět správný podpis
    const store = getStore("seed", {
      siteID: 17481814-8832-47ab-a781-217500258999,
      token:  nfp_nBJ8ZPSpn9ven36KFxcshzxdaNS5yfncd4l2,
    });

    const { users = [], products = [] } = JSON.parse(event.body || "{}");
    await store.set("users", users, { metadata: { updatedAt: Date.now() } });
    await store.set("products", products, { metadata: { updatedAt: Date.now() } });

    return {
      statusCode: 200,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ok: true }),
    };
  } catch (e) {
    return { statusCode: 500, body: `Error: ${e.message}` };
  }
};
