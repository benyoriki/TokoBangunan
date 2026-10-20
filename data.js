/* =====================================================================
   data.js — Data awal (DEMO) dan konfigurasi bawaan TOKO BANGUNAN
   Semua harga & stok di sini adalah DATA DEMO yang dapat diubah admin.
   BUKAN harga pasar terkini.
   ===================================================================== */
window.TB = window.TB || {};

TB.CONFIG = {
  APP_NAME: 'TOKO BANGUNAN',
  TAGLINE: 'Semua Kebutuhan Bangunan, Harga Terbaik, Pengiriman Tepat.',
  VERSION: '1.0.0',
  KEY_PREFIX: 'tb_',
  SESSION_HOURS: 8,
  LOADER_MS: 3000,            // lama loading screen (milidetik)
  LOADER_ONCE_PER_SESSION: true, // true: tampil sekali per sesi browser; false: setiap halaman dimuat
  HERO_IMAGE: '',            // isi dengan nama berkas foto toko di root (mis. 'hero.jpg') untuk mengganti ilustrasi bawaan
  DEVELOPER_NAME: 'benyoriki.com',
  DEVELOPER_URL: 'https://benyoriki.com',
  FOOTER_CREDIT: 'Website & Sistem Developer — benyoriki.com'
};

TB.DEFAULT_CATEGORIES = [
  { id: 'semen',      name: 'Semen & Perekat',        short: 'Semen & Perekat',   icon: 'bag' },
  { id: 'pasir',      name: 'Pasir & Batu',           short: 'Pasir & Batu',      icon: 'pile' },
  { id: 'bata',       name: 'Bata Merah & Bata Ringan', short: 'Bata',            icon: 'brick' },
  { id: 'besi',       name: 'Besi & Baja',            short: 'Besi & Baja',       icon: 'rods' },
  { id: 'keramik',    name: 'Keramik & Granit',       short: 'Keramik & Granit',  icon: 'tile' },
  { id: 'cat',        name: 'Cat & Pelapis',          short: 'Cat & Pelapis',     icon: 'paint' },
  { id: 'alat',       name: 'Alat Pertukangan',       short: 'Alat Pertukangan',  icon: 'tools' },
  { id: 'sanitasi',   name: 'Sanitasi & Pipa',        short: 'Sanitasi & Pipa',   icon: 'pipe' },
  { id: 'elektrikal', name: 'Elektrikal & Lampu',     short: 'Elektrikal',        icon: 'bulb' },
  { id: 'kayu',       name: 'Kayu, Gypsum & Plafon',  short: 'Kayu & Plafon',     icon: 'board' },
  { id: 'atap',       name: 'Atap & Material Lainnya', short: 'Atap & Lainnya',   icon: 'roof' }
];

TB.DEFAULT_UNITS = ['sak', 'buah', 'batang', 'meter', 'lembar', 'dus', 'kilogram', 'kubik', 'rit', 'pail', 'kaleng', 'roll', 'set', 'galon'];

