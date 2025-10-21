// ✅ seed-put.js — admin funkce pro zápis dat do serveru

export const handler = async (event) => {
  try {
    const { getStore } = await import("@netlify/blobs");

    // 💡 explicitní konfigurace
    const store = getStore({
      name: "seed",
      siteID: 17481814-8832-47ab-a781-217500258999,
      token: nfp_nBJ8ZPSpn9ven36KFxcshzxdaNS5yfncd4l2,
    });

    // kontrola tokenu od admina
    const auth = event.headers.authorization || "";
    const adminToken = process.env.ADMIN_TOKEN;
    if (auth !== `Bearer ${adminToken}`) {
      return { statusCode: 401, body: "Unauthorized" };
    }

    const { users, products } = JSON.parse(event.body);

    await store.set("users", users);
    await store.set("products", products);

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (e) {
    return { statusCode: 500, body: `Error: ${e.message}` };
  }
};
