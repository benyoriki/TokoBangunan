/* katalog.js — Katalog produk: pencarian langsung, filter kategori/harga/merek/stok, urutan, halaman */
TB.ready(function () {
  'use strict';
  const PER = 12;
  const all = TB.store.getProducts().filter(function (p) { return p.active; });
  const cats = TB.store.getCategories(); const sold = TB.soldMap();
  const $ = TB.$;
  const st = { q: TB.param('q'), cat: TB.param('cat'), brand: '', min: '', max: '', stock: '', promo: TB.param('promo') === '1', sort: 'rel', page: 1 };
  TB.warnDemo($('#demo-banner'));

  $('#f-cat').innerHTML = '<option value="">Semua kategori</option>' + cats.map(function (c) { return '<option value="' + TB.esc(c.id) + '">' + TB.esc(c.name) + '</option>'; }).join('');
  const brands = Array.from(new Set(all.map(function (p) { return p.brand; }))).sort();
  $('#f-brand').innerHTML = '<option value="">Semua merek</option>' + brands.map(function (b) { return '<option>' + TB.esc(b) + '</option>'; }).join('');
  if (window.innerWidth <= 960) $('#filters').removeAttribute('open');

  function syncInputs() { $('#f-q').value = st.q; $('#f-cat').value = st.cat; $('#f-brand').value = st.brand; $('#f-min').value = st.min; $('#f-max').value = st.max; $('#f-stock').value = st.stock; $('#f-promo').checked = st.promo; $('#f-sort').value = st.sort; }
  function chips() {
    $('#cat-chips').innerHTML = '<button class="chip' + (!st.cat ? ' active' : '') + '" data-cat="">Semua</button>' + cats.map(function (c) { return '<button class="chip' + (st.cat === c.id ? ' active' : '') + '" data-cat="' + TB.esc(c.id) + '">' + TB.esc(c.short || c.name) + '</button>'; }).join('');
  }
  function filtered() {
    const q = st.q.trim().toLowerCase(); const min = st.min === '' ? 0 : Number(st.min); const max = st.max === '' ? Infinity : Number(st.max);
    let list = all.filter(function (p) {
      if (q && (p.name + ' ' + p.sku + ' ' + p.brand + ' ' + p.description).toLowerCase().indexOf(q) < 0) return false;
      if (st.cat && p.category !== st.cat) return false; if (st.brand && p.brand !== st.brand) return false;
      const price = TB.effPrice(p); if (price < min || price > max) return false;
      if (st.stock && TB.stockStatus(p).key !== st.stock) return false; if (st.promo && !TB.isPromo(p)) return false; return true;
    });
    const cmp = { low: function (a, b) { return TB.effPrice(a) - TB.effPrice(b); }, high: function (a, b) { return TB.effPrice(b) - TB.effPrice(a); }, name: function (a, b) { return a.name.localeCompare(b.name, 'id'); }, stock: function (a, b) { return b.stock - a.stock; },
      rel: function (a, b) { return (b.featured ? 1 : 0) - (a.featured ? 1 : 0) || (sold[b.id] || 0) - (sold[a.id] || 0) || a.name.localeCompare(b.name, 'id'); } }[st.sort];
    return list.sort(cmp);
  }
  function render() {
    const list = filtered(); const pages = Math.max(1, Math.ceil(list.length / PER)); st.page = Math.min(st.page, pages);
    const slice = list.slice((st.page - 1) * PER, st.page * PER);
    $('#cat-count').textContent = 'Menampilkan ' + slice.length + ' dari ' + list.length + ' produk' + (list.length !== all.length ? ' (difilter dari ' + all.length + ')' : '');
    $('#prod-grid').innerHTML = slice.length ? slice.map(TB.productCard).join('') : '<div class="empty" style="grid-column:1/-1">' + TB.icon('search', 44) + '<h3>Produk tidak ditemukan</h3><p>Coba ubah kata kunci atau reset filter.</p><button class="btn btn-primary" id="empty-reset" type="button">Reset Filter</button></div>';
    TB.tablePager($('#pager'), st.page, pages, function (n) { st.page = n; render(); window.scrollTo({ top: 0, behavior: 'smooth' }); });
    chips();
  }
  function onChange() { st.q = $('#f-q').value; st.cat = $('#f-cat').value; st.brand = $('#f-brand').value; st.min = $('#f-min').value; st.max = $('#f-max').value; st.stock = $('#f-stock').value; st.promo = $('#f-promo').checked; st.sort = $('#f-sort').value; st.page = 1; render(); }
  ['f-cat', 'f-brand', 'f-stock', 'f-promo', 'f-sort'].forEach(function (id) { $('#' + id).addEventListener('change', onChange); });
  ['f-q', 'f-min', 'f-max'].forEach(function (id) { $('#' + id).addEventListener('input', TB.debounce(onChange, 180)); });
  $('#f-reset').addEventListener('click', reset);
  function reset() { Object.assign(st, { q: '', cat: '', brand: '', min: '', max: '', stock: '', promo: false, sort: 'rel', page: 1 }); syncInputs(); render(); }
  $('#cat-chips').addEventListener('click', function (e) { const b = e.target.closest('[data-cat]'); if (!b) return; st.cat = b.getAttribute('data-cat'); st.page = 1; syncInputs(); render(); });
  $('#prod-grid').addEventListener('click', function (e) { if (e.target.closest('#empty-reset')) reset(); });
  TB.bindProducts($('#prod-grid'));
  syncInputs(); render(); TB.hydrate(document);
  TB.on('datachange', function (k) { if (/products|settings/.test(k || '')) location.reload(); });
});
