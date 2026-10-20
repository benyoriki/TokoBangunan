/* keranjang.js — Keranjang, pengiriman material, pembayaran, checkout, WhatsApp */
TB.ready(function () {
  'use strict';
  const $ = TB.$; const settings = TB.store.getSettings();
  TB.warnDemo($('#demo-banner'));
  const state = { method: 'pickup', zone: '', pay: '' };
  let busy = false;

  function clientRef() { try { let r = sessionStorage.getItem('tb_clientref'); if (!r) { r = TB.uid('co'); sessionStorage.setItem('tb_clientref', r); } return r; } catch (e) { return TB.uid('co'); } }

  /* Bersihkan item yang produknya sudah tidak tersedia / melebihi stok */
  function sanitizeCart() {
    const notes = []; const cart = TB.store.getCart(); const keep = [];
    cart.forEach(function (c) {
      const p = TB.svc.getProduct(c.productId);
      if (!p || !p.active) { notes.push('Satu produk tidak lagi dijual dan dihapus dari keranjang.'); return; }
      if (p.stock <= 0) { notes.push(p.name + ' stok habis dan dihapus dari keranjang.'); return; }
      if (c.qty > p.stock) { notes.push('Jumlah ' + p.name + ' disesuaikan dengan stok tersedia (' + TB.num(p.stock) + ' ' + p.unit + ').'); c.qty = p.stock; }
      keep.push(c);
    });
    if (notes.length) { TB.store.saveCart(keep); notes.forEach(function (n) { TB.toast(n, 'error'); }); }
  }

  function renderItems() {
    const lines = TB.cart.lines(); const box = $('#cart-items');
    if (!lines.length) { box.innerHTML = '<div class="empty">' + TB.icon('cart', 44) + '<h3>Keranjang masih kosong</h3><p>Pilih material di katalog untuk mulai berbelanja.</p><a class="btn btn-primary" href="katalog.html">Lihat Katalog</a></div>'; return; }
    box.innerHTML = lines.map(function (l) {
      const p = l.product, promo = TB.isPromo(p), step = TB.qtyStep(p);
      return '<div class="cart-item" data-id="' + p.id + '"><img src="' + TB.productImage(p) + '" alt="' + TB.esc(p.name) + '"><div><b>' + TB.esc(p.name) + '</b><div class="small muted">' + TB.esc(p.sku) + ' · stok ' + TB.num(p.stock) + ' ' + TB.esc(p.unit) + '</div>' +
        '<div>' + TB.rp(TB.effPrice(p)) + ' / ' + TB.esc(p.unit) + (promo ? ' <span class="price-old">' + TB.rp(p.price) + '</span> <span class="pill promo">Promo</span>' : '') + '</div></div>' +
        '<div class="c-end"><div class="qty" role="group" aria-label="Jumlah ' + TB.esc(p.name) + '"><button type="button" data-dec aria-label="Kurangi">' + TB.icon('minus', 16) + '</button><input type="number" min="' + step + '" max="' + p.stock + '" step="' + step + '" value="' + l.qty + '" aria-label="Jumlah"><button type="button" data-inc aria-label="Tambah">' + TB.icon('plus', 16) + '</button></div>' +
        '<div style="text-align:right"><b>' + TB.rp(TB.effPrice(p) * l.qty) + '</b><br><button type="button" class="btn btn-ghost btn-sm" data-rm aria-label="Hapus ' + TB.esc(p.name) + '">' + TB.icon('trash', 16) + ' Hapus</button></div></div></div>';
    }).join('');
  }

  function renderShipOptions() {
    const w = TB.calcTotals(TB.cart.lines(), {}, settings).weightKg; const heavy = w > settings.shipping.heavyThresholdKg;
    const opts = [['pickup', 'Ambil sendiri di toko', 'Tanpa ongkir. Barang disiapkan setelah pesanan dikonfirmasi.'], ['delivery', 'Pengiriman kendaraan toko', 'Pickup / mobil box untuk muatan ringan hingga sedang.'], ['heavy', 'Pengiriman material berat / jumlah besar', 'Truk untuk pasir, batu, bata, besi, dan semen dalam jumlah banyak.']];
    $('#ship-options').innerHTML = (heavy ? '<div class="alert warn small">' + TB.icon('truck', 18) + '<span>Perkiraan berat pesanan <b>' + TB.num(w) + ' kg</b>. Disarankan memilih <b>pengiriman material berat</b>.</span></div>' : '') +
      opts.map(function (o) { return '<label class="opt"><input type="radio" name="ship" value="' + o[0] + '"' + (state.method === o[0] ? ' checked' : '') + '><span><b>' + o[1] + '</b><small>' + o[2] + '</small></span></label>'; }).join('');
  }
  function renderZones() {
    const sel = $('#c-zone'); const cur = state.zone;
    sel.innerHTML = '<option value="">— Pilih zona —</option>' + settings.shipping.zones.map(function (z) { return '<option value="' + z.id + '">' + TB.esc(z.name) + '</option>'; }).join('') + '<option value="luar">Di luar zona tarif (konfirmasi ongkir dengan toko)</option>';
    sel.value = cur; $('#zone-hint').textContent = 'Ongkir dihitung dari zona yang Anda pilih, bukan dari peta otomatis. Pilih zona yang paling sesuai dengan alamat.';
  }
  function payAllowed() {
    const p = settings.payments; const out = [];
    if (p.qris.enabled) out.push({ id: 'QRIS', title: 'QRIS', desc: 'Scan QRIS toko dan bayar sesuai total. Status tetap "Menunggu Pembayaran" sampai toko memverifikasi.' });
    if (state.method === 'pickup') { if (p.pickup.enabled) out.push({ id: 'PICKUP', title: 'Ambil sendiri & bayar di toko', desc: p.pickup.note }); }
    else if (p.cod.enabled) { const ok = state.zone && state.zone !== 'luar' && p.cod.zones.indexOf(state.zone) >= 0; out.push({ id: 'COD', title: 'Bayar di tempat (COD)', desc: p.cod.note, disabled: !ok, why: ok ? '' : (state.zone ? 'COD tidak tersedia untuk zona ini.' : 'Pilih zona pengiriman terlebih dahulu.') }); }
    return out;
  }
  function renderPay() {
    const opts = payAllowed(); if (!opts.some(function (o) { return o.id === state.pay && !o.disabled; })) state.pay = (opts.find(function (o) { return !o.disabled; }) || {}).id || '';
    $('#pay-options').innerHTML = opts.length ? opts.map(function (o) { return '<label class="opt' + (o.disabled ? ' disabled' : '') + '"><input type="radio" name="pay" value="' + o.id + '"' + (state.pay === o.id ? ' checked' : '') + (o.disabled ? ' disabled' : '') + '><span><b>' + o.title + '</b><small>' + TB.esc(o.desc) + (o.why ? ' <i>(' + o.why + ')</i>' : '') + '</small></span></label>'; }).join('') : '<div class="alert warn">Belum ada metode pembayaran aktif. Hubungi toko.</div>';
    renderQris(); TB.syncOpts();
  }
  function totals() { return TB.calcTotals(TB.cart.lines(), { method: state.method, zoneId: state.zone }, settings); }
  function renderQris() {
    const box = $('#qris-preview'); if (state.pay !== 'QRIS') { box.hidden = true; return; }
    const q = settings.payments.qris, t = totals(); box.hidden = false;
    box.innerHTML = '<div class="alert info small" style="text-align:left">' + TB.icon('qr', 18) + '<span>Total yang dibayar: <b>' + TB.rp(t.total) + '</b>. QRIS ini <b>statis</b> — masukkan nominal secara manual, lalu kirim bukti bayar lewat WhatsApp.</span></div><img src="' + TB.esc(q.image) + '" alt="QRIS ' + TB.esc(q.merchant) + '"><p class="small" style="margin-top:8px"><b>' + TB.esc(q.merchant) + '</b><br>NMID: ' + TB.esc(q.nmid) + '</p><p class="small muted">' + TB.esc(q.note || '') + '</p>';
  }
  function renderSummary() {
    const lines = TB.cart.lines(); const t = totals(); const el = $('#summary');
    let nudge = ''; const next = (settings.discountRules || []).slice().sort(function (a, b) { return a.minSubtotal - b.minSubtotal; }).find(function (r) { return t.subtotal < r.minSubtotal; });
    if (next && t.subtotal > 0 && next.minSubtotal - t.subtotal <= next.minSubtotal * 0.5) nudge = '<p class="small" style="color:var(--ok)">Belanja ' + TB.rp(next.minSubtotal - t.subtotal) + ' lagi untuk diskon ' + next.percent + '%.</p>';
    el.innerHTML = '<div class="sum-row"><span>Subtotal (' + lines.length + ' item)</span><b>' + TB.rp(t.subtotal) + '</b></div>' + (t.discount ? '<div class="sum-row disc"><span>' + TB.esc(t.discountLabel) + '</span><b>-' + TB.rp(t.discount) + '</b></div>' : '') +
      '<div class="sum-row"><span>Ongkos kirim' + (state.method !== 'pickup' ? ' (estimasi)' : '') + '</span><b>' + (t.ship.needsConfirm ? 'Dikonfirmasi toko' : t.ship.incomplete ? '—' : TB.rp(t.shipping)) + '</b></div>' +
      '<div class="sum-row total"><span>Total</span><span>' + TB.rp(t.total) + (t.ship.needsConfirm ? '<small class="muted" style="display:block;font-size:12px;font-weight:500">+ ongkir (dikonfirmasi)</small>' : '') + '</span></div>' + nudge + (t.weightKg ? '<p class="small muted">Perkiraan berat: ' + TB.num(t.weightKg) + ' kg</p>' : '');
    const d = $('#ship-detail');
    if (state.method !== 'pickup' && state.zone && t.ship) {
      d.hidden = false;
      if (t.ship.needsConfirm) d.innerHTML = TB.icon('info', 18) + '<span>' + TB.esc(t.ship.label) + '. Toko akan menghubungi Anda untuk menyepakati biaya.</span>';
      else d.innerHTML = TB.icon('truck', 18) + '<span><b>' + TB.esc(t.ship.vehicle.name) + '</b>' + (t.ship.trips > 1 ? ' × ' + t.ship.trips + ' rit' : '') + ' · ' + TB.esc(t.ship.zone.name) + '<br><span class="small">Biaya dasar ' + TB.rp(t.ship.vehicle.baseFee) + ' + jarak ±' + t.ship.km + ' km × ' + TB.rp(t.ship.vehicle.perKmFee) + ' + zona ' + TB.rp(t.ship.zone.fee) + (t.ship.heavyExtra ? ' + tambahan barang berat ' + TB.rp(t.ship.heavyExtra) : '') + ' (per rit). <b>' + TB.esc(settings.shipping.note) + '</b></span></span>';
    } else d.hidden = true;
    $('#btn-order').disabled = !lines.length || busy;
  }
  function renderMode() {
    const pick = state.method === 'pickup'; $('#zone-box').hidden = pick; $('#addr-field').hidden = pick;
    renderShipOptions(); renderPay(); renderSummary(); TB.syncOpts();
  }

  /* ---- Event ---- */
  $('#cart-items').addEventListener('click', function (e) {
    const row = e.target.closest('.cart-item'); if (!row) return; const id = row.getAttribute('data-id'); const inp = $('input', row); const p = TB.svc.getProduct(id); const step = TB.qtyStep(p);
    if (e.target.closest('[data-rm]')) { TB.cart.remove(id); refresh(); return; }
    if (e.target.closest('[data-inc]')) { const r = TB.cart.setQty(id, parseFloat(inp.value) + step); if (!r.ok) TB.toast(r.msg, 'error'); refresh(); return; }
    if (e.target.closest('[data-dec]')) { TB.cart.setQty(id, parseFloat(inp.value) - step); refresh(); }
  });
  $('#cart-items').addEventListener('change', function (e) {
    const row = e.target.closest('.cart-item'); if (!row || e.target.tagName !== 'INPUT') return; const v = parseFloat(e.target.value);
    const r = TB.cart.setQty(row.getAttribute('data-id'), isNaN(v) ? 0 : v); if (!r.ok && r.msg) TB.toast(r.msg, 'error'); refresh();
  });
  $('#ship-options').addEventListener('change', function (e) { if (e.target.name === 'ship') { state.method = e.target.value; renderMode(); } });
  $('#c-zone').addEventListener('change', function () { state.zone = this.value; renderPay(); renderSummary(); });
  $('#pay-options').addEventListener('change', function (e) { if (e.target.name === 'pay') { state.pay = e.target.value; renderQris(); } });

  function refresh() { renderItems(); renderShipOptions(); renderPay(); renderSummary(); TB.syncOpts(); TB.hydrate(document); if (!TB.cart.lines().length) $('#btn-order').disabled = true; }

  $('#btn-order').addEventListener('click', function () {
    if (busy) return; const err = $('#co-error'); err.textContent = '';
    const lines = TB.cart.lines(); if (!lines.length) { err.textContent = 'Keranjang kosong.'; return; }
    if (!state.pay) { err.textContent = 'Pilih metode pembayaran.'; return; }
    busy = true; $('#btn-order').disabled = true; $('#btn-order').textContent = 'Memproses…';
    const payMap = { QRIS: 'QRIS', COD: 'COD', PICKUP: 'Bayar di Toko' };
    const res = TB.svc.createTransaction({ clientRef: clientRef(), type: 'online', items: lines.map(function (l) { return { productId: l.product.id, qty: l.qty }; }),
      customer: { name: $('#c-name').value, phone: $('#c-phone').value, address: state.method === 'pickup' ? '' : $('#c-addr').value }, deliveryMethod: state.method, zoneId: state.method === 'pickup' ? '' : state.zone, paymentMethod: payMap[state.pay], notes: $('#c-notes').value }, null);
    busy = false; $('#btn-order').textContent = 'Buat Pesanan';
    if (!res.ok) { err.innerHTML = res.errors.map(TB.esc).join('<br>'); $('#btn-order').disabled = false; err.scrollIntoView({ block: 'center', behavior: 'smooth' }); sanitizeCart(); refresh(); return; }
    TB.cart.clear(); try { sessionStorage.removeItem('tb_clientref'); } catch (e) { /* abaikan */ }
    history.replaceState(null, '', 'keranjang.html?order=' + encodeURIComponent(res.transaction.id)); showDone(res.transaction); window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  function showDone(t) {
    $('#cart-layout').hidden = true; document.querySelector('.steps').hidden = true; const box = $('#order-done'); box.hidden = false;
    const waOk = String(settings.store.whatsapp).replace(/\D/g, '').length >= 8; const q = settings.payments.qris;
    box.innerHTML = '<div class="card card-pad" style="max-width:820px;margin:24px auto"><div style="text-align:center"><div class="ic-wrap" style="width:64px;height:64px;border-radius:50%;background:var(--ok-soft);color:var(--ok);display:inline-grid;place-items:center;margin-bottom:10px">' + TB.icon('check', 34) + '</div><h2>Pesanan Tercatat</h2><p class="muted">Nomor pesanan: <b class="kbd">' + TB.esc(t.id) + '</b></p></div>' +
      '<div class="alert warn">' + TB.icon('alert', 18) + '<span><b>Langkah terakhir:</b> tekan tombol WhatsApp di bawah untuk mengirim pesanan ke toko. Membuka WhatsApp <b>belum</b> berarti pesanan diterima atau dibayar — pesanan baru final setelah toko mengonfirmasi.</span></div>' +
      '<dl class="detail-grid"><div><dt>Status pesanan</dt><dd><span class="pill info">' + (t.voided ? 'Dibatalkan' : 'Baru — menunggu konfirmasi toko') + '</span></dd></div><div><dt>Status pembayaran</dt><dd>' + TB.statusPill(t) + '</dd></div><div><dt>Penerima</dt><dd>' + TB.esc(t.customer.name) + ' · ' + TB.esc(t.customer.phone) + '</dd></div><div><dt>Pengiriman</dt><dd>' + TB.deliveryLabel(t.deliveryMethod) + (t.deliveryMethod !== 'pickup' ? '<br><span class="small muted">' + TB.esc(t.shippingLabel) + '</span>' : '') + '</dd></div>' + (t.deliveryMethod !== 'pickup' ? '<div class="full" style="grid-column:1/-1"><dt>Alamat</dt><dd>' + TB.esc(t.customer.address) + '</dd></div>' : '') + '</dl>' +
      '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Barang</th><th class="num">Qty</th><th class="num">Harga</th><th class="num">Jumlah</th></tr></thead><tbody>' + t.items.map(function (i) { return '<tr><td>' + TB.esc(i.name) + '</td><td class="num">' + TB.num(i.qty) + ' ' + TB.esc(i.unit) + '</td><td class="num">' + TB.rp(i.price) + '</td><td class="num">' + TB.rp(i.qty * i.price) + '</td></tr>'; }).join('') + '</tbody></table></div>' +
      '<div style="max-width:340px;margin:14px 0 0 auto"><div class="sum-row"><span>Subtotal</span><b>' + TB.rp(t.subtotal) + '</b></div>' + (t.discount ? '<div class="sum-row disc"><span>' + TB.esc(t.discountLabel) + '</span><b>-' + TB.rp(t.discount) + '</b></div>' : '') + '<div class="sum-row"><span>Ongkir</span><b>' + (t.shippingNeedsConfirm ? 'Dikonfirmasi toko' : TB.rp(t.shipping)) + '</b></div><div class="sum-row total"><span>Total</span><span>' + TB.rp(t.total) + '</span></div></div>' +
      (t.paymentMethod === 'QRIS' ? '<div class="qris-box" style="margin-top:16px"><h3>Bayar dengan QRIS</h3><img src="' + TB.esc(q.image) + '" alt="QRIS ' + TB.esc(q.merchant) + '"><p class="small"><b>' + TB.esc(q.merchant) + '</b> · NMID ' + TB.esc(q.nmid) + '<br>Bayar sebesar <b>' + TB.rp(t.total) + '</b>, lalu kirim bukti pembayaran lewat WhatsApp. Status: <b>Menunggu Pembayaran</b> sampai dikonfirmasi toko.</p></div>' : '') +
      '<div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center;margin-top:20px">' + (waOk ? '<a class="btn btn-ok btn-lg" id="wa-btn" href="' + TB.esc(TB.whatsappUrl(t, settings)) + '" target="_blank" rel="noopener">' + TB.icon('wa', 20) + ' Lanjutkan ke WhatsApp</a>' : '<div class="alert bad">Nomor WhatsApp toko belum diatur. Hubungi toko melalui telepon ' + TB.esc(settings.store.phone) + '.</div>') +
      '<button class="btn btn-outline btn-lg" id="btn-print" type="button">' + TB.icon('print', 20) + ' Cetak Ringkasan</button><a class="btn btn-ghost btn-lg" href="katalog.html">Belanja Lagi</a></div></div>';
    $('#btn-print', box).addEventListener('click', function () { TB.printReceipt(t); });
  }

  /* ---- Awal ---- */
  const orderId = TB.param('order');
  if (orderId) { const t = TB.store.getTransactions().find(function (x) { return x.id === orderId && x.type === 'online'; }); if (t) { showDone(t); return; } }
  sanitizeCart(); renderZones(); renderMode(); renderItems(); TB.hydrate(document); if (!TB.cart.lines().length) $('#btn-order').disabled = true;
  TB.on('datachange', function (k) { if (/cart|products/.test(k || '')) { sanitizeCart(); refresh(); } });
});
