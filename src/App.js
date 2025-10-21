import React, { useEffect, useMemo, useState } from "react";

// ======= Jednoduchý PROTOTYP bez serveru =======
// - Přihlášení přes lokální úložiště (NE bezpečné, jen demo)
// - Zápis prodejů, přepočet bodů podle produktů
// - Žebříček (leaderboard)
// - Admin: správa uživatelů a bodových pravidel + Import/Export CSV/JSON
//
// Poznámka: Pro produkci doporučuji napojit na Supabase/Firebase (auth + databáze).
// ================================================

// --- Lokální klíče ---
const LS_KEYS = {
  USERS: "sales_game_users_v1",
  ENTRIES: "sales_game_entries_v1",
  PRODUCTS: "sales_game_products_v1",
  SESSION: "sales_game_session_v1",
};

// --- Pomocné funkce ---
const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
const todayISO = () => new Date().toISOString().slice(0, 10);

// --- Výchozí data (poprvé naplníme) ---
const DEFAULT_USERS = [
  { id: "u-admin", name: "Admin", email: "admin@firma.cz", role: "admin", password: "admin" },
  { id: "u-oz1", name: "Jan Novák", email: "jan.novak@firma.cz", role: "user", password: "jan" },
  { id: "u-oz2", name: "Petra Veselá", email: "petra.vesela@firma.cz", role: "user", password: "petra" },
];

const DEFAULT_PRODUCTS = [
  { id: "p-tv-basic", name: "TV Basic", basePoints: 5 },
  { id: "p-tv-plus", name: "TV Plus", basePoints: 10 },
  { id: "p-tv-premium", name: "TV Premium", basePoints: 15 },
  { id: "p-internet", name: "Internet", basePoints: 8 },
];

// ===== Komponenta: Přihlášení =====
function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const users = JSON.parse(localStorage.getItem(LS_KEYS.USERS) || "[]");

    // ✨ OPRAVENÁ PODMÍNKA (TRIM + správné uzavírání závorek)
    const u = users.find(
      (x) =>
        x.email.trim().toLowerCase() === email.trim().toLowerCase() &&
        String(x.password).trim() === String(password).trim()
    );

    if (!u) {
      setError("Nesprávný e-mail nebo heslo.");
      return;
    }
    localStorage.setItem(LS_KEYS.SESSION, JSON.stringify({ userId: u.id }));
    onLogin(u);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white shadow-xl rounded-2xl p-6">
        <h1 className="text-2xl font-bold mb-2">Vstup do soutěže</h1>
        <p className="text-gray-500 mb-6">Přihlaste se svým firemním e-mailem.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">E-mail</label>
            <input
              type="email"
              className="w-full border rounded-xl px-3 py-2 focus:outline-none focus:ring"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Heslo</label>
            <input
              type="password"
              className="w-full border rounded-xl px-3 py-2 focus:outline-none focus:ring"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button
            type="submit"
            className="w-full bg-black text-white rounded-xl py-2 font-semibold hover:opacity-90"
          >
            Přihlásit se
          </button>
        </form>
        <p className="text-xs text-gray-400 mt-4">
          Demo účty: admin@firma.cz / admin, jan.novak@firma.cz / jan, petra.vesela@firma.cz / petra
        </p>
      </div>
    </div>
  );
}