/* Kolom: sku, nama, kategori, merek, satuan, harga modal, harga normal, harga promo, stok, stok min, berat kg/satuan, art, deskripsi, unggulan */
TB.DEFAULT_PRODUCTS_RAW = [
  ['SMN-001','Semen Portland 50 kg','semen','Tiga Roda','sak',58000,65000,62500,240,40,50,'bag:#c0392b','Semen portland serbaguna untuk pondasi, cor, plester, dan acian. Kemasan 50 kg.',1],
  ['SMN-002','Semen Instan Perekat Bata Ringan 40 kg','semen','MU','sak',68000,78000,null,90,20,40,'bag:#2e7d32','Mortar instan perekat bata ringan, tinggal dicampur air.',0],
  ['SMN-003','Perekat Keramik Premium 25 kg','semen','Sika','sak',72000,85000,null,70,15,25,'bag:#1565c0','Perekat keramik dan granit, daya rekat tinggi untuk lantai dan dinding.',0],
  ['SMN-004','Semen Putih 40 kg','semen','Gresik','sak',92000,105000,null,8,10,40,'bag:#90a4ae','Semen putih untuk nat, acian halus, dan finishing dekoratif.',0],
  ['PSR-001','Pasir Pasang','pasir','Lokal','kubik',230000,280000,265000,60,10,1400,'pile:#d7a85b','Pasir pasang halus untuk pasangan bata dan plesteran. Harga per m³.',1],
  ['PSR-002','Pasir Beton (Cor)','pasir','Lokal','kubik',270000,320000,null,45,10,1450,'pile:#b88a4a','Pasir beton kasar untuk adukan cor dan struktur. Harga per m³.',0],
  ['PSR-003','Batu Split 1/2','pasir','Lokal','kubik',320000,380000,null,40,8,1500,'pile:#78909c','Batu pecah ukuran 1/2 cm untuk campuran beton dan cor. Harga per m³.',1],
  ['PSR-004','Pasir Urug (1 rit)','pasir','Lokal','rit',850000,1050000,null,20,4,5600,'pile:#a1887f','Pasir urug untuk menimbun dan meninggikan lahan, 1 rit truk.',0],
  ['BTA-001','Bata Merah Press','bata','Lokal','buah',650,850,null,12000,2500,1.6,'brick:#c2562f','Bata merah press ukuran standar, kualitas seragam.',1],
  ['BTA-002','Bata Ringan 60x20x10','bata','Hebel','buah',12500,14500,13900,1500,300,10,'brick:#cfd8dc','Bata ringan (AAC) 60x20x10 cm, pengerjaan cepat dan ringan.',0],
  ['BTA-003','Batako Press','bata','Lokal','buah',2600,3300,null,2800,500,9,'brick:#9e9e9e','Batako press untuk dinding pagar dan bangunan sederhana.',0],
  ['BSI-001','Besi Beton Polos 10 mm (12 m)','besi','Krakatau','batang',68000,78000,null,250,50,7.4,'rods:#37474f','Besi beton polos diameter 10 mm panjang 12 meter.',1],
  ['BSI-002','Besi Beton Polos 8 mm (12 m)','besi','Krakatau','batang',44000,52000,49000,320,60,4.7,'rods:#455a64','Besi beton polos diameter 8 mm panjang 12 meter.',0],
  ['BSI-003','Wiremesh M8 (2,1 x 5,4 m)','besi','Lokal','lembar',410000,475000,null,25,5,52,'rods:#546e7a','Wiremesh untuk cor lantai dan jalan lingkungan.',0],
  ['BSI-004','Kawat Bendrat','besi','Lokal','kilogram',15500,19000,null,180,30,1,'rods:#78909c','Kawat pengikat besi beton, dijual per kilogram.',0],
  ['KRM-001','Keramik Lantai 40x40 (isi 6)','keramik','Platinum','dus',58000,72000,null,300,40,24,'tile:#b0a090','Keramik lantai 40x40 cm, 1 dus berisi 6 lembar (± 0,96 m²).',1],
  ['KRM-002','Granit Tile 60x60 (isi 4)','keramik','Roman','dus',195000,245000,229000,80,15,27,'tile:#8d99a6','Granit tile 60x60 cm, 1 dus berisi 4 lembar (± 1,44 m²).',0],
  ['KRM-003','Keramik Dinding 25x40 (isi 11)','keramik','Mulia','dus',68000,84000,null,6,12,22,'tile:#c9b8a8','Keramik dinding 25x40 cm, 1 dus berisi 11 lembar.',0],
  ['CAT-001','Cat Tembok Interior 20 L','cat','Dulux','pail',560000,650000,615000,35,6,25,'paint:#1976d2','Cat tembok interior daya tutup baik, kemasan pail 20 liter.',1],
  ['CAT-002','Cat Tembok Eksterior 5 kg','cat','Nippon','galon',105000,128000,null,60,10,6,'paint:#2e7d32','Cat tembok eksterior tahan cuaca, kemasan galon 5 kg.',0],
  ['CAT-003','Cat Kayu & Besi 1 kg','cat','Avian','kaleng',48000,62000,null,75,15,1.2,'paint:#6d4c41','Cat sintetis untuk kayu dan besi, kemasan kaleng 1 kg.',0],
  ['CAT-004','Plamir Tembok 5 kg','cat','Sika','pail',38000,49000,null,50,10,5.5,'paint:#bdbdbd','Plamir dasar untuk meratakan permukaan tembok sebelum dicat.',0],
  ['ALT-001','Palu Konde 8 oz','alat','Tekiro','buah',38000,55000,null,40,8,0.6,'tools:#ef6c00','Palu konde gagang ergonomis untuk pertukangan umum.',0],
  ['ALT-002','Meteran Gulung 5 m','alat','Stanley','buah',22000,32000,29000,55,10,0.3,'tools:#fbc02d','Meteran gulung baja 5 meter dengan kunci.',0],
  ['ALT-003','Cangkul Baja','alat','Lokal','buah',48000,65000,null,30,6,2.2,'tools:#5d4037','Cangkul baja dengan gagang kayu, tahan pakai.',0],
  ['ALT-004','Sekop Bangunan','alat','Lokal','buah',42000,58000,null,34,6,1.8,'tools:#607d8b','Sekop bangunan untuk adukan dan penggalian ringan.',0],
  ['SAN-001','Pipa PVC 3" AW (4 m)','sanitasi','Rucika','batang',62000,78000,null,120,20,4.3,'pipe:#eceff1','Pipa PVC 3 inci kelas AW, panjang 4 meter.',1],
  ['SAN-002','Pipa PVC 1/2" AW (4 m)','sanitasi','Rucika','batang',16000,22000,null,200,40,1.1,'pipe:#cfd8dc','Pipa PVC 1/2 inci kelas AW, panjang 4 meter.',0],
  ['SAN-003','Closet Duduk Standar','sanitasi','Ina','buah',520000,650000,599000,14,3,22,'pipe:#ffffff','Closet duduk keramik standar lengkap tutup dudukan.',0],
  ['SAN-004','Keran Air 1/2" Kuningan','sanitasi','Onda','buah',24000,35000,null,90,15,0.4,'pipe:#ffc107','Keran air kuningan ukuran 1/2 inci.',0],
  ['ELK-001','Lampu LED 12 W','elektrikal','Philips','buah',17500,25000,22000,260,50,0.1,'bulb:#ffd54f','Lampu LED 12 watt cahaya putih, hemat listrik.',1],
  ['ELK-002','Kabel NYM 2x1,5 mm (50 m)','elektrikal','Eterna','roll',365000,430000,null,24,5,4.2,'bulb:#ef5350','Kabel NYM 2x1,5 mm roll 50 meter.',0],
  ['ELK-003','Saklar Tunggal Engkel','elektrikal','Broco','buah',11000,16000,null,150,30,0.1,'bulb:#e0e0e0','Saklar tunggal engkel untuk instalasi rumah.',0],
  ['ELK-004','MCB 10 A 1 Fasa','elektrikal','Schneider','buah',48000,65000,null,0,10,0.2,'bulb:#43a047','MCB 10 ampere 1 fasa pengaman instalasi listrik.',0],
  ['KYU-001','Gypsum Board 9 mm (1,2 x 2,4 m)','kayu','Jayaboard','lembar',58000,72000,null,110,20,17,'board:#e0d6c3','Papan gypsum 9 mm untuk plafon dan partisi ringan.',1],
  ['KYU-002','Rangka Hollow Galvalum 4x4 (4 m)','kayu','Lokal','batang',21000,29000,null,300,60,1.6,'board:#90a4ae','Rangka hollow galvalum untuk plafon gypsum.',0],
  ['KYU-003','Triplek 9 mm (122x244)','kayu','Lokal','lembar',105000,130000,null,45,10,17,'board:#c8a165','Triplek multiplek 9 mm untuk bekisting dan furnitur.',0],
  ['KYU-004','Kayu Kaso 4/6 (4 m)','kayu','Lokal','batang',38000,48000,null,150,30,6.5,'board:#a67c52','Kayu kaso 4x6 cm panjang 4 meter untuk rangka atap.',0],
  ['ATP-001','Baja Ringan C75 0,75 (6 m)','atap','Taso','batang',98000,125000,null,100,20,9,'roof:#607d8b','Rangka atap baja ringan C75 tebal 0,75 mm panjang 6 meter.',1],
  ['ATP-002','Genteng Metal Pasir','atap','Multiroof','lembar',42000,55000,52000,260,40,3.5,'roof:#c0392b','Genteng metal berlapis pasir, ringan dan tahan karat.',0],
  ['ATP-003','Seng Gelombang BJLS 0,2 (2 m)','atap','Lokal','lembar',52000,68000,null,140,25,4,'roof:#b0bec5','Seng gelombang BJLS ukuran 2 meter.',0],
  ['ATP-004','Paku Beton 2" (1 kg)','atap','Lokal','kilogram',22000,30000,null,70,15,1,'tools:#8d6e63','Paku beton 2 inci, dijual per kilogram.',0]
];

