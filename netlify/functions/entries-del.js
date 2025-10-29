/* eslint-disable */
import { getStore } from '@netlify/blobs';

const STORE = 'entries';
const KEY   = 'entries.json';

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
    const payload = JSON.parse(event.body || '{}');
    const id = String(payload?.id || '').trim();
    if (!id) return { statusCode:400, body: JSON.stringify({ ok:false, error:'Missing id' }) };

    const s = store();
    const current = (await s.get(KEY, { type:'json' })) || [];
    const next = current.filter(e => e.id !== id);

    if (next.length === current.length) {
      return {
        statusCode: 200,
        headers: { 'cache-control': 'no-store' },
        body: JSON.stringify({ ok:true, deleted:false, notFound:true, remaining:current.length }),
      };
    }

    await s.set(KEY, JSON.stringify(next), {
      contentType: 'application/json',
      addRandomSuffix: false,   // přepis stejného souboru
    });

    return {
      statusCode: 200,
      headers: { 'cache-control': 'no-store' },
      body: JSON.stringify({ ok:true, deleted:true, remaining:next.length }),
    };
  } catch (err) {
    return { statusCode:500, body: JSON.stringify({ ok:false, error:String(err.message||err) }) };
  }
};
