/* home.js — Halaman Home (publik) V2: hero, kategori, material pilihan, promo, proyek, ongkir, keunggulan */
TB.ready(function () {
  'use strict';
  const $ = TB.$; const settings = TB.store.getSettings();
  const products = TB.store.getProducts().filter(function (p) { return p.active; });
  const cats = TB.store.getCategories();
  TB.warnDemo($('#demo-banner'));
  if (TB.CONFIG.HERO_IMAGE) $('#hero-img').src = TB.CONFIG.HERO_IMAGE;

  /* Trust strip (klaim hanya yang didukung sistem) */
  const feats = [['shield', 'Material Berkualitas', 'Beragam merek pilihan'], ['tag', 'Harga Transparan', 'Harga & promo tampil jelas'], ['truck', 'Pengiriman Proyek', 'Ongkir diestimasi per zona'], ['headset', 'Layanan Pelanggan', 'Siap dibantu via WhatsApp']];
  $('#feat-strip').innerHTML = feats.map(function (f) { return '<div class="feat"><span class="ic-wrap">' + TB.icon(f[0], 22) + '</span><div><b>' + f[1] + '</b><small>' + f[2] + '</small></div></div>'; }).join('');

  const promos = products.filter(TB.isPromo).sort(function (a, b) { return TB.promoPct(b) - TB.promoPct(a); });
  if (promos.length) { $('#hero-badge').hidden = false; $('#hero-pct').textContent = TB.promoPct(promos[0]) + '%'; }

  /* Promo: hanya promo yang aktif (tanggal dicek TB.isPromo); tanpa countdown */
  const pb = $('#promo-banner');
  if (promos.length) {
    const p = promos.find(function (x) { return x.stock > 0; }) || promos[0];
    const ends = promos.map(function (x) { return x.promoEnd; }).filter(Boolean).sort();
    pb.innerHTML = '<div class="promo-banner"><img class="pb-img" src="' + TB.productImage(p) + '" alt="' + TB.esc(p.name) + '" width="132" height="132"><div><span class="pill" style="background:#fff;color:#b44100;border:0">PROMO AKTIF</span><h3>' + TB.esc(p.name) + '</h3>' +
      '<div class="pb-price"><s>' + TB.rp(p.price) + '</s><b>' + TB.rp(p.promoPrice) + '</b><span>/ ' + TB.esc(p.unit) + '</span><span class="pill" style="background:#0B1422;color:#fff;border:0">-' + TB.promoPct(p) + '%</span></div>' +
      '<p class="small" style="margin:8px 0 0">Berlaku' + (p.promoStart ? ' ' + TB.fmtDate(p.promoStart) : '') + (p.promoEnd ? ' s.d. ' + TB.fmtDate(p.promoEnd) : '') + ' · selama stok tersedia</p></div><a class="btn btn-lg" href="' + TB.productUrl(p) + '">Lihat Produk</a></div>';
    $('#promo-period').textContent = 'Harga promo berlaku' + (ends.length ? ' hingga ' + TB.fmtDate(ends[0]) : '') + ', selama stok tersedia.';
  } else { pb.innerHTML = ''; $('#promo-period').textContent = 'Belum ada promo aktif saat ini.'; }
  $('#promo-grid').innerHTML = promos.length ? promos.slice(0, 4).map(function (p) { return TB.productCard(p); }).join('') : '<div class="empty" style="grid-column:1/-1">Belum ada promo aktif. Cek kembali segera.</div>';

  /* Kategori (data existing; hanya yang punya produk aktif) */
  const catList = cats.map(function (c) { return { c: c, n: products.filter(function (p) { return p.category === c.id; }).length }; }).filter(function (x) { return x.n > 0; });
  $('#cat-grid').innerHTML = catList.map(function (x) { return '<a class="cat-card" href="katalog.html?cat=' + encodeURIComponent(x.c.id) + '"><img src="' + TB.categoryImage(x.c) + '" alt="" loading="lazy" width="240" height="240"><span><b>' + TB.esc(x.c.short || x.c.name) + '</b><small>' + x.n + ' produk</small></span></a>'; }).join('');

  /* Material pilihan: terlaris berdasarkan penjualan tersimpan, cadangan produk unggulan */
  const sold = TB.soldMap();
  let best = products.slice().sort(function (a, b) { return (sold[b.id] || 0) - (sold[a.id] || 0); }).filter(function (p) { return (sold[p.id] || 0) > 0 || p.featured; }).slice(0, 8);
  if (!best.length) best = products.slice(0, 8);
  $('#best-grid').innerHTML = best.map(function (p, i) { return TB.productCard(p, { best: i < 4 && (sold[p.id] || 0) > 0 }); }).join('');

  /* Proyek: tautan ke katalog (tanpa paket/harga fiktif) */
  const PROJ = [['Pembangunan Rumah', 'Pondasi, dinding, dan struktur', ['semen', 'pasir', 'bata', 'besi'], 'semen'], ['Renovasi', 'Perbaikan dan penggantian', ['alat', 'cat', 'keramik', 'sanitasi'], 'alat'], ['Pengecatan', 'Cat dan pelapis dinding', ['cat'], 'cat'],
    ['Finishing', 'Lantai, plafon, dan cat akhir', ['keramik', 'cat', 'kayu'], 'keramik'], ['Material Atap', 'Rangka dan penutup atap', ['atap'], 'atap'], ['Material Lantai', 'Keramik, granit, dan perekat', ['keramik', 'semen'], 'keramik']];
  $('#proj-grid').innerHTML = PROJ.map(function (j) {
    const n = products.filter(function (p) { return j[2].indexOf(p.category) >= 0; }).length; const cat = cats.find(function (c) { return c.id === j[3]; }) || { id: j[3] };
    return '<a class="proj-card" href="katalog.html?cat=' + encodeURIComponent(j[2].join(',')) + '&for=' + encodeURIComponent(j[0]) + '"><img src="' + TB.categoryImage(cat) + '" alt="" loading="lazy" width="240" height="240"><b>' + j[0] + '</b><small>' + j[1] + ' · ' + n + ' produk</small></a>';
  }).join('');

  /* Estimasi ongkir (memakai TB.calcShipping existing) */
  const sh = settings.shipping;
  $('#est-zone').innerHTML = '<option value="">— Pilih zona —</option>' + sh.zones.map(function (z) { return '<option value="' + z.id + '">' + TB.esc(z.name) + '</option>'; }).join('') + '<option value="luar">Di luar zona tarif</option>';
  $('#est-note').textContent = sh.note || '';
  function est() {
    const kg = parseFloat($('#est-kg').value) || 0, zone = $('#est-zone').value, m = $('#est-method').value; const out = $('#est-out');
    if (!zone) { out.innerHTML = 'Pilih zona untuk melihat estimasi.'; return; }
    if (!(kg > 0)) { out.innerHTML = 'Isi berat muatan.'; return; }
    const r = TB.calcShipping(kg, m, zone, settings);
    out.innerHTML = r.needsConfirm ? TB.esc(r.label) : 'Estimasi ongkir: <b>' + TB.rp(r.fee) + '</b><br><span class="small">' + TB.esc(r.label) + '</span>';
  }
  ['est-zone', 'est-kg', 'est-method'].forEach(function (id) { $('#' + id).addEventListener('input', est); $('#' + id).addEventListener('change', est); }); est();

  /* Keunggulan (hanya yang didukung sistem) */
  const why = [['tag', 'Harga Transparan', 'Harga normal dan promo tampil jelas; diskon dan ongkir dirinci sebelum memesan.'], ['layers', 'Stok Terpantau', 'Status stok tampil di tiap produk dan berkurang saat transaksi tercatat.'], ['grid', 'Material Lengkap', cats.length + ' kategori dan ' + products.length + ' produk aktif di katalog.'], ['truck', 'Pengiriman', 'Ambil di toko atau diantar kendaraan toko sesuai zona.'], ['headset', 'Layanan Pelanggan', 'Konfirmasi pesanan dan tanya produk lewat WhatsApp.']];
  $('#why-grid').innerHTML = why.map(function (w) { return '<div class="card why"><div class="ic-wrap">' + TB.icon(w[0], 22) + '</div><h3>' + w[1] + '</h3><p class="muted">' + w[2] + '</p></div>'; }).join('');
  const exp = [['phone2', 'Belanja dari HP', 'Cari material, atur jumlah, dan pesan tanpa antre di toko.'], ['check2', 'Harga & stok terlihat dulu', 'Lihat harga satuan, promo, dan ketersediaan sebelum memesan.'], ['wa', 'Konfirmasi lewat WhatsApp', 'Pesanan dikirim ke toko dan baru final setelah dikonfirmasi.']];
  $('#exp-grid').innerHTML = exp.map(function (w) { return '<div class="card exp"><div class="ic-wrap">' + TB.icon(w[0], 22) + '</div><div><h3>' + w[1] + '</h3><p class="muted">' + w[2] + '</p></div></div>'; }).join('');

  TB.bindProducts($('#page')); TB.hydrate(document);
  TB.on('datachange', function (k) { if (/products|transactions|settings/.test(k || '')) location.reload(); });
});
