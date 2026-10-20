/* admin-stok.js — Inventaris: produk, stok masuk/keluar, riwayat, kategori & satuan */
TB.ready(function () {
  'use strict';
  const $ = TB.$; const user = TB.auth.current(); const PER = 12;
  const sort = { key: 'name', dir: 1 }; let page = 1, mvPage = 1;
  const catName = function (id) { const c = TB.store.getCategories().find(function (x) { return x.id === id; }); return c ? c.name : id; };

  /* ---- Tab ---- */
  const TABS = ['inventaris', 'mutasi', 'riwayat', 'kategori'];
  function tab(n) { if (TABS.indexOf(n) < 0) n = 'inventaris'; TB.$$('#stok-tabs button').forEach(function (b) { b.classList.toggle('active', b.getAttribute('data-tab') === n); }); TABS.forEach(function (t) { $('#tab-' + t).hidden = t !== n; }); if (n === 'riwayat') renderMv(); if (n === 'kategori') renderCats(); if (n === 'mutasi') fillSelects(); }
  $('#stok-tabs').addEventListener('click', function (e) { const b = e.target.closest('[data-tab]'); if (b) { history.replaceState(null, '', '#' + b.getAttribute('data-tab')); tab(b.getAttribute('data-tab')); } });
  window.addEventListener('hashchange', function () { tab(location.hash.slice(1)); });

  /* ---- Ringkasan ---- */
  function stats() {
    const ps = TB.store.getProducts(); const act = ps.filter(function (p) { return p.active; });
    const low = act.filter(function (p) { return p.stock > 0 && p.stock <= p.minStock; }).length, out = act.filter(function (p) { return p.stock <= 0; }).length;
    const items = [['box', '', 'Total Produk Aktif', act.length, 'dari ' + ps.length + ' produk'], ['layers', 'blue', 'Total Stok Barang', TB.num(act.reduce(function (a, p) { return a + p.stock; }, 0)), 'jumlah semua satuan'], ['alert', 'amber', 'Stok Menipis', low, 'di bawah batas minimum'], ['x', 'red', 'Stok Habis', out, 'perlu restok']];
    $('#stok-stats').innerHTML = items.map(function (i) { return '<div class="card stat"><div class="ic-wrap ' + i[1] + '">' + TB.icon(i[0], 22) + '</div><div><small>' + i[2] + '</small><b>' + i[3] + '</b><em>' + i[4] + '</em></div></div>'; }).join('');
  }

  /* ---- Inventaris ---- */
  const cats = TB.store.getCategories();
  function fillFilterCat() { $('#inv-cat').innerHTML = '<option value="">Semua kategori</option>' + TB.store.getCategories().map(function (c) { return '<option value="' + TB.esc(c.id) + '">' + TB.esc(c.name) + '</option>'; }).join(''); }
  function invList() {
    const q = $('#inv-q').value.trim().toLowerCase(), cat = $('#inv-cat').value, stt = $('#inv-status').value;
    let list = TB.store.getProducts().filter(function (p) {
      if (q && (p.sku + ' ' + p.name + ' ' + p.brand).toLowerCase().indexOf(q) < 0) return false; if (cat && p.category !== cat) return false;
      if (stt === 'inactive') return !p.active; if (!p.active) return false; if (stt && TB.stockStatus(p).key !== stt) return false; return true;
    });
    list.sort(function (a, b) { const x = a[sort.key], y = b[sort.key]; return (typeof x === 'number' ? x - y : String(x).localeCompare(String(y), 'id')) * sort.dir; }); return list;
  }
  function renderInv() {
    stats(); const list = invList(); const pages = Math.max(1, Math.ceil(list.length / PER)); page = Math.min(page, pages);
    $('#inv-body').innerHTML = list.slice((page - 1) * PER, page * PER).map(function (p) {
      const st = TB.stockStatus(p);
      return '<tr' + (p.active ? '' : ' style="opacity:.55"') + '><td data-label="SKU">' + TB.esc(p.sku) + '</td><td data-label="Nama"><b>' + TB.esc(p.name) + '</b><div class="small muted">' + TB.esc(p.brand) + (p.demo ? ' · data demo' : '') + '</div></td><td class="hide-md" data-label="Kategori">' + TB.esc(catName(p.category)) + '</td><td class="hide-md" data-label="Satuan">' + TB.esc(p.unit) + '</td><td class="num" data-label="Stok">' + TB.num(p.stock) + '</td><td class="num hide-md" data-label="Modal">' + TB.rp(p.cost) + '</td><td class="num" data-label="Jual">' + TB.rp(p.price) + (TB.isPromo(p) ? '<div class="small" style="color:var(--orange)">promo ' + TB.rp(p.promoPrice) + '</div>' : '') + '</td><td data-label="Status">' + (p.active ? '<span class="pill ' + st.cls + '">' + st.label + '</span>' : '<span class="pill">Nonaktif</span>') + '</td><td class="actions"><button class="btn btn-outline btn-sm" data-edit="' + p.id + '">' + TB.icon('edit', 14) + ' Edit</button> <button class="btn btn-outline btn-sm" data-toggle="' + p.id + '">' + (p.active ? 'Nonaktifkan' : 'Aktifkan') + '</button></td></tr>';
    }).join('') || '<tr><td colspan="9" class="center muted" style="padding:28px">Tidak ada produk sesuai filter.</td></tr>';
    TB.tablePager($('#inv-pager'), page, pages, function (n) { page = n; renderInv(); });
    TB.$$('#inv-table th.sortable').forEach(function (th) { const k = th.getAttribute('data-sort'); th.setAttribute('aria-sort', sort.key === k ? (sort.dir > 0 ? 'ascending' : 'descending') : 'none'); th.textContent = th.textContent.replace(/ [▲▼]$/, '') + (sort.key === k ? (sort.dir > 0 ? ' ▲' : ' ▼') : ''); });
  }
  ['inv-cat', 'inv-status'].forEach(function (id) { $('#' + id).addEventListener('change', function () { page = 1; renderInv(); }); }); $('#inv-q').addEventListener('input', TB.debounce(function () { page = 1; renderInv(); }, 150));
  $('#inv-table thead').addEventListener('click', function (e) { const th = e.target.closest('th.sortable'); if (!th) return; const k = th.getAttribute('data-sort'); if (sort.key === k) sort.dir *= -1; else { sort.key = k; sort.dir = 1; } renderInv(); });
  $('#inv-body').addEventListener('click', function (e) {
    const ed = e.target.closest('[data-edit]'), tg = e.target.closest('[data-toggle]');
    if (ed) openForm(TB.svc.getProduct(ed.getAttribute('data-edit')));
    if (tg) { const p = TB.svc.getProduct(tg.getAttribute('data-toggle')); const used = TB.store.getTransactions().some(function (t) { return t.items.some(function (i) { return i.productId === p.id; }); });
      TB.confirm(p.active ? 'Nonaktifkan "' + p.name + '"? Produk tidak tampil di toko, riwayat transaksi tetap tersimpan.' + (used ? '' : '') : 'Aktifkan kembali "' + p.name + '"?', { okLabel: p.active ? 'Nonaktifkan' : 'Aktifkan', danger: p.active }).then(function (ok) { if (ok) { TB.svc.setProductActive(p.id, !p.active, user); TB.toast('Produk ' + (p.active ? 'dinonaktifkan' : 'diaktifkan') + '.', 'ok'); renderInv(); } }); }
  });
  $('#inv-add').addEventListener('click', function () { openForm(null); });
  $('#inv-csv').addEventListener('click', function () {
    const rows = [['SKU', 'Nama', 'Kategori', 'Merek', 'Satuan', 'Stok', 'Stok Min', 'Harga Modal', 'Harga Jual', 'Harga Promo', 'Status']];
    invList().forEach(function (p) { rows.push([p.sku, p.name, catName(p.category), p.brand, p.unit, p.stock, p.minStock, p.cost, p.price, p.promoPrice || '', p.active ? TB.stockStatus(p).label : 'Nonaktif']); }); TB.downloadCSV('inventaris-' + TB.dateKey(new Date()) + '.csv', rows);
  });

  /* ---- Form produk ---- */
  function opts(list, sel, get) { return list.map(function (x) { const v = get ? get(x) : x; return '<option value="' + TB.esc(v) + '"' + (v === sel ? ' selected' : '') + '>' + TB.esc(get ? x.name : x) + '</option>'; }).join(''); }
  function openForm(p) {
    const isNew = !p; p = p || { active: true, unit: TB.store.getUnits()[0], category: TB.store.getCategories()[0].id, stock: 0, minStock: 10, cost: 0, price: 0, weightKg: 0, brand: '' };
    const body = '<form id="pf" novalidate><div class="form-grid"><label class="field"><span>SKU *</span><input class="input" name="sku" value="' + TB.esc(p.sku || '') + '"></label><label class="field"><span>Nama produk *</span><input class="input" name="name" value="' + TB.esc(p.name || '') + '"></label>' +
      '<label class="field"><span>Kategori *</span><select class="input" name="category">' + opts(TB.store.getCategories(), p.category, function (c) { return c.id; }) + '</select></label><label class="field"><span>Merek</span><input class="input" name="brand" value="' + TB.esc(p.brand || '') + '"></label>' +
      '<label class="field"><span>Satuan jual *</span><select class="input" name="unit">' + opts(TB.store.getUnits(), p.unit) + '</select></label><label class="field"><span>Berat per satuan (kg)</span><input class="input" type="number" min="0" step="any" name="weightKg" value="' + (p.weightKg || 0) + '"><span class="hint">Dipakai menghitung ongkir material berat.</span></label>' +
      '<label class="field"><span>Harga modal (Rp) *</span><input class="input" type="number" min="0" step="any" name="cost" value="' + p.cost + '"></label><label class="field"><span>Harga jual normal (Rp) *</span><input class="input" type="number" min="0" step="any" name="price" value="' + p.price + '"></label>' +
      '<label class="field"><span>Harga promo (Rp)</span><input class="input" type="number" min="0" step="any" name="promoPrice" value="' + (p.promoPrice || '') + '"><span class="hint">Kosongkan jika tidak promo.</span></label><div class="form-grid" style="gap:0 8px"><label class="field"><span>Promo mulai</span><input class="input" type="date" name="promoStart" value="' + (p.promoStart || '') + '"></label><label class="field"><span>Promo selesai</span><input class="input" type="date" name="promoEnd" value="' + (p.promoEnd || '') + '"></label></div>' +
      (isNew ? '<label class="field"><span>Stok awal</span><input class="input" type="number" min="0" step="any" name="stock" value="0"></label>' : '<label class="field"><span>Stok saat ini</span><input class="input" value="' + TB.num(p.stock) + ' ' + TB.esc(p.unit) + '" disabled><span class="hint">Ubah stok lewat tab Stok Masuk / Keluar agar tercatat.</span></label>') +
      '<label class="field"><span>Batas stok minimum</span><input class="input" type="number" min="0" step="any" name="minStock" value="' + p.minStock + '"></label><label class="field full"><span>Deskripsi</span><textarea class="input" name="description">' + TB.esc(p.description || '') + '</textarea></label><label class="check full"><input type="checkbox" name="featured"' + (p.featured ? ' checked' : '') + '> Tampilkan sebagai produk unggulan di Home</label></div><p class="form-error" id="pf-err" role="alert"></p></form>';
    TB.modal({ title: isNew ? 'Tambah Produk' : 'Edit Produk', body: body, actions: [{ label: 'Batal', cls: 'btn-ghost' }, { label: 'Simpan', cls: 'btn-primary', close: false, onClick: function (close, wrap) {
      const f = TB.$('#pf', wrap); const g = function (n) { return f.elements[n] ? f.elements[n].value : undefined; };
      const input = Object.assign({}, p, { sku: g('sku'), name: g('name'), category: g('category'), brand: g('brand').trim(), unit: g('unit'), weightKg: g('weightKg'), cost: g('cost'), price: g('price'), promoPrice: g('promoPrice'), promoStart: g('promoStart') || null, promoEnd: g('promoEnd') || null, minStock: g('minStock'), description: g('description').trim(), featured: f.elements.featured.checked });
      if (isNew) input.stock = g('stock') || 0; else input.stock = p.stock;
      if (!input.promoPrice) { input.promoStart = null; input.promoEnd = null; }
      const r = TB.svc.saveProduct(input, user); if (!r.ok) { TB.$('#pf-err', wrap).innerHTML = r.errors.map(TB.esc).join('<br>'); return false; }
      TB.toast(isNew ? 'Produk ditambahkan.' : 'Produk diperbarui.', 'ok'); close(true); renderInv(); } }] });
  }

  /* ---- Mutasi stok ---- */
  function fillSelects() {
    const list = TB.store.getProducts().filter(function (p) { return p.active; }).sort(function (a, b) { return a.name.localeCompare(b.name, 'id'); });
    const html = list.map(function (p) { return '<option value="' + p.id + '">' + TB.esc(p.sku + ' — ' + p.name) + ' (stok ' + TB.num(p.stock) + ')</option>'; }).join('');
    ['in-prod', 'out-prod', 'fix-prod'].forEach(function (id) { const el = $('#' + id), v = el.value; el.innerHTML = html; if (v) el.value = v; }); syncUnits();
  }
  function syncUnits() { const a = TB.svc.getProduct($('#in-prod').value), b = TB.svc.getProduct($('#out-prod').value); $('#in-unit').value = a ? a.unit : ''; $('#out-avail').value = b ? TB.num(b.stock) + ' ' + b.unit : ''; }
  $('#in-prod').addEventListener('change', syncUnits); $('#out-prod').addEventListener('change', syncUnits);
  function mut(formId, prefix, type, qtyId, errId) {
    $(formId).addEventListener('submit', function (e) {
      e.preventDefault(); const err = $(errId); err.textContent = ''; const id = $('#' + prefix + '-prod').value, qty = $('#' + qtyId).value, reason = $('#' + prefix + '-reason').value;
      if (qty === '') { err.textContent = 'Jumlah wajib diisi.'; return; }
      const r = TB.svc.adjustStock(id, type, qty, reason, user); if (!r.ok) { err.textContent = r.errors.join(' '); return; }
      TB.toast('Stok tercatat: ' + TB.num(r.before) + ' → ' + TB.num(r.after), 'ok'); $('#' + qtyId).value = ''; $('#' + prefix + '-reason').value = ''; fillSelects(); renderInv();
    });
  }
  mut('#form-in', 'in', 'masuk', 'in-qty', '#in-err'); mut('#form-out', 'out', 'keluar', 'out-qty', '#out-err'); mut('#form-fix', 'fix', 'koreksi', 'fix-qty', '#fix-err');

  /* ---- Riwayat stok ---- */
  function mvList() {
    const q = $('#mv-q').value.trim().toLowerCase(), ty = $('#mv-type').value;
    return TB.store.getStockMovements().filter(function (m) { return (!ty || m.type === ty) && (!q || (m.name + ' ' + m.sku + ' ' + m.reason + ' ' + m.userName).toLowerCase().indexOf(q) >= 0); }).sort(function (a, b) { return b.at.localeCompare(a.at); });
  }
  function renderMv() {
    const list = mvList(); const pages = Math.max(1, Math.ceil(list.length / 15)); mvPage = Math.min(mvPage, pages);
    $('#mv-body').innerHTML = list.slice((mvPage - 1) * 15, mvPage * 15).map(function (m) { const pos = m.qty >= 0;
      return '<tr><td data-label="Waktu">' + TB.fmtDateTime(m.at) + '</td><td data-label="SKU">' + TB.esc(m.sku) + '</td><td data-label="Produk">' + TB.esc(m.name) + '</td><td data-label="Jenis"><span class="pill ' + (pos ? 'ok' : 'warn') + '">' + TB.esc(m.type) + '</span></td><td class="num" data-label="Jumlah" style="color:var(--' + (pos ? 'ok' : 'bad') + ')">' + (pos ? '+' : '') + TB.num(m.qty) + '</td><td class="num" data-label="Sebelum→Sesudah">' + TB.num(m.before) + ' → ' + TB.num(m.after) + '</td><td data-label="Alasan">' + TB.esc(m.reason) + '</td><td data-label="Pengguna">' + TB.esc(m.userName) + '</td></tr>'; }).join('') || '<tr><td colspan="8" class="center muted" style="padding:28px">Belum ada pergerakan stok. Penjualan, stok masuk/keluar, dan koreksi akan tercatat di sini.</td></tr>';
    TB.tablePager($('#mv-pager'), mvPage, pages, function (n) { mvPage = n; renderMv(); });
  }
  $('#mv-q').addEventListener('input', TB.debounce(function () { mvPage = 1; renderMv(); }, 150)); $('#mv-type').addEventListener('change', function () { mvPage = 1; renderMv(); });
  $('#mv-csv').addEventListener('click', function () { const rows = [['Waktu', 'SKU', 'Produk', 'Jenis', 'Jumlah', 'Sebelum', 'Sesudah', 'Alasan', 'Pengguna']]; mvList().forEach(function (m) { rows.push([m.at, m.sku, m.name, m.type, m.qty, m.before, m.after, m.reason, m.userName]); }); TB.downloadCSV('riwayat-stok-' + TB.dateKey(new Date()) + '.csv', rows); });

  /* ---- Kategori & satuan ---- */
  function renderCats() {
    const ps = TB.store.getProducts();
    $('#cat-list').innerHTML = TB.store.getCategories().map(function (c) { const n = ps.filter(function (p) { return p.category === c.id; }).length; return '<div class="sum-row"><span><b>' + TB.esc(c.name) + '</b> <span class="muted small">(' + n + ' produk)</span></span><span><button class="btn btn-outline btn-sm" data-rename="' + TB.esc(c.id) + '">Ubah</button> <button class="btn btn-outline btn-sm" data-delcat="' + TB.esc(c.id) + '"' + (n ? ' disabled title="Masih dipakai produk"' : '') + '>Hapus</button></span></div>'; }).join('');
    $('#unit-list').innerHTML = TB.store.getUnits().map(function (u) { const n = ps.filter(function (p) { return p.unit === u; }).length; return '<span class="chip" style="cursor:default">' + TB.esc(u) + (n ? ' · ' + n : ' <button type="button" data-delunit="' + TB.esc(u) + '" aria-label="Hapus satuan ' + TB.esc(u) + '" style="border:0;background:none;cursor:pointer;color:inherit">×</button>') + '</span>'; }).join(' ');
  }
  $('#form-cat').addEventListener('submit', function (e) { e.preventDefault(); const n = $('#cat-name').value.trim(), err = $('#cat-err'); err.textContent = ''; const cs = TB.store.getCategories(); if (n.length < 3) { err.textContent = 'Nama kategori minimal 3 karakter.'; return; } if (cs.some(function (c) { return c.name.toLowerCase() === n.toLowerCase(); })) { err.textContent = 'Kategori sudah ada.'; return; } cs.push({ id: 'k' + Date.now().toString(36), name: n, short: n, icon: 'box' }); TB.store.saveCategories(cs); TB.store.addAudit({ action: 'kategori.tambah', userId: user.id, userName: user.name, detail: n }); $('#cat-name').value = ''; renderCats(); fillFilterCat(); });
  $('#cat-list').addEventListener('click', function (e) {
    const r = e.target.closest('[data-rename]'), d = e.target.closest('[data-delcat]');
    if (r) { const cs = TB.store.getCategories(); const c = cs.find(function (x) { return x.id === r.getAttribute('data-rename'); }); TB.prompt('Nama baru untuk "' + c.name + '"', { required: true, title: 'Ubah Kategori' }).then(function (v) { if (v) { c.name = v; c.short = v; TB.store.saveCategories(cs); renderCats(); fillFilterCat(); renderInv(); } }); }
    if (d) { const cs = TB.store.getCategories().filter(function (x) { return x.id !== d.getAttribute('data-delcat'); }); TB.store.saveCategories(cs); renderCats(); fillFilterCat(); }
  });
  $('#form-unit').addEventListener('submit', function (e) { e.preventDefault(); const n = $('#unit-name').value.trim().toLowerCase(), err = $('#unit-err'); err.textContent = ''; const us = TB.store.getUnits(); if (!n) { err.textContent = 'Isi nama satuan.'; return; } if (us.indexOf(n) >= 0) { err.textContent = 'Satuan sudah ada.'; return; } us.push(n); TB.store.saveUnits(us); $('#unit-name').value = ''; renderCats(); });
  $('#unit-list').addEventListener('click', function (e) { const d = e.target.closest('[data-delunit]'); if (d) { TB.store.saveUnits(TB.store.getUnits().filter(function (u) { return u !== d.getAttribute('data-delunit'); })); renderCats(); } });

  fillFilterCat(); renderInv(); fillSelects(); tab(location.hash.slice(1)); TB.hydrate(document);
  TB.on('datachange', function (k) { if (/products|movements/.test(k || '')) { renderInv(); fillSelects(); } });
});
