/* eslint-disable */
import React, { useEffect, useMemo, useState } from "react";

/* =================== KONSTANTY & POMOCNÉ FUNKCE =================== */
const LS_KEYS = {
  USERS: "sales_game_users_v1",
  ENTRIES: "sales_game_entries_v1",
  PRODUCTS: "sales_game_products_v1",
  SESSION: "sales_game_session_v1",
};

const uid = () =>
  Math.random().toString(36).slice(2) + Date.now().toString(36);
const todayISO = () => new Date().toISOString().slice(0, 10);

const DEFAULT_USERS = [
  {
    id: "u-admin",
    name: "Admin",
    email: "michal.horsky@dktel.cz",
    role: "admin",
    password: "myTRI2020",
  },
];

const DEFAULT_PRODUCTS = [
  { id: "p-tv-basic", name: "TV Basic", basePoints: 5 },
  { id: "p-tv-plus", name: "TV Plus", basePoints: 10 },
  { id: "p-tv-premium", name: "TV Premium", basePoints: 15 },
  { id: "p-internet", name: "Internet", basePoints: 8 },
];

/** Nastavení obsahu záložky Pravidla a odměny */
const RULES_CONFIG = {
  title: "Pravidla soutěže",
  period: "1. 11. – 31. 12. 2025",
  intro:
    "Cílem soutěže je v měsících listopad a prosinec nasbírat co nejvíce bodů za prodej hlavních služeb uvedených v záložce Zadat prodej.",
  // nejprve výhry
  rewardsTitle: "Odměny",
  rewards: [
    "1. místo – Poukaz 10 000 Kč",
    "2. místo – Poukaz 5 000 Kč",
    "3. místo – Poukaz 2 000 Kč",
    "4. místo – Dárkový balíček",
    "5. místo – Dárkový poukaz",
  ],
  // hlavní soutěž (vlastní sekce)
  grandPrize: {
    title: "Hlavní soutěž – zájezd za 50 000 Kč",
    // <- přesně tento text se zobrazí hned pod nadpisem hlavní soutěže
    intro:
      "Cílem soutěže je v měsících listopad a prosinec nasbírat co nejvíce bodů za prodej hlavních služeb uvedených v záložce Zadat prodej.",
    bulletPoints: [
      "Do hlavní soutěže jsou zařazeni všichni OZ, kteří splní obecná Pravidla soutěže v části níže.",
      "Losování hlavní ceny proběhne na lednovém setkání za přítomnosti soutěžících.",
      "Výherce hlavní ceny musí být osobně přítomen při losování.",
      "Hlavní cena je nepřenosná a nelze ji směnit za hotovost.",
    ],
    imageUrl: "/odměna_50k.JPG",
  },
  // obecná pravidla (jdou až za hlavní soutěž)
  rules: [
    "Vyhodnocení soutěže bude vycházet z dokončených objednávek (GA). Výsledky v záložce Žebříček jsou pouze orientační.",
    "Vyhodnocení soutěže proběhne na lednovém setkání.",
    "Výhercem jakékoli ceny se může stát pouze ten, kdo bude osobně přítomen na lednovém setkání.",
    "OZ musí splnit svůj osobní plán v DS plnění na minimálně 80 % v průměru za listopad a prosinec.",
    "Pokud je OZ ve výpovědní lhůtě nebo podá výpověď v průběhu listopadu, prosince či ledna, soutěže se neúčastní.",
    "OZ nesmí v průběhu soutěže porušit manuál, v opačném případě bude ze soutěže vyřazen.",
    "Pokud OZ nebude využívat tuto webovou stránku k zapisování svých prodejů, bude ze soutěže vyřazen.",
    "Při shodě bodů rozhoduje větší plnění osobního plánu v DS plnění.",
  ],
};

