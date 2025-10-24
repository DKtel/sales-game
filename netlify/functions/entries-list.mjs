// netlify/functions/entries-list.mjs
import { makeStore } from './_blobs.mjs';

export default async () => {
  try {
    const store = makeStore();

    // přečteme JSON z klíče entries.json (pokud neexistuje, vrátíme [])
    let entries = await store.get('entries.json', { type: 'json' });
    if (!Array.isArray(entries)) entries = [];

    return new Response(JSON.stringify({ ok: true, entries }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  } catch (err) {
    console.error('entries-list error:', err);
    return new Response(
      `err: ${err?.message || String(err)}`,
      { status: 500, headers: { 'content-type': 'text/plain; charset=utf-8' } }
    );
  }
};
