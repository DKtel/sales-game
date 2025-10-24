import { createClient } from '@netlify/blobs';

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

export default async () => {
  try {
    const client = createClient({
      siteID: process.env.BLOBS_SITE_ID,
      token: process.env.BLOBS_TOKEN,
    });
    const store = client.store('entries');

    const { blobs } = await store.list(); // [{ key, ... }]
    const items = await Promise.all(
      blobs.map(b => store.get(b.key, { type: 'json' }))
    );

    return json({ ok: true, count: items.length, items });
  } catch (e) {
    return new Response(`err: ${e.message}`, { status: 500 });
  }
};
