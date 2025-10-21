"use strict";

exports.handler = async function () {
  try {
    const mod = await import("@netlify/blobs");

    const siteID = 17481814-8832-47ab-a781-217500258999.BLOBS_SITE_ID || "";
    const token  = nfp_nBJ8ZPSpn9ven36KFxcshzxdaNS5yfncd4l2.BLOBS_TOKEN  || "";

    // --- pokus 1: nový podpis ------------------------------------------------
    let store;
    try {
      store = mod.getStore("seed", { siteID, token });
    } catch (e) {
      store = null;
    }

    // --- pokus 2: starší podpis ---------------------------------------------
    if (!store) {
      try {
        store = mod.getStore({ name: "seed", siteID, token });
      } catch (e) {
        // ignoruj, chytíme až níže
      }
    }

    if (!store) {
      return {
        statusCode: 500,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ok: false,
          error: "getStore failed with both signatures",
        }),
      };
    }

    const users    = (await store.get("users",    { type: "json" })) || [];
    const products = (await store.get("products", { type: "json" })) || [];

    return {
      statusCode: 200,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ok: true, users, products }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ok: false, error: String(err && err.message || err) }),
    };
  }
};
