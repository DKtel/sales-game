import { createClient } from '@netlify/blobs';

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

export default async () => {
  try {
    const siteID = process.env.BLOBS_SITE_ID;
    const token = process.env.BLOBS_TOKEN;

    const client = createClient({ siteID, token });
    const store = client.store('entries');

    // jednoduchý smoke test
    const testKey = `diag-${Date.now()}`;
    await store.setJSON(testKey, { ok: true });
    const back = await store.get(testKey, { type: 'json' });

    return json({
      okEnv: Boolean(siteID && token),
      siteIdLen: siteID?.length || 0,
      tokenPreview: token?.slice(0, 6) + '…',
      wroteAndRead: back?.ok === true,
    });
  } catch (e) {
    return new Response(`err: ${e.message}`, { status: 500 });
  }
};
