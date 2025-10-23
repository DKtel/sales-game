// Uloží jeden prodej jako JSON blob
const { getStore } = require('@netlify/blobs');

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: 'Use POST' };
    }

    const body = JSON.parse(event.body || '{}');
    const entry = body.entry || {};

    // rychlá validace
    if (!entry.userId || !entry.productId || !entry.date) {
      return { statusCode: 400, body: 'Missing required fields' };
    }

    // Fallback: když Netlify neprovdí klienta, použijeme siteID + token z env
    const opts = (process.env.BLOBS_SITE_ID && process.env.BLOBS_TOKEN)
      ? { siteID: process.env.BLOBS_SITE_ID, token: process.env.BLOBS_TOKEN }
      : undefined;

    const store = getStore('sales-game-entries', opts);

    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const key = `entries/${id}.json`;

    const doc = { id, createdAt: Date.now(), ...entry };
    await store.setJSON(key, doc);

    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ok: true, id }),
    };
  } catch (e) {
    return { statusCode: 500, body: `err: ${e.message || String(e)}` };
  }
};
