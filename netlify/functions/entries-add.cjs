// Public: přidá jeden prodej (append do pole v Blobs)
exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { getStore } = await import("@netlify/blobs");
    const store = getStore("seed");

    const body = JSON.parse(event.body || "{}");
    const entry = body.entry || {};

    // základní validace (co potřebujeme pro správný záznam)
    if (
      !entry.userId ||
      !entry.productId ||
      !Number(entry.quantity) ||
      !entry.date ||
      typeof entry.points !== "number"
    ) {
      return { statusCode: 400, body: "Invalid entry payload" };
    }

    const now = Date.now();
    const serverEntry = {
      id: entry.id || `${now}-${Math.random().toString(36).slice(2)}`,
      userId: entry.userId,
      productId: entry.productId,
      quantity: Number(entry.quantity),
      date: entry.date,
      note: entry.note || "",
      points: Number(entry.points) || 0,
      createdAt: now,
    };

    const entries = (await store.get("entries", { type: "json" })) || [];
    entries.unshift(serverEntry);
    await store.setJSON("entries", entries);

    return {
      statusCode: 200,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ok: true, entry: serverEntry, count: entries.length }),
    };
  } catch (e) {
    return { statusCode: 500, body: `Error: ${e.message}` };
  }
};
