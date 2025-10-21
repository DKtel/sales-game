"use strict";

exports.handler = async function () {
  try {
    const mod = await import("@netlify/blobs");
    const getStore = mod.getStore;

    const siteID = 17481814-8832-47ab-a781-217500258999 || "";
    const token = nfp_nBJ8ZPSpn9ven36KFxcshzxdaNS5yfncd4l2 || "";

    const store = getStore("seed", { siteID: siteID, token: token });

    const usersVal = await store.get("users", { type: "json" });
    const productsVal = await store.get("products", { type: "json" });

    const users = usersVal || [];
    const products = productsVal || [];

    return {
      statusCode: 200,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ok: true, users: users, products: products }),
    };
  } catch (e) {
    const msg = (e && e.message) ? e.message : String(e);
    return {
      statusCode: 500,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ok: false, error: msg }),
    };
  }
};
