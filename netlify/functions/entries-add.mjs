import { createClient } from '@netlify/blobs';

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

export default async (req) => {
  try {
    if (req.method !== 'POST') return json({ err: 'Use POST' }, 405);

    const { entry } = await req.json().catch(() => ({}));
    if (!entry) return json({ err: 'Missing body.entry' }, 400);

    const client = createClient({
      siteID: process.env.BLOBS_SITE_ID,
      token: process.env.BLOBS_TOKEN,
    });
    const store = client.store('entries');

    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const doc = { ...entry, id, createdAt: Date.now() };

    await store.setJSON(id, doc);
    return json({ ok: true, id });
  } catch (e) {
    return new Response(`err: ${e.message}`, { status: 500 });
  }
};
