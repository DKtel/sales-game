"use strict";

exports.handler = async () => {
  try {
    const { createClient } = await import("@netlify/blobs");
    const siteID = process.env.BLOBS_SITE_ID;
    const token  = process.env.BLOBS_TOKEN;

    const okEnv = Boolean(siteID && token);
    let canList = false;
    let error = null;

    if (okEnv) {
      try {
        const client = createClient({ siteID, token });
        const store  = client.store("entries");
        await store.get("entries"); // jen zkusíme číst
        canList = true;
      } catch (e) {
        error = e.message || String(e);
      }
    }

    return {
      statusCode: 200,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        okEnv,
        siteIdLen: siteID ? siteID.length : 0,
        tokenPreview: token ? token.slice(0, 6) + "…" : null,
        canList,
        error
      })
    };
  } catch (err) {
    return { statusCode: 500, body: "err: " + (err?.message || String(err)) };
  }
};
