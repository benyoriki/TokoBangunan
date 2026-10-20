/* home.js — Halaman Home (publik): hero, promo, kategori, produk terlaris & promo */
TB.ready(function () {
  'use strict';
  const products = TB.store.getProducts().filter(function (p) { return p.active; });
  const cats = TB.store.getCategories();
  TB.warnDemo(TB.$('#demo-banner'));

  /* Hero: produk pilihan (data nyata dari toko) */
  const pick = products.filter(function (p) { return p.featured && p.stock > 0; }).slice(0, 4);
  TB.$('#hero-art').insertAdjacentHTML('afterbegin', pick.map(function (p) {
    return '<a class="hero-tile" href="katalog.html?q=' + encodeURIComponent(p.name) + '"><img src="' + TB.productImage(p) + '" alt="' + TB.esc(p.name) + '" width="200" height="200"><b>' + TB.esc(p.name) + '</b><span>' + TB.rp(TB.effPrice(p)) + '</span></a>';
  }).join(''));

  const feats = [['tag', 'Harga Terbaik', 'Harga transparan, promo jelas'], ['layers', 'Stok Terpantau', 'Tidak oversell, stok real-time'], ['truck', 'Pengiriman Material', 'Pickup hingga truk ke lokasi'], ['store', 'Ecer & Grosir', 'Melayani semua kebutuhan']];
  TB.$('#feat-strip').innerHTML = feats.map(function (f) { return '<div class="feat"><span class="ic-wrap">' + TB.icon(f[0], 22) + '</span><div><b>' + f[1] + '</b><small>' + f[2] + '</small></div></div>'; }).join('');

  const promos = products.filter(TB.isPromo).sort(function (a, b) { return TB.promoPct(b) - TB.promoPct(a); });
  if (promos.length) {
    const maxPct = TB.promoPct(promos[0]); const badge = TB.$('#hero-badge'); badge.hidden = false; TB.$('#hero-pct', badge).textContent = maxPct + '%';
    badge.querySelector('small').textContent = 'HEMAT HINGGA';
  }

  /* Banner promo: harga normal, harga promo, periode */
  const pb = TB.$('#promo-banner');
  if (promos.length) {
    const p = promos.find(function (x) { return x.stock > 0; }) || promos[0];
    const ends = promos.map(function (x) { return x.promoEnd; }).filter(Boolean).sort();
    pb.innerHTML = '<div class="promo-banner"><img src="' + TB.productImage(p) + '" alt="' + TB.esc(p.name) + '" width="110" height="110" style="border-radius:14px;background:#fff"><div><span class="pill" style="background:#fff;color:#b44100;border:0">PROMO SPESIAL</span><h3 id="promo-title" style="margin-top:8px">' + TB.esc(p.name) + '</h3>' +
      '<p><span style="text-decoration:line-through;opacity:.85">' + TB.rp(p.price) + '</span> &nbsp; <b style="font-size:26px">' + TB.rp(p.promoPrice) + '</b> / ' + TB.esc(p.unit) + ' &nbsp; <span class="pill" style="background:#0b2a4a;color:#fff;border:0">-' + TB.promoPct(p) + '%</span></p>' +
      '<p class="small">Periode promo' + (p.promoStart ? ': ' + TB.fmtDate(p.promoStart) : '') + (p.promoEnd ? ' – ' + TB.fmtDate(p.promoEnd) : '') + ' · selama stok tersedia</p></div><a class="btn btn-lg" href="katalog.html?promo=1">Lihat Semua Promo</a></div>';
    TB.$('#promo-period').textContent = 'Harga promo berlaku' + (ends.length ? ' hingga ' + TB.fmtDate(ends[0]) : '') + ', selama stok tersedia.';
  } else {
    pb.innerHTML = '<div class="promo-banner"><div></div><div><h3 id="promo-title">Belanja Material, Harga Transparan</h3><p>Belum ada promo aktif saat ini. Cek kembali segera.</p></div><a class="btn btn-lg" href="katalog.html">Lihat Katalog</a></div>';
    TB.$('#promo-period').textContent = 'Belum ada promo aktif.';
  }

  /* Kategori */
  TB.$('#cat-grid').innerHTML = cats.map(function (c) {
    const n = products.filter(function (p) { return p.category === c.id; }).length;
    return '<a class="cat-card" href="katalog.html?cat=' + encodeURIComponent(c.id) + '"><img src="' + TB.categoryImage(c) + '" alt="" loading="lazy" width="120" height="120"><b>' + TB.esc(c.short || c.name) + '</b><small>' + n + ' produk</small></a>';
  }).join('');

  /* Terlaris: berdasarkan penjualan tersimpan; cadangan: produk unggulan */
  const sold = TB.soldMap();
  let best = products.slice().sort(function (a, b) { return (sold[b.id] || 0) - (sold[a.id] || 0); }).filter(function (p) { return (sold[p.id] || 0) > 0 || p.featured; }).slice(0, 8);
  if (!best.length) best = products.slice(0, 8);
  TB.$('#best-grid').innerHTML = best.map(TB.productCard).join('');
  const pg = promos.slice(0, 4); TB.$('#promo-grid').innerHTML = pg.length ? pg.map(TB.productCard).join('') : '<div class="empty" style="grid-column:1/-1">Belum ada promo aktif.</div>';
  TB.bindProducts(TB.$('#page'));
  TB.hydrate(document);
  TB.on('datachange', function (k) { if (/products|transactions|settings/.test(k || '')) location.reload(); });
});
