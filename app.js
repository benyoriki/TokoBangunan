/* =====================================================================
   app.js — Fungsi umum: utilitas, ikon, ilustrasi produk, lapisan
   penyimpanan (TB.store), layanan data (TB.svc), kalkulasi, UI umum.
   Lapisan TB.store & TB.svc sengaja dipisah dari UI agar kelak dapat
   diganti dengan Firebase (lihat README bagian migrasi).
   ===================================================================== */
window.TB = window.TB || {};
(function () {
  'use strict';

  /* ---------------- Utilitas dasar ---------------- */
  TB.$ = function (s, r) { return (r || document).querySelector(s); };
  TB.$$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  TB.esc = function (v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  TB.rp = function (n) { n = Math.round(Number(n) || 0); return (n < 0 ? '-Rp' : 'Rp') + Math.abs(n).toLocaleString('id-ID'); };
  TB.num = function (n) { return (Number(n) || 0).toLocaleString('id-ID', { maximumFractionDigits: 2 }); };
  TB.dateKey = function (d) {
    d = d instanceof Date ? d : new Date(d);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  };
  TB.fmtDate = function (iso) { return new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }); };
  TB.fmtDateTime = function (iso) {
    return new Date(iso).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };
  TB.uid = function (p) { return (p || 'id') + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8); };
  TB.clone = function (o) { return JSON.parse(JSON.stringify(o)); };
  TB.round2 = function (n) { return Math.round((Number(n) || 0) * 100) / 100; };
  TB.debounce = function (fn, ms) { let t; return function () { const a = arguments, c = this; clearTimeout(t); t = setTimeout(function () { fn.apply(c, a); }, ms || 200); }; };
  TB.param = function (k) { try { return new URLSearchParams(location.search).get(k) || ''; } catch (e) { return ''; } };

  const listeners = {};
  TB.on = function (ev, fn) { (listeners[ev] = listeners[ev] || []).push(fn); };
  TB.emit = function (ev, data) { (listeners[ev] || []).forEach(function (f) { try { f(data); } catch (e) { console.error(e); } }); };

  /* ---------------- SHA-256 sinkron (untuk hash password prototipe) ---------------- */
  TB.sha256 = function (str) {
    function rr(n, x) { return (x >>> n) | (x << (32 - n)); }
    const K = [0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2];
    const bytes = unescape(encodeURIComponent(str)).split('').map(function (c) { return c.charCodeAt(0); });
    const l = bytes.length * 8; bytes.push(0x80);
    while (bytes.length % 64 !== 56) bytes.push(0);
    const hi = Math.floor(l / 4294967296), lo = l >>> 0;
    [hi, lo].forEach(function (v) { bytes.push((v >>> 24) & 255, (v >>> 16) & 255, (v >>> 8) & 255, v & 255); });
    let h = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
    for (let i = 0; i < bytes.length; i += 64) {
      const w = new Array(64);
      for (let t = 0; t < 16; t++) w[t] = (bytes[i + t * 4] << 24) | (bytes[i + t * 4 + 1] << 16) | (bytes[i + t * 4 + 2] << 8) | bytes[i + t * 4 + 3];
      for (let t = 16; t < 64; t++) {
        const s0 = rr(7, w[t - 15]) ^ rr(18, w[t - 15]) ^ (w[t - 15] >>> 3);
        const s1 = rr(17, w[t - 2]) ^ rr(19, w[t - 2]) ^ (w[t - 2] >>> 10);
        w[t] = (w[t - 16] + s0 + w[t - 7] + s1) | 0;
      }
      let a = h[0], b = h[1], c = h[2], d = h[3], e = h[4], f = h[5], g = h[6], hh = h[7];
      for (let t = 0; t < 64; t++) {
        const S1 = rr(6, e) ^ rr(11, e) ^ rr(25, e), ch = (e & f) ^ (~e & g);
        const t1 = (hh + S1 + ch + K[t] + w[t]) | 0;
        const S0 = rr(2, a) ^ rr(13, a) ^ rr(22, a), mj = (a & b) ^ (a & c) ^ (b & c);
        const t2 = (S0 + mj) | 0;
        hh = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
      }
      h = [(h[0] + a) | 0, (h[1] + b) | 0, (h[2] + c) | 0, (h[3] + d) | 0, (h[4] + e) | 0, (h[5] + f) | 0, (h[6] + g) | 0, (h[7] + hh) | 0];
    }
    return h.map(function (x) { return ('00000000' + (x >>> 0).toString(16)).slice(-8); }).join('');
  };
  TB.hashPassword = function (salt, pw) { return TB.sha256(salt + ':' + pw); };

  /* ---------------- Ikon SVG ---------------- */
  const ICONS = {
    home: 'M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z', grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
    tag: 'M20 12l-8 8-9-9V3h8l9 9zM7.5 7.5h.01', info: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 16v-5M12 8h.01',
    cart: 'M3 4h2l2.4 10.2a2 2 0 0 0 2 1.5h7.7a2 2 0 0 0 2-1.5L21 8H6M10 20h.01M17 20h.01',
    user: 'M20 21v-1a5 5 0 0 0-5-5H9a5 5 0 0 0-5 5v1M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3',
    sun: 'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4',
    moon: 'M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z', menu: 'M3 6h18M3 12h18M3 18h18', x: 'M18 6L6 18M6 6l12 12', plus: 'M12 5v14M5 12h14', minus: 'M5 12h14',
    trash: 'M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6', edit: 'M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z',
    truck: 'M1 3h15v13H1zM16 8h4l3 3v5h-7zM5.5 21a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM18.5 21a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
    shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM9 12l2 2 4-4', box: 'M21 8l-9-5-9 5v8l9 5 9-5zM3 8l9 5 9-5M12 13v8',
    check: 'M20 6L9 17l-5-5', alert: 'M12 3l10 18H2zM12 10v5M12 18h.01',
    wa: 'M21 12a9 9 0 0 1-13.3 7.9L3 21l1.2-4.5A9 9 0 1 1 21 12zM9 9c0 3 3 6 6 6l1-2-2-1-1 1c-1-.5-2-1.5-2.5-2.5l1-1-1-2z',
    logout: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9', chart: 'M3 3v18h18M7 15l4-4 3 3 5-6',
    receipt: 'M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2zM9 8h6M9 12h6', settings: 'M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0M14 4v4M8 10v4M16 16v4',
    users: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8',
    print: 'M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z',
    download: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3', upload: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12',
    eye: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
    eyeoff: 'M17.9 17.9A10.1 10.1 0 0 1 12 20C5 20 1 12 1 12a18 18 0 0 1 5.1-5.9M9.9 4.2A9 9 0 0 1 12 4c7 0 11 8 11 8a18 18 0 0 1-2.2 3.2M1 1l22 22',
    arrow: 'M5 12h14M13 6l6 6-6 6', store: 'M3 9l1-5h16l1 5M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0M5 12v9h14v-9M10 21v-5h4v5',
    clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2',
    phone: 'M22 17v3a2 2 0 0 1-2.2 2A19.8 19.8 0 0 1 2 4.2 2 2 0 0 1 4 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7A2 2 0 0 1 22 17z',
    pin: 'M12 22s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12zM12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z', qr: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h3v3h-3zM20 14v0M14 20h3M20 17v4',
    cash: 'M2 6h20v12H2zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', filter: 'M22 3H2l8 9.5V19l4 2v-8.5z', history: 'M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5M12 7v5l3 2',
    percent: 'M19 5L5 19M7 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM17 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z', layers: 'M12 2L2 7l10 5 10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
    list: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01', refresh: 'M23 4v6h-6M1 20v-6h6M3.5 9a9 9 0 0 1 15-3.4L23 10M1 14l4.5 4.4A9 9 0 0 0 20.5 15',
    lock: 'M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4', save: 'M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2zM17 21v-8H7v8M7 3v5h8',
    bag: 'M7 3h10l2 4v14H5V7zM5 7h14M9 12h6M9 16h6', pile: 'M2 20l7-12 4 6 3-4 6 10zM2 20h20', brick: 'M3 5h18v14H3zM3 12h18M9 5v7M15 12v7',
    rods: 'M4 20L20 4M8 20L20 8M4 16L16 4', tile: 'M3 3h18v18H3zM12 3v18M3 12h18', paint: 'M5 8h14v12H5zM7 8V5h10v3M10 14h4',
    tools: 'M14.7 6.3a4 4 0 0 0 5 5L10 21l-4-4zM17 3l4 4', pipe: 'M3 8h10v4h6v6h-4v-2H9v-4H3z', bulb: 'M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z',
    board: 'M3 6l9-3 9 3-9 3zM3 6v12l9 3 9-3V6M12 9v12', roof: 'M2 12l10-8 10 8M5 10v10h14V10', undo: 'M3 7v6h6M3 13a9 9 0 1 0 3-7.7L3 8',
    headset: 'M4 14v-2a8 8 0 0 1 16 0v2M4 14h3v5H5a1 1 0 0 1-1-1zM20 14h-3v5h2a1 1 0 0 0 1-1zM17 19c0 1.5-2 2-5 2', database: 'M12 8c4.4 0 8-1.3 8-3s-3.6-3-8-3-8 1.3-8 3 3.6 3 8 3zM4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3',
    bell: 'M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9zM13.7 21a2 2 0 0 1-3.4 0', wallet: 'M3 7h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM3 7l2-3h12v3M16 13.5h.01', gauge: 'M12 14l4-4M3 17a9 9 0 1 1 18 0', arrowup: 'M12 19V5M5 12l7-7 7 7', arrowdown: 'M12 5v14M19 12l-7 7-7-7',
    chevron: 'M9 6l6 6-6 6', chevdown: 'M6 9l6 6 6-6', check2: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM8 12l3 3 5-6', hardhat: 'M3 17h18M5 17a7 7 0 0 1 14 0M12 6v5M9 8l1 3M15 8l-1 3', ruler: 'M3 17L17 3l4 4L7 21zM7 13l2 2M10 10l2 2M13 7l2 2', paintroller: 'M5 4h12v5H5zM17 6.5h2.5V12H11v3M9 15h4v6H9z', layersx: 'M12 2L2 7l10 5 10-5zM2 12l10 5 10-5', phone2: 'M7 2h10a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1zM11 18h2'
  };
  TB.icon = function (name, size, cls) {
    size = size || 20;
    return '<svg class="ic ' + (cls || '') + '" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + (ICONS[name] || ICONS.box) + '"/></svg>';
  };

  /* Logo & gambar produk: lihat art.js (TB.logo, TB.productImage, TB.categoryImage, TB.heroImage) */

  /* ---------------- Penyimpanan (LocalStorage) ---------------- */
  const P = TB.CONFIG.KEY_PREFIX;
  const KEYS = { products: P + 'products', transactions: P + 'transactions', users: P + 'users', movements: P + 'stock_movements', settings: P + 'settings', cart: P + 'cart', categories: P + 'categories', units: P + 'units', audit: P + 'audit', counters: P + 'counters', cash: P + 'cash', notifs: P + 'notifs', seeded: P + 'seeded', session: P + 'session', theme: P + 'theme' };
  TB.KEYS = KEYS;
  const store = TB.store = { errors: [] };

  function readKey(key, fallback) {
    let raw = null;
    try { raw = localStorage.getItem(key); } catch (e) { store.errors.push('Penyimpanan browser tidak dapat diakses: ' + e.message); return fallback; }
    if (raw === null) return fallback;
    try { return JSON.parse(raw); } catch (e) {
      try { localStorage.setItem(key + '_rusak_' + Date.now(), raw); localStorage.removeItem(key); } catch (e2) { /* abaikan */ }
      store.errors.push('Data "' + key.replace(P, '') + '" rusak dan telah dipindahkan ke cadangan. Data awal dipulihkan.');
      return fallback;
    }
  }
  function writeKey(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); }
    catch (e) { throw new Error('Gagal menyimpan data (penyimpanan penuh atau diblokir): ' + e.message); }
  }
  store.read = readKey; store.write = writeKey;

  /* Cek cepat "apakah key berisi array" tanpa JSON.parse (data transaksi bisa berukuran MB) */
  function hasArray(key) { try { const r = localStorage.getItem(key); return typeof r === 'string' && r.charAt(0) === '['; } catch (e) { return false; } }
  store.ensureSeed = function () {
    let prods = hasArray(KEYS.products) ? readKey(KEYS.products, null) : null;
    let seededNow = false;
    if (!Array.isArray(prods)) { prods = TB.buildDemoProducts(); writeKey(KEYS.products, prods); seededNow = true; }
    if (!hasArray(KEYS.categories)) writeKey(KEYS.categories, TB.clone(TB.DEFAULT_CATEGORIES));
    if (!hasArray(KEYS.units)) writeKey(KEYS.units, TB.clone(TB.DEFAULT_UNITS));
    if (!hasArray(KEYS.users)) writeKey(KEYS.users, TB.clone(TB.DEFAULT_USERS));
    if (!readKey(KEYS.settings, null)) writeKey(KEYS.settings, TB.clone(TB.DEFAULT_SETTINGS));
    /* Data simulasi otomatis (beban 2x, 30 hari) bila belum ada transaksi, atau disegarkan 1x per hari
       selama semua transaksi masih data demo (tidak pernah menimpa transaksi nyata / pilihan manual). */
    function autoSim() {
      if (!TB.CONFIG.AUTO_SIM || !TB.sim) return false;
      try { const d = TB.sim.generate({ days: 30, load: 2 }); TB.sim.apply(d); writeKey(KEYS.seeded, { at: new Date().toISOString(), version: TB.CONFIG.VERSION, sim: true, day: TB.dateKey(new Date()) }); return true; } catch (e) { console.error(e); return false; }
    }
    if (!hasArray(KEYS.transactions)) {
      if (autoSim()) seededNow = true;
      else { const demo = TB.buildDemoTransactions(prods); writeKey(KEYS.transactions, demo.txns); writeKey(KEYS.counters, demo.counters); seededNow = true; }
    } else if (TB.CONFIG.AUTO_SIM && TB.sim) {
      const sd = readKey(KEYS.seeded, null) || {}; let allDemo = false; try { allDemo = (localStorage.getItem(KEYS.transactions) || '').indexOf('"demo":false') < 0; } catch (e) { /* abaikan */ }
      if (allDemo && !sd.manual && (!sd.sim || sd.day !== TB.dateKey(new Date()))) { autoSim(); prods = readKey(KEYS.products, prods) || prods; }
    }
    if (!hasArray(KEYS.movements)) writeKey(KEYS.movements, []);
    if (!hasArray(KEYS.audit)) writeKey(KEYS.audit, []);
    if (!hasArray(KEYS.cash)) writeKey(KEYS.cash, []);
    if (!hasArray(KEYS.notifs)) writeKey(KEYS.notifs, []);
    if (!hasArray(KEYS.cart)) writeKey(KEYS.cart, []);
    if (!readKey(KEYS.counters, null)) writeKey(KEYS.counters, {});
    if (!readKey(KEYS.seeded, null)) writeKey(KEYS.seeded, { at: new Date().toISOString(), version: TB.CONFIG.VERSION });
    return seededNow;
  };

  function arr(key) { const v = readKey(key, []); return Array.isArray(v) ? v : []; }
  store.getProducts = function () { return arr(KEYS.products); };
  store.saveProducts = function (list) { if (!Array.isArray(list)) throw new Error('Data produk tidak valid'); writeKey(KEYS.products, list); };
  store.getTransactions = function () { return arr(KEYS.transactions); };
  store.saveTransactions = function (list) { writeKey(KEYS.transactions, list); };
  store.saveTransaction = function (t) {
    if (!t || !t.id) throw new Error('Transaksi tidak valid');
    const list = store.getTransactions(); const i = list.findIndex(function (x) { return x.id === t.id; });
    if (i >= 0 && list[i].clientRef !== t.clientRef) throw new Error('Nomor transaksi ' + t.id + ' sudah dipakai. Coba lagi.');
    if (i >= 0) list[i] = t; else list.push(t); writeKey(KEYS.transactions, list);
  };
  store.getStockMovements = function () { return arr(KEYS.movements); };
  store.saveStockMovement = function (m) { const l = store.getStockMovements(); l.push(m); writeKey(KEYS.movements, l); };
  store.saveStockMovements = function (ms) { const l = store.getStockMovements(); ms.forEach(function (m) { l.push(m); }); writeKey(KEYS.movements, l); };
  store.getUsers = function () { return arr(KEYS.users); };
  store.saveUsers = function (u) { writeKey(KEYS.users, u); };
  store.getSettings = function () {
    const s = readKey(KEYS.settings, null); const d = TB.clone(TB.DEFAULT_SETTINGS);
    if (!s || typeof s !== 'object') return d;
    return { store: Object.assign(d.store, s.store), payments: Object.assign(d.payments, s.payments), shipping: Object.assign(d.shipping, s.shipping), discountRules: s.discountRules || d.discountRules, lowStockDefault: s.lowStockDefault || d.lowStockDefault };
  };
  store.saveSettings = function (s) { writeKey(KEYS.settings, s); };
  store.getCart = function () { return arr(KEYS.cart).filter(function (c) { return c && c.productId && c.qty > 0; }); };
  store.saveCart = function (c) { writeKey(KEYS.cart, c); TB.emit('cart'); };
  store.getCategories = function () { const c = arr(KEYS.categories); return c.length ? c : TB.clone(TB.DEFAULT_CATEGORIES); };
  store.saveCategories = function (c) { writeKey(KEYS.categories, c); };
  store.getUnits = function () { const u = arr(KEYS.units); return u.length ? u : TB.clone(TB.DEFAULT_UNITS); };
  store.saveUnits = function (u) { writeKey(KEYS.units, u); };
  store.getAudit = function () { return arr(KEYS.audit); };
  store.addAudit = function (entry) {
    const l = store.getAudit(); l.push(Object.assign({ id: TB.uid('aud'), at: new Date().toISOString() }, entry)); writeKey(KEYS.audit, l.slice(-2000));
  };
  /* Buku kas (entri manual & operasional; kas dari penjualan diturunkan dari transaksi) */
  store.getCash = function () { return arr(KEYS.cash); };
  store.saveCash = function (l) { writeKey(KEYS.cash, l); };
  store.addCash = function (e) { const l = store.getCash(); l.push(Object.assign({ id: TB.uid('kas'), at: new Date().toISOString() }, e)); writeKey(KEYS.cash, l); return l[l.length - 1]; };
  /* Notifikasi (maks. 400 terbaru agar penyimpanan tetap ringan) */
  const NOTIF_MAX = 400;
  store.getNotifs = function () { return arr(KEYS.notifs); };
  store.saveNotifs = function (l) { writeKey(KEYS.notifs, l.slice(-NOTIF_MAX)); TB.emit('notifs'); };
  store.addNotif = function (n) {
    try { const l = store.getNotifs(); l.push(Object.assign({ id: TB.uid('n'), at: new Date().toISOString(), read: false, level: 'info' }, n)); writeKey(KEYS.notifs, l.slice(-NOTIF_MAX)); TB.emit('notifs'); } catch (e) { /* notifikasi tidak boleh menggagalkan transaksi */ }
  };
  store.unreadCount = function () { let n = 0; try { const raw = localStorage.getItem(KEYS.notifs); if (!raw || raw.length < 3) return 0; const l = JSON.parse(raw); for (let i = 0; i < l.length; i++) if (!l[i].read) n++; } catch (e) { /* abaikan */ } return n; };
  /* Pemakaian penyimpanan browser (LocalStorage ±5 juta karakter) */
  store.usage = function () {
    const by = {}; let chars = 0;
    try { Object.keys(localStorage).forEach(function (k) { if (k.indexOf(P) !== 0) return; const n = k.length + (localStorage.getItem(k) || '').length; by[k.slice(P.length)] = n; chars += n; }); } catch (e) { /* abaikan */ }
    const limit = 5 * 1024 * 1024;
    return { chars: chars, bytes: chars * 2, limit: limit, pct: Math.round(chars / limit * 1000) / 10, by: by };
  };
  store.nextNumber = function (prefix) {
    const c = readKey(KEYS.counters, {}) || {}; const key = TB.dateKey(new Date()).replace(/-/g, '').slice(2); const k = prefix + key;
    /* Nomor berikutnya = yang terbesar di antara penghitung dan transaksi tersimpan, +1 (anti-tabrakan) */
    let max = c[k] || 0; const re = new RegExp('^' + prefix + '-' + key + '-(\\d+)$');
    store.getTransactions().forEach(function (t) { const m = re.exec(t.id); if (m) max = Math.max(max, parseInt(m[1], 10)); });
    c[k] = max + 1; writeKey(KEYS.counters, c);
    return prefix + '-' + key + '-' + String(c[k]).padStart(4, '0');
  };
  store.exportBackup = function () {
    const data = {};
    [KEYS.products, KEYS.transactions, KEYS.users, KEYS.movements, KEYS.settings, KEYS.categories, KEYS.units, KEYS.audit, KEYS.counters, KEYS.cash, KEYS.notifs].forEach(function (k) { data[k.replace(P, '')] = readKey(k, null); });
    return { app: 'TOKO BANGUNAN', version: TB.CONFIG.VERSION, exportedAt: new Date().toISOString(), note: 'Backup LocalStorage prototipe. Berisi hash password akun demo.', data: data };
  };
  store.validateBackup = function (obj) {
    if (!obj || typeof obj !== 'object' || obj.app !== 'TOKO BANGUNAN' || !obj.data) return 'Berkas bukan backup TOKO BANGUNAN yang valid.';
    const d = obj.data;
    if (!Array.isArray(d.products) || !d.products.length) return 'Backup tidak memuat data produk.';
    if (!Array.isArray(d.transactions)) return 'Backup tidak memuat data transaksi.';
    if (!Array.isArray(d.users) || !d.users.some(function (u) { return u.role === 'owner' && u.active; })) return 'Backup harus memuat minimal satu akun owner aktif.';
    if (!d.settings || typeof d.settings !== 'object') return 'Backup tidak memuat pengaturan.';
    const ids = {}; for (let i = 0; i < d.products.length; i++) { const p = d.products[i]; if (!p.id || !p.sku || ids[p.id]) return 'Backup memuat produk dengan ID kosong/duplikat.'; ids[p.id] = 1; }
    return '';
  };
  store.importBackup = function (text) {
    let obj; try { obj = JSON.parse(text); } catch (e) { throw new Error('Berkas bukan JSON yang valid.'); }
    const err = store.validateBackup(obj); if (err) throw new Error(err);
    const d = obj.data;
    Object.keys(d).forEach(function (k) { if (d[k] !== null && d[k] !== undefined) writeKey(P + k, d[k]); });
    writeKey(KEYS.cart, []);
    return true;
  };
  store.resetDemo = function () {
    Object.keys(localStorage).filter(function (k) { return k.indexOf(P) === 0 && k !== KEYS.theme; }).forEach(function (k) { localStorage.removeItem(k); });
    return store.ensureSeed();
  };

  /* ---------------- Aturan harga, stok, kalkulasi ---------------- */
  TB.isPromo = function (p) {
    if (!p || !p.promoPrice || p.promoPrice <= 0 || p.promoPrice >= p.price) return false;
    const today = TB.dateKey(new Date());
    if (p.promoStart && today < p.promoStart) return false;
    if (p.promoEnd && today > p.promoEnd) return false;
    return true;
  };
  TB.effPrice = function (p) { return TB.isPromo(p) ? p.promoPrice : p.price; };
  TB.qtyStep = function (p) { return p && p.unit === 'kubik' ? 0.5 : 1; };
  TB.stockStatus = function (p) {
    if (p.stock <= 0) return { key: 'out', label: 'Stok habis', cls: 'bad' };
    if (p.stock <= p.minStock) return { key: 'low', label: 'Stok menipis', cls: 'warn' };
    return { key: 'ok', label: 'Tersedia', cls: 'ok' };
  };
  TB.calcDiscount = function (subtotal, rules) {
    let best = { amount: 0, label: '', percent: 0 };
    (rules || []).forEach(function (r) { if (subtotal >= r.minSubtotal && r.percent > best.percent) best = { percent: r.percent, amount: Math.round(subtotal * r.percent / 100), label: r.label || ('Diskon ' + r.percent + '%') }; });
    return best;
  };
  TB.calcShipping = function (weightKg, method, zoneId, settings) {
    const sh = settings.shipping;
    if (method === 'pickup') return { fee: 0, label: 'Ambil sendiri di toko', needsConfirm: false };
    if (!zoneId) return { fee: 0, label: 'Pilih zona pengiriman', needsConfirm: false, incomplete: true };
    if (zoneId === 'luar') return { fee: 0, label: 'Di luar zona tarif — ongkir dikonfirmasi toko', needsConfirm: true };
    const zone = sh.zones.find(function (z) { return z.id === zoneId; });
    if (!zone) return { fee: 0, label: 'Zona tidak ditemukan', needsConfirm: true };
    const cls = method === 'heavy' ? 'berat' : 'ringan';
    const vs = sh.vehicles.filter(function (v) { return v.cls === cls; }).sort(function (a, b) { return a.capacityKg - b.capacityKg; });
    if (!vs.length) return { fee: 0, label: 'Tarif kendaraan belum diatur — konfirmasi dengan toko', needsConfirm: true };
    let veh = vs.find(function (v) { return v.capacityKg >= weightKg; }), trips = 1;
    if (!veh) { veh = vs[vs.length - 1]; trips = Math.ceil(weightKg / veh.capacityKg); }
    const km = (sh.zoneAvgKm && sh.zoneAvgKm[zone.id]) || ((zone.minKm + zone.maxKm) / 2);
    const perTrip = veh.baseFee + veh.perKmFee * km + zone.fee;
    const heavyExtra = weightKg > sh.heavyThresholdKg ? Math.ceil((weightKg - sh.heavyThresholdKg) / 100) * sh.heavySurchargePer100Kg : 0;
    return { fee: Math.round(perTrip * trips + heavyExtra), vehicle: veh, trips: trips, zone: zone, km: km, perTrip: perTrip, heavyExtra: heavyExtra, label: veh.name + (trips > 1 ? ' × ' + trips + ' rit' : '') + ' · ' + zone.name, needsConfirm: false };
  };
  /* lines: [{product, qty}] */
  TB.calcTotals = function (lines, opts, settings) {
    opts = opts || {};
    const subtotal = lines.reduce(function (a, l) { return a + TB.effPrice(l.product) * l.qty; }, 0);
    const weightKg = lines.reduce(function (a, l) { return a + (l.product.weightKg || 0) * l.qty; }, 0);
    const disc = TB.calcDiscount(subtotal, settings.discountRules);
    const ship = opts.method && opts.method !== 'pickup' ? TB.calcShipping(weightKg, opts.method, opts.zoneId, settings) : { fee: 0, label: 'Ambil sendiri di toko', needsConfirm: false };
    return { subtotal: subtotal, weightKg: weightKg, discount: disc.amount, discountLabel: disc.label, shipping: ship.fee, ship: ship, total: subtotal - disc.amount + ship.fee };
  };

  /* ---------------- Layanan data (logika bisnis, bebas UI) ---------------- */
  const svc = TB.svc = {};
  function actorOf(u) { return u ? { id: u.id, name: u.name, role: u.role } : { id: null, name: 'Pelanggan (publik)', role: 'publik' }; }

  /* Notifikasi & peringatan stok (gagal menulis notifikasi tidak boleh menggagalkan transaksi) */
  svc.notify = function (n) { try { store.addNotif(n); } catch (e) { /* abaikan */ } };
  svc.stockAlerts = function (movements, products) {
    (movements || []).forEach(function (m) {
      const p = (products || []).find(function (x) { return x.id === m.productId; }); if (!p || !(m.after < m.before)) return;
      if (m.after <= 0 && m.before > 0) svc.notify({ type: 'stock', level: 'bad', title: 'Stok habis', body: p.name + ' habis (stok minimum ' + TB.num(p.minStock) + ' ' + p.unit + ').', ref: p.id });
      else if (m.after <= p.minStock && m.before > p.minStock) svc.notify({ type: 'stock', level: 'warn', title: 'Stok menipis', body: p.name + ' tersisa ' + TB.num(m.after) + ' ' + p.unit + ' (minimum ' + TB.num(p.minStock) + ').', ref: p.id });
    });
  };
  svc.validateProduct = function (p, products) {
    const e = [];
    if (!p.name || !String(p.name).trim()) e.push('Nama produk wajib diisi.');
    if (!p.sku || !String(p.sku).trim()) e.push('SKU wajib diisi.');
    if (p.sku && products.some(function (x) { return x.id !== p.id && String(x.sku).toLowerCase() === String(p.sku).trim().toLowerCase(); })) e.push('SKU sudah dipakai produk lain.');
    if (!p.category) e.push('Kategori wajib dipilih.');
    if (!p.unit) e.push('Satuan wajib dipilih.');
    if (!(Number(p.price) >= 0) || p.price === '' || p.price === null) e.push('Harga jual harus angka ≥ 0.');
    if (!(Number(p.cost) >= 0) || p.cost === '' || p.cost === null) e.push('Harga modal harus angka ≥ 0.');
    if (p.promoPrice !== null && p.promoPrice !== '' && p.promoPrice !== undefined) {
      if (!(Number(p.promoPrice) > 0)) e.push('Harga promo harus lebih dari 0.');
      else if (Number(p.promoPrice) >= Number(p.price)) e.push('Harga promo harus lebih rendah dari harga normal.');
      if (p.promoStart && p.promoEnd && p.promoStart > p.promoEnd) e.push('Tanggal akhir promo harus setelah tanggal mulai.');
    }
    if (!(Number(p.stock) >= 0)) e.push('Stok tidak boleh negatif.');
    if (!(Number(p.minStock) >= 0)) e.push('Batas stok minimum tidak boleh negatif.');
    if (p.weightKg !== '' && p.weightKg !== undefined && !(Number(p.weightKg) >= 0)) e.push('Berat harus angka ≥ 0.');
    return e;
  };
  svc.saveProduct = function (input, actor) {
    const products = store.getProducts(); const isNew = !input.id;
    const p = Object.assign({}, input);
    ['price', 'cost', 'stock', 'minStock', 'weightKg'].forEach(function (k) { p[k] = p[k] === '' || p[k] == null ? 0 : TB.round2(p[k]); });
    p.promoPrice = p.promoPrice === '' || p.promoPrice == null ? null : Number(p.promoPrice);
    p.sku = String(p.sku || '').trim().toUpperCase(); p.name = String(p.name || '').trim();
    const errs = svc.validateProduct(p, products); if (errs.length) return { ok: false, errors: errs };
    const now = new Date().toISOString();
    if (isNew) {
      p.id = 'p' + String(Date.now()).slice(-7) + Math.floor(Math.random() * 90 + 10); p.active = p.active !== false; p.createdAt = now; p.updatedAt = now; p.demo = false;
      p.artType = p.artType || 'bag'; p.artColor = p.artColor || '#90a4ae';
      products.push(p);
      if (p.stock > 0) store.saveStockMovement({ id: TB.uid('mv'), at: now, productId: p.id, sku: p.sku, name: p.name, type: 'masuk', qty: p.stock, before: 0, after: p.stock, reason: 'Stok awal produk baru', userId: actor.id, userName: actor.name, ref: '' });
      store.addAudit({ action: 'produk.tambah', userId: actor.id, userName: actor.name, detail: p.sku + ' — ' + p.name });
    } else {
      const i = products.findIndex(function (x) { return x.id === p.id; }); if (i < 0) return { ok: false, errors: ['Produk tidak ditemukan.'] };
      const old = products[i];
      if (Number(old.stock) !== Number(p.stock)) { return { ok: false, errors: ['Perubahan stok harus melalui menu Stok Masuk/Keluar agar tercatat.'] }; }
      const changes = []; ['price', 'cost', 'promoPrice', 'name', 'sku', 'minStock'].forEach(function (k) { if (old[k] !== p[k]) changes.push(k + ': ' + old[k] + ' → ' + p[k]); });
      products[i] = Object.assign({}, old, p, { updatedAt: now });
      store.addAudit({ action: 'produk.ubah', userId: actor.id, userName: actor.name, detail: p.sku + (changes.length ? ' · ' + changes.join('; ') : '') });
    }
    store.saveProducts(products); return { ok: true, product: p };
  };
  svc.setProductActive = function (id, active, actor) {
    const products = store.getProducts(); const p = products.find(function (x) { return x.id === id; }); if (!p) return { ok: false, errors: ['Produk tidak ditemukan.'] };
    p.active = !!active; p.updatedAt = new Date().toISOString(); store.saveProducts(products);
    store.addAudit({ action: active ? 'produk.aktifkan' : 'produk.nonaktifkan', userId: actor.id, userName: actor.name, detail: p.sku }); return { ok: true };
  };
  /* type: 'masuk' | 'keluar' | 'koreksi' (qty = stok baru) */
  svc.adjustStock = function (productId, type, qty, reason, actor, ref) {
    qty = Number(qty); reason = String(reason || '').trim();
    if (!reason) return { ok: false, errors: ['Alasan wajib diisi.'] };
    if (!(qty >= 0) || (type !== 'koreksi' && qty <= 0)) return { ok: false, errors: ['Jumlah harus lebih dari 0.'] };
    const products = store.getProducts(); const p = products.find(function (x) { return x.id === productId; }); if (!p) return { ok: false, errors: ['Produk tidak ditemukan.'] };
    const before = Number(p.stock); let after;
    if (type === 'masuk') after = before + qty; else if (type === 'keluar') after = before - qty; else after = qty;
    after = TB.round2(after);
    if (after < 0) return { ok: false, errors: ['Stok tidak boleh negatif. Stok tersedia: ' + before + ' ' + p.unit + '.'] };
    p.stock = after; p.updatedAt = new Date().toISOString(); store.saveProducts(products);
    const mv = { id: TB.uid('mv'), at: p.updatedAt, productId: p.id, sku: p.sku, name: p.name, type: type, qty: TB.round2(after - before), before: before, after: after, reason: reason, userId: actor.id, userName: actor.name, ref: ref || '' };
    store.saveStockMovement(mv);
    if (type === 'masuk') svc.notify({ type: 'stockin', level: 'ok', title: 'Stok masuk', body: p.name + ' +' + TB.num(after - before) + ' ' + p.unit + ' (stok kini ' + TB.num(after) + ').', ref: p.id });
    else svc.stockAlerts([mv], products);
    return { ok: true, before: before, after: after };
  };

  /* Draft: {clientRef,type,items:[{productId,qty}],customer,deliveryMethod,zoneId,paymentMethod,paymentStatus,cashReceived,notes} */
  svc.createTransaction = function (draft, actor) {
    const settings = store.getSettings(); const errs = [];
    if (!draft || !Array.isArray(draft.items) || !draft.items.length) return { ok: false, errors: ['Keranjang kosong.'] };
    if (!draft.clientRef) return { ok: false, errors: ['Referensi transaksi tidak valid.'] };
    const existing = store.getTransactions().find(function (t) { return t.clientRef === draft.clientRef; });
    if (existing) return { ok: true, duplicate: true, transaction: existing };
    const products = store.getProducts(); const need = {};
    draft.items.forEach(function (it) { need[it.productId] = TB.round2((need[it.productId] || 0) + Number(it.qty)); });
    const lines = [];
    Object.keys(need).forEach(function (pid) {
      const p = products.find(function (x) { return x.id === pid; }); const q = need[pid];
      if (!p) { errs.push('Produk tidak ditemukan.'); return; }
      if (!p.active) { errs.push(p.name + ' sedang tidak dijual.'); return; }
      if (!(q > 0)) { errs.push('Jumlah ' + p.name + ' tidak valid.'); return; }
      if (q > p.stock) { errs.push('Stok ' + p.name + ' tidak cukup (tersedia ' + TB.num(p.stock) + ' ' + p.unit + ', diminta ' + TB.num(q) + ').'); return; }
      lines.push({ product: p, qty: q });
    });
    if (errs.length) return { ok: false, errors: errs };
    const isOnline = draft.type === 'online';
    if (isOnline) {
      const c = draft.customer || {};
      if (!c.name || String(c.name).trim().length < 2) errs.push('Nama penerima wajib diisi.');
      if (!/^(\+?62|0)8[0-9]{7,12}$/.test(String(c.phone || '').replace(/[\s-]/g, ''))) errs.push('Nomor WhatsApp tidak valid (contoh: 081234567890).');
      if (draft.deliveryMethod !== 'pickup' && (!c.address || String(c.address).trim().length < 10)) errs.push('Alamat lengkap pengiriman wajib diisi (min. 10 karakter).');
      if (draft.deliveryMethod !== 'pickup' && !draft.zoneId) errs.push('Pilih zona pengiriman.');
      if (errs.length) return { ok: false, errors: errs };
    }
    const totals = TB.calcTotals(lines, { method: draft.deliveryMethod, zoneId: draft.zoneId }, settings);
    let payStatus = draft.paymentStatus;
    if (isOnline) payStatus = draft.paymentMethod === 'QRIS' ? 'Menunggu Pembayaran' : draft.paymentMethod === 'COD' ? 'COD (Belum Dibayar)' : 'Bayar di Toko';
    let cashReceived = null, change = null;
    if (!isOnline) {
      if (draft.paymentMethod === 'Tunai') {
        cashReceived = Number(draft.cashReceived);
        if (!(cashReceived >= totals.total)) return { ok: false, errors: ['Uang diterima kurang dari total (' + TB.rp(totals.total) + ').'] };
        change = cashReceived - totals.total;
      }
      payStatus = 'Lunas';
    }
    const now = new Date().toISOString(); const number = store.nextNumber(isOnline ? 'ORD' : 'TRX');
    const txn = {
      id: number, clientRef: draft.clientRef, type: isOnline ? 'online' : 'pos', createdAt: now,
      cashierId: actor ? actor.id : null, cashierName: isOnline ? 'Pesanan Online' : (actor ? actor.name : '-'),
      customer: { name: String((draft.customer && draft.customer.name) || (isOnline ? '' : 'Pelanggan Umum')).trim() || 'Pelanggan Umum', phone: String((draft.customer && draft.customer.phone) || '').trim(), address: String((draft.customer && draft.customer.address) || '').trim() },
      items: lines.map(function (l) { return { productId: l.product.id, sku: l.product.sku, name: l.product.name, unit: l.product.unit, qty: l.qty, price: TB.effPrice(l.product), normalPrice: l.product.price, cost: l.product.cost, weightKg: l.product.weightKg || 0 }; }),
      subtotal: totals.subtotal, discount: totals.discount, discountLabel: totals.discountLabel, shipping: totals.shipping, shippingLabel: totals.ship.label, shippingNeedsConfirm: !!totals.ship.needsConfirm,
      total: totals.total, weightKg: totals.weightKg, deliveryMethod: draft.deliveryMethod || 'pickup', zoneId: draft.zoneId || '',
      paymentMethod: draft.paymentMethod, paymentStatus: payStatus, orderStatus: isOnline ? 'Baru' : 'Selesai',
      cashReceived: cashReceived, change: change, notes: String(draft.notes || '').trim(), voided: false, demo: false, audit: [{ at: now, by: actorOf(actor).name, action: 'Transaksi dibuat' }]
    };
    /* Terapkan perubahan stok secara logis; pulihkan jika gagal di tengah jalan */
    const snapshot = JSON.stringify(store.getProducts());
    try {
      const movements = [];
      lines.forEach(function (l) {
        const before = l.product.stock; l.product.stock = TB.round2(before - l.qty);
        movements.push({ id: TB.uid('mv'), at: now, productId: l.product.id, sku: l.product.sku, name: l.product.name, type: isOnline ? 'pesanan' : 'penjualan', qty: -l.qty, before: before, after: l.product.stock, reason: (isOnline ? 'Pesanan online ' : 'Penjualan kasir ') + number, userId: actor ? actor.id : null, userName: actorOf(actor).name, ref: number });
      });
      store.saveProducts(products); store.saveTransaction(txn); store.saveStockMovements(movements);
      if (isOnline) svc.notify({ type: 'order', level: 'info', title: 'Pesanan online baru', body: number + ' · ' + txn.customer.name + ' · ' + TB.rp(txn.total) + ' · ' + txn.paymentStatus, ref: number });
      else if (txn.total >= 5000000) svc.notify({ type: 'order', level: 'info', title: 'Transaksi besar', body: number + ' · ' + txn.customer.name + ' · ' + TB.rp(txn.total) + ' (' + txn.paymentMethod + ')', ref: number });
      svc.stockAlerts(movements, products);
    } catch (e) {
      try { localStorage.setItem(KEYS.products, snapshot); } catch (e2) { /* abaikan */ }
      return { ok: false, errors: ['Transaksi dibatalkan karena gagal menyimpan: ' + e.message] };
    }
    return { ok: true, transaction: txn };
  };
  svc.updateTransaction = function (id, patch, actor, note) {
    const list = store.getTransactions(); const t = list.find(function (x) { return x.id === id; }); if (!t) return { ok: false, errors: ['Transaksi tidak ditemukan.'] };
    const nowIso = new Date().toISOString();
    if (patch && patch.paymentStatus === 'Lunas' && t.paymentStatus !== 'Lunas') { patch = Object.assign({ paidAt: nowIso }, patch); svc.notify({ type: 'payment', level: 'ok', title: 'Pembayaran diterima', body: t.id + ' · ' + t.customer.name + ' · ' + TB.rp(t.total) + ' (' + t.paymentMethod + ')', ref: t.id }); }
    Object.assign(t, patch); t.audit = (t.audit || []).concat([{ at: nowIso, by: actorOf(actor).name, action: note || 'Diperbarui' }]);
    store.saveTransactions(list); store.addAudit({ action: 'transaksi.ubah', userId: actor.id, userName: actor.name, detail: id + ' · ' + (note || '') }); return { ok: true, transaction: t };
  };
  svc.cancelTransaction = function (id, reason, actor) {
    reason = String(reason || '').trim(); if (reason.length < 5) return { ok: false, errors: ['Alasan pembatalan wajib diisi (min. 5 karakter).'] };
    const list = store.getTransactions(); const t = list.find(function (x) { return x.id === id; }); if (!t) return { ok: false, errors: ['Transaksi tidak ditemukan.'] };
    if (t.voided) return { ok: false, errors: ['Transaksi sudah dibatalkan.'] };
    const products = store.getProducts(); const now = new Date().toISOString(); const movements = [];
    t.items.forEach(function (it) {
      const p = products.find(function (x) { return x.id === it.productId; }); if (!p) return;
      const before = p.stock; p.stock = TB.round2(before + it.qty);
      movements.push({ id: TB.uid('mv'), at: now, productId: p.id, sku: p.sku, name: p.name, type: 'pembatalan', qty: it.qty, before: before, after: p.stock, reason: 'Pembatalan ' + id + ': ' + reason, userId: actor.id, userName: actor.name, ref: id });
    });
    t.voided = true; t.voidReason = reason; t.voidedAt = now; t.voidedBy = actor.name; t.orderStatus = 'Dibatalkan';
    t.audit = (t.audit || []).concat([{ at: now, by: actor.name, action: 'Dibatalkan: ' + reason }]);
    store.saveProducts(products); store.saveTransactions(list); store.saveStockMovements(movements);
    store.addAudit({ action: 'transaksi.batal', userId: actor.id, userName: actor.name, detail: id + ' · ' + reason });
    svc.notify({ type: 'cancel', level: 'warn', title: 'Transaksi dibatalkan', body: id + ' · ' + TB.rp(t.total) + ' · ' + reason, ref: id }); return { ok: true };
  };
  svc.getProduct = function (id) { return store.getProducts().find(function (p) { return p.id === id; }); };
  svc.activeTransactions = function () { return store.getTransactions().filter(function (t) { return !t.voided; }); };
  /* Ringkasan keuangan: omzet (barang), HPP, laba kotor, ongkir, arus kas masuk, piutang */
  svc.summarize = function (txns) {
    const s = { count: 0, omzet: 0, hpp: 0, grossProfit: 0, shipping: 0, cashIn: 0, pending: 0, discount: 0, items: 0, avg: 0, byMethod: {} };
    txns.forEach(function (t) {
      if (t.voided) return; s.count++;
      const goods = t.subtotal - t.discount; const hpp = t.items.reduce(function (a, i) { return a + i.cost * i.qty; }, 0);
      s.omzet += goods; s.hpp += hpp; s.shipping += t.shipping; s.discount += t.discount; s.items += t.items.reduce(function (a, i) { return a + i.qty; }, 0);
      if (t.paymentStatus === 'Lunas') s.cashIn += t.total; else s.pending += t.total;
      s.byMethod[t.paymentMethod] = (s.byMethod[t.paymentMethod] || 0) + t.total;
    });
    s.grossProfit = s.omzet - s.hpp; s.avg = s.count ? (s.omzet + s.shipping) / s.count : 0; return s;
  };

  /* Buku kas: kas masuk dari penjualan (lunas) diturunkan dari transaksi dan dikelompokkan per hari & metode;
     kas keluar/masuk lain dicatat di tb_cash. Tidak ada pencatatan ganda. */
  svc.cashEntries = function () {
    const g = {}, out = [];
    function add(when, dir, method, amt, cat) {
      const day = TB.dateKey(when), k = dir + '|' + day + '|' + method; let e = g[k];
      if (!e) { const d = new Date(when); d.setHours(21, 0, 0, 0); e = g[k] = { id: 'auto-' + k, at: d.toISOString(), dir: dir, cat: cat, amount: 0, method: method, n: 0, auto: true, note: '' }; out.push(e); }
      e.amount += amt; e.n++;
    }
    store.getTransactions().forEach(function (t) {
      if (t.paymentStatus !== 'Lunas') return;
      add(t.paidAt || t.createdAt, 'in', t.paymentMethod, t.total, 'Penjualan');
      if (t.voided) add(t.voidedAt || t.createdAt, 'out', t.paymentMethod, t.total, 'Refund pembatalan');
    });
    out.forEach(function (e) { e.note = e.dir === 'in' ? 'Penjualan ' + e.method + ' · ' + e.n + ' transaksi' : 'Refund ' + e.n + ' pembatalan'; });
    return out.concat(store.getCash());
  };
  svc.cashSummary = function (entries, from, to) {
    const s = { in: 0, out: 0, net: 0, byCat: {}, balanceEnd: 0, opening: 0 };
    entries.forEach(function (e) {
      const d = TB.dateKey(e.at), v = e.dir === 'in' ? e.amount : -e.amount;
      if (to && d > to) return;
      if (from && d < from) { s.opening += v; return; }
      if (e.dir === 'in') s.in += e.amount; else { s.out += e.amount; s.byCat[e.cat] = (s.byCat[e.cat] || 0) + e.amount; }
    });
    s.net = s.in - s.out; s.balanceEnd = s.opening + s.net; return s;
  };

  /* ---------------- WhatsApp ---------------- */
  TB.deliveryLabel = function (m) { return m === 'pickup' ? 'Ambil sendiri di toko' : m === 'heavy' ? 'Pengiriman material berat / jumlah besar' : 'Pengiriman kendaraan toko'; };
  TB.buildWhatsAppText = function (t, settings) {
    const L = []; L.push('*PESANAN BARU — ' + settings.store.name + '*'); L.push('No. Pesanan : ' + t.id); L.push('Tanggal     : ' + TB.fmtDateTime(t.createdAt)); L.push('');
    L.push('*DATA PELANGGAN*'); L.push('Nama        : ' + t.customer.name); L.push('WhatsApp    : ' + t.customer.phone); L.push('Pengiriman  : ' + TB.deliveryLabel(t.deliveryMethod));
    if (t.deliveryMethod !== 'pickup') { L.push('Alamat      : ' + t.customer.address); if (t.shippingLabel) L.push('Zona/Armada : ' + t.shippingLabel); }
    L.push(''); L.push('*DAFTAR BARANG*');
    t.items.forEach(function (i, n) { L.push((n + 1) + '. ' + i.name); L.push('   ' + TB.num(i.qty) + ' ' + i.unit + ' x ' + TB.rp(i.price) + ' = ' + TB.rp(i.qty * i.price)); });
    L.push(''); L.push('Subtotal : ' + TB.rp(t.subtotal)); if (t.discount) L.push('Diskon   : -' + TB.rp(t.discount) + (t.discountLabel ? ' (' + t.discountLabel + ')' : ''));
    L.push('Ongkir' + (t.deliveryMethod === 'pickup' ? '   : Ambil di toko' : ' (estimasi) : ' + (t.shippingNeedsConfirm ? 'dikonfirmasi toko' : TB.rp(t.shipping))));
    L.push('*TOTAL    : ' + TB.rp(t.total) + (t.shippingNeedsConfirm ? ' + ongkir' : '') + '*'); L.push(''); L.push('Pembayaran : ' + (t.paymentMethod === 'COD' ? 'Bayar di Tempat (COD)' : t.paymentMethod)); L.push('Status     : ' + t.paymentStatus);
    if (t.notes) L.push('Catatan    : ' + t.notes);
    L.push(''); L.push('_Pesanan belum final sampai dikonfirmasi oleh toko. Stok, jadwal, dan ongkir akan dikonfirmasi._'); return L.join('\n');
  };
  TB.whatsappUrl = function (t, settings) { const num = String(settings.store.whatsapp || '').replace(/\D/g, ''); return 'https://wa.me/' + num + '?text=' + encodeURIComponent(TB.buildWhatsAppText(t, settings)); };

  /* ---------------- UI: toast, modal, konfirmasi ---------------- */
  TB.toast = function (msg, type) {
    let box = document.getElementById('toasts'); if (!box) { box = document.createElement('div'); box.id = 'toasts'; box.setAttribute('role', 'status'); box.setAttribute('aria-live', 'polite'); document.body.appendChild(box); }
    const el = document.createElement('div'); el.className = 'toast ' + (type || 'info');
    el.innerHTML = '<span class="t-ic">' + TB.icon(type === 'ok' ? 'check' : type === 'error' ? 'alert' : 'info', 14) + '</span><span class="t-msg"></span>'; el.querySelector('.t-msg').textContent = msg; box.appendChild(el);
    while (box.children.length > 4) box.removeChild(box.firstChild);
    setTimeout(function () { el.classList.add('out'); setTimeout(function () { el.remove(); }, 300); }, type === 'error' ? 5200 : 3200);
  };
  TB.modal = function (opts) {
    const wrap = document.createElement('div'); wrap.className = 'modal-wrap';
    wrap.innerHTML = '<div class="modal" role="dialog" aria-modal="true" aria-label="' + TB.esc(opts.title || '') + '"><div class="modal-head"><h3>' + TB.esc(opts.title || '') + '</h3><button class="icon-btn" data-close aria-label="Tutup">' + TB.icon('x') + '</button></div><div class="modal-body"></div><div class="modal-foot"></div></div>';
    const body = TB.$('.modal-body', wrap), foot = TB.$('.modal-foot', wrap);
    if (typeof opts.body === 'string') body.innerHTML = opts.body; else if (opts.body) body.appendChild(opts.body);
    const prev = document.activeElement;
    function close(v) { wrap.remove(); document.body.classList.remove('modal-open'); if (prev && prev.focus) try { prev.focus(); } catch (e) { /* abaikan */ } if (opts.onClose) opts.onClose(v); }
    (opts.actions || []).forEach(function (a) {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'btn ' + (a.cls || 'btn-ghost'); b.textContent = a.label;
      b.addEventListener('click', function () { if (a.onClick) { const r = a.onClick(close, wrap); if (r === false) return; } if (a.close !== false) close(a.value); }); foot.appendChild(b);
    });
    if (!(opts.actions || []).length) foot.remove();
    wrap.addEventListener('click', function (e) { if (e.target === wrap || e.target.closest('[data-close]')) close(false); });
    wrap.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(false); });
    document.body.appendChild(wrap); document.body.classList.add('modal-open');
    const f = wrap.querySelector('input,select,textarea,.btn-primary,.btn'); if (f) f.focus();
    return { close: close, el: wrap };
  };
  TB.confirm = function (message, opts) {
    opts = opts || {};
    return new Promise(function (resolve) {
      TB.modal({ title: opts.title || 'Konfirmasi', body: '<p>' + TB.esc(message).replace(/\n/g, '<br>') + '</p>', onClose: function (v) { resolve(v === true); },
        actions: [{ label: opts.cancelLabel || 'Batal', cls: 'btn-ghost', value: false }, { label: opts.okLabel || 'Ya, lanjutkan', cls: opts.danger ? 'btn-danger' : 'btn-primary', value: true }] });
    });
  };
  TB.prompt = function (message, opts) {
    opts = opts || {};
    return new Promise(function (resolve) {
      let val = null;
      TB.modal({ title: opts.title || 'Isi data', body: '<label class="field"><span>' + TB.esc(message) + '</span><input type="text" class="input" id="prompt-input" placeholder="' + TB.esc(opts.placeholder || '') + '"></label>',
        onClose: function () { resolve(val); },
        actions: [{ label: 'Batal', cls: 'btn-ghost', value: false }, { label: opts.okLabel || 'OK', cls: opts.danger ? 'btn-danger' : 'btn-primary', close: false, onClick: function (close, wrap) { const v = TB.$('#prompt-input', wrap).value.trim(); if (opts.required && !v) { TB.toast('Kolom ini wajib diisi.', 'error'); return false; } if (opts.mustEqual && v !== opts.mustEqual) { TB.toast('Ketik persis: ' + opts.mustEqual, 'error'); return false; } val = v; close(true); } }] });
    });
  };

  TB.downloadFile = function (filename, text, mime) {
    const blob = new Blob([text], { type: mime || 'text/plain;charset=utf-8' }); const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = filename; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  };
  TB.downloadCSV = function (filename, rows) {
    const csv = '﻿' + rows.map(function (r) { return r.map(function (c) { c = c == null ? '' : String(c); return /[",\n;]/.test(c) ? '"' + c.replace(/"/g, '""') + '"' : c; }).join(','); }).join('\r\n');
    TB.downloadFile(filename, csv, 'text/csv;charset=utf-8');
  };

  /* ---------------- Cetak struk ---------------- */
  TB.receiptHtml = function (t, settings) {
    const s = settings.store; let h = '<div class="rcpt"><div class="rc-c"><b>' + TB.esc(s.name) + '</b><br>' + TB.esc(s.address) + '<br>Telp ' + TB.esc(s.phone) + '</div><hr>';
    h += '<div>No: ' + TB.esc(t.id) + '<br>Tgl: ' + TB.fmtDateTime(t.createdAt) + '<br>Kasir: ' + TB.esc(t.cashierName) + (t.customer && t.customer.name ? '<br>Pelanggan: ' + TB.esc(t.customer.name) : '') + '</div><hr>';
    t.items.forEach(function (i) { h += '<div>' + TB.esc(i.name) + '</div><div class="rc-r">' + TB.num(i.qty) + ' ' + TB.esc(i.unit) + ' x ' + TB.num(i.price) + ' = ' + TB.num(i.qty * i.price) + '</div>'; });
    h += '<hr><div class="rc-r">Subtotal: ' + TB.rp(t.subtotal) + '</div>'; if (t.discount) h += '<div class="rc-r">Diskon: -' + TB.rp(t.discount) + '</div>'; if (t.shipping) h += '<div class="rc-r">Ongkir: ' + TB.rp(t.shipping) + '</div>';
    h += '<div class="rc-r"><b>TOTAL: ' + TB.rp(t.total) + '</b></div><div class="rc-r">Bayar (' + TB.esc(t.paymentMethod) + '): ' + TB.rp(t.cashReceived != null ? t.cashReceived : t.total) + '</div>';
    if (t.change != null) h += '<div class="rc-r">Kembali: ' + TB.rp(t.change) + '</div>';
    if (t.voided) h += '<div class="rc-c"><b>*** DIBATALKAN ***</b></div>';
    h += '<hr><div class="rc-c">' + TB.esc(s.receiptFooter || '') + '</div></div>'; return h;
  };
  TB.printReceipt = function (t) {
    let a = document.getElementById('print-area'); if (!a) { a = document.createElement('div'); a.id = 'print-area'; document.body.appendChild(a); }
    a.innerHTML = TB.receiptHtml(t, store.getSettings()); setTimeout(function () { window.print(); }, 60);
  };

  /* ---------------- Tema ---------------- */
  TB.theme = {
    get: function () { return document.documentElement.getAttribute('data-theme') || 'light'; },
    set: function (t) { document.documentElement.setAttribute('data-theme', t); try { localStorage.setItem(KEYS.theme, t); } catch (e) { /* abaikan */ } TB.$$('[data-theme-toggle]').forEach(function (b) { b.innerHTML = TB.icon(t === 'dark' ? 'sun' : 'moon'); b.setAttribute('aria-label', t === 'dark' ? 'Ganti ke mode terang' : 'Ganti ke mode gelap'); b.title = b.getAttribute('aria-label'); }); },
    toggle: function () { TB.theme.set(TB.theme.get() === 'dark' ? 'light' : 'dark'); }
  };
  TB.themeButton = function () { return '<button class="icon-btn" type="button" data-theme-toggle aria-label="Ganti tema"></button>'; };

  /* ---------------- Keranjang (helper bersama) ---------------- */
  TB.cart = {
    get: function () { return store.getCart(); },
    count: function () { return store.getCart().reduce(function (a, c) { return a + 1 * (c.qty > 0 ? 1 : 0); }, 0); },
    add: function (productId, qty) {
      const p = svc.getProduct(productId); if (!p || !p.active) return { ok: false, msg: 'Produk tidak tersedia.' };
      qty = qty || TB.qtyStep(p); const cart = store.getCart(); const c = cart.find(function (x) { return x.productId === productId; });
      const next = TB.round2((c ? c.qty : 0) + qty);
      if (p.stock <= 0) return { ok: false, msg: p.name + ' stok habis.' };
      if (next > p.stock) return { ok: false, msg: 'Stok ' + p.name + ' hanya ' + TB.num(p.stock) + ' ' + p.unit + '.' };
      if (c) c.qty = next; else cart.push({ productId: productId, qty: next }); store.saveCart(cart); return { ok: true, qty: next };
    },
    setQty: function (productId, qty) {
      const p = svc.getProduct(productId); const cart = store.getCart(); const c = cart.find(function (x) { return x.productId === productId; }); if (!c || !p) return { ok: false, msg: 'Item tidak ditemukan.' };
      qty = TB.round2(qty); if (!(qty > 0)) { store.saveCart(cart.filter(function (x) { return x.productId !== productId; })); return { ok: true, removed: true }; }
      if (qty > p.stock) { c.qty = p.stock; store.saveCart(cart.filter(function (x) { return x.qty > 0; })); return { ok: false, msg: 'Stok ' + p.name + ' hanya ' + TB.num(p.stock) + ' ' + p.unit + '.', qty: p.stock }; }
      c.qty = qty; store.saveCart(cart); return { ok: true, qty: qty };
    },
    remove: function (productId) { store.saveCart(store.getCart().filter(function (x) { return x.productId !== productId; })); },
    clear: function () { store.saveCart([]); },
    lines: function () { const cart = store.getCart(); const out = []; cart.forEach(function (c) { const p = svc.getProduct(c.productId); if (p && p.active) out.push({ product: p, qty: c.qty }); }); return out; }
  };

  /* ---------------- Kerangka halaman (header/footer/dashboard) ---------------- */
  TB.NAV = {
    owner: [
      { href: 'owner.html', icon: 'dashboard', label: 'Dashboard', ic: 'chart' }, { href: 'kasir.html', label: 'Kasir (POS)', ic: 'cash' },
      { href: 'laporan.html#transaksi', label: 'Transaksi', ic: 'receipt' }, { href: 'laporan.html#penjualan', label: 'Laporan Penjualan', ic: 'chart' },
      { href: 'laporan.html#stok', label: 'Laporan Stok', ic: 'layers' }, { href: 'admin-stok.html', label: 'Produk & Stok', ic: 'box' },
      { href: 'pengaturan.html', label: 'Pengaturan Toko', ic: 'settings' }, { href: 'pengaturan.html#pengguna', label: 'Pengguna & Role', ic: 'users' },
      { href: 'kas.html', label: 'Kas & Pengeluaran', ic: 'wallet' }, { href: 'notifikasi.html', label: 'Notifikasi', ic: 'bell', notif: true },
      { href: 'laporan.html#audit', label: 'Catatan Audit', ic: 'shield' }, { href: 'index.html', label: 'Lihat Toko', ic: 'store' }],
    kasir: [
      { href: 'kasir.html', label: 'Transaksi Kasir', ic: 'cash' }, { href: 'kasir.html#riwayat', label: 'Riwayat Transaksi', ic: 'history' },
      { href: 'laporan.html#penjualan', label: 'Laporan Saya', ic: 'chart' }, { href: 'notifikasi.html', label: 'Notifikasi', ic: 'bell', notif: true }, { href: 'index.html', label: 'Lihat Toko', ic: 'store' }],
    admin: [
      { href: 'admin-stok.html', label: 'Inventaris', ic: 'box' }, { href: 'admin-stok.html#mutasi', label: 'Stok Masuk / Keluar', ic: 'layers' },
      { href: 'admin-stok.html#riwayat', label: 'Riwayat Stok', ic: 'history' }, { href: 'admin-stok.html#kategori', label: 'Kategori & Satuan', ic: 'tag' },
      { href: 'laporan.html#stok', label: 'Laporan Stok', ic: 'chart' }, { href: 'notifikasi.html', label: 'Notifikasi', ic: 'bell', notif: true }, { href: 'index.html', label: 'Lihat Toko', ic: 'store' }]
  };

  /* ---------------- Notifikasi ---------------- */
  TB.NOTIF_TYPES = { order: { ic: 'receipt', label: 'Pesanan' }, payment: { ic: 'check', label: 'Pembayaran' }, stock: { ic: 'alert', label: 'Stok' }, stockin: { ic: 'box', label: 'Stok' }, cancel: { ic: 'undo', label: 'Pembatalan' }, kas: { ic: 'wallet', label: 'Kas' }, delivery: { ic: 'truck', label: 'Pengiriman' }, system: { ic: 'info', label: 'Sistem' } };
  TB.timeAgo = function (iso) {
    const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
    if (s < 60) return 'baru saja'; if (s < 3600) return Math.floor(s / 60) + ' mnt lalu'; if (s < 86400) return Math.floor(s / 3600) + ' jam lalu';
    if (s < 7 * 86400) return Math.floor(s / 86400) + ' hari lalu'; return TB.fmtDate(iso);
  };
  TB.notifVisible = function (n, role) { return !n.for || n.for === role || (n.for === 'staff' && role !== 'publik'); };
  TB.notifHref = function (n, role) {
    if (!n.ref) return ''; if (n.type === 'stock' || n.type === 'stockin') return role === 'kasir' ? '' : 'admin-stok.html';
    if (n.type === 'kas') return role === 'owner' ? 'kas.html' : ''; return 'laporan.html?q=' + encodeURIComponent(n.ref) + '#transaksi';
  };
  TB.notifItem = function (n, role) {
    const t = TB.NOTIF_TYPES[n.type] || TB.NOTIF_TYPES.system; const href = TB.notifHref(n, role);
    return '<' + (href ? 'a href="' + href + '"' : 'div') + ' class="nt-item' + (n.read ? '' : ' unread') + '" data-nid="' + TB.esc(n.id) + '"><span class="nt-ic ' + TB.esc(n.level || 'info') + '">' + TB.icon(t.ic, 16) + '</span><span class="nt-tx"><b>' + TB.esc(n.title) + '</b><span>' + TB.esc(n.body || '') + '</span><small>' + TB.timeAgo(n.at) + '</small></span></' + (href ? 'a' : 'div') + '>';
  };
  TB.notifs = {
    mine: function (role) { return store.getNotifs().filter(function (n) { return TB.notifVisible(n, role); }); },
    markRead: function (ids) { const l = store.getNotifs(); let ch = false; const all = ids === 'all'; l.forEach(function (n) { if (!n.read && (all || ids.indexOf(n.id) >= 0)) { n.read = true; ch = true; } }); if (ch) store.saveNotifs(l); },
    badge: function () { const n = store.unreadCount(); TB.$$('[data-notif-badge]').forEach(function (b) { b.textContent = n > 99 ? '99+' : n; b.hidden = n === 0; }); }
  };


  TB.renderFooter = function (el, compact) {
    const s = store.getSettings().store;
    if (compact) { el.innerHTML = '<div class="dash-credit"><a href="' + TB.CONFIG.DEVELOPER_URL + '" target="_blank" rel="noopener">' + TB.esc(TB.CONFIG.FOOTER_CREDIT) + '</a></div>'; return; }
    const cats = store.getCategories().slice(0, 8); const waNum = String(s.whatsapp || '').replace(/\D/g, '');
    el.innerHTML = '<footer class="site-footer" id="kontak"><div class="container foot-grid"><div><div class="brand brand-light">' + TB.logo(40) + '<div><b>' + TB.esc(s.name) + '</b><small>Mitra Material Konstruksi</small></div></div><p class="muted-light" style="margin-top:14px">' + TB.esc(s.tagline) + '</p>' +
      '<ul class="foot-list"><li>' + TB.icon('pin', 16) + '<span>' + TB.esc(s.address) + '</span></li><li>' + TB.icon('clock', 16) + '<span>' + TB.esc(s.hours) + '</span></li><li>' + TB.icon('phone', 16) + '<span>' + TB.esc(s.phone) + '</span></li></ul>' +
      (waNum.length >= 8 ? '<a class="btn btn-wa btn-sm foot-wa" href="https://wa.me/' + waNum + '" target="_blank" rel="noopener">' + TB.icon('wa', 16) + ' Chat WhatsApp</a>' : '') + '</div>' +
      '<div class="foot-cols"><div><h4>Navigasi</h4><ul class="foot-list"><li><a href="index.html">Home</a></li><li><a href="katalog.html">Katalog Produk</a></li><li><a href="index.html#promo">Promo</a></li><li><a href="index.html#pengiriman">Pengiriman</a></li><li><a href="index.html#tentang">Tentang</a></li><li><a href="keranjang.html">Keranjang</a></li><li><a href="login.html">Login Staf</a></li></ul></div>' +
      '<div><h4>Kategori</h4><ul class="foot-list">' + cats.map(function (c) { return '<li><a href="katalog.html?cat=' + encodeURIComponent(c.id) + '">' + TB.esc(c.short || c.name) + '</a></li>'; }).join('') + '</ul></div></div>' +
      '<div><h4>Informasi Pengiriman</h4><ul class="foot-list"><li>' + TB.icon('truck', 16) + '<span>Ambil di toko atau diantar kendaraan toko ke lokasi proyek.</span></li><li>' + TB.icon('pin', 16) + '<span>Ongkir diestimasi per zona; biaya akhir dikonfirmasi toko.</span></li><li>' + TB.icon('wa', 16) + '<span>Pesanan dikirim dan dikonfirmasi lewat WhatsApp.</span></li></ul></div></div>' +
      '<div class="container foot-bottom"><span>© ' + new Date().getFullYear() + ' ' + TB.esc(s.name) + '. Versi prototipe: harga, stok, dan transaksi adalah data demo yang tersimpan di browser (LocalStorage), bukan data server.</span><a class="dev-credit" href="' + TB.CONFIG.DEVELOPER_URL + '" target="_blank" rel="noopener">' + TB.esc(TB.CONFIG.FOOTER_CREDIT) + '</a></div></footer>';
  };

  TB.renderPublicHeader = function (el, active) {
    const s = store.getSettings().store; const user = TB.auth && TB.auth.current();
    const links = [['index.html', 'Home', 'home', 'home'], ['katalog.html', 'Katalog', 'grid', 'katalog'], ['index.html#promo', 'Promo', 'tag', 'promo'], ['index.html#pengiriman', 'Pengiriman', 'truck', 'pengiriman'], ['index.html#tentang', 'Tentang', 'info', 'tentang']];
    el.innerHTML = '<header class="site-header"><div class="container hdr-row"><a class="brand" href="index.html" aria-label="' + TB.esc(s.name) + '">' + TB.logo(40) + '<div><b>' + TB.esc(s.name) + '</b><small>Mitra Material Konstruksi</small></div></a>' +
      '<nav class="hdr-nav" id="hdr-nav" aria-label="Navigasi utama">' + links.map(function (l) { return '<a href="' + l[0] + '" class="' + (active === l[3] ? 'active' : '') + '">' + TB.icon(l[2], 17) + '<span>' + l[1] + '</span></a>'; }).join('') + '</nav>' +
      '<form class="hdr-search" role="search" id="hdr-search"><input type="search" class="input" id="hdr-q" placeholder="Cari semen, pasir, bata, besi, keramik..." aria-label="Cari produk" autocomplete="off"><button type="submit" class="search-btn" aria-label="Cari">' + TB.icon('search', 18) + '</button></form>' +
      '<div class="hdr-actions">' + TB.themeButton() + '<a class="icon-btn cart-btn" href="keranjang.html" aria-label="Keranjang belanja">' + TB.icon('cart', 22) + '<span class="badge" id="cart-badge" hidden>0</span></a>' +
      (user ? '<a class="btn btn-primary btn-sm hdr-login" href="' + TB.ROLES[user.role].home + '">' + TB.icon('user', 16) + '<span>' + TB.esc(user.name.split(' ')[0]) + '</span></a>' : '<a class="btn btn-primary btn-sm hdr-login" href="login.html">' + TB.icon('user', 16) + '<span>Login</span></a>') +
      '<button class="icon-btn" id="mnav-btn" type="button" aria-label="Buka menu" aria-expanded="false" aria-controls="mnav">' + TB.icon('menu', 22) + '</button></div></div>' +
      '<nav class="mnav" id="mnav" aria-label="Menu lengkap">' + links.concat([['keranjang.html', 'Keranjang', 'cart', 'keranjang']]).map(function (l) { return '<a href="' + l[0] + '">' + TB.icon(l[2], 18) + '<span>' + l[1] + '</span></a>'; }).join('') + '</nav></header>' +
      '<nav class="bnav" aria-label="Menu bawah">' + [['index.html', 'Beranda', 'home', 'home'], ['katalog.html', 'Katalog', 'grid', 'katalog'], ['index.html#promo', 'Promo', 'tag', 'promo'], ['keranjang.html', 'Keranjang', 'cart', 'keranjang'], [user ? TB.ROLES[user.role].home : 'login.html', user ? 'Akun' : 'Login', 'user', 'login']].map(function (l) { return '<a href="' + l[0] + '" class="' + (active === l[3] ? 'active' : '') + '">' + TB.icon(l[2], 22) + '<span>' + l[1] + '</span>' + (l[3] === 'keranjang' ? '<span class="badge" id="cart-badge2" hidden>0</span>' : '') + '</a>'; }).join('') + '</nav>';
    TB.$('#hdr-search').addEventListener('submit', function (e) { e.preventDefault(); const q = TB.$('#hdr-q').value.trim(); location.href = 'katalog.html' + (q ? '?q=' + encodeURIComponent(q) : ''); });
    const mb = TB.$('#mnav-btn'), mn = TB.$('#mnav'); mb.addEventListener('click', function () { const o = mn.classList.toggle('open'); mb.setAttribute('aria-expanded', o ? 'true' : 'false'); mb.innerHTML = TB.icon(o ? 'x' : 'menu', 22); });
    mn.addEventListener('click', function (e) { if (e.target.closest('a')) mn.classList.remove('open'); });
    const q0 = TB.param('q'); if (q0 && TB.$('#hdr-q')) TB.$('#hdr-q').value = q0;
    TB.updateCartBadge();
  };
  TB.updateCartBadge = function () {
    const n = store.getCart().length; ['cart-badge', 'cart-badge2'].forEach(function (id) { const b = document.getElementById(id); if (b) { b.textContent = n > 99 ? '99+' : n; b.hidden = n === 0; } });
  };
  TB.on('cart', TB.updateCartBadge);

  TB.renderDash = function (opts) {
    const user = TB.auth.current(); if (!user) return; const role = user.role;
    const side = TB.$('#dash-side'), top = TB.$('#dash-top'), foot = TB.$('#dash-foot'); const s = store.getSettings().store;
    const nav = TB.NAV[role] || [];
    side.innerHTML = '<div class="side-head"><a class="brand brand-light" href="index.html">' + TB.logo(36) + '<div><b>' + TB.esc(s.name) + '</b><small>' + TB.ROLES[role].label + '</small></div></a><button class="icon-btn side-close" id="side-close" aria-label="Tutup menu">' + TB.icon('x') + '</button></div>' +
      '<nav class="side-nav" aria-label="Menu dashboard">' + nav.map(function (n) { return '<a href="' + n.href + '" data-href="' + n.href + '">' + TB.icon(n.ic, 18) + '<span>' + n.label + '</span>' + (n.notif ? '<span class="badge side-badge" data-notif-badge hidden>0</span>' : '') + '</a>'; }).join('') + '</nav>' +
      '<div class="side-foot"><div class="side-user"><div class="avatar">' + TB.esc(user.name.charAt(0)) + '</div><div><b>' + TB.esc(user.name) + '</b><small>' + TB.esc(user.email) + '</small></div></div><button class="btn btn-ghost-light btn-block" id="chgpw-btn">' + TB.icon('lock', 18) + ' Ganti Password</button><button class="btn btn-ghost-light btn-block" id="logout-btn">' + TB.icon('logout', 18) + ' Keluar</button></div>';
    top.innerHTML = '<button class="icon-btn" id="side-open" aria-label="Buka menu">' + TB.icon('menu', 22) + '</button><div class="top-title"><h1>' + TB.esc(opts.title || '') + '</h1><small id="top-clock"></small></div><div class="top-right"><span class="status-pill" title="Data tersimpan di browser perangkat ini (LocalStorage), tidak tersinkron antar perangkat">' + TB.icon('database', 14) + ' Data lokal · demo</span><div class="notif-wrap"><button class="icon-btn" type="button" id="notif-btn" aria-label="Notifikasi" aria-expanded="false" aria-haspopup="true">' + TB.icon('bell', 22) + '<span class="badge" data-notif-badge hidden>0</span></button><div class="notif-panel" id="notif-panel" hidden></div></div>' + TB.themeButton() + '<span class="top-user">' + TB.icon('user', 16) + TB.esc(user.name) + '</span><button class="btn btn-outline btn-sm" id="logout-top">' + TB.icon('logout', 16) + '<span>Keluar</span></button></div>';
    TB.renderFooter(foot, true);
    function mark() { const cur = (location.pathname.split('/').pop() || 'index.html') + location.hash; const exact = TB.$$('.side-nav a').find(function (a) { return a.getAttribute('data-href') === cur; }); TB.$$('.side-nav a').forEach(function (a) { a.classList.remove('active'); }); const pick = exact || TB.$$('.side-nav a').find(function (a) { return a.getAttribute('data-href') === (location.pathname.split('/').pop() || 'index.html'); }); if (pick) pick.classList.add('active'); }
    mark(); window.addEventListener('hashchange', function () { mark(); closeSide(); });
    const dash = TB.$('#dash'); function closeSide() { dash.classList.remove('side-open'); }
    TB.$('#side-open').addEventListener('click', function () { dash.classList.add('side-open'); }); TB.$('#side-close').addEventListener('click', closeSide); TB.$('#dash-scrim').addEventListener('click', closeSide);
    function out() { TB.auth.logout(); location.href = 'login.html'; } TB.$('#logout-btn').addEventListener('click', out); TB.$('#logout-top').addEventListener('click', out); TB.$('#chgpw-btn').addEventListener('click', function () { TB.auth.openChangePassword(); });
    if (TB.param('denied')) { TB.toast('Anda tidak punya akses ke halaman tersebut.', 'error'); }
    if (user.mustChange && !sessionStorage.getItem('tb_pwnote')) { try { sessionStorage.setItem('tb_pwnote', '1'); } catch (e) { /* abaikan */ } TB.toast('Anda masih memakai password demo. Segera ganti lewat menu "Ganti Password".', 'info'); }
    /* Lonceng notifikasi */
    const nb = TB.$('#notif-btn'), np = TB.$('#notif-panel');
    function fillPanel() {
      const list = TB.notifs.mine(role).slice(-8).reverse();
      np.innerHTML = '<div class="np-head"><b>Notifikasi</b><button type="button" class="link-more small" id="np-readall">Tandai semua dibaca</button></div><div class="np-list">' + (list.map(function (n) { return TB.notifItem(n, role); }).join('') || '<div class="empty">Belum ada notifikasi.</div>') + '</div><a class="np-foot" href="notifikasi.html">Lihat semua notifikasi ' + TB.icon('arrow', 14) + '</a>';
      const ra = TB.$('#np-readall', np); if (ra) ra.addEventListener('click', function () { TB.notifs.markRead('all'); fillPanel(); TB.notifs.badge(); });
    }
    if (nb && np) {
      nb.addEventListener('click', function (e) { e.stopPropagation(); const o = np.hidden; if (o) fillPanel(); np.hidden = !o; nb.setAttribute('aria-expanded', o ? 'true' : 'false'); });
      np.addEventListener('click', function (e) { const it = e.target.closest('[data-nid]'); if (it) TB.notifs.markRead([it.getAttribute('data-nid')]); });
      document.addEventListener('click', function (e) { if (!np.hidden && !e.target.closest('.notif-wrap')) { np.hidden = true; nb.setAttribute('aria-expanded', 'false'); } });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !np.hidden) { np.hidden = true; nb.focus(); } });
    }
    TB.notifs.badge(); TB.on('notifs', TB.notifs.badge); TB.on('datachange', function (k) { if (/notifs/.test(k || '')) TB.notifs.badge(); }); setInterval(TB.notifs.badge, 30000);
    function tick() { const el = TB.$('#top-clock'); if (el) el.textContent = new Date().toLocaleString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }); } tick(); setInterval(tick, 30000);
  };

  /* ---------------- Kartu produk bersama (Home & Katalog) ---------------- */
  TB.hydrate = function (root) {
    TB.$$('[data-ic]', root).forEach(function (el) { el.innerHTML = TB.icon(el.getAttribute('data-ic'), parseInt(el.getAttribute('data-size'), 10) || 20); el.removeAttribute('data-ic'); });
    TB.$$('[data-logo]', root).forEach(function (el) { el.innerHTML = TB.logo(parseInt(el.getAttribute('data-logo'), 10) || 40); el.removeAttribute('data-logo'); });
  };
  TB.promoPct = function (p) { return TB.isPromo(p) ? Math.round((1 - p.promoPrice / p.price) * 100) : 0; };
  TB.productUrl = function (p) { return 'produk.html?id=' + encodeURIComponent(p.id); };
  TB.waProductUrl = function (p) {
    const num = String(store.getSettings().store.whatsapp || '').replace(/\D/g, ''); if (num.length < 8) return '';
    return 'https://wa.me/' + num + '?text=' + encodeURIComponent('Halo ' + store.getSettings().store.name + ', saya ingin bertanya tentang produk:\n*' + p.name + '* (SKU ' + p.sku + ')\nHarga: ' + TB.rp(TB.effPrice(p)) + ' / ' + p.unit + '\nApakah stoknya tersedia dan bisa dikirim?');
  };
  TB.imgTag = function (p, cls, w) {
    return '<img src="' + TB.productImage(p) + '" alt="' + TB.esc(p.name) + '" loading="lazy" decoding="async" width="' + (w || 480) + '" height="' + (w || 480) + '"' + (cls ? ' class="' + cls + '"' : '') + ' onerror="this.onerror=null;this.src=TB.productImageFallback(' + "TB.svc.getProduct('" + p.id + "')" + ')">';
  };
  /* opts.best: tandai "Terlaris" (dari data penjualan/unggulan) */
  TB.productCard = function (p, opts) {
    opts = opts || {}; const st = TB.stockStatus(p), promo = TB.isPromo(p), out = p.stock <= 0, nm = TB.esc(p.name), step = TB.qtyStep(p), url = TB.productUrl(p);
    return '<article class="prod" data-id="' + p.id + '"><a href="' + url + '" class="pimg" aria-label="Lihat detail ' + nm + '">' + TB.imgTag(p) +
      (promo ? '<span class="pill promo">PROMO -' + TB.promoPct(p) + '%</span>' : '') + (out ? '<span class="pill bad oos">Habis</span>' : '') + (opts.best && !out ? '<span class="pill best">Terlaris</span>' : '') + '</a>' +
      '<div class="pbody"><div class="pbrand">' + TB.esc(p.brand) + '</div><a class="pname" href="' + url + '">' + nm + '</a>' +
      '<div><span class="price">' + TB.rp(TB.effPrice(p)) + ' <small>/ ' + TB.esc(p.unit) + '</small></span>' + (promo ? '<span class="price-old">' + TB.rp(p.price) + '</span>' : '') + '</div>' +
      '<div class="stock ' + st.cls + '">' + st.label + (p.stock > 0 ? ' · ' + TB.num(p.stock) + ' ' + TB.esc(p.unit) : '') + '</div>' +
      '<div class="pact"><div class="qty" role="group" aria-label="Jumlah ' + nm + '"><button type="button" data-qm aria-label="Kurangi"' + (out ? ' disabled' : '') + '>' + TB.icon('minus', 14) + '</button><input type="number" data-qin min="' + step + '" max="' + p.stock + '" step="' + step + '" value="' + step + '" aria-label="Jumlah"' + (out ? ' disabled' : '') + '><button type="button" data-qp aria-label="Tambah"' + (out ? ' disabled' : '') + '>' + TB.icon('plus', 14) + '</button></div>' +
      '<button class="btn btn-primary btn-cart" type="button" data-add="' + p.id + '"' + (out ? ' disabled' : '') + ' aria-label="Tambah ' + nm + ' ke keranjang">' + TB.icon('cart', 18) + '<span>' + (out ? 'Stok Habis' : 'Tambah') + '</span></button></div></div></article>';
  };
  /* Ringkasan cepat (modal) — tetap tersedia; halaman detail lengkap: produk.html */
  TB.productDetail = function (id) { location.href = TB.productUrl({ id: id }); };
  TB.bindProducts = function (root) {
    root.addEventListener('click', function (e) {
      const card = e.target.closest('.prod');
      const m = e.target.closest('[data-qm],[data-qp]');
      if (m && card) { const inp = card.querySelector('[data-qin]'); const p = svc.getProduct(card.getAttribute('data-id')); const step = TB.qtyStep(p); let v = parseFloat(inp.value) || step; v = m.hasAttribute('data-qp') ? v + step : v - step; v = Math.max(step, Math.min(p.stock, TB.round2(v))); inp.value = v; return; }
      const a = e.target.closest('[data-add]');
      if (a) { const inp = card && card.querySelector('[data-qin]'); let q = inp ? parseFloat(inp.value) : 0; const p = svc.getProduct(a.getAttribute('data-add')); if (!(q > 0)) q = TB.qtyStep(p); const r = TB.cart.add(a.getAttribute('data-add'), q); TB.toast(r.ok ? 'Ditambahkan ke keranjang.' : r.msg, r.ok ? 'ok' : 'error'); }
    });
  };
  /* Penjualan per produk. Hasil di-cache per sesi dengan tanda tangan data transaksi, agar halaman publik
     tidak mem-parse seluruh riwayat transaksi (bisa beberapa MB) setiap dibuka. */
  TB.soldMap = function () {
    let sig = ''; try { const raw = localStorage.getItem(KEYS.transactions) || ''; sig = raw.length + ':' + raw.slice(-64); } catch (e) { /* abaikan */ }
    try { const c = sessionStorage.getItem('tb_sold_cache'); if (c && sig) { const o = JSON.parse(c); if (o && o.sig === sig) return o.map; } } catch (e) { /* abaikan */ }
    const m = {}; svc.activeTransactions().forEach(function (t) { t.items.forEach(function (i) { m[i.productId] = (m[i.productId] || 0) + i.qty; }); });
    try { sessionStorage.setItem('tb_sold_cache', JSON.stringify({ sig: sig, map: m })); } catch (e) { /* abaikan */ }
    return m;
  };
  TB.tablePager = function (el, page, pages, onGo) {
    if (pages <= 1) { el.innerHTML = ''; return; }
    el.innerHTML = '<button class="btn btn-outline btn-sm" data-go="' + (page - 1) + '"' + (page <= 1 ? ' disabled' : '') + '>‹ Sebelumnya</button><span class="small muted">Hal. ' + page + ' / ' + pages + '</span><button class="btn btn-outline btn-sm" data-go="' + (page + 1) + '"' + (page >= pages ? ' disabled' : '') + '>Berikutnya ›</button>';
    TB.$$('[data-go]', el).forEach(function (b) { b.addEventListener('click', function () { onGo(parseInt(b.getAttribute('data-go'), 10)); }); });
  };
  TB.statusPill = function (t) {
    const map = { 'Lunas': 'ok', 'Menunggu Pembayaran': 'warn', 'COD (Belum Dibayar)': 'warn', 'Bayar di Toko': 'info' };
    return '<span class="pill ' + (t.voided ? 'bad' : map[t.paymentStatus] || '') + '">' + (t.voided ? 'Dibatalkan' : TB.esc(t.paymentStatus)) + '</span>';
  };

  /* Detail transaksi (dipakai bersama halaman lain) */
  TB.showTransaction = function (t, opts) {
    if (!t) return; opts = opts || {};
    const body = '<dl class="detail-grid"><div><dt>No. Transaksi</dt><dd>' + TB.esc(t.id) + '</dd></div><div><dt>Waktu</dt><dd>' + TB.fmtDateTime(t.createdAt) + '</dd></div><div><dt>Pelanggan</dt><dd>' + TB.esc(t.customer.name || '-') + (t.customer.phone ? ' · ' + TB.esc(t.customer.phone) : '') + '</dd></div><div><dt>Kasir</dt><dd>' + TB.esc(t.cashierName) + '</dd></div><div><dt>Metode / Status</dt><dd>' + TB.esc(t.paymentMethod) + ' · ' + TB.statusPill(t) + '</dd></div><div><dt>Pengiriman</dt><dd>' + TB.deliveryLabel(t.deliveryMethod) + '</dd></div>' + (t.customer.address ? '<div style="grid-column:1/-1"><dt>Alamat</dt><dd>' + TB.esc(t.customer.address) + '</dd></div>' : '') + (t.notes ? '<div style="grid-column:1/-1"><dt>Catatan</dt><dd>' + TB.esc(t.notes) + '</dd></div>' : '') + '</dl>' +
      '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Barang</th><th class="num">Qty</th><th class="num">Harga</th><th class="num">Jumlah</th></tr></thead><tbody>' + t.items.map(function (i) { return '<tr><td>' + TB.esc(i.name) + '</td><td class="num">' + TB.num(i.qty) + ' ' + TB.esc(i.unit) + '</td><td class="num">' + TB.rp(i.price) + '</td><td class="num">' + TB.rp(i.qty * i.price) + '</td></tr>'; }).join('') + '</tbody></table></div>' +
      '<div style="max-width:300px;margin-left:auto"><div class="sum-row"><span>Subtotal</span><b>' + TB.rp(t.subtotal) + '</b></div>' + (t.discount ? '<div class="sum-row disc"><span>Diskon</span><b>-' + TB.rp(t.discount) + '</b></div>' : '') + (t.shipping ? '<div class="sum-row"><span>Ongkir</span><b>' + TB.rp(t.shipping) + '</b></div>' : '') + '<div class="sum-row total"><span>Total</span><span>' + TB.rp(t.total) + '</span></div></div>' +
      (t.voided ? '<div class="alert bad" style="margin-top:12px"><b>Dibatalkan</b>&nbsp;oleh ' + TB.esc(t.voidedBy) + ': ' + TB.esc(t.voidReason) + '</div>' : '') +
      (opts.audit && t.audit && t.audit.length ? '<h4 style="margin-top:14px">Jejak Audit</h4><ul class="timeline">' + t.audit.map(function (a) { return '<li><b>' + TB.fmtDateTime(a.at) + '</b> · ' + TB.esc(a.by) + ' — ' + TB.esc(a.action) + '</li>'; }).join('') + '</ul>' : '');
    TB.modal({ title: 'Detail ' + t.id, body: body, actions: [{ label: 'Cetak Struk', cls: 'btn-outline', close: false, onClick: function () { TB.printReceipt(t); return false; } }].concat(opts.extra || []).concat([{ label: 'Tutup', cls: 'btn-primary' }]) });
  };


  /* Penanda pilihan radio (pengganti :has() agar jalan di browser lama / Windows 7) */
  TB.syncOpts = function () { TB.$$('label.opt, .pay-methods label').forEach(function (l) { const i = l.querySelector('input'); if (i) l.classList.toggle('sel', i.checked); }); };
  document.addEventListener('change', function (e) { if (e.target && e.target.type === 'radio') TB.syncOpts(); });

  /* ---------------- Inisialisasi halaman ---------------- */
  const readyQueue = []; let isReady = false;
  TB.ready = function (fn) { if (isReady) fn(); else readyQueue.push(fn); };
  TB.warnDemo = function (el) { /* banner data demo */ if (store.getSettings().store.demoNotice && el) el.innerHTML = '<div class="demo-banner">' + TB.icon('info', 16) + ' <span><b>Mode prototipe:</b> harga, stok, dan transaksi adalah <b>data demo</b> yang tersimpan di browser ini (LocalStorage) dan dapat diubah di dashboard.</span></div>'; };

  function init() {
    try { store.ensureSeed(); } catch (e) { console.error(e); store.errors.push('Gagal menyiapkan data: ' + e.message); }
    TB.theme.set(TB.theme.get());
    document.addEventListener('click', function (e) { const b = e.target.closest('[data-theme-toggle]'); if (b) TB.theme.toggle(); });
    /* Loading screen 3 detik */
    const ld = document.getElementById('tb-loader');
    if (ld) {
      if (document.documentElement.classList.contains('no-loader')) ld.remove();
      else {
        const wait = Math.max(0, TB.CONFIG.LOADER_MS - (window.performance ? performance.now() : 0));
        const pct = document.getElementById('ld-pct'), msg = document.getElementById('ld-msg'), t0 = Date.now() - (window.performance ? performance.now() : 0), total = TB.CONFIG.LOADER_MS;
        const steps = ['Menyiapkan sistem…', 'Memuat katalog material…', 'Menyiapkan keranjang & data lokal…', 'Hampir siap…'];
        let finished = false, tick = 0;
        function finish() { if (finished) return; finished = true; clearInterval(tick); ld.classList.add('done'); document.documentElement.classList.remove('loading'); setTimeout(function () { ld.remove(); }, 600); }
        tick = setInterval(function () { const r = Math.min(1, (Date.now() - t0) / total); if (pct) pct.textContent = Math.round(r * 100) + '%'; if (msg) msg.textContent = steps[Math.min(steps.length - 1, Math.floor(r * steps.length))]; }, 100);
        setTimeout(finish, wait);
        const sk = document.getElementById('ld-skip'); if (sk) sk.addEventListener('click', finish);
        try { if (TB.CONFIG.LOADER_ONCE_PER_SESSION) sessionStorage.setItem('tb_loaded', '1'); } catch (e) { /* abaikan */ }
      }
    }
    const body = document.body; const guard = body.getAttribute('data-roles');
    if (guard) { const ok = TB.auth.requireRole(guard.split(',')); if (!ok) return; }
    const shell = body.getAttribute('data-shell');
    if (shell === 'public') { TB.renderPublicHeader(TB.$('#site-header'), body.getAttribute('data-active')); TB.renderFooter(TB.$('#site-footer')); try { const wn = String(store.getSettings().store.whatsapp || '').replace(/\D/g, ''); if (wn.length >= 8 && !document.querySelector('.wa-fab')) { const f = document.createElement('a'); f.className = 'wa-fab'; f.target = '_blank'; f.rel = 'noopener'; f.href = 'https://wa.me/' + wn + '?text=' + encodeURIComponent('Halo, saya ingin bertanya tentang material bangunan.'); f.setAttribute('aria-label', 'Chat WhatsApp toko'); f.innerHTML = TB.icon('wa', 22) + '<span>Tanya via WhatsApp</span>'; document.body.appendChild(f); } } catch (e) { /* abaikan */ } }
    if (shell === 'dash') TB.renderDash({ title: body.getAttribute('data-title') });
    TB.theme.set(TB.theme.get());
    body.classList.remove('guard-pending');
    TB.hydrate(document); TB.syncOpts();
    if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) { navigator.serviceWorker.register('sw.js').catch(function () { /* opsional */ }); }
    store.errors.splice(0).forEach(function (m) { TB.toast(m, 'error'); });
    isReady = true; readyQueue.splice(0).forEach(function (f) { try { f(); } catch (e) { console.error(e); TB.toast('Terjadi kesalahan: ' + e.message, 'error'); } });
  }
  window.addEventListener('storage', function (e) { if (e.key && e.key.indexOf(P) === 0) { TB.emit('datachange', e.key); if (e.key === KEYS.cart) TB.updateCartBadge(); } });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  window.addEventListener('error', function (e) { console.error(e.error || e.message); });
})();
