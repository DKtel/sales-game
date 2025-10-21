"use strict";

exports.handler = async () => {
  try {
    const { getStore } = await import("@netlify/blobs");

    // přihlášení do Blobs – hodnoty bere z Netlify env
    const store = getStore("seed", {
      siteID: 17481814-8832-47ab-a781-217500258999,
      token: nfp_nBJ8ZPSpn9ven36KFxcshzxdaNS5yfncd4l2,
    });

    const users =
      (await store.get("users", { type: "json" })) || [];
    const products =
      (await store.get("products", { type: "json" })) || [];

    return {"use strict";

exports.handler = async () => {
  // === lehká diagnostika prostředí ===
  const diag = {
    node: process.version,
    has_SITE_ID: !!process.env.BLOBS_SITE_ID,
    siteID_len: (process.env.BLOBS_SITE_ID || "").length,
    has_TOKEN: !!process.env.BLOBS_TOKEN,
    token_len: (process.env.BLOBS_TOKEN || "").length,
  };

  try {
    const { getStore } = await import("@netlify/blobs");

    // zkuste vytvořit store (když tady spadne, uvidíme chybu níže)
    const store = getStore("seed", {
      siteID: process.env.BLOBS_SITE_ID,
      token: process.env.BLOBS_TOKEN,
    });

    // Zkusíme obě čtení paralelně (když key neexistuje, vrací null)
    const [users, products] = await Promise.all([
      store.get("users", { type: "json" }),
      store.get("products", { type: "json" }),
    ]);

    return {
      statusCode: 200,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ok: true,
        diag,
        users: users || [],
        products: products || [],
      }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ok: false,
        diag,
        error: err?.message || String(err),
        stack: err?.stack || null,
      }),
    };
  }
};

      statusCode: 200,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ users, products }),
    };
  } catch (err) {
    return { statusCode: 500, body: "Error: " + (err?.message || String(err)) };
  }
};