/* ------------------- API helpers (serverové funkce) ------------------- */
const api = {
  getSeed: async () => {
    try {
      const r = await fetch("/.netlify/functions/seed-get");
      if (!r.ok) return { users: [], products: [] };
      const d = await r.json().catch(() => ({}));
      return {
        users: Array.isArray(d.users) ? d.users : [],
        products: Array.isArray(d.products) ? d.products : [],
      };
    } catch {
      return { users: [], products: [] };
    }
  },
  listEntries: async () => {
    try {
      const r = await fetch(
        `/.netlify/functions/entries-list?ts=${Date.now()}`,
        { cache: "no-store", headers: { pragma: "no-cache" } }
      );
      if (!r.ok) return [];
      const d = await r.json().catch(() => ({}));
      return Array.isArray(d.entries) ? d.entries : [];
    } catch {
      return [];
    }
  },
  addEntry: async (entry) => {
    const r = await fetch("/.netlify/functions/entries-add", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ entry }),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok || !d.ok) throw new Error(d.error || `HTTP ${r.status}`);
    return d.entry;
  },
  delEntry: async (id) => {
    const r = await fetch("/.netlify/functions/entries-del", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok || !d.ok) throw new Error(d.error || `HTTP ${r.status}`);
    return d;
  },
};

/* =================== LOGIN =================== */
function Login({ onLogin, usersFromApp = [] }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const findMatch = (list) =>
    list.find(
      (x) =>
        x.email?.trim().toLowerCase() === email.trim().toLowerCase() &&
        String(x.password ?? "").trim() === String(password).trim()
    );

  const handleSubmit = async (e) => {
    e.preventDefault();

    let users =
      usersFromApp.length
        ? usersFromApp
        : JSON.parse(localStorage.getItem(LS_KEYS.USERS) || "[]");

    let u = findMatch(users);

    if (!u) {
      try {
        const { users: srvUsers } = await api.getSeed();
        if (srvUsers?.length) {
          localStorage.setItem(LS_KEYS.USERS, JSON.stringify(srvUsers));
          u = findMatch(srvUsers);
        }
      } catch {}
    }

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
        <p className="text-gray-500 mb-6">
          Přihlaste se svým firemním e-mailem.
        </p>
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
      </div>
    </div>
  );
}

