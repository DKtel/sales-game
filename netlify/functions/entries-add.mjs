/* eslint-disable */
import { getStore } from '@netlify/blobs';

const STORE = 'entries';
const KEY = 'entries.json';

function store() {
  const siteID = process.env.BLOBS_SITE_ID || process.env.BLOBS_SITEId;
  const token  = process.env.BLOBS_TOKEN;
  return getStore({ name: STORE, siteID, token });
}

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ ok:false, error:'Method Not Allowed' }) };
  }

  try {
    const { entry } = JSON.parse(event.body || '{}');
    if (!entry) return { statusCode:400, body: JSON.stringify({ ok:false, error:'Missing entry' }) };

    const s = store();
    const current = (await s.get(KEY, { type:'json' })) || [];

    const saved = {
      id: entry.id || `e_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      createdAt: Date.now(),
      ...entry,
    };
    current.unshift(saved);

    await s.set(KEY, JSON.stringify(current), {
      contentType: 'application/json',
      addRandomSuffix: false,     // ← DŮLEŽITÉ: stejný soubor, žádné suffixy
    });

    return {
      statusCode: 200,
      headers: { 'cache-control': 'no-store' },
      body: JSON.stringify({ ok:true, entry:saved }),
    };
  } catch (err) {
    return { statusCode:500, body: JSON.stringify({ ok:false, error:String(err.message||err) }) };
  }
};
