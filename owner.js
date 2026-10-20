/* owner.js — Dashboard owner: statistik nyata dari transaksi tersimpan */
TB.ready(function () {
  'use strict';
  const $ = TB.$; TB.warnDemo($('#demo-banner'));
  const DAY = 864e5;
  function dk(d) { return TB.dateKey(d); }
  function parse(k) { const p = k.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  const today = dk(new Date());
  $('#o-from').value = dk(new Date(Date.now() - 13 * DAY)); $('#o-to').value = today;

  function range() {
    let from = $('#o-from').value || today, to = $('#o-to').value || today; if (from > to) { const t = from; from = to; to = t; }
    const days = Math.round((parse(to) - parse(from)) / DAY) + 1;
    const pTo = dk(new Date(parse(from).getTime() - DAY)), pFrom = dk(new Date(parse(from).getTime() - days * DAY));
    return { from: from, to: to, days: days, pFrom: pFrom, pTo: pTo };
  }
  function inRange(t, a, b) { const d = dk(t.createdAt); return d >= a && d <= b; }

  function render() {
    const r = range(); const all = TB.store.getTransactions(); const cur = all.filter(function (t) { return inRange(t, r.from, r.to); }), prev = all.filter(function (t) { return inRange(t, r.pFrom, r.pTo); });
    const s = TB.svc.summarize(cur), ps = TB.svc.summarize(prev); const products = TB.store.getProducts().filter(function (p) { return p.active; });
    const crit = products.filter(function (p) { return p.stock <= p.minStock; });
    const todaySum = TB.svc.summarize(all.filter(function (t) { return dk(t.createdAt) === today; }));
    function delta(a, b) { if (!b) return a ? 'baru' : '—'; const d = Math.round((a - b) / b * 100); return (d >= 0 ? '▲ ' : '▼ ') + Math.abs(d) + '% vs periode lalu'; }
    const cards = [['cash', '', 'Omzet Hari Ini', TB.rp(todaySum.omzet), todaySum.count + ' transaksi hari ini'], ['receipt', 'blue', 'Jumlah Transaksi', s.count, delta(s.count, ps.count)], ['chart', 'green', 'Rata-rata Transaksi', TB.rp(s.avg), 'omzet + ongkir per transaksi'],
      ['percent', 'green', 'Estimasi Laba Kotor', TB.rp(s.grossProfit), 'omzet − modal barang (bukan laba bersih)'], ['box', 'blue', 'Total Produk Aktif', products.length, 'produk dijual'], ['alert', 'red', 'Peringatan Stok Kritis', crit.length, 'menipis atau habis']];
    $('#o-stats').innerHTML = cards.map(function (c) { return '<div class="card stat"><div class="ic-wrap ' + c[1] + '">' + TB.icon(c[0], 22) + '</div><div><small>' + c[2] + '</small><b>' + c[3] + '</b><em>' + c[4] + '</em></div></div>'; }).join('') +
      '<div class="card stat"><div class="ic-wrap amber">' + TB.icon('cash', 22) + '</div><div><small>Omzet Periode</small><b>' + TB.rp(s.omzet) + '</b><em>' + delta(s.omzet, ps.omzet) + '</em></div></div><div class="card stat"><div class="ic-wrap green">' + TB.icon('check', 22) + '</div><div><small>Arus Kas Masuk (Lunas)</small><b>' + TB.rp(s.cashIn) + '</b><em>belum lunas: ' + TB.rp(s.pending) + '</em></div></div>';

    /* Grafik harian: batang periode ini + batang tipis periode sebelumnya */
    const days = []; for (let i = 0; i < r.days; i++) days.push(dk(new Date(parse(r.from).getTime() + i * DAY)));
    const byDay = function (list, keys) { const m = {}; keys.forEach(function (k) { m[k] = 0; }); list.forEach(function (t) { if (t.voided) return; const k = dk(t.createdAt); if (k in m) m[k] += t.subtotal - t.discount; }); return keys.map(function (k) { return m[k]; }); };
    const prevDays = days.map(function (_, i) { return dk(new Date(parse(r.pFrom).getTime() + i * DAY)); });
    const cv = byDay(cur, days), pv = byDay(prev, prevDays); const max = Math.max.apply(null, cv.concat(pv).concat([1]));
    const W = 720, H = 260, L = 56, B = 34, T = 12, n = days.length, bw = (W - L - 8) / n; const ch = H - B - T;
    const nice = function (v) { const p = Math.pow(10, Math.floor(Math.log10(v))); return Math.ceil(v / p * 2) / 2 * p; }; const top = nice(max);
    let svg = '<svg class="bar-chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Grafik penjualan harian periode ' + r.from + ' sampai ' + r.to + '">';
    for (let g = 0; g <= 4; g++) { const y = T + ch - ch * g / 4; svg += '<line x1="' + L + '" x2="' + W + '" y1="' + y + '" y2="' + y + '" stroke="var(--line)"/><text x="' + (L - 6) + '" y="' + (y + 4) + '" text-anchor="end" font-size="10" fill="var(--muted)">' + (top * g / 4 >= 1e6 ? TB.num(top * g / 4 / 1e6) + ' jt' : TB.num(top * g / 4 / 1000) + ' rb') + '</text>'; }
    const step = Math.ceil(n / 10);
    cv.forEach(function (v, i) {
      const x = L + i * bw, h = v / top * ch, h2 = pv[i] / top * ch; const bwi = Math.max(2, bw * 0.62);
      svg += '<rect x="' + (x + (bw - bwi) / 2) + '" y="' + (T + ch - h2) + '" width="' + bwi + '" height="' + h2 + '" fill="#8aa4c4" opacity=".55"><title>Periode lalu ' + prevDays[i] + ': ' + TB.rp(pv[i]) + '</title></rect>';
      svg += '<rect x="' + (x + (bw - bwi * 0.6) / 2) + '" y="' + (T + ch - h) + '" width="' + bwi * 0.6 + '" height="' + h + '" rx="2" fill="var(--orange)"><title>' + days[i] + ': ' + TB.rp(v) + '</title></rect>';
      if (i % step === 0) svg += '<text x="' + (x + bw / 2) + '" y="' + (H - 12) + '" text-anchor="middle" font-size="10" fill="var(--muted)">' + days[i].slice(8) + '/' + days[i].slice(5, 7) + '</text>';
    });
    $('#o-chart').innerHTML = svg + '</svg>';
    $('#o-compare').innerHTML = 'Omzet periode ini <b>' + TB.rp(s.omzet) + '</b> (' + r.from + ' – ' + r.to + ') vs <b>' + TB.rp(ps.omzet) + '</b> pada ' + r.days + ' hari sebelumnya (' + r.pFrom + ' – ' + r.pTo + '). ' + delta(s.omzet, ps.omzet) + '.';

    /* Metode pembayaran */
    const colors = ['#f26b1d', '#1f5fae', '#2e9e5b', '#8a5cc7', '#c9a227']; const ms = Object.keys(s.byMethod).sort(function (a, b) { return s.byMethod[b] - s.byMethod[a]; }); const tot = ms.reduce(function (a, k) { return a + s.byMethod[k]; }, 0);
    let acc = 0; const grad = ms.map(function (k, i) { const a = acc / tot * 100; acc += s.byMethod[k]; return colors[i % 5] + ' ' + a + '% ' + acc / tot * 100 + '%'; }).join(',');
    $('#o-methods').innerHTML = tot ? '<div class="donut-wrap"><div class="donut" role="img" aria-label="Komposisi metode pembayaran" style="background:conic-gradient(' + grad + ')"></div><ul class="rank" style="flex:1;min-width:150px">' + ms.map(function (k, i) { return '<li style="grid-template-columns:14px 1fr auto"><i style="width:12px;height:12px;border-radius:3px;background:' + colors[i % 5] + '"></i><span>' + TB.esc(k) + '</span><b>' + Math.round(s.byMethod[k] / tot * 100) + '%</b></li>'; }).join('') + '</ul></div><p class="small muted">Nilai: ' + ms.map(function (k) { return TB.esc(k) + ' ' + TB.rp(s.byMethod[k]); }).join(' · ') + '</p>' : '<div class="empty">Belum ada transaksi pada periode ini.</div>';

    /* Produk terlaris */
    const agg = {}; cur.forEach(function (t) { if (t.voided) return; t.items.forEach(function (i) { const a = agg[i.productId] = agg[i.productId] || { name: i.name, unit: i.unit, qty: 0, rev: 0 }; a.qty += i.qty; a.rev += i.qty * i.price; }); });
    const top5 = Object.keys(agg).map(function (k) { return agg[k]; }).sort(function (a, b) { return b.rev - a.rev; }).slice(0, 6); const mx = top5.length ? top5[0].rev : 1;
    $('#o-top').innerHTML = top5.map(function (a, i) { return '<li><span class="no">' + (i + 1) + '</span><div>' + TB.esc(a.name) + '<div class="small muted">' + TB.num(a.qty) + ' ' + TB.esc(a.unit) + '</div><div class="meter"><i style="width:' + Math.round(a.rev / mx * 100) + '%"></i></div></div><b>' + TB.rp(a.rev) + '</b></li>'; }).join('') || '<li class="muted">Belum ada penjualan.</li>';

    /* Stok menipis */
    const lows = crit.sort(function (a, b) { return a.stock / (a.minStock || 1) - b.stock / (b.minStock || 1); }).slice(0, 8);
    $('#o-low').innerHTML = lows.length ? '<ul class="rank">' + lows.map(function (p) { return '<li style="grid-template-columns:1fr auto"><div>' + TB.esc(p.name) + '<div class="small muted">Min. ' + TB.num(p.minStock) + ' ' + TB.esc(p.unit) + '</div></div><span class="pill ' + (p.stock <= 0 ? 'bad' : 'warn') + '">' + (p.stock <= 0 ? 'Habis' : TB.num(p.stock) + ' ' + TB.esc(p.unit)) + '</span></li>'; }).join('') + '</ul>' : '<div class="empty">Semua stok aman.</div>';

    /* Transaksi terbaru */
    const rec = all.slice().sort(function (a, b) { return b.createdAt.localeCompare(a.createdAt); }).slice(0, 8);
    $('#o-recent').innerHTML = rec.map(function (t) { return '<tr data-id="' + t.id + '" style="cursor:pointer"><td data-label="No."><b>' + TB.esc(t.id) + '</b></td><td data-label="Waktu">' + TB.fmtDateTime(t.createdAt) + '</td><td data-label="Pelanggan">' + TB.esc(t.customer.name || '-') + '</td><td data-label="Metode">' + TB.esc(t.paymentMethod) + '</td><td class="num" data-label="Total">' + TB.rp(t.total) + '</td><td data-label="Status">' + TB.statusPill(t) + '</td></tr>'; }).join('') || '<tr><td colspan="6" class="center muted" style="padding:24px">Belum ada transaksi.</td></tr>';
    TB.$$('#o-presets .chip').forEach(function (c) { c.classList.remove('active'); });
  }
  $('#o-from').addEventListener('change', render); $('#o-to').addEventListener('change', render);
  $('#o-presets').addEventListener('click', function (e) {
    const b = e.target.closest('[data-p]'); if (!b) return; const p = b.getAttribute('data-p'); const t = new Date();
    if (p === 'today') $('#o-from').value = today; else if (p === 'month') $('#o-from').value = dk(new Date(t.getFullYear(), t.getMonth(), 1)); else $('#o-from').value = dk(new Date(Date.now() - (+p - 1) * DAY));
    $('#o-to').value = today; render(); b.classList.add('active');
  });
  $('#o-recent').addEventListener('click', function (e) { const tr = e.target.closest('tr[data-id]'); if (tr) TB.showTransaction(TB.store.getTransactions().find(function (t) { return t.id === tr.getAttribute('data-id'); }), { audit: true }); });
  render(); $('#o-presets [data-p="14"]').classList.add('active'); TB.hydrate(document);
  TB.on('datachange', function (k) { if (/transactions|products/.test(k || '')) render(); });
});
