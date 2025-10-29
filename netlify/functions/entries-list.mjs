/* eslint-disable */
import { getStore } from '@netlify/blobs';

const STORE = 'entries';
const KEY   = 'entries.json';

function store() {
  const siteID = process.env.BLOBS_SITE_ID || process.env.BLOBS_SITEId;
  const token  = process.env.BLOBS_TOKEN;
  return getStore({ name: STORE, siteID, token });
}

export const handler = async () => {
  try {
    const s = store();
    const entries = (await s.get(KEY, { type:'json' })) || [];
    return {
      statusCode: 200,
      headers: { 'cache-control': 'no-store' }, // žádný edge/browser cache
      body: JSON.stringify({ ok:true, entries }),
    };
  } catch (err) {
    return { statusCode:500, body: JSON.stringify({ ok:false, error:String(err.message||err) }) };
  }
};

