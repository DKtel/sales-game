// Vrátí všechny uložené prodeje
const { getStore } = require('@netlify/blobs');

exports.handler = async () => {
  try {
    const opts = (process.env.BLOBS_SITE_ID && process.env.BLOBS_TOKEN)
      ? { siteID: process.env.BLOBS_SITE_ID, token: process.env.BLOBS_TOKEN }
      : undefined;

    const store = getStore('sales-game-entries', opts);

    // načteme všechny klíče (stránkovaně)
    let cursor;
    const keys = [];
    do {
      const page = await store.list({ prefix: 'entries/', cursor });
      (page.blobs || []).forEach(b => keys.push(b.key));
      cursor = page.cursor;
    } while (cursor);

    // dotáhneme JSONy
    const entries = [];
    for (const key of keys) {
      const obj = await store.getJSON(key).catch(() => null);
      if (obj) entries.push(obj);
    }
    entries.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ok: true, count: entries.length, entries }),
    };
  } catch (e) {
    return { statusCode: 500, body: `err: ${e.message || String(e)}` };
  }
};
