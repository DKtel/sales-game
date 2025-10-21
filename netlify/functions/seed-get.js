// CommonJS verze + ESM import uvnitř handleru
exports.handler = async () => {
  try {
    const { getStore } = await import("@netlify/blobs");

    // 🔑 explicitní přihlášení k Blobs
    const store = getStore("seed", {
      siteID: 17481814-8832-47ab-a781-217500258999,  // např. 1748…58999
      token:  nfp_nBJ8ZPSpn9ven36KFxcshzxdaNS5yfncd4l2,    // nfp_…
    });

    const users    = (await store.get("users",    { type: "json" })) || [];
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