// ===== Panel: Zadat prodej =====
function SalesEntry({ user, products, onAddSale }) {
  const [productId, setProductId] = useState(products[0]?.id || "");
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState("");
  const [date, setDate] = useState(todayISO());

  const selected = useMemo(() => products.find((p) => p.id === productId), [products, productId]);
  const computedPoints = useMemo(() => (selected ? selected.basePoints * (Number(quantity) || 0) : 0), [selected, quantity]);

  const submit = (e) => {
    e.preventDefault();
    if (!selected) return;
    onAddSale({ productId, quantity: Number(quantity), date, note, points: computedPoints });
    setQuantity(1);
    setNote("");
  };

  return (
    <div className="bg-white rounded-2xl p-5 shadow">
      <h2 className="text-xl font-semibold mb-4">Zadat prodej</h2>
      <form onSubmit={submit} className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Produkt</label>
          <select
            className="w-full border rounded-xl px-3 py-2"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ( {p.basePoints} b )
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Datum</label>
          <input
            type="date"
            className="w-full border rounded-xl px-3 py-2"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Počet kusů</label>
          <input
            type="number"
            min={1}
            className="w-full border rounded-xl px-3 py-2"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Poznámka</label>
          <input
            type="text"
            placeholder="číslo smlouvy, balíček, …"
            className="w-full border rounded-xl px-3 py-2"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
        <div className="md:col-span-2 flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
          <span className="text-sm text-gray-600">Přidělené body</span>
          <span className="text-lg font-bold">{computedPoints} b</span>
        </div>
        <div className="md:col-span-2">
          <button className="w-full md:w-auto bg-black text-white rounded-xl px-5 py-2 font-semibold hover:opacity-90">
            Uložit prodej
          </button>
        </div>
      </form>
    </div>
  );
}

