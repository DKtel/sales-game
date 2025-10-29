// netlify/functions/entries-del.js
/* eslint-disable */
import { getStore } from '@netlify/blobs';

const STORE_NAME = 'entries';
const KEY = 'entries.json';

function makeStore() {
  // Kompatibilně – některé buildy očekávají `siteID` s velkým D
  const siteID = process.env.BLOBS_SITE_ID || process.env.BLOBS_SITEId || process.env.BLOBS_SITEId;
  const token = process.env.BLOBS_TOKEN;
  return getStore({ name: STORE_NAME, siteID, token });
}

export const handler = async (event) => {
  try {
    const store = makeStore();

    // Diagnostika: GET /.netlify/functions/entries-del?diag=1
    if (event.httpMethod === 'GET') {
      if (event.queryStringParameters?.diag) {
        const okEnv = Boolean(process.env.BLOBS_SITE_ID && process.env.BLOBS_TOKEN);
        return {
          statusCode: 200,
          body: JSON.stringify({
            ok: true,
            hasSiteID: !!process.env.BLOBS_SITE_ID,
            siteIDLen: (process.env.BLOBS_SITE_ID || '').length,
            hasToken: !!process.env.BLOBS_TOKEN,
            tokenLen: (process.env.BLOBS_TOKEN || '').length,
            okEnv,
          }),
        };
      }
      return { statusCode: 405, body: JSON.stringify({ ok: false, error: 'Method Not Allowed' }) };
    }

    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: JSON.stringify({ ok: false, error: 'Method Not Allowed' }) };
    }

    const payload = JSON.parse(event.body || '{}');
    const id = String(payload?.id || '').trim();
    if (!id) {
      return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'Missing id' }) };
    }

    // Načti existující entries
    const current = (await store.get(KEY, { type: 'json' })) || [];
    const idx = current.findIndex((e) => e.id === id);

    if (idx === -1) {
      return {
        statusCode: 200,
        body: JSON.stringify({ ok: true, deleted: false, notFound: true, remaining: current.length }),
      };
    }

    current.splice(idx, 1);
    await store.set(KEY, JSON.stringify(current), {
      contentType: 'application/json',
      // důležité: nechceme suffix
      addRandomSuffix: false,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, deleted: true, remaining: current.length }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, error: String(err.message || err) }),
    };
  }
};
