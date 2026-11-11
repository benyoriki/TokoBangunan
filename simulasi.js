/* =====================================================================
   simulasi.js — Generator data simulasi + uji performa (hanya dimuat di Pengaturan)
   Membuat riwayat toko yang meniru operasional nyata, dengan beban "sibuk":
   transaksi POS & pesanan online, stok berkurang (penjualan, rusak, koreksi)
   dan bertambah (pembelian dari supplier), kas masuk/keluar, notifikasi, audit.
   Deterministik (seed tetap) agar hasil uji dapat diulang & dibandingkan.
   Semua data ditandai demo:true dan dapat dikembalikan ke data awal.
   ===================================================================== */
(function () {
  'use strict';
  const sim = TB.sim = {};
  const DAY = 864e5, HOUR = 36e5, MIN = 6e4;

  /* Beban dasar: toko material skala menengah ± 35 transaksi/hari. "Sibuk 2x" = ± 70/hari. */
  sim.BASE_PER_DAY = 35;
  sim.LOADS = { 1: 'Normal (1x)', 2: 'Sibuk (2x) — disarankan', 3: 'Ekstrem (3x)' };
  sim.DAYS = [14, 30, 45, 60];
  sim.BYTES_PER_TXN_DAY = 1; // dikalibrasi di bawah (estimate)

  function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  /* ---------- data referensi ---------- */
  const FIRST = ['Slamet', 'Budi', 'Joko', 'Agus', 'Hendra', 'Sugeng', 'Eko', 'Wahyu', 'Bambang', 'Yanto', 'Rudi', 'Dedi', 'Tono', 'Ujang', 'Asep', 'Cecep', 'Maman', 'Parman', 'Mulyadi', 'Supri', 'Sarno', 'Warno', 'Darman', 'Heri', 'Anto', 'Rahmat', 'Sutrisno', 'Imam', 'Fajar', 'Dwi', 'Ahmad', 'Rizki', 'Andi', 'Yusuf', 'Ilham', 'Bayu', 'Teguh', 'Sholeh', 'Kurniawan', 'Hasan'];
  const LAST = ['Santoso', 'Wibowo', 'Pratama', 'Susilo', 'Hidayat', 'Saputra', 'Nugroho', 'Setiawan', 'Lestari', 'Rahayu', 'Wijaya', 'Kusuma', 'Utomo', 'Firmansyah', 'Maulana', 'Permana', 'Purnomo', 'Hartono', 'Siregar', 'Harahap', 'Simanjuntak', 'Nasution', 'Gunawan', 'Halim', 'Suryadi'];
  const WOMEN = ['Siti', 'Ratna', 'Dewi', 'Sari', 'Wati', 'Lina', 'Yuni', 'Rina', 'Fitri', 'Endang', 'Nurhayati', 'Sri', 'Tuti', 'Ani', 'Maya'];
  const FIRMS = ['CV Karya Mandiri', 'PT Bangun Persada', 'UD Sumber Makmur', 'CV Tiga Saudara', 'PT Cipta Griya Nusantara', 'CV Putra Perkasa', 'PT Anugerah Konstruksi', 'CV Mitra Sejahtera', 'UD Berkah Jaya', 'PT Graha Mulia Abadi', 'CV Surya Utama', 'CV Bumi Karya Lestari', 'PT Kencana Bangun Sejati', 'UD Rizki Bersama'];
  const STREETS = ['Melati', 'Kenanga', 'Mawar', 'Anggrek', 'Cempaka', 'Pahlawan', 'Merdeka', 'Diponegoro', 'Sudirman', 'Ahmad Yani', 'Gajah Mada', 'Veteran', 'Kemuning', 'Flamboyan', 'Dahlia', 'Teratai', 'Pemuda', 'Raya Industri'];
  const AREAS = ['Sukamaju', 'Mekar Jaya', 'Karang Anyar', 'Tegal Sari', 'Harapan Baru', 'Sidomulyo', 'Cibeunying', 'Bumi Asri', 'Pondok Indah Baru', 'Rejosari', 'Sumber Rejeki', 'Wonosari'];
  const PREFIX = ['0812', '0813', '0821', '0822', '0852', '0853', '0857', '0858', '0877', '0878', '0896', '0895', '0811', '0819', '0831', '0838'];
  const SUPPLIER = { semen: 'UD Agung Semen Distribusi', pasir: 'CV Galian Sumber Alam', bata: 'Sentra Bata Merah Pak Hardi', besi: 'PT Baja Mitra Utama', keramik: 'CV Lantai Prima', cat: 'PT Warna Indah Distribusi', alat: 'Grosir Perkakas Jaya', sanitasi: 'UD Pipa Makmur', elektrikal: 'CV Elektra Terang', kayu: 'UD Kayu & Gypsum Sentosa', atap: 'PT Atap Perkasa Roof' };
  const PACK = { sak: 20, buah: 12, batang: 20, meter: 50, lembar: 10, dus: 20, kilogram: 25, kubik: 7, rit: 5, pail: 6, kaleng: 12, roll: 5, set: 5, galon: 6 };
  const PACK_SKU = { 'BTA-001': 2000, 'BTA-002': 200, 'BTA-003': 500, 'ELK-001': 48, 'ELK-003': 50, 'ATP-004': 50 };
  const KEEP_LOW = { 'SMN-004': 1, 'KRM-003': 1, 'ELK-004': 1 };        // supplier kosong: stok sengaja dibiarkan menipis/habis (uji peringatan)
  const DAMAGE = { keramik: 'Pecah saat bongkar muat', bata: 'Bata pecah/retak saat penurunan', semen: 'Semen mengeras (terkena air hujan)', cat: 'Kemasan bocor/penyok', kayu: 'Papan melengkung/rusak', atap: 'Lembaran penyok saat penumpukan', sanitasi: 'Pipa retak', elektrikal: 'Barang cacat produksi', besi: 'Besi bengkok/berkarat', pasir: 'Susut/terbawa hujan', alat: 'Barang cacat' };

  /* Template keranjang: [sku, peluang, qty min, qty maks] */
  const TPL = [
    { w: 5, it: [['SMN-001', 1, 10, 60], ['PSR-002', .85, 2, 10], ['PSR-003', .8, 1, 8], ['BSI-001', .9, 10, 80], ['BSI-002', .7, 10, 70], ['BSI-004', .8, 5, 25], ['BSI-003', .15, 2, 10]] },
    { w: 4, it: [['BTA-001', .65, 500, 4000], ['BTA-002', .4, 60, 300], ['BTA-003', .2, 100, 800], ['SMN-001', .9, 5, 40], ['PSR-001', .9, 1, 8], ['SMN-002', .3, 5, 25]] },
    { w: 2, it: [['SMN-001', 1, 5, 25], ['PSR-001', .8, 1, 5], ['SMN-004', .25, 1, 4], ['CAT-004', .3, 2, 10]] },
    { w: 4, it: [['CAT-001', .6, 1, 5], ['CAT-002', .5, 1, 8], ['CAT-004', .7, 2, 12], ['CAT-003', .5, 1, 4], ['ALT-002', .1, 1, 1]] },
    { w: 3, it: [['KRM-001', .6, 10, 70], ['KRM-002', .35, 5, 30], ['KRM-003', .3, 5, 25], ['SMN-003', .9, 3, 15], ['SMN-004', .4, 1, 4], ['PSR-001', .3, 1, 3]] },
    { w: 2.5, it: [['ATP-001', .7, 20, 120], ['ATP-002', .55, 30, 200], ['ATP-003', .2, 20, 80], ['ATP-004', .7, 1, 6], ['KYU-004', .2, 10, 60]] },
    { w: 2, it: [['KYU-001', .9, 8, 50], ['KYU-002', .9, 15, 80], ['KYU-003', .15, 2, 12], ['ATP-004', .3, 1, 3], ['CAT-004', .2, 2, 6]] },
    { w: 3, it: [['ELK-001', .8, 3, 25], ['ELK-002', .5, 1, 4], ['ELK-003', .7, 2, 12], ['ELK-004', .35, 1, 4]] },
    { w: 3, it: [['SAN-001', .6, 3, 15], ['SAN-002', .8, 4, 25], ['SAN-003', .2, 1, 2], ['SAN-004', .5, 1, 6]] },
    { w: 2, it: [['ALT-001', .5, 1, 3], ['ALT-002', .6, 1, 3], ['ALT-003', .4, 1, 3], ['ALT-004', .4, 1, 3], ['BSI-004', .3, 1, 5], ['ATP-004', .4, 1, 3]] },
    { w: 1.5, it: [['PSR-004', .7, 1, 3], ['PSR-003', .6, 2, 8], ['PSR-002', .4, 1, 6]] }
  ];
  /* Pembeli eceran (umum): barang kecil yang sering dibeli */
  const RETAIL = [['ATP-004', 3, 1, 3], ['BSI-004', 3, 1, 5], ['SMN-001', 4, 1, 6], ['ELK-001', 3, 1, 4], ['ELK-003', 2, 1, 4], ['SAN-002', 3, 1, 5], ['SAN-004', 2, 1, 2], ['CAT-004', 2, 1, 3], ['CAT-003', 2, 1, 3], ['CAT-002', 1.5, 1, 2],
    ['ALT-001', 1, 1, 1], ['ALT-002', 1.5, 1, 1], ['ALT-003', .6, 1, 1], ['ALT-004', .6, 1, 1], ['BTA-001', 2, 50, 300], ['PSR-001', 1.5, 1, 2], ['SMN-003', 1, 1, 3], ['KYU-004', 1, 2, 8], ['ELK-002', .7, 1, 1]];
  const SEG = [{ k: 'umum', w: 64, on: .10, scale: [.5, 1] }, { k: 'tukang', w: 27, on: .25, scale: [.12, .4] }, { k: 'rumah', w: 7, on: .5, scale: [.25, .6] }, { k: 'kontraktor', w: 2, on: .6, scale: [.7, 1.5] }];
  const VOID_POS = ['Salah input barang oleh kasir', 'Pelanggan membatalkan pembelian', 'Barang tidak sesuai kebutuhan', 'Salah pilih metode pembayaran'];
  const VOID_ON = ['Pelanggan membatalkan pesanan', 'Alamat pengiriman di luar jangkauan', 'Stok fisik tidak sesuai, diganti pesanan baru'];
  const HOURS_WEEK = [[450, 540, 1.5], [540, 660, 2.2], [660, 780, 1.1], [780, 900, 1.8], [900, 1020, 1]];
  const HOURS_SUN = [[480, 600, 2], [600, 720, 2], [720, 840, 1]];

  /* ---------- generator ---------- */
  sim.generate = function (opts) {
    const t0 = performance.now(); opts = opts || {};
    const days = Math.max(1, Math.min(90, opts.days || 30)), load = opts.load || 2, rnd = mulberry32(opts.seed || 20261111);
    const ri = function (a, b) { return a + Math.floor(rnd() * (b - a + 1)); };
    const pick = function (a) { return a[Math.floor(rnd() * a.length)]; };
    const wpick = function (items, wf) { let s = 0, i; for (i = 0; i < items.length; i++) s += wf(items[i]); let r = rnd() * s; for (i = 0; i < items.length; i++) { r -= wf(items[i]); if (r <= 0) return items[i]; } return items[items.length - 1]; };
    const settings = TB.store.getSettings(), users = TB.store.getUsers();
    const owner = users.find(function (u) { return u.role === 'owner'; }) || { id: 'u-owner', name: 'Pemilik Toko (Demo)' };
    const kasir = users.find(function (u) { return u.role === 'kasir'; }) || { id: 'u-kasir', name: 'Kasir Demo' };
    const admin = users.find(function (u) { return u.role === 'admin'; }) || { id: 'u-stok', name: 'Admin Stok Demo' };
    const now = new Date(), nowMs = now.getTime(); const today0 = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime(); const start0 = today0 - (days - 1) * DAY;

    /* produk & stok awal */
    const products = TB.clone(TB.store.getProducts()); const byId = {}, bySku = {}, stock = {}, ema = {}, pendQty = {};
    products.forEach(function (p) {
      byId[p.id] = p; bySku[p.sku] = p; ema[p.id] = 0; pendQty[p.id] = 0;
      stock[p.id] = KEEP_LOW[p.sku] ? Math.max(p.minStock * 1.1, Math.min(p.stock, p.minStock * 2)) : Math.max(p.stock, p.minStock * 4);
      stock[p.id] = TB.round2(stock[p.id]);
    });

    /* pelanggan langganan */
    function phone() { return pick(PREFIX) + String(ri(1000000, 99999999)).padStart(8, '0').slice(0, ri(7, 8)); }
    function addr() { return 'Jl. ' + pick(STREETS) + ' No. ' + ri(1, 120) + ' RT ' + String(ri(1, 9)).padStart(2, '0') + '/RW ' + String(ri(1, 12)).padStart(2, '0') + ', Kel. ' + pick(AREAS); }
    const pool = { tukang: [], rumah: [], kontraktor: [] }; let i;
    for (i = 0; i < 40; i++) pool.tukang.push({ name: (rnd() < .5 ? 'Pak ' : 'Mas ') + pick(FIRST) + ' (tukang)', phone: phone(), address: addr() });
    for (i = 0; i < 70; i++) { const w = rnd() < .45; pool.rumah.push({ name: (w ? (rnd() < .5 ? 'Bu ' : 'Ibu ') + pick(WOMEN) : (rnd() < .2 ? 'H. ' : 'Pak ') + pick(FIRST) + ' ' + pick(LAST)), phone: phone(), address: addr() }); }
    FIRMS.forEach(function (f) { pool.kontraktor.push({ name: f, phone: phone(), address: 'Proyek ' + pick(AREAS) + ', ' + addr() }); });
    function customer(seg) { if (seg === 'umum') return { name: 'Pelanggan Umum', phone: rnd() < .22 ? phone() : '', address: '' }; const p = pool[seg]; return p[Math.floor(Math.pow(rnd(), 2) * p.length)]; }

    /* keranjang */
    function basket(seg) {
      const sg = SEG.find(function (s) { return s.k === seg; }); const sc = sg.scale[0] + rnd() * (sg.scale[1] - sg.scale[0]); const out = {};
      function put(sku, q) { const p = bySku[sku]; if (!p) return; const st = TB.qtyStep(p); q = Math.max(st, Math.round(q / st) * st); out[sku] = (out[sku] || 0) + q; }
      if (seg === 'umum') { const n = wpick([1, 2, 3], function (x) { return x === 1 ? 6 : x === 2 ? 3 : 1; }); for (let k = 0; k < n; k++) { const r = wpick(RETAIL, function (x) { return x[1]; }); put(r[0], ri(r[2], r[3])); } }
      else { const nt = seg === 'kontraktor' ? ri(2, 3) : seg === 'rumah' ? ri(1, 3) : wpick([1, 2], function (x) { return x === 1 ? 4 : 1; }); for (let k = 0; k < nt; k++) { const t = wpick(TPL, function (x) { return x.w; }); t.it.forEach(function (r) { if (rnd() < r[1]) put(r[0], Math.max(r[2] * .5, ri(r[2], r[3]) * sc)); }); } }
      return Object.keys(out).map(function (k) { return [k, out[k]]; });
    }

    /* penampung hasil */
    const txns = [], movs = [], cash = [], notifs = [], audit = [], counters = {}; let mvN = 0, kN = 0, cashN = 0;
    const deliveries = {}, voidQ = {}; let lost = 0, voidedN = 0, poN = 0, lowAlerts = 0;
    const dayAgg = {}; function dk(ms) { return TB.dateKey(new Date(ms)); }
    function mvId() { return 'm' + (++mvN).toString(36); }
    function nid() { return 'n' + (++kN).toString(36); }
    function addCash(at, dir, cat, amount, method, ref, note, by) { cash.push({ id: 'k' + (++cashN).toString(36), at: new Date(at).toISOString(), dir: dir, cat: cat, amount: Math.round(amount), method: method, ref: ref || '', note: note || '', by: by || owner.name }); }
    function notify(at, type, level, title, body, ref, role) { const n = { id: nid(), at: new Date(at).toISOString(), type: type, level: level, title: title, body: body, ref: ref || '', read: true }; if (role) n.for = role; notifs.push(n); }
    function promoActive(p, ms) { if (!p.promoPrice || p.promoPrice >= p.price) return false; const d = dk(ms); return (!p.promoStart || d >= p.promoStart) && (!p.promoEnd || d <= p.promoEnd); }
    function applyStock(p, delta, at, type, reason, ref, user) {
      const before = stock[p.id], after = TB.round2(before + delta); stock[p.id] = after;
      movs.push({ id: mvId(), at: new Date(at).toISOString(), productId: p.id, sku: p.sku, name: p.name, type: type, qty: TB.round2(delta), before: before, after: after, reason: reason, userName: user.name, ref: ref || '' });
      if (delta < 0) {
        if (after <= 0 && before > 0) { notify(at, 'stock', 'bad', 'Stok habis', p.name + ' habis (stok minimum ' + TB.num(p.minStock) + ' ' + p.unit + ').', p.id); lowAlerts++; }
        else if (after <= p.minStock && before > p.minStock) { notify(at, 'stock', 'warn', 'Stok menipis', p.name + ' tersisa ' + TB.num(after) + ' ' + p.unit + ' (minimum ' + TB.num(p.minStock) + ').', p.id); lowAlerts++; }
      }
      return after;
    }
    function seqId(prefix, ms) { const key = dk(ms).replace(/-/g, '').slice(2), k = prefix + key; counters[k] = (counters[k] || 0) + 1; return prefix + '-' + key + '-' + String(counters[k]).padStart(4, '0'); }
    function roundCash(total) { const step = total < 100000 ? 5000 : total < 1000000 ? 50000 : 100000; return rnd() < .3 ? Math.ceil(total / 1000) * 1000 : Math.ceil(total / step) * step; }
    function sampleTime(day0, sun) { const b = wpick(sun ? HOURS_SUN : HOURS_WEEK, function (x) { return x[2]; }); return day0 + (b[0] + rnd() * (b[1] - b[0])) * MIN; }

    /* ---------- loop harian ---------- */
    let prevDelivery = null;
    for (let di = 0; di < days; di++) {
      const day0 = start0 + di * DAY, dd = new Date(day0), dow = dd.getDay(), dom = dd.getDate(), sun = dow === 0, dkey = dk(day0);
      const events = []; const agg = dayAgg[dkey] = { n: 0, omzet: 0, online: 0 };
      /* jumlah transaksi hari ini */
      let f = sun ? .45 : dow === 6 ? 1.12 : dow === 1 ? 1.08 : 1;
      if (dom >= 25 || dom <= 3) f *= 1.15; if (rnd() < .18) f *= .7 + rnd() * .2; f *= .88 + rnd() * .26;
      const n = Math.round(sim.BASE_PER_DAY * load * f);
      for (let k = 0; k < n; k++) events.push({ t: sampleTime(day0, sun), kind: 'sale' });
      (deliveries[dkey] || []).forEach(function (po) { events.push({ t: po.t, kind: 'po', po: po }); });
      (voidQ[dkey] || []).forEach(function (v) { events.push({ t: v.t, kind: 'void', v: v }); });
      const dmgN = rnd() < .6 ? ri(1, 2) : 0; for (let k = 0; k < dmgN; k++) events.push({ t: day0 + (ri(8, 16) * 60 + ri(0, 59)) * MIN, kind: 'dmg' });
      if (dow === 6) events.push({ t: day0 + (16 * 60 + 30) * MIN, kind: 'opname' });
      events.sort(function (a, b) { return a.t - b.t; });
      const soldToday = {}; let bbm = 0, kuli = 0, drove = 0;

      events.forEach(function (ev) {
        if (ev.t > nowMs) return;
        if (ev.kind === 'sale') {
          const sg = wpick(SEG, function (s) { return s.w; }); let seg = sg.k; const isOn = rnd() < sg.on; if (isOn && seg === 'umum') seg = 'rumah';
          const cust = customer(seg), bk = basket(seg), lines = []; let weight = 0;
          bk.forEach(function (b) {
            const p = bySku[b[0]]; if (!p) return; let q = b[1]; const st = TB.qtyStep(p), av = stock[p.id];
            if (av < st) return; if (q > av) { if (rnd() < .4) return; q = Math.floor(av / st) * st; } if (q < st) return;
            const price = promoActive(p, ev.t) ? p.promoPrice : p.price; lines.push({ p: p, qty: q, price: price }); weight += (p.weightKg || 0) * q;
          });
          if (!lines.length) { lost++; return; }
          const subtotal = lines.reduce(function (a, l) { return a + l.qty * l.price; }, 0), disc = TB.calcDiscount(subtotal, settings.discountRules);
          let delivery = 'pickup', zoneId = '', ship = { fee: 0, label: '' }, pay, payStatus = 'Lunas', ordStatus = 'Selesai', paidAt = null, voidAt = 0, voidReason = '';
          if (isOn) {
            if (rnd() < .22) delivery = 'pickup'; else { delivery = weight > settings.shipping.heavyThresholdKg ? 'heavy' : 'delivery'; zoneId = wpick(settings.shipping.zones, function (z) { return z.id === 'z1' ? 4 : z.id === 'z2' ? 3 : z.id === 'z3' ? 2 : 1; }).id; ship = TB.calcShipping(weight, delivery, zoneId, settings); }
          }
          const total = subtotal - disc.amount + (ship.fee || 0);
          const age = nowMs - ev.t;
          if (!isOn) { pay = total > 10e6 ? wpick(['Transfer', 'QRIS', 'Tunai'], function (x) { return x === 'Transfer' ? 55 : x === 'QRIS' ? 30 : 15; }) : wpick(['Tunai', 'QRIS', 'Transfer'], function (x) { return x === 'Tunai' ? 60 : x === 'QRIS' ? 30 : 10; }); }
          else if (delivery === 'pickup') { pay = 'Bayar di Toko'; }
          else if ((settings.payments.cod.zones || []).indexOf(zoneId) >= 0 && total < 3e6 && rnd() < .4) pay = 'COD'; else pay = 'QRIS';
          if (isOn) {
            if (age > 3 * DAY) { payStatus = 'Lunas'; ordStatus = 'Selesai'; paidAt = ev.t + (pay === 'QRIS' ? ri(3, 40) * MIN : pay === 'COD' ? ri(4, 8) * HOUR : ri(1, 6) * HOUR); }
            else if (pay === 'QRIS') {
              if (age < 3 * HOUR) { payStatus = 'Menunggu Pembayaran'; ordStatus = 'Baru'; }
              else if (age < DAY) { payStatus = 'Lunas'; ordStatus = delivery === 'pickup' ? 'Diproses' : (rnd() < .5 ? 'Diproses' : 'Dikirim'); paidAt = ev.t + ri(3, 40) * MIN; }
              else if (rnd() < .06) { payStatus = 'Menunggu Pembayaran'; ordStatus = 'Baru'; voidAt = ev.t + DAY + ri(10, 120) * MIN; voidReason = 'Pembayaran tidak diterima dalam 24 jam'; }
              else { payStatus = 'Lunas'; ordStatus = 'Selesai'; paidAt = ev.t + ri(3, 40) * MIN; }
            } else if (pay === 'COD') {
              if (age < 4 * HOUR) { payStatus = 'COD (Belum Dibayar)'; ordStatus = 'Baru'; } else if (age < 10 * HOUR) { payStatus = 'COD (Belum Dibayar)'; ordStatus = 'Dikirim'; } else { payStatus = 'Lunas'; ordStatus = 'Selesai'; paidAt = ev.t + ri(4, 9) * HOUR; }
            } else { if (age < 5 * HOUR) { payStatus = 'Bayar di Toko'; ordStatus = 'Baru'; } else { payStatus = 'Lunas'; ordStatus = 'Selesai'; paidAt = ev.t + ri(1, 5) * HOUR; } }
            if (paidAt && paidAt > nowMs) { paidAt = nowMs - MIN; }
          }
          /* pembatalan acak */
          if (!voidAt && rnd() < (isOn ? .05 : .022)) { voidAt = ev.t + ri(20, 300) * MIN; voidReason = pick(isOn ? VOID_ON : VOID_POS); if (new Date(voidAt).getHours() >= 17) voidAt = day0 + DAY + ri(480, 600) * MIN; }
          if (voidAt && (voidAt > nowMs || voidAt >= start0 + days * DAY)) { voidAt = 0; }
          const prefix = isOn ? 'ORD' : 'TRX', id = seqId(prefix, ev.t);
          const cashier = isOn ? null : (rnd() < .85 ? kasir : owner); const recv = !isOn && pay === 'Tunai' ? roundCash(total) : null;
          const items = lines.map(function (l) { applyStock(l.p, -l.qty, ev.t, isOn ? 'pesanan' : 'penjualan', (isOn ? 'Pesanan online ' : 'Penjualan kasir ') + id, id, cashier || { id: null, name: 'Pelanggan (publik)' }); soldToday[l.p.id] = (soldToday[l.p.id] || 0) + l.qty; return { productId: l.p.id, sku: l.p.sku, name: l.p.name, unit: l.p.unit, qty: l.qty, price: l.price, cost: l.p.cost }; });
          const created = new Date(ev.t).toISOString(); const aud = [{ at: created, by: cashier ? cashier.name : 'Pelanggan (publik)', action: 'Transaksi dibuat' }];
          if (paidAt && isOn) aud.push({ at: new Date(paidAt).toISOString(), by: payStatusActor(pay), action: pay === 'QRIS' ? 'Pembayaran dikonfirmasi manual oleh owner' : 'Pembayaran diterima' });
          if (isOn && ordStatus === 'Selesai') aud.push({ at: new Date((paidAt || ev.t) + ri(1, 5) * HOUR > nowMs ? nowMs - MIN : (paidAt || ev.t) + ri(1, 5) * HOUR).toISOString(), by: kasir.name, action: 'Status pesanan: Selesai' });
          const t = {
            id: id, type: isOn ? 'online' : 'pos', createdAt: created, cashierId: cashier ? cashier.id : null, cashierName: isOn ? 'Pesanan Online' : cashier.name,
            customer: { name: cust.name }, items: items, subtotal: subtotal, discount: disc.amount, shipping: ship.fee || 0, total: total,
            deliveryMethod: delivery, paymentMethod: pay, paymentStatus: payStatus, orderStatus: ordStatus, demo: true
          };
          /* Kolom kosong/bawaan tidak disimpan (hemat LocalStorage); semua pembaca memakai pengecekan "falsy" */
          if (cust.phone) t.customer.phone = cust.phone; if (delivery !== 'pickup' && cust.address) t.customer.address = cust.address;
          if (disc.amount) t.discountLabel = disc.label; if (ship.fee) { t.shippingLabel = ship.label; t.zoneId = zoneId; } if (recv != null) { t.cashReceived = recv; t.change = recv - total; }
          if (isOn || voidAt) t.audit = aud;
          if (paidAt && isOn) t.paidAt = new Date(paidAt).toISOString();
          txns.push(t);
          if (voidAt) (voidQ[dk(voidAt)] = voidQ[dk(voidAt)] || []).push({ t: voidAt, id: id, reason: voidReason, ref: t });
          /* statistik, notifikasi, biaya armada */
          agg.n++; agg.omzet += subtotal - disc.amount; if (isOn) agg.online++;
          if (isOn) {
            notify(ev.t, 'order', 'info', 'Pesanan online baru', id + ' · ' + cust.name + ' · ' + TB.rp(total) + ' · ' + payStatus, id);
            if (paidAt && pay === 'QRIS') notify(paidAt, 'payment', 'ok', 'Pembayaran diterima', id + ' · ' + cust.name + ' · ' + TB.rp(total) + ' (QRIS)', id);
            if (delivery !== 'pickup' && ordStatus !== 'Baru') { const sd = Math.min(nowMs - MIN, (paidAt || ev.t) + ri(60, 240) * MIN); notify(sd, 'delivery', 'info', 'Pesanan dikirim', id + ' · ' + (ship.vehicle ? ship.vehicle.name : 'Kendaraan toko') + ' · ' + zoneName(settings, zoneId), id); bbm += Math.round((ship.fee || 60000) * (.25 + rnd() * .2) / 5000) * 5000; drove++; if (delivery === 'heavy') kuli += ri(10, 40) * 5000; }
          } else if (total >= 5e6) notify(ev.t, 'order', 'info', 'Transaksi besar', id + ' · ' + cust.name + ' · ' + TB.rp(total) + ' (' + pay + ')', id);
        } else if (ev.kind === 'po') {
          const po = ev.po; let sum = 0; const lines = [];
          po.lines.forEach(function (l) { const p = byId[l.pid]; pendQty[p.id] -= l.qty; applyStock(p, l.qty, ev.t + lines.length, 'masuk', 'Pembelian dari ' + po.supplier + ' (' + po.no + ')', po.no, admin); sum += l.qty * p.cost; lines.push(p); });
          notify(ev.t + lines.length, 'stockin', 'ok', 'Barang masuk ' + po.no, po.supplier + ' · ' + lines.length + ' jenis barang · nilai ' + TB.rp(sum), po.no);
          addCash(ev.t + ri(20, 180) * MIN, 'out', 'Pembelian stok', sum, sum > 5e6 ? 'Transfer' : 'Tunai', po.no, 'Pembayaran ' + po.no + ' ke ' + po.supplier, owner.name);
          if (sum >= 8e6) kuli += ri(10, 30) * 5000;
          if (sum >= 25e6) notify(ev.t + 4 * HOUR, 'kas', 'warn', 'Pengeluaran besar', 'Pembayaran ' + po.no + ' ke ' + po.supplier + ' ' + TB.rp(sum), po.no, 'owner');
        } else if (ev.kind === 'void') {
          const v = ev.v, t = v.ref; if (t.voided) return;
          t.items.forEach(function (it) { const p = byId[it.productId]; if (p) { stock[p.id] = TB.round2(stock[p.id] + it.qty); const before = stock[p.id] - it.qty; movs.push({ id: mvId(), at: new Date(ev.t).toISOString(), productId: p.id, sku: p.sku, name: p.name, type: 'pembatalan', qty: it.qty, before: TB.round2(before), after: stock[p.id], reason: 'Pembatalan ' + t.id + ': ' + v.reason, userName: owner.name, ref: t.id }); } });
          t.voided = true; t.voidReason = v.reason; t.voidedAt = new Date(ev.t).toISOString(); t.voidedBy = owner.name; t.orderStatus = 'Dibatalkan'; t.audit.push({ at: t.voidedAt, by: owner.name, action: 'Dibatalkan: ' + v.reason });
          voidedN++; audit.push({ id: 'a' + audit.length.toString(36), at: t.voidedAt, action: 'transaksi.batal', userId: owner.id, userName: owner.name, detail: t.id + ' · ' + v.reason });
          notify(ev.t, 'cancel', 'warn', 'Transaksi dibatalkan', t.id + ' · ' + TB.rp(t.total) + ' · ' + v.reason, t.id);
        } else if (ev.kind === 'dmg') {
          const p = pick(products.filter(function (x) { return stock[x.id] > x.minStock * 2; })); if (!p) return; const q = p.unit === 'buah' && p.price < 5000 ? ri(20, 80) : ri(1, p.unit === 'dus' ? 4 : 3); if (q >= stock[p.id]) return;
          applyStock(p, -q, ev.t, 'keluar', DAMAGE[p.category] || 'Barang rusak', '', admin);
        } else if (ev.kind === 'opname') {
          for (let k = 0; k < 3; k++) { const p = pick(products); const d = Math.max(-stock[p.id], Math.round(stock[p.id] * (rnd() * .04 - .02) * 10) / 10); if (Math.abs(d) < .5) continue; const st = TB.qtyStep(p); const dd2 = Math.round(d / st) * st; if (!dd2) continue; applyStock(p, dd2, ev.t + k, 'koreksi', 'Stok opname mingguan (selisih fisik)', '', admin); }
        }
      });

      /* tutup hari: pesan ulang stok, biaya operasional, ringkasan, audit login */
      const isFuture = day0 + 17 * HOUR > nowMs;
      products.forEach(function (p) {
        ema[p.id] = ema[p.id] * .75 + (soldToday[p.id] || 0) * .25; if (KEEP_LOW[p.sku]) return;
        const lead = p.category === 'pasir' || p.category === 'bata' ? 1 : 2, rp = Math.max(p.minStock * 1.5, ema[p.id] * lead * 1.6);
        if (stock[p.id] + pendQty[p.id] > rp) return;
        let arr = di + lead, a0 = start0 + arr * DAY; if (new Date(a0).getDay() === 0) { arr++; a0 += DAY; } if (arr >= days) return;
        const target = Math.max(p.minStock * 5, ema[p.id] * 12), need = target - stock[p.id] - pendQty[p.id], pk = PACK_SKU[p.sku] || PACK[p.unit] || 10, q = Math.max(pk, Math.ceil(need / pk) * pk);
        const ak = dk(a0), sup = SUPPLIER[p.category] || 'Distributor Umum'; const list = deliveries[ak] = deliveries[ak] || []; let po = list.find(function (x) { return x.supplier === sup; });
        if (!po) { po = { supplier: sup, t: a0 + (8 * 60 + ri(0, 210)) * MIN, lines: [], no: 'PO-' + ak.replace(/-/g, '').slice(2) + '-' + String(++poN % 1000).padStart(3, '0') }; list.push(po); }
        po.lines.push({ pid: p.id, qty: q }); pendQty[p.id] += q;
      });
      if (!isFuture || nowMs > day0 + 17 * HOUR) {
        if (!sun) addCash(day0 + 7 * HOUR + 10 * MIN, 'out', 'Operasional', ri(9, 12) * 25000, 'Tunai', '', 'Uang makan karyawan', kasir.name);
        if (bbm) addCash(day0 + 17 * HOUR + 15 * MIN, 'out', 'BBM & armada', bbm, 'Tunai', '', 'Solar & BBM armada · ' + drove + ' pengiriman', owner.name);
        if (kuli) addCash(day0 + 17 * HOUR + 20 * MIN, 'out', 'Bongkar muat', kuli, 'Tunai', '', 'Upah bongkar muat', owner.name);
        if (dow === 6) addCash(day0 + 16 * HOUR, 'out', 'Gaji karyawan', ri(11, 14) * 1000000, 'Tunai', '', 'Gaji harian lepas mingguan', owner.name);
        if (dow === 3) addCash(day0 + 11 * HOUR, 'out', 'Perawatan', ri(4, 28) * 100000, 'Tunai', '', 'Servis armada, oli & ban', owner.name);
        if (dow === 1) addCash(day0 + 10 * HOUR, 'out', 'Operasional', ri(15, 42) * 10000, 'Tunai', '', 'ATK, plastik & kertas struk', kasir.name);
        if (dow === 5) addCash(day0 + 15 * HOUR, 'in', 'Pendapatan lain', ri(20, 80) * 10000, 'Tunai', '', 'Penjualan sisa besi & karung bekas', kasir.name);
        if (dom === 28) { const g = ri(22, 26) * 1000000; addCash(day0 + 10 * HOUR, 'out', 'Gaji karyawan', g, 'Transfer', '', 'Gaji karyawan tetap (kasir, admin, sopir)', owner.name); notify(day0 + 10 * HOUR, 'kas', 'warn', 'Pengeluaran besar', 'Gaji karyawan tetap ' + TB.rp(g), '', 'owner'); }
        if (dom === 1) addCash(day0 + 9 * HOUR, 'out', 'Sewa', 12500000, 'Transfer', '', 'Sewa ruko & gudang bulanan', owner.name);
        if (dom === 20) addCash(day0 + 10 * HOUR, 'out', 'Listrik, air & internet', ri(32, 46) * 100000, 'Transfer', '', 'Listrik & air', owner.name);
        if (dom === 22) addCash(day0 + 10 * HOUR, 'out', 'Listrik, air & internet', 650000, 'Transfer', '', 'Internet & telepon', owner.name);
        if (dom === 5) addCash(day0 + 10 * HOUR, 'out', 'Operasional', 450000, 'Tunai', '', 'Iuran kebersihan & keamanan', owner.name);
        if (agg.n && !(isFuture && nowMs < day0 + 17 * HOUR)) notify(day0 + 17 * HOUR + 5 * MIN, 'kas', 'info', 'Ringkasan harian ' + TB.fmtDate(new Date(day0).toISOString()), agg.n + ' transaksi · omzet ' + TB.rp(agg.omzet) + ' · ' + agg.online + ' pesanan online', '', 'owner');
      }
      /* audit harian: login & aktivitas */
      const lg = function (u, h, m) { audit.push({ id: 'a' + audit.length.toString(36), at: new Date(day0 + h * HOUR + m * MIN).toISOString(), action: 'login', userId: u.id, userName: u.name, detail: 'Login berhasil (' + (u === owner ? 'owner' : u === kasir ? 'kasir' : 'admin') + ')' }); };
      if (day0 + 7 * HOUR < nowMs && !sun) { lg(kasir, 7, ri(15, 40)); lg(admin, 7, ri(20, 50)); } if (day0 + 9 * HOUR < nowMs && rnd() < .7) lg(owner, ri(8, 16), ri(0, 59));
      if (dow === 2 && day0 + 14 * HOUR < nowMs) { const p = pick(products); audit.push({ id: 'a' + audit.length.toString(36), at: new Date(day0 + 14 * HOUR).toISOString(), action: 'produk.ubah', userId: owner.id, userName: owner.name, detail: p.sku + ' · price: ' + p.price + ' → ' + p.price }); }
      if (dow === 6 && day0 + 18 * HOUR < nowMs) { audit.push({ id: 'a' + audit.length.toString(36), at: new Date(day0 + 18 * HOUR).toISOString(), action: 'backup.unduh', userId: owner.id, userName: owner.name, detail: 'Backup diunduh' }); }
      if (dow === 1 && day0 + 8 * HOUR < nowMs) notify(day0 + 8 * HOUR, 'system', 'info', 'Pengingat backup mingguan', 'Unduh backup data di Pengaturan → Backup & Data agar riwayat tidak hilang bila data browser terhapus.', '', 'owner');
    }

    /* pajak bulanan (PPh final 0,5% dari omzet bulan sebelumnya, bila datanya ada di periode) */
    const byMonth = {}; txns.forEach(function (t) { if (!t.voided) { const m = t.createdAt.slice(0, 7); byMonth[m] = (byMonth[m] || 0) + t.subtotal - t.discount; } });
    for (let di = 0; di < days; di++) { const d = new Date(start0 + di * DAY); if (d.getDate() !== 15) continue; const pm = new Date(d.getFullYear(), d.getMonth() - 1, 1), key = pm.getFullYear() + '-' + String(pm.getMonth() + 1).padStart(2, '0'); if (byMonth[key]) addCash(d.getTime() + 11 * HOUR, 'out', 'Pajak', Math.round(byMonth[key] * .005 / 1000) * 1000, 'Transfer', '', 'PPh Final 0,5% omzet ' + key, owner.name); }

    /* Modal awal, tambahan modal & setoran pemilik: saldo dijaga realistis (tidak pernah negatif).
       Dihitung berurutan waktu dari arus penjualan (lunas) dan semua kas manual. */
    const fl = []; txns.forEach(function (t) { if (t.paymentStatus !== 'Lunas') return; fl.push([new Date(t.paidAt || t.createdAt).getTime(), t.total]); if (t.voided) fl.push([new Date(t.voidedAt).getTime(), -t.total]); });
    cash.forEach(function (c) { fl.push([new Date(c.at).getTime(), c.dir === 'in' ? c.amount : -c.amount]); }); fl.sort(function (x, y) { return x[0] - y[0]; });
    let run = 0, lo = 0; fl.forEach(function (x) { run += x[1]; if (run < lo) lo = run; });
    const opening = Math.max(100e6, Math.ceil((-lo + 40e6) / 10e6) * 10e6); const extras = [{ at: start0 + 6 * HOUR + 30 * MIN, dir: 'in', cat: 'Modal awal', amount: opening, method: 'Transfer', note: 'Saldo awal kas & bank (simulasi)' }];
    let bal = opening, lastSat = -1;
    fl.forEach(function (x) {
      bal += x[1]; const d = new Date(x[0]);
      if (bal < 10e6) { const top = Math.ceil((40e6 - bal) / 10e6) * 10e6; extras.push({ at: x[0] - MIN, dir: 'in', cat: 'Tambahan modal', amount: top, method: 'Transfer', note: 'Tambahan modal kerja dari pemilik' }); bal += top; }
      if (d.getDay() === 6 && d.getHours() >= 17 && bal > opening * 2 && lastSat !== dk(x[0])) { const pv = Math.floor((bal - opening) * .7 / 5e6) * 5e6; if (pv > 0) { extras.push({ at: x[0] + MIN, dir: 'out', cat: 'Prive / setoran pemilik', amount: pv, method: 'Transfer', note: 'Setoran laba ke rekening pemilik' }); bal -= pv; lastSat = dk(x[0]); } }
    });
    extras.forEach(function (e) { if (e.at <= nowMs) addCash(e.at, e.dir, e.cat, e.amount, e.method, '', e.note, owner.name); });
    cash.sort(function (a, b) { return a.at < b.at ? -1 : 1; });

    /* finalisasi */
    notifs.sort(function (a, b) { return a.at < b.at ? -1 : 1; }); const keepN = notifs.slice(-400);
    const cut = nowMs - 36 * HOUR; keepN.forEach(function (n) { n.read = new Date(n.at).getTime() < cut ? true : ((n.type === 'order' || n.type === 'stock') ? rnd() < .3 : rnd() < .55); });
    const unread = keepN.filter(function (n) { return !n.read; }).length;
    movs.sort(function (a, b) { return a.at < b.at ? -1 : 1; }); txns.sort(function (a, b) { return a.createdAt < b.createdAt ? -1 : 1; }); audit.sort(function (a, b) { return a.at < b.at ? -1 : 1; });
    products.forEach(function (p) { p.stock = TB.round2(stock[p.id]); p.updatedAt = now.toISOString(); });
    let omzet = 0, goods = 0, onl = 0; txns.forEach(function (t) { if (!t.voided) { omzet += t.total; goods += t.subtotal - t.discount; } if (t.type === 'online') onl++; });
    const stats = { days: days, load: load, txns: txns.length, online: onl, voided: voidedN, omzet: omzet, goods: goods, movements: movs.length, stockIn: movs.filter(function (m) { return m.type === 'masuk'; }).length, stockOut: movs.filter(function (m) { return m.qty < 0 && m.type !== 'penjualan' && m.type !== 'pesanan'; }).length, cash: cash.length, notifs: keepN.length, unread: unread, audit: Math.min(audit.length, 2000), lostSales: lost, stockAlerts: lowAlerts, pos: poN, perDay: Math.round(txns.length / days * 10) / 10, ms: Math.round(performance.now() - t0) };
    return { products: products, transactions: txns, movements: movs, cash: cash, notifs: keepN, audit: audit.slice(-2000), counters: counters, stats: stats };
  };
  function payStatusActor(pay) { return pay === 'QRIS' ? 'Pemilik Toko (Demo)' : 'Kasir Demo'; }
  function zoneName(s, id) { const z = s.shipping.zones.find(function (x) { return x.id === id; }); return z ? z.name : ''; }

  /* ---------- tulis ke LocalStorage (dengan pemulihan bila kuota penuh) ---------- */
  sim.KEYS = ['products', 'transactions', 'stock_movements', 'cash', 'notifs', 'audit', 'counters'];
  sim.apply = function (data) {
    const P = TB.CONFIG.KEY_PREFIX, map = { products: 'products', transactions: 'transactions', stock_movements: 'movements', cash: 'cash', notifs: 'notifs', audit: 'audit', counters: 'counters' };
    const snap = {}; sim.KEYS.forEach(function (k) { try { snap[k] = localStorage.getItem(P + k); } catch (e) { snap[k] = null; } });
    const sizes = {}; sim.KEYS.forEach(function (k) { sizes[k] = JSON.stringify(data[map[k]]); });
    const t0 = performance.now();
    try {
      sim.KEYS.forEach(function (k) { localStorage.removeItem(P + k); });
      sim.KEYS.forEach(function (k) { localStorage.setItem(P + k, sizes[k]); });
      try { sessionStorage.removeItem('tb_sold_cache'); } catch (e) { /* abaikan */ }
    } catch (e) {
      sim.KEYS.forEach(function (k) { try { localStorage.removeItem(P + k); } catch (e2) { /* abaikan */ } });
      sim.KEYS.forEach(function (k) { try { if (snap[k] !== null) localStorage.setItem(P + k, snap[k]); } catch (e3) { /* abaikan */ } });
      throw new Error('Penyimpanan browser tidak cukup untuk data sebesar ini (batas ±5 MB). Data sebelumnya dipulihkan. Kurangi periode atau beban simulasi.');
    }
    return { ms: Math.round(performance.now() - t0), chars: sim.KEYS.reduce(function (a, k) { return a + sizes[k].length; }, 0) };
  };
  /* Kembali ke data demo bawaan (tidak menyentuh pengguna & pengaturan) */
  sim.restoreDefault = function () {
    const P = TB.CONFIG.KEY_PREFIX; const prods = TB.buildDemoProducts(); const demo = TB.buildDemoTransactions(prods);
    localStorage.setItem(P + 'products', JSON.stringify(prods)); localStorage.setItem(P + 'transactions', JSON.stringify(demo.txns)); localStorage.setItem(P + 'counters', JSON.stringify(demo.counters));
    ['stock_movements', 'cash', 'notifs', 'audit'].forEach(function (k) { localStorage.setItem(P + k, '[]'); }); localStorage.setItem(P + 'seeded', JSON.stringify({ at: new Date().toISOString(), version: TB.CONFIG.VERSION, manual: true })); try { sessionStorage.removeItem('tb_sold_cache'); } catch (e) { /* abaikan */ }
  };
  /* Perkiraan ukuran (karakter) — dikalibrasi dari hasil nyata: ±1,5 KB per transaksi (termasuk mutasi stok) + ±25 KB tetap */
  sim.estimate = function (days, load) { const n = Math.round(sim.BASE_PER_DAY * load * days * .97); const chars = n * 1530 + 25000; return { txns: n, chars: chars, pct: Math.round(chars / (5 * 1024 * 1024) * 1000) / 10 }; };

  /* ---------- uji performa ---------- */
  function time(fn, reps) { reps = reps || 3; const a = []; let r; fn(); for (let i = 0; i < reps; i++) { const t = performance.now(); r = fn(); a.push(performance.now() - t); } a.sort(function (x, y) { return x - y; }); return { ms: a[Math.floor(a.length / 2)], out: r }; }
  sim.benchmark = function () {
    const rows = []; const P = TB.CONFIG.KEY_PREFIX; function add(name, desc, ms, lim) { rows.push({ name: name, desc: desc, ms: Math.round(ms * 10) / 10, rate: ms <= lim[0] ? 'ok' : ms <= lim[1] ? 'warn' : 'bad' }); }
    let r = time(function () { return TB.store.getTransactions(); }); const all = r.out; add('Baca & parse data transaksi', all.length + ' transaksi — dilakukan di tiap halaman dashboard', r.ms, [40, 120]);
    r = time(function () { const s = TB.svc.summarize(all); const m = {}; all.forEach(function (t) { if (!t.voided) { const k = TB.dateKey(t.createdAt); m[k] = (m[k] || 0) + t.subtotal - t.discount; } }); return s; }); add('Hitung dashboard owner (ringkasan + grafik harian)', 'summarize() + agregasi per hari', r.ms, [30, 100]);
    r = time(function () { const q = 'semen'; const l = all.filter(function (t) { return (t.id + ' ' + t.customer.name + ' ' + t.items.map(function (i) { return i.name; }).join(' ')).toLowerCase().indexOf(q) >= 0; }).sort(function (a, b) { return b.createdAt.localeCompare(a.createdAt); }); return l.slice(0, 15).map(function (t) { return '<tr>' + TB.esc(t.id) + TB.fmtDateTime(t.createdAt) + TB.rp(t.total) + '</tr>'; }).join(''); }); add('Cari "semen" di Laporan Transaksi + urut + render 1 halaman', 'filter, sort, 15 baris', r.ms, [40, 120]);
    r = time(function () { const mv = TB.store.getStockMovements(); return mv.filter(function (m) { return (m.name + ' ' + m.sku + ' ' + m.reason).toLowerCase().indexOf('semen') >= 0; }).sort(function (a, b) { return b.at.localeCompare(a.at); }).length; }); add('Riwayat stok: parse + cari "semen"', TB.store.getStockMovements().length + ' mutasi stok', r.ms, [50, 150]);
    r = time(function () { const e = TB.svc.cashEntries(); return TB.svc.cashSummary(e, '', ''); }); add('Buku kas: gabung penjualan + pengeluaran + saldo', 'cashEntries() + cashSummary()', r.ms, [50, 150]);
    r = time(function () { const m = {}; TB.svc.activeTransactions().forEach(function (t) { t.items.forEach(function (i) { m[i.productId] = (m[i.productId] || 0) + i.qty; }); }); return m; }, 3); add('Beranda publik tanpa cache (produk terlaris)', 'Dengan cache sesi: nyaris 0 ms pada kunjungan berikutnya', r.ms, [40, 120]);
    const rawT = localStorage.getItem(P + 'transactions') || '[]'; const key = P + '_bench';
    r = time(function () { const l = JSON.parse(rawT); l.push(l[l.length - 1]); const s = JSON.stringify(l); try { localStorage.setItem(key, s); } finally { localStorage.removeItem(key); } return s.length; }, 3);
    add('Simpan 1 transaksi baru (baca + tulis ulang seluruh data)', 'Tiap checkout/kasir menulis ulang seluruh daftar transaksi', r.ms, [60, 180]);
    const u = TB.store.usage(); const pct = u.pct; rows.push({ name: 'Pemakaian penyimpanan LocalStorage', desc: TB.num(u.chars / 1e6) + ' juta karakter dari ±5 juta', ms: null, pct: pct, rate: pct < 60 ? 'ok' : pct < 85 ? 'warn' : 'bad' });
    const worst = rows.some(function (x) { return x.rate === 'bad'; }) ? 'bad' : rows.some(function (x) { return x.rate === 'warn'; }) ? 'warn' : 'ok';
    return { rows: rows, verdict: worst, txns: all.length, usage: u, when: new Date().toISOString() };
  };
})();