TB.DEFAULT_USERS = [
  { id: 'u-owner', name: 'Pemilik Toko (Demo)', email: 'owner@tokobangunan.demo', role: 'owner', active: true,
    salt: 'tb-own-9f3a', passwordHash: '32a460762fb3c641281037a520f76391e30fe22273733205ab78bdf6c14a4a78', mustChange: true },
  { id: 'u-kasir', name: 'Kasir Demo', email: 'kasir@tokobangunan.demo', role: 'kasir', active: true,
    salt: 'tb-ksr-27c1', passwordHash: '9865e35bb33339d96704b86c5b1537542f2525193b26455492987e4a0bcbdda2', mustChange: true },
  { id: 'u-stok', name: 'Admin Stok Demo', email: 'admin@tokobangunan.demo', role: 'admin', active: true,
    salt: 'tb-stk-5d84', passwordHash: 'af7a8063c888cefdfa477a50bc7b3f3fdf444f9d0a2c5f32990e7e41e4b8a31d', mustChange: true }
];

TB.ROLES = {
  owner: { label: 'Owner',       home: 'owner.html',      pages: ['owner.html', 'kasir.html', 'admin-stok.html', 'laporan.html', 'pengaturan.html'] },
  kasir: { label: 'Kasir',       home: 'kasir.html',      pages: ['kasir.html', 'laporan.html'] },
  admin: { label: 'Admin Stok',  home: 'admin-stok.html', pages: ['admin-stok.html', 'laporan.html'] }
};

