// Rychlá diagnostika Blobs přístupu
const { getStore } = require('@netlify/blobs');

exports.handler = async () => {
  try {
    const okEnv = Boolean(process.env.BLOBS_SITE_ID && process.env.BLOBS_TOKEN);
    const tokenPreview = (process.env.BLOBS_TOKEN || '').slice(0, 6);

    const opts = okEnv ? { siteID: process.env.BLOBS_SITE_ID, token: process.env.BLOBS_TOKEN } : undefined;
    const store = getStore('sales-game-entries', opts);

    let canList = false;
    let err = null;
    try {
      const page = await store.list({ prefix: 'entries/', limit: 1 });
      canList = Array.isArray(page?.blobs);
    } catch (e) {
      err = e.message || String(e);
    }

    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        okEnv,
        siteIdLen: (process.env.BLOBS_SITE_ID || '').length,
        tokenPreview,
        canList,
        err,
      }),
    };
  } catch (e) {
    return { statusCode: 500, body: `err: ${e.message || String(e)}` };
  }
};
