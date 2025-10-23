"use strict";

exports.handler = async () => {
  const siteID = String(process.env.BLOBS_SITE_ID || "");
  const token  = String(process.env.BLOBS_TOKEN || "");
  let blobOk = false, reason = "";

  try {
    const mod = await import("@netlify/blobs");
    const store = mod.getStore("entries", { siteID: siteID, token: token });
    // jen lehký read (bez zápisu)
    await store.list({ prefix: "entries/", limit: 1 });
    blobOk = true;
  } catch (e) {
    reason = e?.message || String(e);
  }

  return {
    statusCode: 200,
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      BLOBS_SITE_ID: !!siteID, BLOBS_SITE_ID_len: siteID.length,
      BLOBS_TOKEN: !!token, BLOBS_TOKEN_len: token.length,
      tokenPreview: token ? token.slice(0, 6) + "…" + token.slice(-4) : "",
      node: process.version,
      blobsClientOk: blobOk,
      err: blobOk ? null : reason
    })
  };
};
