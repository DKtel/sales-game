// netlify/functions/env-check.js
exports.handler = async () => {
  return {
    statusCode: 200,
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      BLOBS_SITE_ID: !!process.env.BLOBS_SITE_ID,
      BLOBS_TOKEN: !!process.env.BLOBS_TOKEN,
      ADMIN_TOKEN: !!process.env.ADMIN_TOKEN,
      node: process.version,
    }),
  };
};
