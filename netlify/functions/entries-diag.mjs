// netlify/functions/entries-diag.mjs
import { makeStore } from './_blobs.mjs';

export default async () => {
  try {
    const store = makeStore();
    // jednoduchý ping na blob store
    await store.set('__diag.txt', `ok ${new Date().toISOString()}`);
    const ok = await store.get('__diag.txt', { type: 'text' });

    return new Response(JSON.stringify({
      ok: true,
      hasSiteID: !!process.env.BLOBS_SITE_ID,
      hasToken: !!process.env.BLOBS_TOKEN,
      ping: ok?.trim(),
      node: process.version,
    }), { status: 200, headers: { 'content-type': 'application/json' } });
  } catch (err) {
    return new Response(
      `err: ${err?.message || String(err)}`,
      { status: 500, headers: { 'content-type': 'text/plain; charset=utf-8' } }
    );
  }
};
