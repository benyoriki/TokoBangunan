/* kasir.js — Dashboard kasir (POS): transaksi, pembayaran, struk, riwayat */
TB.ready(function () {
  'use strict';
  const $ = TB.$; const user = TB.auth.current(); const settings = TB.store.getSettings(); const cats = TB.store.getCategories();
  let pos = []; /* {productId, qty} */ let method = 'Tunai'; let ref = TB.uid('pos'); let busy = false; let rwPage = 1;
  const POS_KEY = 'tb_pos_draft_' + user.id;

  try { const d = JSON.parse(sessionStorage.getItem(POS_KEY) || '[]'); if (Array.isArray(d)) pos = d.filter(function (x) { return TB.svc.getProduct(x.productId); }); } catch (e) { pos = []; }
  function persist() { try { sessionStorage.setItem(POS_KEY, JSON.stringify(pos)); } catch (e) { /* abaikan */ } }

  /* ---- Tab ---- */
  function tab(name) { TB.$$('#kasir-tabs button').forEach(function (b) { b.classList.toggle('active', b.getAttribute('data-tab') === name); }); $('#tab-pos').hidden = name !== 'pos'; $('#tab-riwayat').hidden = name !== 'riwayat'; if (name === 'riwayat') renderHistory(); }
  $('#kasir-tabs').addEventListener('click', function (e) { const b = e.target.closest('[data-tab]'); if (b) { tab(b.getAttribute('data-tab')); } });
  function fromHash() { tab(location.hash === '#riwayat' ? 'riwayat' : 'pos'); } window.addEventListener('hashchange', fromHash);

  /* ---- Produk ---- */
  $('#pos-cat').innerHTML = '<option value="">Semua kategori</option>' + cats.map(function (c) { return '<option value="' + TB.esc(c.id) + '">' + TB.esc(c.name) + '</option>'; }).join('');
  function renderGrid() {
    const q = $('#pos-q').value.trim().toLowerCase(), cat = $('#pos-cat').value;
    const list = TB.store.getProducts().filter(function (p) { return p.active && (!cat || p.category === cat) && (!q || (p.name + ' ' + p.sku + ' ' + p.brand).toLowerCase().indexOf(q) >= 0); }).sort(function (a, b) { return a.name.localeCompare(b.name, 'id'); });
    $('#pos-grid').innerHTML = list.length ? list.map(function (p) {
      const st = TB.stockStatus(p), inCart = (pos.find(function (x) { return x.productId === p.id; }) || {}).qty || 0;
      return '<button type="button" class="pos-item" data-add="' + p.id + '"' + (p.stock <= 0 ? ' disabled' : '') + '><img src="' + TB.productImage(p) + '" alt="" loading="lazy"><div class="b"><div class="n">' + TB.esc(p.name) + '</div><div class="p">' + TB.rp(TB.effPrice(p)) + ' <small class="muted">/' + TB.esc(p.unit) + '</small>' + (TB.isPromo(p) ? ' <span class="pill promo">Promo</span>' : '') + '</div><div class="s stock ' + st.cls + '">' + (p.stock > 0 ? 'Stok ' + TB.num(p.stock) : 'Habis') + (inCart ? ' · di keranjang ' + TB.num(inCart) : '') + '</div></div></button>';
    }).join('') : '<div class="empty" style="grid-column:1/-1">Produk tidak ditemukan.</div>';
  }
  $('#pos-q').addEventListener('input', TB.debounce(renderGrid, 150)); $('#pos-cat').addEventListener('change', renderGrid);
  $('#pos-q').addEventListener('keydown', function (e) { if (e.key === 'Enter') { const first = $('#pos-grid .pos-item:not([disabled])'); if (first) { first.click(); this.select(); } } });
  $('#pos-grid').addEventListener('click', function (e) { const b = e.target.closest('[data-add]'); if (b) addToPos(b.getAttribute('data-add'), null); });

  function addToPos(id, qty) {
    const p = TB.svc.getProduct(id); if (!p || !p.active) return; const step = qty || TB.qtyStep(p); const line = pos.find(function (x) { return x.productId === id; }); const next = TB.round2((line ? line.qty : 0) + step);
    if (next > p.stock) { TB.toast('Stok ' + p.name + ' hanya ' + TB.num(p.stock) + ' ' + p.unit + '.', 'error'); return; }
    if (line) line.qty = next; else pos.push({ productId: id, qty: next }); persist(); renderCart(); renderGrid();
  }
  function setQty(id, q) {
    const p = TB.svc.getProduct(id); const i = pos.findIndex(function (x) { return x.productId === id; }); if (i < 0 || !p) return;
    if (!(q > 0)) pos.splice(i, 1); else if (q > p.stock) { TB.toast('Stok ' + p.name + ' hanya ' + TB.num(p.stock) + ' ' + p.unit + '.', 'error'); pos[i].qty = p.stock; } else pos[i].qty = TB.round2(q);
    persist(); renderCart(); renderGrid();
  }

  /* ---- Keranjang POS ---- */
  function lines() { return pos.map(function (x) { return { product: TB.svc.getProduct(x.productId), qty: x.qty }; }).filter(function (l) { return l.product; }); }
  function totals() { return TB.calcTotals(lines(), { method: 'pickup' }, settings); }
  function renderCart() {
    const ls = lines(); const el = $('#pos-lines');
    el.innerHTML = ls.length ? ls.map(function (l) {
      const p = l.product, step = TB.qtyStep(p);
      return '<div class="pos-line" data-id="' + p.id + '"><div class="n">' + TB.esc(p.name) + '<div class="small muted">' + TB.rp(TB.effPrice(p)) + ' / ' + TB.esc(p.unit) + '</div></div><div class="t">' + TB.rp(TB.effPrice(p) * l.qty) + '</div><div class="qty"><button type="button" data-dec aria-label="Kurangi">' + TB.icon('minus', 14) + '</button><input type="number" min="0" max="' + p.stock + '" step="' + step + '" value="' + l.qty + '" aria-label="Jumlah ' + TB.esc(p.name) + '"><button type="button" data-inc aria-label="Tambah">' + TB.icon('plus', 14) + '</button></div><div style="text-align:right"><button type="button" class="btn btn-ghost btn-sm" data-rm aria-label="Hapus">' + TB.icon('trash', 14) + '</button></div></div>';
    }).join('') : '<div class="empty" style="padding:28px 12px">Klik produk untuk menambah ke transaksi.</div>';
    const t = totals(); $('#pos-sub').textContent = TB.rp(t.subtotal); $('#pos-disc-row').hidden = !t.discount; $('#pos-disc-label').textContent = t.discountLabel || 'Diskon'; $('#pos-disc').textContent = '-' + TB.rp(t.discount); $('#pos-total').textContent = TB.rp(t.total);
    $('#pos-fab-label').textContent = 'Keranjang (' + ls.length + ') · ' + TB.rp(t.total); calcChange(); TB.hydrate($('#pos-cart'));
  }
  $('#pos-lines').addEventListener('click', function (e) {
    const row = e.target.closest('.pos-line'); if (!row) return; const id = row.getAttribute('data-id'), inp = $('input', row), p = TB.svc.getProduct(id), step = TB.qtyStep(p);
    if (e.target.closest('[data-inc]')) setQty(id, parseFloat(inp.value) + step); else if (e.target.closest('[data-dec]')) setQty(id, parseFloat(inp.value) - step); else if (e.target.closest('[data-rm]')) setQty(id, 0);
  });
  $('#pos-lines').addEventListener('change', function (e) { const row = e.target.closest('.pos-line'); if (row && e.target.tagName === 'INPUT') { const v = parseFloat(e.target.value); setQty(row.getAttribute('data-id'), isNaN(v) ? 0 : v); } });
  $('#pos-clear').addEventListener('click', function () { if (!pos.length) return; TB.confirm('Kosongkan semua item transaksi ini?', { danger: true, okLabel: 'Kosongkan' }).then(function (ok) { if (ok) { pos = []; persist(); renderCart(); renderGrid(); } }); });

  /* ---- Pembayaran ---- */
  const methods = settings.payments.posMethods && settings.payments.posMethods.length ? settings.payments.posMethods : ['Tunai', 'QRIS', 'Transfer'];
  $('#pos-methods').innerHTML = methods.map(function (m, i) { return '<label><input type="radio" name="pm" value="' + TB.esc(m) + '"' + (i === 0 ? ' checked' : '') + '>' + TB.esc(m) + '</label>'; }).join(''); method = methods[0];
  $('#pos-methods').addEventListener('change', function (e) { method = e.target.value; syncMethod(); });
  function syncMethod() { $('#pos-cash-box').hidden = method !== 'Tunai'; $('#pos-qris-box').hidden = method === 'Tunai'; $('#pos-show-qris').hidden = method !== 'QRIS'; $('#pos-paid-confirm').closest('label').lastChild.textContent = ' Pembayaran ' + method + ' sudah saya cek masuk'; }
  function calcChange() { const t = totals().total; const cash = parseFloat($('#pos-cash').value) || 0; $('#pos-change').textContent = TB.rp(Math.max(0, cash - t)); $('#pos-change').style.color = cash >= t && t > 0 ? 'var(--ok)' : 'inherit'; }
  $('#pos-cash').addEventListener('input', calcChange);
  $('#pos-show-qris').addEventListener('click', function () { const q = settings.payments.qris; TB.modal({ title: 'QRIS ' + settings.store.name, body: '<div class="qris-box"><img src="' + TB.esc(q.image) + '" alt="QRIS"><p><b>' + TB.esc(q.merchant) + '</b><br>NMID ' + TB.esc(q.nmid) + '</p><p class="alert info" style="text-align:left">QRIS statis: pelanggan memasukkan nominal <b>' + TB.rp(totals().total) + '</b>. Cek notifikasi pembayaran masuk sebelum menyelesaikan transaksi.</p></div>', actions: [{ label: 'Tutup', cls: 'btn-primary' }] }); });
  $('#pos-fab').addEventListener('click', function () { $('#pos').classList.toggle('cart-open'); });
  $('#pos-fab').setAttribute('aria-expanded', 'false');

  $('#pos-pay').addEventListener('click', function () {
    if (busy) return; const err = $('#pos-error'); err.textContent = ''; const ls = lines();
    if (!ls.length) { err.textContent = 'Tambahkan produk terlebih dahulu.'; return; }
    if (method !== 'Tunai' && !$('#pos-paid-confirm').checked) { err.textContent = 'Centang konfirmasi bahwa pembayaran ' + method + ' sudah masuk.'; return; }
    busy = true; const btn = $('#pos-pay'); btn.disabled = true; btn.textContent = 'Memproses…';
    const res = TB.svc.createTransaction({ clientRef: ref, type: 'pos', items: ls.map(function (l) { return { productId: l.product.id, qty: l.qty }; }), customer: { name: $('#pos-cust').value }, deliveryMethod: 'pickup', paymentMethod: method, cashReceived: $('#pos-cash').value }, user);
    busy = false; btn.disabled = false; btn.textContent = 'Proses Pembayaran';
    if (!res.ok) { err.innerHTML = res.errors.map(TB.esc).join('<br>'); if (res.errors.some(function (x) { return /Stok/.test(x); })) { pos = pos.filter(function (x) { const p = TB.svc.getProduct(x.productId); return p && p.stock > 0; }); pos.forEach(function (x) { const p = TB.svc.getProduct(x.productId); if (x.qty > p.stock) x.qty = p.stock; }); persist(); renderCart(); renderGrid(); } return; }
    pos = []; persist(); ref = TB.uid('pos'); $('#pos-cash').value = ''; $('#pos-cust').value = ''; $('#pos-paid-confirm').checked = false; $('#pos').classList.remove('cart-open'); renderCart(); renderGrid(); showSuccess(res.transaction);
  });
  function showSuccess(t) {
    TB.modal({ title: 'Transaksi Berhasil', body: '<div style="text-align:center"><div style="color:var(--ok)">' + TB.icon('check', 44) + '</div><h3>' + TB.esc(t.id) + '</h3></div><div class="sum-row"><span>Total</span><b>' + TB.rp(t.total) + '</b></div><div class="sum-row"><span>Metode</span><b>' + TB.esc(t.paymentMethod) + '</b></div>' + (t.change != null ? '<div class="sum-row"><span>Diterima</span><b>' + TB.rp(t.cashReceived) + '</b></div><div class="sum-row total"><span>Kembalian</span><span style="color:var(--ok)">' + TB.rp(t.change) + '</span></div>' : '') + '<p class="small muted" style="margin-top:10px">' + t.items.length + ' jenis barang · stok sudah dikurangi.</p>',
      actions: [{ label: 'Cetak Struk', cls: 'btn-outline', close: false, onClick: function () { TB.printReceipt(t); return false; } }, { label: 'Transaksi Baru', cls: 'btn-primary' }] });
    $('#pos-q').focus();
  }

  /* ---- Riwayat ---- */
  const today = TB.dateKey(new Date()); $('#rw-from').value = TB.dateKey(new Date(Date.now() - 6 * 864e5)); $('#rw-to').value = today;
  function historyList() {
    let list = TB.store.getTransactions(); const from = $('#rw-from').value, to = $('#rw-to').value, q = $('#rw-q').value.trim().toLowerCase(), ty = $('#rw-type').value;
    if (user.role === 'kasir') list = list.filter(function (t) { return t.type === 'online' || t.cashierId === user.id; });
    return list.filter(function (t) { const d = TB.dateKey(t.createdAt); return (!from || d >= from) && (!to || d <= to) && (!ty || t.type === ty) && (!q || (t.id + ' ' + (t.customer.name || '')).toLowerCase().indexOf(q) >= 0); }).sort(function (a, b) { return b.createdAt.localeCompare(a.createdAt); });
  }
  function renderHistory() {
    $('#rw-note').textContent = user.role === 'kasir' ? 'Menampilkan transaksi kasir Anda dan pesanan online. Pembatalan hanya dapat dilakukan owner.' : 'Owner dapat membatalkan transaksi dari halaman Laporan.';
    const list = historyList(); const pages = Math.max(1, Math.ceil(list.length / 15)); rwPage = Math.min(rwPage, pages); const slice = list.slice((rwPage - 1) * 15, rwPage * 15);
    $('#rw-body').innerHTML = slice.length ? slice.map(function (t) {
      const canConfirm = t.type === 'online' && !t.voided && t.paymentStatus !== 'Lunas';
      return '<tr><td data-label="No."><b>' + TB.esc(t.id) + '</b>' + (t.demo ? ' <span class="pill">demo</span>' : '') + '</td><td data-label="Waktu">' + TB.fmtDateTime(t.createdAt) + '</td><td data-label="Pelanggan">' + TB.esc(t.customer.name || '-') + '</td><td data-label="Metode">' + TB.esc(t.paymentMethod) + '</td><td class="num" data-label="Total">' + TB.rp(t.total) + '</td><td data-label="Status">' + TB.statusPill(t) + '</td><td class="actions"><button class="btn btn-outline btn-sm" data-view="' + t.id + '">Detail</button> <button class="btn btn-outline btn-sm" data-print="' + t.id + '">' + TB.icon('print', 14) + '</button>' + (canConfirm ? ' <button class="btn btn-ok btn-sm" data-pay="' + t.id + '">Konfirmasi Bayar</button>' : '') + '</td></tr>';
    }).join('') : '<tr><td colspan="7" class="center muted" style="padding:28px">Belum ada transaksi pada filter ini.</td></tr>';
    TB.tablePager($('#rw-pager'), rwPage, pages, function (n) { rwPage = n; renderHistory(); });
  }
  ['rw-from', 'rw-to', 'rw-type'].forEach(function (id) { $('#' + id).addEventListener('change', function () { rwPage = 1; renderHistory(); }); }); $('#rw-q').addEventListener('input', TB.debounce(function () { rwPage = 1; renderHistory(); }, 200));
  $('#rw-body').addEventListener('click', function (e) {
    const v = e.target.closest('[data-view]'), pr = e.target.closest('[data-print]'), py = e.target.closest('[data-pay]'); const get = function (id) { return TB.store.getTransactions().find(function (t) { return t.id === id; }); };
    if (v) TB.showTransaction(get(v.getAttribute('data-view'))); if (pr) TB.printReceipt(get(pr.getAttribute('data-print')));
    if (py) { const t = get(py.getAttribute('data-pay')); TB.confirm('Konfirmasi pembayaran ' + TB.rp(t.total) + ' untuk ' + t.id + ' sudah diterima? Lakukan hanya setelah memeriksa dana masuk.', { okLabel: 'Ya, sudah diterima' }).then(function (ok) { if (ok) { TB.svc.updateTransaction(t.id, { paymentStatus: 'Lunas' }, user, 'Pembayaran dikonfirmasi manual oleh ' + user.name); TB.toast('Pembayaran dikonfirmasi.', 'ok'); renderHistory(); } }); }
  });

  renderGrid(); renderCart(); syncMethod(); fromHash(); TB.hydrate(document);
  if (user.role === 'owner') $('#pos-error').textContent = '';
  TB.on('datachange', function (k) { if (/products/.test(k || '')) { renderGrid(); renderCart(); } });
});