/* =================== ZADÁNÍ PRODEJE =================== */
function SalesEntry({ user, products, onAddSale }) {
  const [productId, setProductId] = useState(products[0]?.id || "");
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState("");
  const [date, setDate] = useState(todayISO());

  useEffect(() => {
    if (!productId && products[0]?.id) setProductId(products[0].id);
  }, [products]);

  const selected = useMemo(
    () => products.find((p) => p.id === productId),
    [products, productId]
  );
  const computedPoints = useMemo(
    () => (selected ? selected.basePoints * (Number(quantity) || 0) : 0),
    [selected, quantity]
  );

  const submit = (e) => {
    e.preventDefault();
    if (!selected) return;
    onAddSale({
      productId,
      quantity: Number(quantity),
      date,
      note,
      points: computedPoints,
    });
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

/* =================== MOJE PRODEJE =================== */
function MySales({ user, entries, products, onDeleteSale }) {
  const my = entries
    .filter((e) => e.userId === user.id)
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
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
              <th className="p-2">Akce</th>
            </tr>
          </thead>
          <tbody>
            {my.map((e) => (
              <tr key={e.id} className="border-t">
                <td className="p-2">{e.date}</td>
                <td className="p-2">
                  {productMap[e.productId]?.name || e.productId}
                </td>
                <td className="p-2">{e.quantity}</td>
                <td className="p-2">{e.note}</td>
                <td className="p-2 font-semibold">{e.points}</td>
                <td className="p-2">
                  <button
                    onClick={() => onDeleteSale(e.id)}
                    className="text-red-600 hover:underline"
                  >
                    Smazat
                  </button>
                </td>
              </tr>
            ))}
            {my.length === 0 && (
              <tr>
                <td className="p-3 text-gray-500" colSpan={6}>
                  Zatím žádné záznamy.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* =================== IMPORT/EXPORT UTILITY =================== */
function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  const headers = lines.shift().split(",").map((h) => h.trim());
  return lines.map((line) => {
    const cols = line.split(",");
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = (cols[i] || "").trim();
    });
    return obj;
  });
}
function downloadJSON(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
function toCSV(arr, headers) {
  const head = headers.join(",");
  const body = arr
    .map((o) => headers.map((h) => (o[h] ?? "")).join(","))
    .join("\n");
  return head + "\n" + body;
}
function downloadCSV(filename, data, headers) {
  const blob = new Blob([toCSV(data, headers)], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/* =================== ADMIN PANEL =================== */
function AdminPanel({ users, setUsers, products, setProducts }) {
  const [uName, setUName] = useState("");
  const [uEmail, setUEmail] = useState("");
  const [uPass, setUPass] = useState("");

  const [pName, setPName] = useState("");
  const [pPoints, setPPoints] = useState(10);

  const [seedBusy, setSeedBusy] = useState(false);

  const importUsersFromFile = async (file) => {
    const text = await file.text();
    const arr = file.name.endsWith(".json") ? JSON.parse(text) : parseCSV(text);
    const cleaned = arr
      .map((r) => ({
        id: r.id?.trim() || uid(),
        name: (r.name || "").trim(),
        email: (r.email || "").trim().toLowerCase(),
        role: (r.role || "user").trim(),
        password: (r.password || "").trim(),
      }))
      .filter((x) => x.name && x.email && x.password);

    setUsers((prev) => {
      const byEmail = new Map(prev.map((u) => [u.email.toLowerCase(), u]));
      cleaned.forEach((u) => byEmail.set(u.email.toLowerCase(), u));
      const next = Array.from(byEmail.values());
      localStorage.setItem(LS_KEYS.USERS, JSON.stringify(next));
      return next;
    });
  };

  const importProductsFromFile = async (file) => {
    const text = await file.text();
    const arr = file.name.endsWith(".json") ? JSON.parse(text) : parseCSV(text);
    const cleaned = arr
      .map((r) => ({
        id: r.id?.trim() || uid(),
        name: (r.name || "").trim(),
        basePoints: Number(r.basePoints || r.points || 0) || 0,
      }))
      .filter((x) => x.name);

    setProducts((prev) => {
      const byName = new Map(prev.map((p) => [p.name.toLowerCase(), p]));
      cleaned.forEach((p) => byName.set(p.name.toLowerCase(), p));
      const next = Array.from(byName.values());
      localStorage.setItem(LS_KEYS.PRODUCTS, JSON.stringify(next));
      return next;
    });
  };

  const exportUsers = () => downloadJSON("users.json", users);
  const exportUsersCSV = () =>
    downloadCSV("users.csv", users, ["id", "name", "email", "role", "password"]);
  const exportProducts = () => downloadJSON("products.json", products);
  const exportProductsCSV = () =>
    downloadCSV("products.csv", products, ["id", "name", "basePoints"]);

  const addUser = (e) => {
    e.preventDefault();
    const newUser = {
      id: uid(),
      name: uName.trim(),
      email: uEmail.trim().toLowerCase(),
      role: "user",
      password: uPass,
    };
    if (!newUser.name || !newUser.email || !newUser.password) return;
    setUsers((prev) => {
      const next = [...prev, newUser];
      localStorage.setItem(LS_KEYS.USERS, JSON.stringify(next));
      return next;
    });
    setUName("");
    setUEmail("");
    setUPass("");
  };

  const addProduct = (e) => {
    e.preventDefault();
    const newProduct = {
      id: uid(),
      name: pName.trim(),
      basePoints: Number(pPoints) || 0,
    };
    if (!newProduct.name) return;
    setProducts((prev) => {
      const next = [...prev, newProduct];
      localStorage.setItem(LS_KEYS.PRODUCTS, JSON.stringify(next));
      return next;
    });
    setPName("");
    setPPoints(10);
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

  const fetchFromServer = async () => {
    setSeedBusy(true);
    try {
      const { users: srvUsers, products: srvProducts } = await api.getSeed();

      if (srvUsers.length || srvProducts.length) {
        localStorage.setItem(LS_KEYS.USERS, JSON.stringify(srvUsers));
        localStorage.setItem(LS_KEYS.PRODUCTS, JSON.stringify(srvProducts));
        setUsers(srvUsers);
        setProducts(srvProducts);
      }

      alert(
        `Načteno ze serveru ✅\nUživatelé: ${srvUsers.length}\nProdukty: ${srvProducts.length}`
      );
    } catch (err) {
      alert(`Chyba při načítání ze serveru ❌\n${String(err.message || err)}`);
    } finally {
      setSeedBusy(false);
    }
  };

  const publishToServer = async () => {
    const token = prompt("Zadej ADMIN_TOKEN (z Netlify env):");
    if (!token) return;

    setSeedBusy(true);
    try {
      const res = await fetch("/.netlify/functions/seed-put", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-admin-token": token,
        },
        body: JSON.stringify({ users, products }),
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status}\n${txt}`);
      }

      await fetchFromServer();
    } catch (err) {
      alert(`Chyba při publikování ❌\n${String(err.message || err)}`);
    } finally {
      setSeedBusy(false);
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Uživatelé */}
      <div className="bg-white rounded-2xl p-5 shadow">
        <h3 className="text-lg font-semibold mb-4">Uživatelé</h3>
        <form onSubmit={addUser} className="grid grid-cols-1 gap-3 mb-4">
          <input
            className="border rounded-xl px-3 py-2"
            placeholder="Jméno a příjmení"
            value={uName}
            onChange={(e) => setUName(e.target.value)}
          />
          <input
            className="border rounded-xl px-3 py-2"
            placeholder="E-mail"
            value={uEmail}
            onChange={(e) => setUEmail(e.target.value)}
          />
          <input
            className="border rounded-xl px-3 py-2"
            placeholder="Dočasné heslo"
            value={uPass}
            onChange={(e) => setUPass(e.target.value)}
          />
          <button className="bg-black text-white rounded-xl px-4 py-2 w-full md:w-auto">
            Přidat uživatele
          </button>
        </form>
        <div className="flex flex-wrap gap-2 mb-3">
          <label className="text-sm">
            Import (CSV/JSON):{" "}
            <input
              type="file"
              accept=".csv,.json"
              onChange={(e) =>
                e.target.files[0] && importUsersFromFile(e.target.files[0])
              }
            />
          </label>
          <button onClick={exportUsers} className="text-sm underline">
            Export JSON
          </button>
          <button onClick={exportUsersCSV} className="text-sm underline">
            Export CSV
          </button>
        </div>
        <ul className="divide-y">
          {users.map((u) => (
            <li key={u.id} className="py-2 flex items-center justify-between">
              <div>
                <p className="font-medium">{u.name}</p>
                <p className="text-xs text-gray-500">
                  {u.email} • role: {u.role}
                </p>
              </div>
              {u.role !== "admin" && (
                <button
                  onClick={() => removeUser(u.id)}
                  className="text-red-600 text-sm hover:underline"
                >
                  Smazat
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Produkty */}
      <div className="bg-white rounded-2xl p-5 shadow">
        <h3 className="text-lg font-semibold mb-4">Produkty & body</h3>
        <form onSubmit={addProduct} className="grid grid-cols-1 gap-3 mb-4">
          <input
            className="border rounded-xl px-3 py-2"
            placeholder="Název produktu"
            value={pName}
            onChange={(e) => setPName(e.target.value)}
          />
          <input
            type="number"
            className="border rounded-xl px-3 py-2"
            placeholder="Body za kus"
            value={pPoints}
            onChange={(e) => setPPoints(e.target.value)}
          />
          <button className="bg-black text-white rounded-xl px-4 py-2 w-full md:w-auto">
            Přidat produkt
          </button>
        </form>
        <div className="flex flex-wrap gap-2 mb-3">
          <label className="text-sm">
            Import (CSV/JSON):{" "}
            <input
              type="file"
              accept=".csv,.json"
              onChange={(e) =>
                e.target.files[0] &&
                importProductsFromFile(e.target.files[0])
              }
            />
          </label>
          <button onClick={exportProducts} className="text-sm underline">
            Export JSON
          </button>
          <button onClick={exportProductsCSV} className="text-sm underline">
            Export CSV
          </button>
        </div>
        <ul className="divide-y">
          {products.map((p) => (
            <li key={p.id} className="py-2 flex items-center justify-between">
              <div>
                <p className="font-medium">{p.name}</p>
                <p className="text-xs text-gray-500">{p.basePoints} bodů / ks</p>
              </div>
              <button
                onClick={() => removeProduct(p.id)}
                className="text-red-600 text-sm hover:underline"
              >
                Smazat
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="md:col-span-2 flex flex-wrap gap-3 justify-end">
        <button
          onClick={fetchFromServer}
          disabled={seedBusy}
          className="text-sm border rounded-xl px-4 py-2 disabled:opacity-60"
        >
          {seedBusy ? "Načítám…" : "Načíst ze serveru"}
        </button>
        <button
          onClick={publishToServer}
          disabled={seedBusy}
          className="text-sm bg-black text-white rounded-xl px-4 py-2 disabled:opacity-60"
        >
          {seedBusy ? "Publikuji…" : "Publikovat uživatele & produkty na server"}
        </button>
      </div>
    </div>
  );
}

/* =================== HLAVNÍ APP =================== */
export default function SalesGameApp() {
  const [session, setSession] = useState(null);
  const [me, setMe] = useState(null);
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [entries, setEntries] = useState([]);
  const [tab, setTab] = useState("leaderboard");

  const handleLogout = () => {
    localStorage.removeItem(LS_KEYS.SESSION);
    setSession(null);
    setMe(null);
  };

  // Lokální bootstrap
  useEffect(() => {
    const uRaw = localStorage.getItem(LS_KEYS.USERS);
    const pRaw = localStorage.getItem(LS_KEYS.PRODUCTS);
    const eRaw = localStorage.getItem(LS_KEYS.ENTRIES);
    if (!uRaw) localStorage.setItem(LS_KEYS.USERS, JSON.stringify(DEFAULT_USERS));
    if (!pRaw)
      localStorage.setItem(LS_KEYS.PRODUCTS, JSON.stringify(DEFAULT_PRODUCTS));
    if (!eRaw) localStorage.setItem(LS_KEYS.ENTRIES, JSON.stringify([]));

    setUsers(JSON.parse(localStorage.getItem(LS_KEYS.USERS) || "[]"));
    setProducts(JSON.parse(localStorage.getItem(LS_KEYS.PRODUCTS) || "[]"));
    setEntries(JSON.parse(localStorage.getItem(LS_KEYS.ENTRIES) || "[]"));

    const sRaw = localStorage.getItem(LS_KEYS.SESSION);
    if (sRaw) setSession(JSON.parse(sRaw));
  }, []);

  // Hydratace ze serveru po mountu
  useEffect(() => {
    (async () => {
      try {
        const { users: srvUsers, products: srvProducts } = await api.getSeed();

        if (srvUsers.length) {
          localStorage.setItem(LS_KEYS.USERS, JSON.stringify(srvUsers));
          setUsers(srvUsers);
        }
        if (srvProducts.length) {
          localStorage.setItem(LS_KEYS.PRODUCTS, JSON.stringify(srvProducts));
          setProducts(srvProducts);
        }

        const srvEntries = await api.listEntries();
        localStorage.setItem(LS_KEYS.ENTRIES, JSON.stringify(srvEntries));
        setEntries(srvEntries);
      } catch {
        // offline
      }
    })();
  }, []);

  // Při změně session nastavíme me
  useEffect(() => {
    if (!session) {
      setMe(null);
      return;
    }
    const u = users.find((x) => x.id === session.userId) || null;
    setMe(u);
  }, [session, users]);

  // Uložení prodeje
  const addSale = async ({ productId, quantity, date, note, points }) => {
    if (!me) return;

    const payload = { userId: me.id, productId, quantity, date, note, points };

    try {
      const saved = await api.addEntry(payload);
      setEntries((prev) => {
        const next = [saved, ...prev];
        localStorage.setItem(LS_KEYS.ENTRIES, JSON.stringify(next));
        return next;
      });
      setTab("leaderboard");
    } catch (err) {
      const localFallback = { id: uid(), ...payload, createdAt: Date.now() };
      setEntries((prev) => {
        const next = [localFallback, ...prev];
        localStorage.setItem(LS_KEYS.ENTRIES, JSON.stringify(next));
        return next;
      });
      setTab("leaderboard");
      alert("Serverové uložení se nepovedlo, záznam je dočasně jen lokálně.");
    }
  };

  // Smazání prodeje
  const deleteSale = async (id) => {
    const sure = window.confirm("Opravdu smazat tento záznam?");
    if (!sure) return;

    const previous = entries;
    const next = entries.filter((e) => e.id !== id);
    setEntries(next);
    localStorage.setItem(LS_KEYS.ENTRIES, JSON.stringify(next));

    try {
      await api.delEntry(id);
    } catch (err) {
      setEntries(previous);
      localStorage.setItem(LS_KEYS.ENTRIES, JSON.stringify(previous));
      alert(
        `Smazání na serveru se nepovedlo. Záznam byl obnoven.\n${String(
          err.message || err
        )}`
      );
    }
  };

  if (!me) {
    return (
      <Login
        usersFromApp={users}
        onLogin={(u) => {
          setSession({ userId: u.id });
          setMe(u);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-12 h-8 rounded-xl bg-black text-white flex items-center justify-center font-bold">
              DKtel
            </div>
            <h1 className="font-bold">Vánoční soutěž</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">
              {me?.name} ({me?.role})
            </span>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:underline"
            >
              Odhlásit
            </button>
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
            { id: "rules", label: "Pravidla a odměny" }, // <— název záložky
            ...(me?.role === "admin" ? [{ id: "admin", label: "Admin" }] : []),
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
            <MySales
              user={me}
              entries={entries}
              products={products}
              onDeleteSale={deleteSale}
            />
          )}

          {tab === "leaderboard" && (
            <Leaderboard
              users={users}
              entries={entries}
              currentUserId={me.id}
            />
          )}

          {tab === "rules" && <RulesPage config={RULES_CONFIG} />}

          {tab === "admin" && me.role === "admin" && (
            <AdminPanel
              users={users}
              setUsers={setUsers}
              products={products}
              setProducts={setProducts}
            />
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center text-xs text-gray-400 py-6">
        Prototyp • serverová data: Netlify Functions + Blobs
      </footer>
    </div>
  );
}

/* =================== ŽEBŘÍČEK =================== */
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
                <tr key={row.user.id} className={`border-t ${isMe ? "bg-green-50" : ""}`}>
                  <td className="p-2 font-semibold">{idx + 1}</td>
                  <td className="p-2">
                    <span className={isMe ? "font-bold" : ""}>{row.user.name}</span>
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

/* =================== PRAVIDLA & ODMĚNY (NOVÁ STRÁNKA) =================== */
function RulesPage({ config }) {
  const {
    title,
    period,
    intro,
    rewardsTitle,
    rewards,
    grandPrize,
    rules,
  } = config || {};

  return (
    <div className="bg-white rounded-2xl p-5 shadow">
      {/* HLAVIČKA + úvod */}
      <h2 className="text-xl font-semibold">{title || "Pravidla soutěže"}</h2>
      {period && <p className="text-sm text-gray-500 mt-1">Termín: {period}</p>}
      {intro && <p className="text-gray-700 mt-4">{intro}</p>}

      {/* ODMĚNY */}
      {Array.isArray(rewards) && rewards.length > 0 && (
        <section className="mt-8">
          <h3 className="font-semibold mb-2">{rewardsTitle || "Odměny"}</h3>
          <ul className="list-disc pl-5 space-y-1">
            {rewards.map((r, i) => (
              <li key={i} className="text-gray-700">
                {r}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* HLAVNÍ SOUTĚŽ */}
      {grandPrize && (
        <section className="mt-10">
          <h3 className="font-extrabold tracking-tight text-[clamp(28px,4.2vw,40px)]">
            {grandPrize.title || "Hlavní soutěž"}
          </h3>

          {/* Úvodní věta hned pod nadpisem hlavní soutěže */}
          {(grandPrize.intro || intro) && (
            <p className="text-gray-700 mt-3">
              {grandPrize.intro || intro}
            </p>
          )}

          {Array.isArray(grandPrize.bulletPoints) &&
            grandPrize.bulletPoints.length > 0 && (
              <ul className="list-disc pl-5 space-y-1 mt-3">
                {grandPrize.bulletPoints.map((b, i) => (
                  <li key={i} className="text-gray-700">
                    {b}
                  </li>
                ))}
              </ul>
            )}

          {grandPrize.imageUrl && (
            <div className="mt-4 rounded-2xl bg-gray-50 border">
              <img
                src={grandPrize.imageUrl}
                alt="Hlavní výhra"
                className="w-full max-h-[520px] object-contain rounded-2xl"
                loading="lazy"
              />
            </div>
          )}
        </section>
      )}

      {/* PRAVIDLA (až za hlavní soutěží) */}
      {Array.isArray(rules) && rules.length > 0 && (
        <section className="mt-10">
          <h3 className="font-semibold mb-2">Pravidla</h3>
          <ul className="list-disc pl-5 space-y-1">
            {rules.map((r, i) => (
              <li key={i} className="text-gray-700">
                {r}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
