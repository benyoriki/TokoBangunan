/* =====================================================================
   art.js — Visual produk & logo TOKO BANGUNAN V2
   Render produk bergaya foto studio (bayangan, material, pencahayaan) dalam SVG.
   Dipakai sebagai: (1) cadangan runtime bila berkas gambar belum ada, dan
   (2) sumber untuk membuat berkas assets/p/*.webp (lihat tools/build-assets).
   Foto asli bisa dipakai kapan saja: isi field `photo` pada produk, atau taruh
   berkas assets/p/<SKU>.jpg|webp (lihat README bagian "Foto produk").
   Tidak mengubah data produk tersimpan (artType/artColor tetap dibaca).
   ===================================================================== */
window.TB = window.TB || {};
(function () {
  'use strict';

  /* ---------- Logo ---------- */
  TB.logo = function (size) {
    size = size || 40;
    return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 64 64" role="img" aria-label="Logo TOKO BANGUNAN"><rect width="64" height="64" rx="14" fill="#FF7626"/><path d="M8 31L32 11l24 20" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><path d="M15 29v23h34V29" fill="#fff" fill-opacity=".14" stroke="#fff" stroke-width="4" stroke-linejoin="round"/><rect x="21" y="36" width="9" height="6" rx="1" fill="#fff"/><rect x="33" y="36" width="9" height="6" rx="1" fill="#fff"/><rect x="27" y="44" width="10" height="6" rx="1" fill="#0B1422"/></svg>';
  };

  /* ---------- Util warna ---------- */
  function shade(hex, pct) {
    hex = String(hex || '#888').replace('#', ''); if (hex.length === 3) hex = hex.split('').map(function (c) { return c + c; }).join('');
    const n = parseInt(hex, 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255, t = pct < 0 ? 0 : 255, p = Math.abs(pct);
    const f = function (v) { return Math.round((t - v) * p + v); };
    return '#' + [f(r), f(g), f(b)].map(function (v) { return ('0' + v.toString(16)).slice(-2); }).join('');
  }
  function lum(hex) { hex = String(hex || '#888').replace('#', ''); if (hex.length === 3) hex = hex.split('').map(function (c) { return c + c; }).join(''); const n = parseInt(hex, 16); return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255; }
  function rng(seed) { let s = seed >>> 0; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  function lg(id, c1, c2, x1, y1, x2, y2, mid) { return '<linearGradient id="' + id + '" x1="' + (x1 || 0) + '" y1="' + (y1 || 0) + '" x2="' + (x2 == null ? 1 : x2) + '" y2="' + (y2 || 0) + '"><stop offset="0" stop-color="' + c1 + '"/>' + (mid ? '<stop offset=".5" stop-color="' + mid + '"/>' : '') + '<stop offset="1" stop-color="' + c2 + '"/></linearGradient>'; }
  /* Silinder horizontal-lembut: gelap-terang-gelap */
  function cyl(id, c) { return '<linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + shade(c, -.38) + '"/><stop offset=".28" stop-color="' + shade(c, .28) + '"/><stop offset=".55" stop-color="' + c + '"/><stop offset="1" stop-color="' + shade(c, -.5) + '"/></linearGradient>'; }
  function box3d(x, y, w, h, d, c, opt) { /* balok oblik: muka depan, atas, samping */
    opt = opt || {}; const dx = d, dy = d * .55; const id = (opt.id || 'b') + Math.round(x) + '_' + Math.round(y);
    return '<g><path d="M' + x + ' ' + y + 'h' + w + 'v' + h + 'h-' + w + 'z" fill="' + shade(c, opt.front || -.08) + '"' + (opt.tex ? ' filter="url(#tex)"' : '') + '/>' +
      '<path d="M' + x + ' ' + y + 'l' + dx + ' -' + dy + 'h' + w + 'l-' + dx + ' ' + dy + 'z" fill="' + shade(c, opt.top || .22) + '"' + (opt.tex ? ' filter="url(#tex)"' : '') + '/>' +
      '<path d="M' + (x + w) + ' ' + y + 'l' + dx + ' -' + dy + 'v' + h + 'l-' + dx + ' ' + dy + 'z" fill="' + shade(c, opt.side || -.32) + '"' + (opt.tex ? ' filter="url(#tex)"' : '') + '/>' +
      (opt.edge === false ? '' : '<path d="M' + x + ' ' + y + 'h' + w + '" stroke="#fff" stroke-opacity=".28" stroke-width="1.4"/>') + '</g>';
  }

  /* ---------- Varian visual (dipilih dari nama & artType; data tersimpan tidak diubah) ---------- */
  const TYPE_DEFAULT = { bag: 'bag', pile: 'pile', brick: 'brick', rods: 'rods', tile: 'tile', paint: 'paint', tools: 'hammer', pipe: 'pipe', bulb: 'bulb', board: 'board', roof: 'roof', box: 'bag' };
  TB.artVariant = function (p) {
    const n = String((p && p.name) || '').toLowerCase(), t = (p && p.artType) || 'box';
    const rules = [['semen', 'bag'], ['perekat', 'bag'], ['wiremesh', 'mesh'], ['kawat', 'wire'], ['split', 'gravel'], ['batu', 'gravel'], ['bata ringan', 'hebel'], ['batako', 'hebel'], ['palu', 'hammer'], ['meteran', 'tape'], ['cangkul', 'shovel'], ['sekop', 'shovel'], ['paku', 'nails'],
      ['closet', 'toilet'], ['keran', 'faucet'], ['kabel', 'cable'], ['saklar', 'switch'], ['mcb', 'mcb'], ['lampu', 'bulb'], ['gypsum', 'board'], ['triplek', 'plywood'], ['kaso', 'plank'], ['hollow', 'hollow'], ['baja ringan', 'hollow'], ['seng', 'roof'], ['genteng', 'roof'], ['plamir', 'paint']];
    for (let i = 0; i < rules.length; i++) if (n.indexOf(rules[i][0]) >= 0) return rules[i][1];
    return TYPE_DEFAULT[t] || 'bag';
  };

  /* ---------- Gambar tiap varian (viewBox 600x600) ---------- */
  const V = {};
  V.bag = function (c) {
    const dk = shade(c, -.28);
    const body = 'M154 142Q300 108 446 142L470 438Q300 494 130 438Z';
    return '<defs><linearGradient id="bgs" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity=".36"/><stop offset=".33" stop-color="#fff" stop-opacity=".2"/><stop offset=".62" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".4"/></linearGradient><linearGradient id="bgv" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".14"/><stop offset=".78" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".26"/></linearGradient></defs>' +
      '<path d="' + body + '" fill="' + c + '" filter="url(#tex)"/><path d="' + body + '" fill="url(#bgs)"/><path d="' + body + '" fill="url(#bgv)"/>' +
      '<path d="M154 142Q300 108 446 142L450 196Q300 166 150 196Z" fill="' + dk + '" fill-opacity=".5"/><path d="M154 142Q300 108 446 142" stroke="#fff" stroke-opacity=".5" stroke-width="2" fill="none"/>' +
      '<path d="M152 176Q300 146 448 176" stroke="#fff" stroke-opacity=".6" stroke-dasharray="5 6" stroke-width="2" fill="none"/>' +
      '<path d="M154 142l-26 -16 44 -14zM446 142l26 -16 -44 -14z" fill="' + dk + '" fill-opacity=".85"/>' +
      '<g transform="rotate(-1.2 300 330)"><rect x="190" y="236" width="224" height="170" rx="12" fill="#fff" fill-opacity=".96"/><rect x="190" y="236" width="224" height="170" rx="12" fill="url(#bgs)" opacity=".45"/>' +
      '<rect x="208" y="254" width="188" height="34" rx="6" fill="' + dk + '"/><path d="M224 271h84" stroke="#fff" stroke-width="8" stroke-linecap="round" stroke-opacity=".92"/><circle cx="364" cy="271" r="9" fill="#fff" fill-opacity=".92"/>' +
      '<path d="M210 314h126M210 336h156M210 358h100" stroke="' + shade(c, -.1) + '" stroke-width="9" stroke-linecap="round" stroke-opacity=".85"/><rect x="336" y="344" width="58" height="42" rx="8" fill="' + c + '"/><path d="M346 368l12-12 12 12 12-12" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></g>' +
      '<path d="M166 232Q152 336 158 428M440 226Q458 336 452 426" stroke="#000" stroke-opacity=".1" stroke-width="5" fill="none"/><path d="M232 150q-22 150 -8 300M388 150q20 140 8 296" stroke="#fff" stroke-opacity=".1" stroke-width="3" fill="none"/>';
  };
  V.pile = function (c, o) {
    const r = rng(7); let g = '', i;
    const dark = shade(c, -.3), lt = shade(c, .35);
    for (i = 0; i < 260; i++) { const t = r(); const y = 270 + t * 205; const spread = 40 + (y - 250) * 1.15; const x = 300 + (r() - .5) * 2 * spread * (0.55 + .45 * t); const s = (o && o.gravel ? 4 + r() * 7 : 1.4 + r() * 2.8); g += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + s.toFixed(1) + '" fill="' + (r() > .5 ? lt : dark) + '" fill-opacity="' + (.35 + r() * .5).toFixed(2) + '"/>'; }
    return '<defs><radialGradient id="pg" cx=".42" cy=".28" r=".85"><stop offset="0" stop-color="' + shade(c, .28) + '"/><stop offset=".55" stop-color="' + c + '"/><stop offset="1" stop-color="' + shade(c, -.42) + '"/></radialGradient><clipPath id="pc"><path d="M70 468Q130 440 196 372Q258 290 296 214Q316 186 342 214Q384 300 440 400Q490 450 538 468Q300 520 70 468Z"/></clipPath></defs>' +
      '<path d="M70 468Q130 440 196 372Q258 290 296 214Q316 186 342 214Q384 300 440 400Q490 450 538 468Q300 520 70 468Z" fill="url(#pg)" filter="url(#tex)"/><g clip-path="url(#pc)">' + g +
      '<path d="M296 214Q258 300 196 372Q130 440 70 468L120 480Q250 390 300 214Z" fill="#fff" fill-opacity=".1"/><path d="M342 214Q384 300 440 400Q490 450 538 468L500 486Q420 420 340 214Z" fill="#000" fill-opacity=".16"/></g>';
  };
  V.gravel = function (c) { return V.pile(c, { gravel: true }); };
  V.brick = function (c, o) {
    const w = (o && o.w) || 118, h = (o && o.h) || 52, d = (o && o.d) || 64; let s = ''; const rows = [[0, 1, 2], [0.5, 1.5], [1]];
    const base = 430; const lay = function (row, ri) { return row.map(function (k) { return [150 + k * (w + 8) + ri * 0, base - ri * (h + 8) - ri * 2, k]; }); };
    /* 3 baris susun, tiap baris bergeser (running bond) */
    const rowsDef = [[0, 1, 2], [0.5, 1.5], [0, 1, 2]];
    rowsDef.forEach(function (row, ri) { row.forEach(function (k) { const x = 120 + k * (w + 8) + ri * 4, y = 420 - ri * (h + 6); s += box3d(x, y, w, h, d, c, { tex: true, id: 'br' }); if (!(o && o.light)) s += '<rect x="' + (x + 8) + '" y="' + (y + 8) + '" width="' + (w - 16) + '" height="6" rx="3" fill="#fff" fill-opacity=".1"/>'; }); });
    return s;
  };
  V.hebel = function (c) { return V.brick(shade(c, 0), { w: 130, h: 58, d: 70, light: true }); };
  V.rods = function (c) {
    let s = '<g transform="rotate(-18 300 320)">'; const n = 9, base = c;
    for (let i = 0; i < n; i++) { const y = 215 + i * 20 + (i % 2 ? 4 : 0); const x1 = 70 + (i % 3) * 6, x2 = 530 - (i % 2) * 14; s += '<line x1="' + x1 + '" y1="' + y + '" x2="' + x2 + '" y2="' + y + '" stroke="' + shade(base, -.45) + '" stroke-width="21" stroke-linecap="round"/><line x1="' + x1 + '" y1="' + (y - 1) + '" x2="' + x2 + '" y2="' + (y - 1) + '" stroke="' + shade(base, .1) + '" stroke-width="15" stroke-linecap="round"/><line x1="' + x1 + '" y1="' + (y - 4) + '" x2="' + x2 + '" y2="' + (y - 4) + '" stroke="#fff" stroke-opacity=".38" stroke-width="4" stroke-linecap="round"/><line x1="' + (x1 + 12) + '" y1="' + (y + 3) + '" x2="' + (x2 - 12) + '" y2="' + (y + 3) + '" stroke="' + shade(base, -.55) + '" stroke-opacity=".55" stroke-width="5" stroke-dasharray="2 13"/>'; }
    s += '<ellipse cx="528" cy="300" rx="9" ry="10" fill="' + shade(base, .2) + '" opacity="0"/>';
    [180, 400].forEach(function (x) { s += '<rect x="' + x + '" y="198" width="18" height="190" rx="6" fill="#2b2f36" fill-opacity=".85"/><path d="M' + (x + 2) + ' 204v176" stroke="#fff" stroke-opacity=".25" stroke-width="2"/>'; });
    return s + '</g>';
  };
  V.mesh = function (c) {
    let s = '<g transform="skewY(-8)" >'; const x0 = 110, y0 = 230, W = 380, H = 230;
    s += '<rect x="' + x0 + '" y="' + y0 + '" width="' + W + '" height="' + H + '" fill="#fff" fill-opacity=".06"/>';
    for (let i = 0; i <= 10; i++) { const x = x0 + i * W / 10; s += '<line x1="' + x + '" y1="' + y0 + '" x2="' + x + '" y2="' + (y0 + H) + '" stroke="' + shade(c, -.25) + '" stroke-width="6"/><line x1="' + (x - 1.5) + '" y1="' + y0 + '" x2="' + (x - 1.5) + '" y2="' + (y0 + H) + '" stroke="#fff" stroke-opacity=".45" stroke-width="2"/>'; }
    for (let j = 0; j <= 6; j++) { const y = y0 + j * H / 6; s += '<line x1="' + x0 + '" y1="' + y + '" x2="' + (x0 + W) + '" y2="' + y + '" stroke="' + shade(c, -.25) + '" stroke-width="6"/><line x1="' + x0 + '" y1="' + (y - 1.5) + '" x2="' + (x0 + W) + '" y2="' + (y - 1.5) + '" stroke="#fff" stroke-opacity=".45" stroke-width="2"/>'; }
    return s + '</g>';
  };
  V.wire = function (c) {
    let s = '<defs>' + cyl('wcy', '#9aa5b1') + '</defs>'; for (let i = 0; i < 11; i++) { const k = i / 10; s += '<ellipse cx="300" cy="' + (300 - k * 6) + '" rx="' + (150 - k * 60) + '" ry="' + (140 - k * 60) + '" fill="none" stroke="' + shade('#8b95a1', k * .35 - .2) + '" stroke-width="12"/>'; }
    for (let j = 0; j < 22; j++) { const a = j / 22 * Math.PI * 2; s += '<path d="M' + (300 + Math.cos(a) * 150) + ' ' + (300 + Math.sin(a) * 140) + 'L' + (300 + Math.cos(a) * 92) + ' ' + (300 + Math.sin(a) * 82) + '" stroke="#fff" stroke-opacity=".12" stroke-width="3"/>'; }
    return s + '<ellipse cx="300" cy="300" rx="60" ry="52" fill="#e8edf2"/><ellipse cx="300" cy="304" rx="46" ry="38" fill="#c9d1da"/>';
  };
  V.tile = function (c, o) {
    o = o || {}; let s = ''; const n = o.n || 5, w = o.w || 300, d = o.d || 120, th = o.th || 18;
    for (let i = 0; i < n; i++) { const x = 120 + (i % 2) * 5, y = 430 - i * (th + 2); s += box3d(x, y, w, th, d, c, { top: .06, front: -.18, side: -.34, id: 'tl' }); }
    const x = 120, y = 430 - (n - 1) * (th + 2);
    s += '<path d="M' + x + ' ' + y + 'l' + d + ' -' + d * .55 + 'h' + w + 'l-' + d + ' ' + d * .55 + 'z" fill="#fff" fill-opacity=".14"/><path d="M' + (x + 120) + ' ' + (y - 14) + 'q50 -20 120 -16M' + (x + 60) + ' ' + (y - 4) + 'q80 -44 160 -30M' + (x + 210) + ' ' + y + 'q60 -26 100 -42" stroke="#fff" stroke-opacity=".45" stroke-width="2.2" fill="none"/>' +
      '<path d="M' + (x + 20) + ' ' + y + 'l' + d + ' -' + d * .55 + '" stroke="#fff" stroke-opacity=".6" stroke-width="2"/>';
    return s;
  };
  V.board = function (c) { return V.tile(shade(c, .1), { n: 7, w: 330, d: 90, th: 12 }); };
  V.paint = function (c) {
    return '<defs>' + lg('pm', '#7e8794', '#7e8794', 0, 0, 1, 0, '#e7ebf0') + '</defs>' +
      '<ellipse cx="300" cy="212" rx="118" ry="26" fill="#6c7683"/>' +
      '<path d="M182 212L204 466Q300 500 396 466L418 212Q300 246 182 212Z" fill="url(#pm)"/>' +
      '<path d="M182 212L204 466Q300 500 396 466L418 212" fill="none" stroke="#000" stroke-opacity=".12" stroke-width="2"/>' +
      '<path d="M190 262L198 420Q300 452 402 420L410 262Q300 292 190 262Z" fill="' + c + '"/>' +
      '<path d="M190 262L198 420Q300 452 402 420L410 262Q300 292 190 262Z" fill="url(#bgs2)"/>' +
      '<defs><linearGradient id="bgs2" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity=".3"/><stop offset=".32" stop-color="#fff" stop-opacity=".24"/><stop offset=".65" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".36"/></linearGradient></defs>' +
      '<rect x="236" y="308" width="128" height="76" rx="9" fill="#fff" fill-opacity=".95" transform="rotate(1 300 346)"/><path d="M252 330h64M252 348h92M252 366h50" stroke="' + shade(c, -.2) + '" stroke-width="8" stroke-linecap="round"/><circle cx="342" cy="332" r="8" fill="' + c + '"/>' +
      '<ellipse cx="300" cy="206" rx="118" ry="26" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="3"/><ellipse cx="300" cy="212" rx="104" ry="20" fill="' + shade(c, .06) + '"/><ellipse cx="300" cy="212" rx="104" ry="20" fill="none" stroke="#000" stroke-opacity=".14"/>' +
      '<path d="M192 190Q300 50 408 190" fill="none" stroke="#3a424d" stroke-width="6" stroke-linecap="round"/><path d="M196 188Q300 60 404 188" fill="none" stroke="#fff" stroke-opacity=".25" stroke-width="2" stroke-linecap="round"/>' +
      '<path d="M258 214q-4 30 6 44q10 6 14 -10q-2 -26 -2 -34z" fill="' + c + '"/>';
  };
  V.hammer = function (c) {
    return '<g transform="rotate(-38 300 310)"><defs>' + cyl('hh', '#b9823f') + cyl('hm', '#aab3be') + '</defs><rect x="274" y="170" width="52" height="316" rx="24" fill="url(#hh)"/><rect x="274" y="360" width="52" height="124" rx="24" fill="' + c + '"/><path d="M284 372v100" stroke="#fff" stroke-opacity=".35" stroke-width="6" stroke-linecap="round"/>' +
      '<path d="M170 132h206q16 0 16 16v28q0 14-14 14H186q-16 0-16-16z" fill="url(#hm)"/><path d="M176 140h196" stroke="#fff" stroke-opacity=".6" stroke-width="3"/><path d="M170 138L96 108q-12 -4 -10 8l16 54q4 10 18 6l70 -20z" fill="url(#hm)"/><rect x="262" y="176" width="76" height="18" fill="#6a7480"/></g>';
  };
  V.tape = function (c) {
    return '<rect x="142" y="170" width="316" height="286" rx="62" fill="' + c + '"/><rect x="142" y="170" width="316" height="286" rx="62" fill="url(#tpg)"/><defs><linearGradient id="tpg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".3"/></linearGradient></defs>' +
      '<circle cx="300" cy="312" r="94" fill="#2b2f36"/><circle cx="300" cy="312" r="82" fill="#3a404a"/><circle cx="300" cy="312" r="30" fill="#c9d1da"/><circle cx="300" cy="312" r="14" fill="#7d8794"/>' +
      '<rect x="186" y="436" width="228" height="22" rx="6" fill="#dfe4ea"/><path d="M196 447h210" stroke="#222" stroke-width="2" stroke-dasharray="2 10"/><rect x="412" y="440" width="50" height="18" rx="4" fill="#2b2f36"/><path d="M178 190q40 -22 80 -10" stroke="#fff" stroke-opacity=".5" stroke-width="5" fill="none" stroke-linecap="round"/>';
  };
  V.shovel = function (c) {
    return '<g transform="rotate(32 300 300)"><defs>' + cyl('sh', '#b9823f') + lg('sb', '#8a95a1', '#8a95a1', 0, 0, 1, 0, '#d6dce3') + '</defs><rect x="284" y="60" width="32" height="270" rx="14" fill="url(#sh)"/><rect x="268" y="46" width="64" height="34" rx="14" fill="' + shade(c, -.1) + '"/><path d="M236 320Q300 300 364 320L392 472Q300 520 208 472Z" fill="url(#sb)"/><path d="M262 324L246 470M338 324L354 470" stroke="#fff" stroke-opacity=".2" stroke-width="4"/><path d="M236 320Q300 300 364 320" stroke="#fff" stroke-opacity=".6" stroke-width="3" fill="none"/></g>';
  };
  V.pipe = function (c) {
    let s = '<defs>' + cyl('pp', c) + '</defs>'; const ys = [190, 262, 334, 406];
    ys.forEach(function (y, i) { const x = 90 + (i % 2) * 14; s += '<rect x="' + x + '" y="' + y + '" width="400" height="56" rx="8" fill="url(#pp)"/><rect x="' + (x + 330) + '" y="' + (y - 5) + '" width="82" height="66" rx="10" fill="url(#pp)"/><path d="M' + (x + 332) + ' ' + (y + 2) + 'v52" stroke="#000" stroke-opacity=".16" stroke-width="2"/><path d="M' + (x + 24) + ' ' + (y + 28) + 'h180" stroke="#1565c0" stroke-opacity=".6" stroke-width="5" stroke-dasharray="26 10"/><ellipse cx="' + (x + 412) + '" cy="' + (y + 28) + '" rx="9" ry="29" fill="' + shade(c, -.3) + '"/><ellipse cx="' + (x + 412) + '" cy="' + (y + 28) + '" rx="5" ry="20" fill="#2b2f36"/>'; });
    return s;
  };
  V.toilet = function (c) {
    return '<defs>' + lg('tb', '#dfe5ec', '#dfe5ec', 0, 0, 1, 0, '#fff') + '</defs><rect x="352" y="110" width="150" height="190" rx="22" fill="url(#tb)"/><rect x="340" y="98" width="174" height="34" rx="14" fill="#fff"/><circle cx="440" cy="116" r="9" fill="#c9d1da"/>' +
      '<path d="M90 292Q300 270 452 292Q470 380 392 430Q372 470 330 478H250Q210 470 190 430Q84 380 90 292Z" fill="url(#tb)"/><ellipse cx="270" cy="296" rx="178" ry="36" fill="#f5f8fb"/><ellipse cx="270" cy="298" rx="138" ry="24" fill="#cfd8e2"/><ellipse cx="270" cy="304" rx="94" ry="14" fill="#8fa6bc"/><path d="M120 318Q140 400 230 440" stroke="#fff" stroke-opacity=".7" stroke-width="6" fill="none" stroke-linecap="round"/><rect x="232" y="476" width="110" height="26" rx="8" fill="#c8d0d9"/>';
  };
  V.faucet = function (c) {
    return '<defs>' + cyl('fc', '#d8a84a') + '</defs><rect x="262" y="330" width="76" height="130" rx="14" fill="url(#fc)"/><rect x="246" y="446" width="108" height="30" rx="10" fill="url(#fc)"/><path d="M300 340V230Q300 150 380 150H440" fill="none" stroke="url(#fc)" stroke-width="58" stroke-linecap="round" stroke-linejoin="round"/><path d="M300 330V228Q300 160 376 158H430" fill="none" stroke="#fff" stroke-opacity=".4" stroke-width="8" stroke-linecap="round"/><rect x="410" y="138" width="50" height="54" rx="8" fill="#b5842c"/><rect x="222" y="268" width="156" height="34" rx="14" fill="url(#fc)"/><circle cx="222" cy="285" r="26" fill="#e9eef3"/><path d="M212 284h20" stroke="#8e99a5" stroke-width="5" stroke-linecap="round"/>';
  };
  V.bulb = function (c) {
    return '<defs><radialGradient id="bl" cx=".4" cy=".3" r=".8"><stop offset="0" stop-color="#fff"/><stop offset=".45" stop-color="' + shade(c, .6) + '"/><stop offset="1" stop-color="' + shade(c, -.1) + '"/></radialGradient><radialGradient id="gl" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="' + c + '" stop-opacity=".55"/><stop offset="1" stop-color="' + c + '" stop-opacity="0"/></radialGradient>' + cyl('bm', '#aab3be') + '</defs>' +
      '<circle cx="300" cy="250" r="230" fill="url(#gl)"/><path d="M300 90a128 128 0 0 0-84 224q18 20 18 52h132q0-32 18-52A128 128 0 0 0 300 90z" fill="url(#bl)"/><path d="M236 150q-34 44 -14 100" stroke="#fff" stroke-opacity=".8" stroke-width="12" fill="none" stroke-linecap="round"/><path d="M260 330h80M270 296q30 -40 60 0" stroke="#d99a2b" stroke-width="5" fill="none"/>' +
      '<rect x="234" y="366" width="132" height="30" rx="8" fill="url(#bm)"/><rect x="238" y="396" width="124" height="28" rx="8" fill="url(#bm)"/><rect x="242" y="424" width="116" height="26" rx="8" fill="url(#bm)"/><path d="M254 366v84M284 366v84M316 366v84M346 366v84" stroke="#000" stroke-opacity=".12" stroke-width="2"/><rect x="264" y="450" width="72" height="26" rx="12" fill="#2b2f36"/>';
  };
  V.cable = function (c) {
    let s = ''; for (let i = 0; i < 12; i++) { const k = i / 11; s += '<ellipse cx="300" cy="' + (318 - k * 8) + '" rx="' + (190 - k * 70) + '" ry="' + (150 - k * 56) + '" fill="none" stroke="' + shade(c, k * .3 - .3) + '" stroke-width="16"/><ellipse cx="300" cy="' + (314 - k * 8) + '" rx="' + (190 - k * 70) + '" ry="' + (150 - k * 56) + '" fill="none" stroke="#fff" stroke-opacity=".12" stroke-width="4"/>'; }
    return s + '<ellipse cx="300" cy="310" rx="64" ry="50" fill="#eadfc6"/><ellipse cx="300" cy="314" rx="50" ry="36" fill="#c6b88d"/><rect x="226" y="190" width="100" height="56" rx="8" fill="#fff" fill-opacity=".92" transform="rotate(-8 276 218)"/><path d="M240 214h60M240 228h40" stroke="' + shade(c, -.2) + '" stroke-width="6" stroke-linecap="round" transform="rotate(-8 276 218)"/>';
  };
  V.switch = function (c) {
    return '<defs>' + lg('sw', '#e6eaef', '#c9d0d8', 0, 0, 1, 1, '#fff') + '</defs><rect x="190" y="130" width="220" height="340" rx="28" fill="url(#sw)"/><rect x="190" y="130" width="220" height="340" rx="28" fill="none" stroke="#000" stroke-opacity=".12"/><rect x="226" y="176" width="148" height="248" rx="18" fill="#f7f9fb"/><rect x="236" y="186" width="128" height="116" rx="14" fill="#fff"/><rect x="236" y="310" width="128" height="104" rx="14" fill="#dde3ea"/><path d="M244 192h112" stroke="#fff" stroke-width="4"/><circle cx="300" cy="150" r="7" fill="#b5bdc7"/><circle cx="300" cy="450" r="7" fill="#b5bdc7"/>';
  };
  V.mcb = function (c) {
    return '<defs>' + lg('mc', '#dfe4ea', '#aeb7c2', 0, 0, 1, 0, '#f6f8fa') + '</defs><rect x="228" y="110" width="144" height="372" rx="12" fill="url(#mc)"/><rect x="246" y="150" width="108" height="150" rx="8" fill="#2b2f36"/><rect x="262" y="164" width="76" height="60" rx="6" fill="' + c + '"/><rect x="262" y="232" width="76" height="56" rx="6" fill="#4a5360"/><rect x="246" y="330" width="108" height="64" rx="6" fill="#fff"/><path d="M258 352h56M258 370h80" stroke="#6b7480" stroke-width="6" stroke-linecap="round"/><rect x="228" y="440" width="144" height="42" rx="8" fill="#9aa4b0"/><path d="M236 118h128" stroke="#fff" stroke-opacity=".7" stroke-width="3"/>';
  };
  V.plank = function (c) {
    let s = '<defs>' + cyl('pk', c) + '</defs>'; const ys = [170, 262, 354];
    ys.forEach(function (y, i) { const x = 80 + i * 16; s += '<rect x="' + x + '" y="' + y + '" width="400" height="76" rx="6" fill="url(#pk)"/>'; for (let g = 0; g < 7; g++) s += '<path d="M' + (x + 10) + ' ' + (y + 10 + g * 9) + 'q120 ' + ((g % 2 ? -5 : 5)) + ' 240 0t140 0" stroke="' + shade(c, -.4) + '" stroke-opacity=".28" stroke-width="1.6" fill="none"/>'; s += '<rect x="' + (x + 400) + '" y="' + y + '" width="46" height="76" rx="6" fill="' + shade(c, -.28) + '"/><ellipse cx="' + (x + 423) + '" cy="' + (y + 38) + '" rx="14" ry="26" fill="none" stroke="' + shade(c, -.55) + '" stroke-opacity=".55" stroke-width="2"/>'; });
    return s;
  };
  V.plywood = function (c) { return V.tile(c, { n: 7, w: 340, d: 100, th: 13 }); };
  V.hollow = function (c) {
    let s = '<defs>' + cyl('hl', '#9fb0c0') + '</defs>'; const ys = [190, 270, 350];
    ys.forEach(function (y, i) { const x = 80 + i * 12; s += '<rect x="' + x + '" y="' + y + '" width="410" height="58" rx="5" fill="url(#hl)"/><path d="M' + (x + 4) + ' ' + (y + 5) + 'h400" stroke="#fff" stroke-opacity=".6" stroke-width="3"/><rect x="' + (x + 410) + '" y="' + y + '" width="30" height="58" rx="4" fill="#5d6b79"/><rect x="' + (x + 417) + '" y="' + (y + 10) + '" width="16" height="38" rx="2" fill="#2b2f36"/>'; });
    return s;
  };
  V.roof = function (c) {
    let waves = ''; for (let i = 0; i < 12; i++) waves += '<path d="M' + (120 + i * 34) + ' 450l60 -250" stroke="#fff" stroke-opacity="' + (i % 2 ? .34 : .08) + '" stroke-width="16"/><path d="M' + (136 + i * 34) + ' 450l60 -250" stroke="#000" stroke-opacity="' + (i % 2 ? .02 : .16) + '" stroke-width="8"/>';
    return '<path d="M90 470L170 170H520L440 470Z" fill="' + c + '" filter="url(#tex)"/><clipPath id="rf"><path d="M90 470L170 170H520L440 470Z"/></clipPath><g clip-path="url(#rf)">' + waves + '</g><path d="M90 470L170 170H520" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="3"/><path d="M90 470H440L520 170" fill="none" stroke="#000" stroke-opacity=".2" stroke-width="4"/>';
  };
  V.nails = function (c) {
    let s = '<defs>' + lg('nb', '#c19a6b', '#a47c4c', 0, 0, 1, 1) + '</defs>' + box3d(150, 300, 250, 160, 70, '#c19a6b', { id: 'nx' }) + '<rect x="176" y="330" width="198" height="84" rx="8" fill="#fff" fill-opacity=".92"/><path d="M194 356h110M194 376h150" stroke="#8b5e34" stroke-width="9" stroke-linecap="round"/><rect x="316" y="342" width="40" height="22" rx="5" fill="#c0392b"/>';
    const r = rng(11); for (let i = 0; i < 14; i++) { const x = 190 + r() * 250, y = 470 + r() * 24, a = r() * 40 - 20; s += '<g transform="rotate(' + a.toFixed(0) + ' ' + x.toFixed(0) + ' ' + y.toFixed(0) + ')"><rect x="' + (x - 1.8).toFixed(1) + '" y="' + (y - 52).toFixed(1) + '" width="3.6" height="54" fill="#8a949f"/><ellipse cx="' + x.toFixed(1) + '" cy="' + (y - 52).toFixed(1) + '" rx="8" ry="3" fill="#c9d1da"/></g>'; }
    return s;
  };

  /* [zoom, geser-y] per varian agar subjek besar & terpusat */
  const ZOOM = { bag: [1.12, 0, 0], pile: [1.1, -10, 0], gravel: [1.1, -10, 0], brick: [1.12, -25, -34], hebel: [1.1, -25, -40], rods: [1.12, -10, 0], mesh: [1.22, -20, 0], wire: [1.3, -20, 0], tile: [1.2, -50, -32], board: [1.2, -45, -30], plywood: [1.2, -45, -35], paint: [1.12, 0, 0], hammer: [1.12, 0, 0], tape: [1.2, -10, 0], shovel: [1.1, 0, 0], pipe: [1.15, -20, -20], toilet: [1.08, 14, 0], faucet: [1.15, 0, 0], bulb: [1.1, 0, 0], cable: [1.25, -20, 0], switch: [1.1, 0, 0], mcb: [1.08, 0, 0], plank: [1.15, -20, -5], hollow: [1.15, -20, -25], roof: [1.18, -25, -5], nails: [1.3, -30, 0] };
  const DEFS = '<defs><linearGradient id="bkd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbfcfd"/><stop offset="1" stop-color="#e6eaef"/></linearGradient><radialGradient id="shd" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#0b1422" stop-opacity=".42"/><stop offset="1" stop-color="#0b1422" stop-opacity="0"/></radialGradient>' +
    '<filter id="tex" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" seed="4" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -.9 .62" result="g"/><feComposite in="g" in2="SourceAlpha" operator="in" result="gc"/><feBlend in="SourceGraphic" in2="gc" mode="multiply"/></filter></defs>';

  /* Hasilkan SVG utuh. opts.bg=false → transparan (untuk komposisi hero). */
  TB.artSvg = function (variant, color, opts) {
    opts = opts || {}; const fn = V[variant] || V.bag; const c = color || '#90a4ae';
    const bg = opts.bg === false ? '' : '<rect width="600" height="600" fill="url(#bkd)"/>';
    const sh = '<ellipse cx="300" cy="' + (opts.shadowY || 486) + '" rx="' + (opts.shadowRx || 230) + '" ry="26" fill="url(#shd)"/>';
    const z = ZOOM[variant] || [1.1, 0, 0];
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="600" height="600">' + DEFS + bg + '<g transform="translate(' + z[2] + ' ' + z[1] + ') translate(300 486) scale(' + z[0] + ') translate(-300 -486)">' + sh + fn(c) + '</g></svg>';
  };

  /* ---------- Berkas gambar pra-render (assets/p/<varian>-<hex>.webp) ---------- */
  TB.ART_FILES = /*ART_FILES*/{"bag-c0392b":1,"bag-2e7d32":1,"bag-1565c0":1,"bag-90a4ae":1,"pile-d7a85b":1,"pile-b88a4a":1,"gravel-78909c":1,"pile-a1887f":1,"brick-c2562f":1,"hebel-cfd8dc":1,"hebel-9e9e9e":1,"rods-37474f":1,"rods-455a64":1,"mesh-546e7a":1,"wire-78909c":1,"tile-b0a090":1,"tile-8d99a6":1,"tile-c9b8a8":1,"paint-1976d2":1,"paint-2e7d32":1,"paint-6d4c41":1,"paint-bdbdbd":1,"hammer-ef6c00":1,"tape-fbc02d":1,"shovel-5d4037":1,"shovel-607d8b":1,"pipe-eceff1":1,"pipe-cfd8dc":1,"toilet-ffffff":1,"faucet-ffc107":1,"bulb-ffd54f":1,"cable-ef5350":1,"switch-e0e0e0":1,"mcb-43a047":1,"board-e0d6c3":1,"hollow-90a4ae":1,"plywood-c8a165":1,"plank-a67c52":1,"hollow-607d8b":1,"roof-c0392b":1,"roof-b0bec5":1,"nails-8d6e63":1};
  const cache = {};
  TB.artKey = function (p) { return TB.artVariant(p) + '-' + String((p && p.artColor) || '#90a4ae').replace('#', '').toLowerCase(); };
  /* URL gambar produk: foto asli (p.photo) > assets/p/<SKU>.* bila terdaftar > pra-render > SVG runtime */
  TB.productImage = function (p) {
    if (p && p.photo) return p.photo;
    const key = TB.artKey(p);
    if (TB.ART_FILES[key]) return 'assets/p/' + key + '.webp';
    if (cache[key]) return cache[key];
    return (cache[key] = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(TB.artSvg(TB.artVariant(p), p && p.artColor)));
  };
  TB.productImageFallback = function (p) { return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(TB.artSvg(TB.artVariant(p), p && p.artColor)); };
  /* Gambar kategori: varian representatif */
  const CAT_ART = { semen: ['bag', '#c0392b'], pasir: ['pile', '#d7a85b'], bata: ['brick', '#c2562f'], besi: ['rods', '#37474f'], keramik: ['tile', '#b0a090'], cat: ['paint', '#1976d2'], alat: ['hammer', '#ef6c00'], sanitasi: ['pipe', '#eceff1'], elektrikal: ['bulb', '#ffd54f'], kayu: ['board', '#e0d6c3'], atap: ['roof', '#c0392b'] };
  TB.categoryArt = function (cat) { return CAT_ART[cat && cat.id] || ['bag', '#90a4ae']; };
  TB.categoryImage = function (cat) {
    const a = TB.categoryArt(cat), key = a[0] + '-' + a[1].replace('#', '').toLowerCase();
    if (TB.ART_FILES[key]) return 'assets/p/' + key + '.webp';
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(TB.artSvg(a[0], a[1]));
  };
  /* Hero: gambar komposisi pra-render bila ada; kalau tidak, gunakan susunan SVG sederhana */
  TB.heroImage = function () {
    if (TB.CONFIG && TB.CONFIG.HERO_IMAGE) return TB.CONFIG.HERO_IMAGE;
    return 'assets/hero.webp';
  };
  TB.ART_VARIANTS = Object.keys(V);
})();