// ===== Panel: Moje prodeje =====
function MySales({ user, entries, products }) {
  const my = entries.filter((e) => e.userId === user.id).sort((a, b) => b.createdAt - a.createdAt);
  const productMap = Object.fromEntries(products.map((p) => [p.id, p]));

  return (
    <div className="bg-white rounded-2xl p-5 shadow">
      <h2 className="text-xl font-semibold mb-4">Moje prodeje</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-gray-600">
              <th className="p-2">Datum</th>
              <th className="p-2">Produkt</th>
              <th className="p-2">Ks</th>
              <th className="p-2">Poznámka</th>
              <th className="p-2">Body</th>
            </tr>
          </thead>
          <tbody>
            {my.map((e) => (
              <tr key={e.id} className="border-t">
                <td className="p-2">{e.date}</td>
                <td className="p-2">{productMap[e.productId]?.name || e.productId}</td>
                <td className="p-2">{e.quantity}</td>
                <td className="p-2">{e.note}</td>
                <td className="p-2 font-semibold">{e.points}</td>
              </tr>
            ))}
            {my.length === 0 && (
              <tr>
                <td className="p-3 text-gray-500" colSpan={5}>Zatím žádné záznamy.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ===== Import/Export utility funkce =====
function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  const headers = lines.shift().split(',').map(h => h.trim());
  return lines.map(line => {
    const cols = line.split(',');
    const obj = {};
    headers.forEach((h, i) => { obj[h] = (cols[i] || '').trim(); });
    return obj;
  });
}
function downloadJSON(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
function toCSV(arr, headers) {
  const head = headers.join(',');
  const body = arr.map(o => headers.map(h => (o[h] ?? '')).join(',')).join('\n');
  return head + '\n' + body;
}
function downloadCSV(filename, data, headers) {
  const blob = new Blob([toCSV(data, headers)], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ===== Panel: Admin =====
function AdminPanel({ users, setUsers, products, setProducts }) {
  // Správa uživatelů
  const [uName, setUName] = useState("");
  const [uEmail, setUEmail] = useState("");
  const [uPass, setUPass] = useState("");

  // Správa produktů
  const [pName, setPName] = useState("");
  const [pPoints, setPPoints] = useState(10);

  // === Hromadný import UŽIVATELŮ ===
  const importUsersFromFile = async (file) => {
    const text = await file.text();
    const arr = file.name.endsWith(".json") ? JSON.parse(text) : parseCSV(text);
    const cleaned = arr.map((r) => ({
      id: r.id?.trim() || uid(),
      name: (r.name || "").trim(),
      email: (r.email || "").trim().toLowerCase(),
      role: (r.role || "user").trim(),
      password: (r.password || "").trim(),
    })).filter(x => x.name && x.email && x.password);

    setUsers((prev) => {
      const byEmail = new Map(prev.map(u => [u.email.toLowerCase(), u]));
      cleaned.forEach(u => byEmail.set(u.email.toLowerCase(), u));
      const next = Array.from(byEmail.values());
      localStorage.setItem(LS_KEYS.USERS, JSON.stringify(next));
      return next;
    });
  };

  // === Hromadný import PRODUKTŮ ===
  const importProductsFromFile = async (file) => {
    const text = await file.text();
    const arr = file.name.endsWith(".json") ? JSON.parse(text) : parseCSV(text);
    const cleaned = arr.map((r) => ({
      id: r.id?.trim() || uid(),
      name: (r.name || "").trim(),
      basePoints: Number(r.basePoints || r.points || 0) || 0,
    })).filter(x => x.name);

    setProducts((prev) => {
      const byName = new Map(prev.map(p => [p.name.toLowerCase(), p]));
      cleaned.forEach(p => byName.set(p.name.toLowerCase(), p));
      const next = Array.from(byName.values());
      localStorage.setItem(LS_KEYS.PRODUCTS, JSON.stringify(next));
      return next;
    });
  };

  // === Exporty ===
  const exportUsers = () => downloadJSON("users.json", users);
  const exportUsersCSV = () => downloadCSV("users.csv", users, ["id","name","email","role","password"]);
  const exportProducts = () => downloadJSON("products.json", products);
  const exportProductsCSV = () => downloadCSV("products.csv", products, ["id","name","basePoints"]);

  // === Přidání / mazání ===
  const addUser = (e) => {
    e.preventDefault();
    const newUser = { id: uid(), name: uName.trim(), email: uEmail.trim().toLowerCase(), role: "user", password: uPass };
    if (!newUser.name || !newUser.email || !newUser.password) return;
    setUsers((prev) => {
      const next = [...prev, newUser];
      localStorage.setItem(LS_KEYS.USERS, JSON.stringify(next));
      return next;
    });
    setUName(""); setUEmail(""); setUPass("");
  };

  const addProduct = (e) => {
    e.preventDefault();
    const newProduct = { id: uid(), name: pName.trim(), basePoints: Number(pPoints) || 0 };
    if (!newProduct.name) return;
    setProducts((prev) => {
      const next = [...prev, newProduct];
      localStorage.setItem(LS_KEYS.PRODUCTS, JSON.stringify(next));
      return next;
    });
    setPName(""); setPPoints(10);
  };

  const removeUser = (id) => {
    setUsers((prev) => {
      const next = prev.filter((u) => u.id !== id);
      localStorage.setItem(LS_KEYS.USERS, JSON.stringify(next));
      return next;
    });
  };

  const removeProduct = (id) => {
    setProducts((prev) => {
      const next = prev.filter((p) => p.id !== id);
      localStorage.setItem(LS_KEYS.PRODUCTS, JSON.stringify(next));
      return next;
    });
  };

  // === Publikovat na server (Netlify Functions + Blobs) ===
  const publishToServer = async () => {
    const token = prompt("Zadej ADMIN_TOKEN (z Netlify env):");
    if (!token) return;
    const res = await fetch("/.netlify/functions/seed-put", {
      method: "POST",
      headers: { "content-type": "application/json", "x-admin-token": token },
      body: JSON.stringify({ users, products }),
    });
    if (res.ok) alert("Publikováno na server ✅");
    else alert("Chyba při publikování ❌");
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="bg-white rounded-2xl p-5 shadow">
        <h3 className="text-lg font-semibold mb-4">Uživatelé</h3>
        <form onSubmit={addUser} className="grid grid-cols-1 gap-3 mb-4">
          <input className="border rounded-xl px-3 py-2" placeholder="Jméno a příjmení" value={uName} onChange={(e) => setUName(e.target.value)} />
          <input className="border rounded-xl px-3 py-2" placeholder="E-mail" value={uEmail} onChange={(e) => setUEmail(e.target.value)} />
          <input className="border rounded-xl px-3 py-2" placeholder="Dočasné heslo" value={uPass} onChange={(e) => setUPass(e.target.value)} />
          <button className="bg-black text-white rounded-xl px-4 py-2 w-full md:w-auto">Přidat uživatele</button>
        </form>
        <div className="flex flex-wrap gap-2 mb-3">
          <label className="text-sm">Import (CSV/JSON): <input type="file" accept=".csv,.json" onChange={(e)=> e.target.files[0] && importUsersFromFile(e.target.files[0])} /></label>
          <button onClick={exportUsers} className="text-sm underline">Export JSON</button>
          <button onClick={exportUsersCSV} className="text-sm underline">Export CSV</button>
        </div>
        <ul className="divide-y">
          {users.map((u) => (
            <li key={u.id} className="py-2 flex items-center justify-between">
              <div>
                <p className="font-medium">{u.name}</p>
                <p className="text-xs text-gray-500">{u.email} • role: {u.role}</p>
              </div>
              {u.role !== "admin" && (
                <button onClick={() => removeUser(u.id)} className="text-red-600 text-sm hover:underline">Smazat</button>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow">
        <h3 className="text-lg font-semibold mb-4">Produkty & body</h3>
        <form onSubmit={addProduct} className="grid grid-cols-1 gap-3 mb-4">
          <input className="border rounded-xl px-3 py-2" placeholder="Název produktu" value={pName} onChange={(e) => setPName(e.target.value)} />
          <input type="number" className="border rounded-xl px-3 py-2" placeholder="Body za kus" value={pPoints} onChange={(e) => setPPoints(e.target.value)} />
          <button className="bg-black text-white rounded-xl px-4 py-2 w-full md:w-auto">Přidat produkt</button>
        </form>
        <div className="flex flex-wrap gap-2 mb-3">
          <label className="text-sm">Import (CSV/JSON): <input type="file" accept=".csv,.json" onChange={(e)=> e.target.files[0] && importProductsFromFile(e.target.files[0])} /></label>
          <button onClick={exportProducts} className="text-sm underline">Export JSON</button>
          <button onClick={exportProductsCSV} className="text-sm underline">Export CSV</button>
        </div>
        <ul className="divide-y">
          {products.map((p) => (
            <li key={p.id} className="py-2 flex items-center justify-between">
              <div>
                <p className="font-medium">{p.name}</p>
                <p className="text-xs text-gray-500">{p.basePoints} bodů / ks</p>
              </div>
              <button onClick={() => removeProduct(p.id)} className="text-red-600 text-sm hover:underline">Smazat</button>
            </li>
          ))}
        </ul>
      </div>

      <div className="md:col-span-2 flex justify-end">
        <button onClick={publishToServer} className="text-sm bg-black text-white rounded-xl px-4 py-2">
          Publikovat uživatele & produkty na server
        </button>
      </div>
    </div>
  );
}

// ===== Hlavní aplikace =====
export default function SalesGameApp() {
  const [session, setSession] = useState(null);
  const [me, setMe] = useState(null);
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [entries, setEntries] = useState([]);
  const [tab, setTab] = useState("leaderboard");

  // --- Odhlášení uživatele ---
  const handleLogout = () => {
    localStorage.removeItem(LS_KEYS.SESSION);
    setSession(null);
    setMe(null);
  };


  // Init demo dat při prvním spuštění
  useEffect(() => {
    const uRaw = localStorage.getItem(LS_KEYS.USERS);
    const pRaw = localStorage.getItem(LS_KEYS.PRODUCTS);
    const eRaw = localStorage.getItem(LS_KEYS.ENTRIES);
    if (!uRaw) localStorage.setItem(LS_KEYS.USERS, JSON.stringify(DEFAULT_USERS));
    if (!pRaw) localStorage.setItem(LS_KEYS.PRODUCTS, JSON.stringify(DEFAULT_PRODUCTS));
    if (!eRaw) localStorage.setItem(LS_KEYS.ENTRIES, JSON.stringify([]));

    setUsers(JSON.parse(localStorage.getItem(LS_KEYS.USERS) || "[]"));
    setProducts(JSON.parse(localStorage.getItem(LS_KEYS.PRODUCTS) || "[]"));
    setEntries(JSON.parse(localStorage.getItem(LS_KEYS.ENTRIES) || "[]"));

    const sRaw = localStorage.getItem(LS_KEYS.SESSION);
    if (sRaw) setSession(JSON.parse(sRaw));
  }, []);

// Při změně session nastavíme me
useEffect(() => {
  if (!session) { setMe(null); return; }
  const u = users.find((x) => x.id === session.userId) || null;
  setMe(u);
}, [session, users]);

  const addSale = ({ productId, quantity, date, note, points }) => {
    if (!me) return;
    const newEntry = {
      id: uid(),
      userId: me.id,
      productId,
      quantity,
      date,
      note,
      points,
      createdAt: Date.now(),
    };
    setEntries((prev) => {
      const next = [newEntry, ...prev];
      localStorage.setItem(LS_KEYS.ENTRIES, JSON.stringify(next));
      return next;
    });
    setTab("leaderboard");
  };

 if (!me) {
   return <Login onLogin={(u) => setSession({ userId: u.id })} />;
 }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-black text-white flex items-center justify-center font-bold">DKtel</div>
            <h1 className="font-bold">Vánoční soutěž</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">{me.name} ({me.role})</span>
            <button onClick={handleLogout} className="text-sm text-gray-500 hover:underline">Odhlásit</button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-6xl mx-auto px-4 mt-6">
        <div className="flex flex-wrap gap-2 mb-4">
          {[
            { id: "entry", label: "Zadat prodej" },
            { id: "mysales", label: "Moje prodeje" },
            { id: "leaderboard", label: "Žebříček" },
            ...(me.role === "admin" ? [{ id: "admin", label: "Admin" }] : []),
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium border ${
                tab === t.id ? "bg-black text-white" : "bg-white hover:bg-gray-50"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="space-y-6 pb-12">
          {tab === "entry" && (
            <SalesEntry user={me} products={products} onAddSale={addSale} />
          )}

          {tab === "mysales" && (
            <MySales user={me} entries={entries} products={products} />
          )}

         {tab === "leaderboard" && (
  <Leaderboard users={users} entries={entries} currentUserId={me.id} />
)}

          {tab === "admin" && me.role === "admin" && (
            <AdminPanel users={users} setUsers={setUsers} products={products} setProducts={setProducts} />
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center text-xs text-gray-400 py-6">Prototyp bez serveru • pro produkci napojte Auth + DB</footer>
    </div>
  );
}
// ===== Žebříček (Leaderboard) =====
function Leaderboard({ users, entries, currentUserId }) {
  const totals = React.useMemo(() => {
    const map = new Map();
    for (const e of entries) map.set(e.userId, (map.get(e.userId) || 0) + e.points);
    const arr = users.map((u) => ({ user: u, points: map.get(u.id) || 0 }));
    arr.sort((a, b) => b.points - a.points || a.user.name.localeCompare(b.user.name));
    return arr;
  }, [users, entries]);

  return (
    <div className="bg-white rounded-2xl p-5 shadow">
      <h2 className="text-xl font-semibold mb-4">Žebříček</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-gray-600">
              <th className="p-2">#</th>
              <th className="p-2">Obchodník</th>
              <th className="p-2">Body</th>
            </tr>
          </thead>
          <tbody>
            {totals.map((row, idx) => {
              const isMe = row.user.id === currentUserId;
              return (
                <tr
                  key={row.user.id}
                  className={`border-t ${isMe ? "bg-green-50" : ""}`}
                >
                  <td className="p-2 font-semibold">{idx + 1}</td>
                  <td className="p-2">
                    {row.user.name}
                    {isMe && (
                      <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 align-middle">
                      </span>
                    )}
                  </td>
                  <td className="p-2 font-bold">{row.points}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}