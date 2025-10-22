// netlify/functions/seed-put.mjs
import { getStore } from "@netlify/blobs";

const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

export const handler = async (event) => {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Use POST" };
  if (event.headers["x-admin-token"] !== ADMIN_TOKEN)
    return { statusCode: 401, body: "unauthorized" };

  const { users = [], products = [] } = JSON.parse(event.body || "{}");
  const store = getStore({ name: "seed" });
  await Promise.all([
    store.set("users", users),
    store.set("products", products),
  ]);
  return { statusCode: 200, body: "ok" };
};