TB.DEFAULT_SETTINGS = {
  store: {
    name: 'TOKO BANGUNAN',
    tagline: 'Semua Kebutuhan Bangunan, Harga Terbaik, Pengiriman Tepat.',
    address: 'Jl. Contoh Raya No. 123, Kota Anda (ubah di Pengaturan)',
    phone: '0812-3456-7890',
    whatsapp: '6281234567890',          // format internasional tanpa +, WAJIB diganti pemilik
    email: 'info@tokobangunan.example',
    hours: 'Senin–Sabtu 07.30–17.00 · Minggu 08.00–14.00',
    mapsUrl: '',
    receiptFooter: 'Terima kasih sudah berbelanja. Barang yang sudah dibeli tidak dapat ditukar kecuali ada perjanjian.',
    demoNotice: true
  },
  payments: {
    qris: { enabled: true, image: 'qris.png', merchant: 'RIKI HERMAWAN, DIGITAL & KREATIF', nmid: 'ID1026615097429', note: 'Scan QRIS, masukkan nominal sesuai total pesanan, lalu kirim bukti pembayaran lewat WhatsApp.' },
    cod:  { enabled: true, zones: ['z1', 'z2'], note: 'Bayar tunai ke kurir saat barang diterima. Hanya untuk zona yang diizinkan.' },
    pickup: { enabled: true, note: 'Ambil barang di toko dan bayar di kasir.' },
    posMethods: ['Tunai', 'QRIS', 'Transfer']
  },
  shipping: {
    heavyThresholdKg: 500,
    heavySurchargePer100Kg: 15000,
    zones: [
      { id: 'z1', name: 'Zona 1 · 0–5 km',   minKm: 0,  maxKm: 5,  fee: 0 },
      { id: 'z2', name: 'Zona 2 · 5–10 km',  minKm: 5,  maxKm: 10, fee: 25000 },
      { id: 'z3', name: 'Zona 3 · 10–20 km', minKm: 10, maxKm: 20, fee: 60000 },
      { id: 'z4', name: 'Zona 4 · 20–35 km', minKm: 20, maxKm: 35, fee: 120000 }
    ],
    vehicles: [
      { id: 'v1', name: 'Pickup Bak Terbuka',      cls: 'ringan', capacityKg: 700,  baseFee: 40000,  perKmFee: 3000 },
      { id: 'v2', name: 'Mobil Box / Engkel',      cls: 'ringan', capacityKg: 1500, baseFee: 75000,  perKmFee: 4500 },
      { id: 'v3', name: 'Truk Engkel Material',    cls: 'berat',  capacityKg: 4000, baseFee: 150000, perKmFee: 7000 },
      { id: 'v4', name: 'Truk Tronton / Dump Truk', cls: 'berat', capacityKg: 8000, baseFee: 300000, perKmFee: 10000 }
    ],
    zoneAvgKm: { z1: 3, z2: 8, z3: 15, z4: 28 },
    note: 'Ongkos kirim adalah ESTIMASI berdasarkan zona yang dipilih. Toko akan mengonfirmasi biaya akhir.'
  },
  discountRules: [
    { id: 'd1', minSubtotal: 5000000,  percent: 2, label: 'Diskon belanja ≥ Rp5 juta' },
    { id: 'd2', minSubtotal: 15000000, percent: 3.5, label: 'Diskon belanja ≥ Rp15 juta' }
  ],
  lowStockDefault: 10
};

/* ---- Generator transaksi demo (deterministik) ---- */
TB.makeSeededRandom = function (seed) {
  let s = seed >>> 0;
  return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
};

