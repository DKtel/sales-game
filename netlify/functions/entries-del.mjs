// Smazání jednoho prodeje podle id z Netlify Blobs
// DŮLEŽITÉ: STORE_NAME a ENTRIES_KEY musí být všude stejné jako v entries-add/list

import { createClient } from '@netlify/blobs';

const STORE_NAME = 'sales-game';     // stejné jako u add/list
const ENTRIES_KEY = 'entries.json';  // stejné jako u add/list

export default async function handler(req) {
  try {
    // pouze POST
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ ok: false, error: 'Method Not Allowed' }), {
        status: 405,
        headers: { 'content-type': 'application/json' },
      });
    }

    // env (na Netlify jsou dostupné automaticky; lokálně přes .env)
    const siteID = process.env.BLOBS_SITE_ID;
    const token  = process.env.BLOBS_TOKEN;

    const client = createClient({ siteID, token });
    const store  = client.store(STORE_NAME);

    // načti tělo (id záznamu)
    const body = await req.json().catch(() => ({}));
    const id   = String(body?.id || '').trim();

    if (!id) {
      return new Response(JSON.stringify({ ok: false, error: 'Missing id' }), {
        status: 400,
        headers: { 'content-type': 'application/json' },
      });
    }

    // načtení existujících záznamů
    let entries = await store.get(ENTRIES_KEY, { type: 'json' }).catch(() => null);
    if (!Array.isArray(entries)) entries = [];

    const beforeLen = entries.length;
    const next = entries.filter(e => e && e.id !== id);

    const deleted = next.length !== beforeLen;
    const notFound = !deleted;

    // zapiš zpět do stejného klíče
    await store.set(
      ENTRIES_KEY,
      JSON.stringify(next, null, 2),
      { contentType: 'application/json' }
    );

    // diagnostika (volitelně ?diag=1)
    const url = new URL(req.url);
    const diag = url.searchParams.get('diag');
    if (diag) {
      return new Response(JSON.stringify({
        ok: true,
        hasSiteID: !!siteID, siteIDLen: siteID?.length || 0,
        hasToken:  !!token,  tokenLen:  token?.length  || 0,
        deleted, notFound, remaining: next.length
      }), { headers: { 'content-type': 'application/json' }});
    }

    return new Response(JSON.stringify({
      ok: true,
      deleted,
      notFound,
      id,
      remaining: next.length
    }), { headers: { 'content-type': 'application/json' }});
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: String(err?.message || err) }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
}
