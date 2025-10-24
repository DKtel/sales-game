// netlify/functions/_blobs.mjs
import { getStore } from '@netlify/blobs';

const STORE_NAME = 'sales-data'; // můžeš libovolně změnit

export function makeStore() {
  const siteID = process.env.BLOBS_SITE_ID;
  const token  = process.env.BLOBS_TOKEN;

  if (!siteID || !token) {
    // jasná, čitelná chyba do logu i odpovědi
    const msg = 'Missing BLOBS_SITE_ID or BLOBS_TOKEN in environment.';
    console.error(msg, { siteID: !!siteID, token: !!token });
    throw new Error(msg);
  }

  // DŮLEŽITÉ: manuální konfigurace přes siteID + token (funkční i u V1/V2)
  const store = getStore({
    name: STORE_NAME,
    siteID,
    token,
    // silná konzistence (ať se to hned projeví v žebříčku)
    consistency: 'strong',
  });

  return store;
}