TB.buildDemoProducts = function () {
  return TB.DEFAULT_PRODUCTS_RAW.map(function (r, i) {
    const art = String(r[11]).split(':');
    return {
      id: 'p' + String(i + 1).padStart(3, '0'), sku: r[0], name: r[1], category: r[2], brand: r[3], unit: r[4],
      cost: r[5], price: r[6], promoPrice: r[7], promoStart: r[7] ? TB.dateKey(new Date(Date.now() - 5 * 864e5)) : null,
      promoEnd: r[7] ? TB.dateKey(new Date(Date.now() + 25 * 864e5)) : null,
      stock: r[8], minStock: r[9], weightKg: r[10], artType: art[0], artColor: art[1],
      description: r[12], featured: !!r[13], active: true, demo: true,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
    };
  });
};

TB.buildDemoTransactions = function (products) {
  const rnd = TB.makeSeededRandom(20261019);
  const txns = [];
  const names = ['Budi Santoso', 'Siti Aminah', 'CV Karya Mandiri', 'Pak Haji Darto', 'Ibu Ratna', 'Joko Susilo', 'PT Bangun Jaya', 'Agus Pratama', 'Dewi Lestari', 'Tukang Slamet'];
  const methods = ['Tunai', 'Tunai', 'Tunai', 'QRIS', 'QRIS', 'Transfer'];
  const weights = products.map(function (p) { return p.featured ? 4 : 1; });
  const wsum = weights.reduce(function (a, b) { return a + b; }, 0);
  function pick() { let r = rnd() * wsum; for (let i = 0; i < products.length; i++) { r -= weights[i]; if (r <= 0) return products[i]; } return products[0]; }
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const counters = {};
  for (let d = 24; d >= 0; d--) {
    const day = new Date(today.getTime() - d * 864e5);
    const n = 5 + Math.floor(rnd() * 8) + (d === 0 ? -1 : 0);
    for (let t = 0; t < n; t++) {
      const items = []; const k = 1 + Math.floor(rnd() * 3);
      const used = {};
      for (let j = 0; j < k; j++) {
        const p = pick(); if (used[p.id]) continue; used[p.id] = 1;
        let qty = p.unit === 'buah' && p.price < 5000 ? 50 + Math.floor(rnd() * 400) : 1 + Math.floor(rnd() * (p.price > 200000 ? 3 : 12));
        const price = p.promoPrice && rnd() > 0.5 ? p.promoPrice : p.price;
        items.push({ productId: p.id, sku: p.sku, name: p.name, unit: p.unit, qty: qty, price: price, cost: p.cost, weightKg: p.weightKg });
      }
      const subtotal = items.reduce(function (a, i) { return a + i.qty * i.price; }, 0);
      const disc = TB.calcDiscount(subtotal, TB.DEFAULT_SETTINGS.discountRules);
      const ship = rnd() > 0.78 ? [25000, 60000, 120000][Math.floor(rnd() * 3)] : 0;
      const total = subtotal - disc.amount + ship;
      const nowH = (Date.now() - today.getTime()) / 36e5; const when = new Date(day.getTime() + (d === 0 ? 6.5 + rnd() * Math.max(0.3, nowH - 6.6) : 7.5 + rnd() * 9) * 36e5);
      if (when > new Date()) continue;
      const method = methods[Math.floor(rnd() * methods.length)];
      const key = TB.dateKey(when).replace(/-/g, '').slice(2);
      counters[key] = (counters[key] || 0) + 1;
      const isOnline = ship > 0 && rnd() > 0.4;
      txns.push({
        id: (isOnline ? 'ORD-' : 'TRX-') + key + '-' + String(counters[key]).padStart(4, '0'),
        clientRef: 'demo-' + key + '-' + counters[key],
        type: isOnline ? 'online' : 'pos', createdAt: when.toISOString(),
        cashierId: isOnline ? null : 'u-kasir', cashierName: isOnline ? 'Pesanan Online' : 'Kasir Demo',
        customer: { name: names[Math.floor(rnd() * names.length)], phone: '08' + String(1000000000 + Math.floor(rnd() * 8999999999)).slice(0, 10), address: ship ? 'Alamat demo' : '' },
        items: items, subtotal: subtotal, discount: disc.amount, discountLabel: disc.label, shipping: ship, total: total,
        deliveryMethod: ship ? 'delivery' : 'pickup', paymentMethod: method, paymentStatus: 'Lunas',
        orderStatus: 'Selesai', cashReceived: method === 'Tunai' ? Math.ceil(total / 50000) * 50000 : null,
        change: method === 'Tunai' ? Math.ceil(total / 50000) * 50000 - total : null,
        notes: '', voided: false, demo: true, audit: []
      });
    }
  }
  return { txns: txns, counters: counters };
};
