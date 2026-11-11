/* kas.js — Buku kas: kas masuk/keluar, saldo, grafik, catat pengeluaran (owner) */
TB.ready(function () {
  'use strict';
  const $ = TB.$, DAY = 864e5, user = TB.auth.current(); TB.warnDemo($('#demo-banner'));
  const OUT = ['Pembelian stok', 'Gaji karyawan', 'Operasional', 'BBM & armada', 'Bongkar muat', 'Sewa', 'Listrik, air & internet', 'Perawatan', 'Pajak', 'Prive / setoran pemilik', 'Lain-lain'];
  const IN = ['Modal awal', 'Tambahan modal', 'Pendapatan lain'];
  const dk = TB.dateKey; let page = 1, all = [], rows = [];
  $('#k-to').value = dk(new Date()); $('#k-from').value = dk(new Date(Date.now() - 29 * DAY));
  function load() {
    all = TB.svc.cashEntries().sort(function (a, b) { return a.at < b.at ? -1 : a.at > b.at ? 1 : 0; });
    let bal = 0; all.forEach(function (e) { bal += e.dir === 'in' ? e.amount : -e.amount; e.bal = bal; });
    const cats = {}; all.forEach(function (e) { cats[e.cat] = 1; }); const cur = $('#k-cat').value;
    $('#k-cat').innerHTML = '<option value="">Semua</option>' + Object.keys(cats).sort().map(function (c) { return '<option' + (c === cur ? ' selected' : '') + '>' + TB.esc(c) + '</option>'; }).join('');
  }
  function filt() {
    const f = $('#k-from').value, t = $('#k-to').value, d = $('#k-dir').value, c = $('#k-cat').value, q = $('#k-q').value.trim().toLowerCase();
    return all.filter(function (e) { const k = dk(e.at); return (!f || k >= f) && (!t || k <= t) && (!d || e.dir === d) && (!c || e.cat === c) && (!q || (e.cat + ' ' + e.note + ' ' + (e.ref || '')).toLowerCase().indexOf(q) >= 0); });
  }
  function render() {
    rows = filt(); const f = $('#k-from').value, t = $('#k-to').value; const s = TB.svc.cashSummary(all, f, t);
    const sales = rows.filter(function (e) { return e.auto && e.dir === 'in'; }).reduce(function (a, e) { return a + e.amount; }, 0), buy = s.byCat['Pembelian stok'] || 0;
    const cards = [['arrowdown', 'green', 'Kas Masuk', TB.rp(s.in), 'penjualan lunas + pemasukan lain'], ['arrowup', 'amber', 'Kas Keluar', TB.rp(s.out), 'pembelian stok, gaji, operasional'], ['cash', s.net >= 0 ? 'green' : 'red', 'Arus Bersih', TB.rp(s.net), 'masuk − keluar periode ini'], ['wallet', 'blue', 'Saldo Kas & Bank', TB.rp(s.balanceEnd), 'akumulasi sampai ' + (t || 'sekarang')], ['box', '', 'Pembelian Stok', TB.rp(buy), 'pembayaran ke supplier']];
    $('#k-stats').innerHTML = cards.map(function (c) { return '<div class="card stat"><div class="ic-wrap ' + c[1] + '">' + TB.icon(c[0], 22) + '</div><div><small>' + c[2] + '</small><b>' + c[3] + '</b><em>' + c[4] + '</em></div></div>'; }).join('');
    /* grafik */
    const days = {}; rows.forEach(function (e) { const k = dk(e.at), d = days[k] = days[k] || { i: 0, o: 0 }; if (e.dir === 'in') d.i += e.amount; else d.o += e.amount; });
    const keys = Object.keys(days).sort(); const max = Math.max.apply(null, keys.map(function (k) { return Math.max(days[k].i, days[k].o); }).concat([1]));
    const W = 720, H = 240, L = 52, B = 28, T = 10, n = Math.max(keys.length, 1), bw = (W - L - 6) / n, ch = H - B - T; let svg = '<svg class="bar-chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Grafik kas masuk dan keluar harian">';
    for (let g = 0; g <= 4; g++) { const y = T + ch - ch * g / 4, v = max * g / 4; svg += '<line x1="' + L + '" x2="' + W + '" y1="' + y + '" y2="' + y + '" stroke="var(--line)"/><text x="' + (L - 6) + '" y="' + (y + 4) + '" text-anchor="end" font-size="10" fill="var(--muted)">' + (v >= 1e6 ? TB.num(v / 1e6) + ' jt' : TB.num(v / 1e3) + ' rb') + '</text>'; }
    const step = Math.ceil(n / 10); keys.forEach(function (k, i) { const d = days[k], x = L + i * bw, w = Math.max(1.5, bw * .36), hi = d.i / max * ch, ho = d.o / max * ch;
      svg += '<rect x="' + (x + bw * .1) + '" y="' + (T + ch - hi) + '" width="' + w + '" height="' + hi + '" fill="var(--ok)"><title>' + k + ' masuk ' + TB.rp(d.i) + '</title></rect><rect x="' + (x + bw * .1 + w + 1) + '" y="' + (T + ch - ho) + '" width="' + w + '" height="' + ho + '" fill="var(--orange)"><title>' + k + ' keluar ' + TB.rp(d.o) + '</title></rect>';
      if (i % step === 0) svg += '<text x="' + (x + bw / 2) + '" y="' + (H - 9) + '" text-anchor="middle" font-size="10" fill="var(--muted)">' + k.slice(8) + '/' + k.slice(5, 7) + '</text>'; });
    $('#k-chart').innerHTML = keys.length ? svg + '</svg>' : '<div class="empty">Belum ada data kas pada periode ini.</div>';
    const cs = Object.keys(s.byCat).map(function (c) { return [c, s.byCat[c]]; }).sort(function (a, b) { return b[1] - a[1]; }).slice(0, 8), mx = cs.length ? cs[0][1] : 1;
    $('#k-cats').innerHTML = cs.map(function (c, i) { return '<li><span class="no">' + (i + 1) + '</span><div>' + TB.esc(c[0]) + '<div class="meter"><i style="width:' + Math.round(c[1] / mx * 100) + '%"></i></div></div><b>' + TB.rp(c[1]) + '</b></li>'; }).join('') || '<li class="muted">Belum ada pengeluaran.</li>';
    const list = rows.slice().reverse(), pages = Math.max(1, Math.ceil(list.length / 20)); page = Math.min(page, pages);
    $('#k-body').innerHTML = list.slice((page - 1) * 20, page * 20).map(function (e) { const i = e.dir === 'in';
      return '<tr><td data-label="Waktu">' + (e.auto ? TB.fmtDate(e.at) : TB.fmtDateTime(e.at)) + '</td><td data-label="Kategori"><span class="pill ' + (i ? 'ok' : 'warn') + '">' + TB.esc(e.cat) + '</span></td><td data-label="Keterangan">' + TB.esc(e.note || '') + (e.ref ? ' <small class="muted">' + TB.esc(e.ref) + '</small>' : '') + '</td><td data-label="Metode">' + TB.esc(e.method || '-') + '</td><td class="num" data-label="Masuk">' + (i ? TB.rp(e.amount) : '') + '</td><td class="num" data-label="Keluar">' + (i ? '' : TB.rp(e.amount)) + '</td><td class="num" data-label="Saldo">' + TB.rp(e.bal) + '</td></tr>'; }).join('') || '<tr><td colspan="7" class="center muted" style="padding:28px">Belum ada catatan kas. Buat data simulasi di Pengaturan → Simulasi & Uji Performa, atau catat pengeluaran.</td></tr>';
    TB.tablePager($('#k-pager'), page, pages, function (p) { page = p; render(); });
  }
  function addForm(dir) {
    const cats = dir === 'out' ? OUT : IN;
    const m = TB.modal({ title: dir === 'out' ? 'Catat Pengeluaran' : 'Catat Pemasukan', body: '<label class="field"><span>Kategori</span><select class="input" id="kf-cat">' + cats.map(function (c) { return '<option>' + c + '</option>'; }).join('') + '</select></label><label class="field"><span>Jumlah (Rp)</span><input class="input" type="number" min="1" id="kf-amt" inputmode="numeric"></label><label class="field"><span>Metode</span><select class="input" id="kf-met"><option>Tunai</option><option>Transfer</option><option>QRIS</option></select></label><label class="field"><span>Keterangan</span><input class="input" id="kf-note" maxlength="120"></label><p class="form-error" id="kf-err" role="alert"></p>',
      actions: [{ label: 'Batal', cls: 'btn-ghost' }, { label: 'Simpan', cls: 'btn-primary', close: false, onClick: function (close, w) {
        const amt = parseFloat($('#kf-amt', w).value); if (!(amt > 0)) { $('#kf-err', w).textContent = 'Jumlah harus lebih dari 0.'; return false; }
        try { TB.store.addCash({ dir: dir, cat: $('#kf-cat', w).value, amount: Math.round(amt), method: $('#kf-met', w).value, note: $('#kf-note', w).value.trim(), ref: '', by: user.name }); TB.store.addAudit({ action: 'kas.catat', userId: user.id, userName: user.name, detail: (dir === 'out' ? 'Keluar ' : 'Masuk ') + TB.rp(amt) + ' · ' + $('#kf-cat', w).value }); } catch (e) { $('#kf-err', w).textContent = e.message; return false; }
        TB.toast('Kas tersimpan.', 'ok'); close(true); load(); render(); } }] });
    return m;
  }
  ['k-from', 'k-to', 'k-dir', 'k-cat'].forEach(function (id) { $('#' + id).addEventListener('change', function () { page = 1; render(); }); });
  $('#k-q').addEventListener('input', TB.debounce(function () { page = 1; render(); }, 200));
  $('#k-presets').addEventListener('click', function (e) { const b = e.target.closest('[data-p]'); if (!b) return; const p = b.getAttribute('data-p'), t = new Date(); $('#k-from').value = p === 'month' ? dk(new Date(t.getFullYear(), t.getMonth(), 1)) : dk(new Date(Date.now() - (+p - 1) * DAY)); $('#k-to').value = dk(t); TB.$$('#k-presets .chip').forEach(function (c) { c.classList.toggle('active', c === b); }); page = 1; render(); });
  $('#k-add-out').addEventListener('click', function () { addForm('out'); }); $('#k-add-in').addEventListener('click', function () { addForm('in'); });
  $('#k-csv').addEventListener('click', function () { const r = [['Waktu', 'Arus', 'Kategori', 'Keterangan', 'Metode', 'Jumlah', 'Saldo']]; rows.forEach(function (e) { r.push([e.at, e.dir === 'in' ? 'Masuk' : 'Keluar', e.cat, e.note, e.method, e.amount, e.bal]); }); TB.downloadCSV('buku-kas-' + dk(new Date()) + '.csv', r); });
  load(); render(); TB.hydrate(document);
});
