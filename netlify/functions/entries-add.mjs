// netlify/functions/entries-add.mjs
import { makeStore } from './_blobs.mjs';

export default async (request) => {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const store = makeStore();

    const body = await request.json().catch(() => ({}));
    const entry = body?.entry;

    if (!entry || !entry.userId || !entry.productId || !entry.points) {
      return new Response('Bad Request: missing fields', { status: 400 });
    }

    // načti dosavadní pole záznamů
    let entries = await store.get('entries.json', { type: 'json' });
    if (!Array.isArray(entries)) entries = [];

    // doplň interní id a čas, pokud nepřišlo
    const now = Date.now();
    const withMeta = {
      id: entry.id || `e_${now}_${Math.random().toString(36).slice(2)}`,
      createdAt: entry.createdAt || now,
      ...entry,
    };

    entries.unshift(withMeta); // přidáme na začátek

    // zapiš zpět – bezpečně jako JSON
    await store.set('entries.json', JSON.stringify(entries), {
      contentType: 'application/json',
    });

    return new Response(JSON.stringify({ ok: true, saved: withMeta }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  } catch (err) {
    console.error('entries-add error:', err);
    return new Response(
      `err: ${err?.message || String(err)}`,
      { status: 500, headers: { 'content-type': 'text/plain; charset=utf-8' } }
    );
  }
};
