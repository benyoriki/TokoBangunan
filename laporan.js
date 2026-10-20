/* laporan.js — Laporan transaksi, penjualan, stok, audit (dibatasi per role) */
TB.ready(function () {
  'use strict';
  const $ = TB.$; const user = TB.auth.current(); const isOwner = user.role === 'owner';
  const DAY = 864e5; let page = 1, aPage = 1;
  const tabsDef = [['transaksi', 'Transaksi', true], ['penjualan', 'Laporan Penjualan', user.role !== 'admin'], ['stok', 'Laporan Stok', user.role !== 'kasir'], ['audit', 'Catatan Audit', isOwner]].filter(function (t) { return t[2]; });
  let cur = tabsDef[0][0];
  $('#lap-tabs').innerHTML = tabsDef.map(function (t) { return '<button role="tab" data-tab="' + t[0] + '">' + t[1] + '</button>'; }).join('');
  $('#l-from').value = TB.dateKey(new Date(Date.now() - 29 * DAY)); $('#l-to').value = TB.dateKey(new Date());
  const catName = function (id) { const c = TB.store.getCategories().find(function (x) { return x.id === id; }); return c ? c.name : id; };

  function scoped() {
    let list = TB.store.getTransactions(); if (user.role === 'kasir') list = list.filter(function (t) { return t.type === 'online' || t.cashierId === user.id; });
    const f = $('#l-from').value, to = $('#l-to').value, q = $('#l-q').value.trim().toLowerCase(), st = $('#l-status').value;
    return list.filter(function (t) { const d = TB.dateKey(t.createdAt); return (!f || d >= f) && (!to || d <= to) && (!st || t.paymentStatus === st) && (!q || (t.id + ' ' + t.customer.name + ' ' + t.items.map(function (i) { return i.name; }).join(' ')).toLowerCase().indexOf(q) >= 0); }).sort(function (a, b) { return b.createdAt.localeCompare(a.createdAt); });
  }
  function showTab(n) {
    if (!tabsDef.some(function (t) { return t[0] === n; })) n = tabsDef[0][0]; cur = n;
    TB.$$('#lap-tabs button').forEach(function (b) { b.classList.toggle('active', b.getAttribute('data-tab') === n); });
    ['transaksi', 'penjualan', 'stok', 'audit'].forEach(function (t) { $('#lap-' + t).hidden = t !== n; });
    $('#l-status-wrap').hidden = n !== 'transaksi'; $('#l-from').closest('.field').hidden = $('#l-to').closest('.field').hidden = n === 'stok';
    $('#l-q').closest('.field').hidden = n === 'penjualan'; render();
  }
  $('#lap-tabs').addEventListener('click', function (e) { const b = e.target.closest('[data-tab]'); if (b) { history.replaceState(null, '', '#' + b.getAttribute('data-tab')); page = 1; showTab(b.getAttribute('data-tab')); } });
  window.addEventListener('hashchange', function () { showTab(location.hash.slice(1)); });
  ['l-from', 'l-to', 'l-status'].forEach(function (id) { $('#' + id).addEventListener('change', function () { page = 1; render(); }); }); $('#l-q').addEventListener('input', TB.debounce(function () { page = 1; aPage = 1; render(); }, 200));

  function renderTx() {
    const list = scoped(); const pages = Math.max(1, Math.ceil(list.length / 15)); page = Math.min(page, pages);
    $('#lt-body').innerHTML = list.slice((page - 1) * 15, page * 15).map(function (t) {
      return '<tr><td data-label="No."><b>' + TB.esc(t.id) + '</b>' + (t.demo ? ' <span class="pill">demo</span>' : '') + '</td><td data-label="Waktu">' + TB.fmtDateTime(t.createdAt) + '</td><td data-label="Pelanggan">' + TB.esc(t.customer.name || '-') + '</td><td data-label="Kasir">' + TB.esc(t.cashierName) + '</td><td data-label="Metode">' + TB.esc(t.paymentMethod) + '</td><td class="num" data-label="Total">' + TB.rp(t.total) + '</td><td data-label="Pembayaran">' + TB.statusPill(t) + '</td><td data-label="Pesanan">' + TB.esc(t.orderStatus) + '</td><td class="actions"><button class="btn btn-outline btn-sm" data-view="' + t.id + '">Detail</button></td></tr>';
    }).join('') || '<tr><td colspan="9" class="center muted" style="padding:28px">Tidak ada transaksi pada filter ini.</td></tr>';
    TB.tablePager($('#lt-pager'), page, pages, function (n) { page = n; renderTx(); });
  }
  function renderSales() {
    const list = scoped(); const s = TB.svc.summarize(list); const profit = isOwner;
    const cards = [['cash', '', 'Omzet (barang)', TB.rp(s.omzet), 'setelah diskon, tanpa transaksi batal'], ['receipt', 'blue', 'Transaksi', s.count, 'rata-rata ' + TB.rp(s.avg)], ['truck', 'amber', 'Ongkir', TB.rp(s.shipping), 'terpisah dari omzet'], ['check', 'green', 'Arus Kas Masuk', TB.rp(s.cashIn), 'hanya status Lunas']];
    if (profit) cards.push(['percent', 'green', 'Estimasi Laba Kotor', TB.rp(s.grossProfit), 'omzet − modal; bukan laba bersih']);
    cards.push(['alert', 'red', 'Belum Lunas', TB.rp(s.pending), 'menunggu pembayaran / COD']);
    $('#lp-stats').innerHTML = cards.map(function (c) { return '<div class="card stat"><div class="ic-wrap ' + c[1] + '">' + TB.icon(c[0], 22) + '</div><div><small>' + c[2] + '</small><b>' + c[3] + '</b><em>' + c[4] + '</em></div></div>'; }).join('');
    TB.$$('[data-profit]').forEach(function (el) { el.hidden = !profit; });
    const days = {}; const prods = {};
    list.forEach(function (t) { if (t.voided) return; const k = TB.dateKey(t.createdAt); const d = days[k] = days[k] || { n: 0, omzet: 0, profit: 0 }; d.n++; d.omzet += t.subtotal - t.discount; d.profit += t.subtotal - t.discount - t.items.reduce(function (a, i) { return a + i.cost * i.qty; }, 0);
      t.items.forEach(function (i) { const p = prods[i.productId] = prods[i.productId] || { name: i.name, unit: i.unit, qty: 0, rev: 0 }; p.qty += i.qty; p.rev += i.qty * i.price; }); });
    $('#lp-days').innerHTML = Object.keys(days).sort().reverse().map(function (k) { const d = days[k]; return '<tr><td>' + TB.fmtDate(k) + '</td><td class="num">' + d.n + '</td><td class="num">' + TB.rp(d.omzet) + '</td>' + (profit ? '<td class="num">' + TB.rp(d.profit) + '</td>' : '') + '</tr>'; }).join('') || '<tr><td colspan="4" class="center muted">Tidak ada data.</td></tr>';
    $('#lp-prods').innerHTML = Object.keys(prods).map(function (k) { return prods[k]; }).sort(function (a, b) { return b.rev - a.rev; }).slice(0, 20).map(function (p) { return '<tr><td>' + TB.esc(p.name) + '</td><td class="num">' + TB.num(p.qty) + ' ' + TB.esc(p.unit) + '</td><td class="num">' + TB.rp(p.rev) + '</td></tr>'; }).join('') || '<tr><td colspan="3" class="center muted">Tidak ada data.</td></tr>';
  }
  function stockList() { const q = $('#l-q').value.trim().toLowerCase(); return TB.store.getProducts().filter(function (p) { return p.active && (!q || (p.name + p.sku).toLowerCase().indexOf(q) >= 0); }).sort(function (a, b) { return a.stock / (a.minStock || 1) - b.stock / (b.minStock || 1); }); }
  function renderStock() {
    const list = stockList(); const canCost = TB.auth.can('viewCost'); const val = list.reduce(function (a, p) { return a + p.stock * p.cost; }, 0); const retail = list.reduce(function (a, p) { return a + p.stock * p.price; }, 0);
    $('#ls-stats').innerHTML = [['box', '', 'Produk Aktif', list.length, ''], ['alert', 'amber', 'Menipis', list.filter(function (p) { return p.stock > 0 && p.stock <= p.minStock; }).length, ''], ['x', 'red', 'Habis', list.filter(function (p) { return p.stock <= 0; }).length, '']].concat(canCost ? [['cash', 'green', 'Nilai Stok (modal)', TB.rp(val), 'nilai jual ' + TB.rp(retail)]] : []).map(function (c) { return '<div class="card stat"><div class="ic-wrap ' + c[1] + '">' + TB.icon(c[0], 22) + '</div><div><small>' + c[2] + '</small><b>' + c[3] + '</b><em>' + c[4] + '</em></div></div>'; }).join('');
    TB.$$('[data-cost]').forEach(function (el) { el.hidden = !canCost; });
    $('#ls-body').innerHTML = list.map(function (p) { const st = TB.stockStatus(p); return '<tr><td data-label="SKU">' + TB.esc(p.sku) + '</td><td data-label="Produk">' + TB.esc(p.name) + '</td><td data-label="Kategori">' + TB.esc(catName(p.category)) + '</td><td class="num" data-label="Stok">' + TB.num(p.stock) + ' ' + TB.esc(p.unit) + '</td><td class="num" data-label="Min.">' + TB.num(p.minStock) + '</td><td data-label="Status"><span class="pill ' + st.cls + '">' + st.label + '</span></td>' + (canCost ? '<td class="num" data-label="Nilai Stok">' + TB.rp(p.stock * p.cost) + '</td>' : '') + '</tr>'; }).join('');
  }
  function renderAudit() {
    const q = $('#l-q').value.trim().toLowerCase(); const list = TB.store.getAudit().filter(function (a) { return !q || (a.action + a.userName + a.detail).toLowerCase().indexOf(q) >= 0; }).sort(function (a, b) { return b.at.localeCompare(a.at); }); const pages = Math.max(1, Math.ceil(list.length / 20)); aPage = Math.min(aPage, pages);
    $('#la-body').innerHTML = list.slice((aPage - 1) * 20, aPage * 20).map(function (a) { return '<tr><td data-label="Waktu">' + TB.fmtDateTime(a.at) + '</td><td data-label="Pengguna">' + TB.esc(a.userName || '-') + '</td><td data-label="Aksi"><span class="pill info">' + TB.esc(a.action) + '</span></td><td data-label="Rincian">' + TB.esc(a.detail || '') + '</td></tr>'; }).join('') || '<tr><td colspan="4" class="center muted" style="padding:24px">Belum ada catatan audit.</td></tr>';
    TB.tablePager($('#la-pager'), aPage, pages, function (n) { aPage = n; renderAudit(); });
  }
  function render() { ({ transaksi: renderTx, penjualan: renderSales, stok: renderStock, audit: renderAudit })[cur](); }

  $('#lt-body').addEventListener('click', function (e) {
    const b = e.target.closest('[data-view]'); if (!b) return; const t = TB.store.getTransactions().find(function (x) { return x.id === b.getAttribute('data-view'); }); const extra = [];
    if (isOwner && !t.voided) {
      if (t.type === 'online' && t.paymentStatus !== 'Lunas') extra.push({ label: 'Tandai Lunas', cls: 'btn-ok', close: true, onClick: function () { TB.svc.updateTransaction(t.id, { paymentStatus: 'Lunas' }, user, 'Pembayaran dikonfirmasi manual oleh owner'); TB.toast('Ditandai lunas.', 'ok'); setTimeout(render, 0); } });
      if (t.type === 'online' && t.orderStatus !== 'Selesai') extra.push({ label: 'Tandai Selesai', cls: 'btn-outline', onClick: function () { TB.svc.updateTransaction(t.id, { orderStatus: 'Selesai' }, user, 'Status pesanan: Selesai'); TB.toast('Pesanan selesai.', 'ok'); setTimeout(render, 0); } });
      extra.push({ label: 'Batalkan Transaksi', cls: 'btn-danger', onClick: function () { setTimeout(function () { TB.prompt('Alasan pembatalan ' + t.id + ' (stok akan dikembalikan)', { title: 'Batalkan Transaksi', required: true, danger: true, okLabel: 'Batalkan Transaksi' }).then(function (reason) { if (!reason) return; const r = TB.svc.cancelTransaction(t.id, reason, user); if (!r.ok) TB.toast(r.errors.join(' '), 'error'); else { TB.toast('Transaksi dibatalkan, stok dikembalikan.', 'ok'); render(); } }); }, 0); } });
    }
    TB.showTransaction(t, { audit: true, extra: extra });
  });
  $('#l-csv').addEventListener('click', function () {
    const d = TB.dateKey(new Date());
    if (cur === 'transaksi' || cur === 'penjualan') { const rows = [['No', 'Waktu', 'Pelanggan', 'Kasir', 'Metode', 'Subtotal', 'Diskon', 'Ongkir', 'Total', 'Status Pembayaran', 'Status Pesanan', 'Dibatalkan']]; scoped().forEach(function (t) { rows.push([t.id, t.createdAt, t.customer.name, t.cashierName, t.paymentMethod, t.subtotal, t.discount, t.shipping, t.total, t.paymentStatus, t.orderStatus, t.voided ? 'Ya' : 'Tidak']); }); TB.downloadCSV('transaksi-' + d + '.csv', rows); }
    else if (cur === 'stok') { const rows = [['SKU', 'Produk', 'Kategori', 'Stok', 'Satuan', 'Stok Min', 'Status']]; stockList().forEach(function (p) { rows.push([p.sku, p.name, catName(p.category), p.stock, p.unit, p.minStock, TB.stockStatus(p).label]); }); TB.downloadCSV('stok-' + d + '.csv', rows); }
    else { const rows = [['Waktu', 'Pengguna', 'Aksi', 'Rincian']]; TB.store.getAudit().forEach(function (a) { rows.push([a.at, a.userName, a.action, a.detail]); }); TB.downloadCSV('audit-' + d + '.csv', rows); }
  });
  showTab(location.hash.slice(1)); TB.hydrate(document);
  TB.on('datachange', function () { render(); });
});
