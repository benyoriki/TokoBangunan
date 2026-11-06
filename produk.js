/* produk.js — Detail produk (data dari LocalStorage via ?id=) */
TB.ready(function () {
  'use strict';
  const $ = TB.$; TB.warnDemo($('#demo-banner'));
  const p = TB.svc.getProduct(TB.param('id')); const box = $('#pd-content');
  if (!p || !p.active) { box.innerHTML = '<div class="empty">' + TB.icon('search', 44) + '<h3>Produk tidak ditemukan</h3><p>Produk mungkin sudah tidak dijual.</p><a class="btn btn-primary" href="katalog.html">Lihat Katalog</a></div>'; TB.hydrate(document); return; }
  document.title = p.name + ' — TOKO BANGUNAN';
  const cat = TB.store.getCategories().find(function (c) { return c.id === p.category; });
  $('#pd-crumb').innerHTML = '<a href="index.html">Home</a> / <a href="katalog.html">Katalog</a>' + (cat ? ' / <a href="katalog.html?cat=' + encodeURIComponent(cat.id) + '">' + TB.esc(cat.short || cat.name) + '</a>' : '') + ' / <span>' + TB.esc(p.name) + '</span>';
  function render() {
    const q = TB.svc.getProduct(p.id), promo = TB.isPromo(q), st = TB.stockStatus(q), step = TB.qtyStep(q), wa = TB.waProductUrl(q);
    box.innerHTML = '<div class="pd-wrap"><div class="pd-gal"><div class="pd-main">' + TB.imgTag(q, '', 600) + (promo ? '<span class="pill promo" style="position:absolute;top:12px;left:12px">PROMO -' + TB.promoPct(q) + '%</span>' : '') + '</div></div>' +
      '<div class="pd-info"><div class="pbrand muted small" style="text-transform:uppercase;font-weight:700;letter-spacing:.05em">' + TB.esc(q.brand) + '</div><h1>' + TB.esc(q.name) + '</h1>' +
      '<div class="pd-price">' + TB.rp(TB.effPrice(q)) + ' <small>/ ' + TB.esc(q.unit) + '</small>' + (promo ? '<span class="price-old" style="font-size:16px">' + TB.rp(q.price) + '</span>' : '') + '</div>' +
      (promo ? '<p class="small"><span class="pill promo">PROMO AKTIF</span> ' + (q.promoEnd ? 'berlaku s.d. ' + TB.fmtDate(q.promoEnd) : 'selama stok tersedia') + '</p>' : '') +
      '<p class="pstock stock ' + st.cls + '"><b>' + st.label + '</b>' + (q.stock > 0 ? ' · ' + TB.num(q.stock) + ' ' + TB.esc(q.unit) : '') + '</p>' +
      '<p>' + TB.esc(q.description || '') + '</p>' +
      '<div class="pd-meta"><div><small>SKU</small><b>' + TB.esc(q.sku) + '</b></div><div><small>Kategori</small><b>' + TB.esc(cat ? cat.name : '-') + '</b></div><div><small>Satuan</small><b>' + TB.esc(q.unit) + '</b></div><div><small>Perkiraan berat</small><b>' + (q.weightKg ? TB.num(q.weightKg) + ' kg / ' + TB.esc(q.unit) : '-') + '</b></div></div>' +
      (q.stock > 0 ? '<div class="pd-buy"><div class="qty" role="group" aria-label="Jumlah"><button type="button" id="pd-m" aria-label="Kurangi">' + TB.icon('minus', 16) + '</button><input type="number" id="pd-qty" min="' + step + '" max="' + q.stock + '" step="' + step + '" value="' + step + '" aria-label="Jumlah"><button type="button" id="pd-p" aria-label="Tambah">' + TB.icon('plus', 16) + '</button></div><button class="btn btn-primary btn-lg" id="pd-add" type="button">' + TB.icon('cart', 20) + ' Tambah ke Keranjang</button></div>' : '<div class="alert bad">Stok habis. Tanyakan ketersediaan ulang lewat WhatsApp.</div>') +
      (wa ? '<a class="btn btn-wa btn-lg btn-block" href="' + TB.esc(wa) + '" target="_blank" rel="noopener">' + TB.icon('wa', 20) + ' Tanya via WhatsApp</a>' : '') +
      '<p class="small muted" style="margin-top:12px">Ongkir dihitung di keranjang berdasarkan zona. Stok & harga mengikuti data di browser ini (prototipe).</p></div></div>';
    const inp = $('#pd-qty'); if (inp) {
      $('#pd-m').addEventListener('click', function () { inp.value = Math.max(step, TB.round2((parseFloat(inp.value) || step) - step)); });
      $('#pd-p').addEventListener('click', function () { inp.value = Math.min(q.stock, TB.round2((parseFloat(inp.value) || 0) + step)); });
      $('#pd-add').addEventListener('click', function () { const n = parseFloat(inp.value); if (!(n > 0)) { TB.toast('Jumlah tidak valid.', 'error'); return; } const r = TB.cart.add(q.id, n); TB.toast(r.ok ? 'Ditambahkan ke keranjang.' : r.msg, r.ok ? 'ok' : 'error'); });
    }
    TB.hydrate(document);
  }
  render();
  const rel = TB.store.getProducts().filter(function (x) { return x.active && x.id !== p.id && x.category === p.category; }).slice(0, 4);
  if (rel.length) { $('#pd-related').hidden = false; $('#pd-related-grid').innerHTML = rel.map(function (x) { return TB.productCard(x); }).join(''); TB.bindProducts($('#pd-related-grid')); }
  TB.on('datachange', function (k) { if (/products/.test(k || '')) render(); });
});
