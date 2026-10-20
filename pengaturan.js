/* pengaturan.js — Pengaturan toko (owner): identitas, pembayaran, tarif kirim, diskon, pengguna, backup */
TB.ready(function () {
  'use strict';
  const $ = TB.$; const user = TB.auth.current(); let S = TB.store.getSettings();
  const num = function (v) { const n = parseFloat(v); return isNaN(n) ? 0 : n; };
  const field = function (label, id, val, extra) { return '<label class="field"><span>' + label + '</span><input class="input" id="' + id + '" value="' + TB.esc(val == null ? '' : val) + '" ' + (extra || '') + '></label>'; };
  function save(msg) { try { TB.store.saveSettings(S); TB.store.addAudit({ action: 'pengaturan.ubah', userId: user.id, userName: user.name, detail: msg }); TB.toast('Pengaturan disimpan: ' + msg, 'ok'); } catch (e) { TB.toast(e.message, 'error'); } }

  /* ---- Tab ---- */
  const TABS = ['toko', 'pembayaran', 'pengiriman', 'diskon', 'pengguna', 'data'];
  function tab(n) { if (TABS.indexOf(n) < 0) n = 'toko'; TB.$$('#set-tabs button').forEach(function (b) { b.classList.toggle('active', b.getAttribute('data-tab') === n); }); TABS.forEach(function (t) { $('#set-' + t).hidden = t !== n; }); }
  $('#set-tabs').addEventListener('click', function (e) { const b = e.target.closest('[data-tab]'); if (b) { history.replaceState(null, '', '#' + b.getAttribute('data-tab')); tab(b.getAttribute('data-tab')); } });
  window.addEventListener('hashchange', function () { tab(location.hash.slice(1)); });

  /* ---- Identitas toko ---- */
  function viewToko() {
    const s = S.store;
    $('#set-toko').innerHTML = '<div class="card panel"><h3>Identitas Toko</h3><form id="f-toko" novalidate><div class="form-grid">' + field('Nama toko *', 's-name', s.name) + field('Tagline', 's-tag', s.tagline) + field('Nomor WhatsApp toko * (format 62…, tanpa +)', 's-wa', s.whatsapp, 'inputmode="numeric"') + field('Telepon', 's-phone', s.phone) + field('Email', 's-email', s.email) + field('Jam operasional', 's-hours', s.hours) +
      '<label class="field full"><span>Alamat toko</span><textarea class="input" id="s-addr">' + TB.esc(s.address) + '</textarea></label><label class="field full"><span>Catatan kaki struk</span><textarea class="input" id="s-rcpt">' + TB.esc(s.receiptFooter) + '</textarea></label></div>' +
      '<label class="check" style="margin-bottom:12px"><input type="checkbox" id="s-demo"' + (s.demoNotice ? ' checked' : '') + '> Tampilkan banner "data demo" di halaman publik (matikan setelah data asli dimasukkan)</label><p class="form-error" id="e-toko" role="alert"></p><button class="btn btn-primary" type="submit">Simpan Identitas</button></form></div>';
    $('#f-toko').addEventListener('submit', function (e) {
      e.preventDefault(); const err = $('#e-toko'); err.textContent = ''; const wa = $('#s-wa').value.replace(/\D/g, '');
      if ($('#s-name').value.trim().length < 2) { err.textContent = 'Nama toko wajib diisi.'; return; } if (!/^62\d{8,13}$/.test(wa)) { err.textContent = 'Nomor WhatsApp harus berformat internasional, contoh 6281234567890.'; return; }
      Object.assign(S.store, { name: $('#s-name').value.trim(), tagline: $('#s-tag').value.trim(), whatsapp: wa, phone: $('#s-phone').value.trim(), email: $('#s-email').value.trim(), hours: $('#s-hours').value.trim(), address: $('#s-addr').value.trim(), receiptFooter: $('#s-rcpt').value.trim(), demoNotice: $('#s-demo').checked }); save('identitas toko');
    });
  }

  /* ---- Pembayaran ---- */
  function viewBayar() {
    const p = S.payments, q = p.qris;
    $('#set-pembayaran').innerHTML = '<div class="grid-2e"><div class="card panel"><h3>QRIS</h3><form id="f-qris" novalidate><label class="check" style="margin-bottom:12px"><input type="checkbox" id="q-on"' + (q.enabled ? ' checked' : '') + '> Aktifkan pembayaran QRIS</label>' + field('Nama merchant (sesuai QRIS)', 'q-merch', q.merchant) + field('NMID', 'q-nmid', q.nmid) +
      '<label class="field"><span>Gambar QRIS resmi</span><input class="input" type="file" id="q-file" accept="image/png,image/jpeg,image/webp"><span class="hint">Unggah QRIS resmi milik toko (maks. 600 KB), atau biarkan memakai berkas qris.png di repository. Jangan memakai QR yang bukan milik toko.</span></label><img class="qris-preview" id="q-img" src="' + TB.esc(q.image) + '" alt="Pratinjau QRIS"><label class="field" style="margin-top:12px"><span>Catatan untuk pelanggan</span><textarea class="input" id="q-note">' + TB.esc(q.note || '') + '</textarea></label><p class="form-error" id="e-qris" role="alert"></p><button class="btn btn-primary" type="submit">Simpan QRIS</button></form></div>' +
      '<div class="card panel"><h3>COD & Ambil Sendiri</h3><form id="f-cod" novalidate><label class="check" style="margin-bottom:10px"><input type="checkbox" id="c-on"' + (p.cod.enabled ? ' checked' : '') + '> Aktifkan Bayar di Tempat (COD)</label><div class="field"><span>COD hanya untuk zona:</span>' + S.shipping.zones.map(function (z) { return '<label class="check"><input type="checkbox" name="codz" value="' + z.id + '"' + (p.cod.zones.indexOf(z.id) >= 0 ? ' checked' : '') + '> ' + TB.esc(z.name) + '</label>'; }).join('') + '<span class="hint">Alamat di luar zona tarif tidak mendapat COD.</span></div><label class="field"><span>Catatan COD</span><textarea class="input" id="c-note">' + TB.esc(p.cod.note) + '</textarea></label><label class="check" style="margin-bottom:12px"><input type="checkbox" id="pk-on"' + (p.pickup.enabled ? ' checked' : '') + '> Aktifkan "Ambil sendiri & bayar di toko"</label>' +
      field('Metode di kasir (pisahkan koma)', 'pos-m', p.posMethods.join(', ')) + '<p class="form-error" id="e-cod" role="alert"></p><button class="btn btn-primary" type="submit">Simpan</button></form></div></div><div class="alert warn">' + TB.icon('alert', 18) + '<span>Pembayaran QRIS pada prototipe <b>tidak diverifikasi otomatis</b>. Pesanan tetap "Menunggu Pembayaran" sampai staf mengonfirmasi manual. Verifikasi otomatis butuh penyedia pembayaran (payment gateway).</span></div>';
    let newImg = null;
    $('#q-file').addEventListener('change', function () {
      const f = this.files[0]; if (!f) return; const err = $('#e-qris'); err.textContent = '';
      if (f.size > 600 * 1024) { err.textContent = 'Ukuran gambar maksimal 600 KB.'; this.value = ''; return; }
      const rd = new FileReader(); rd.onload = function () { newImg = rd.result; $('#q-img').src = newImg; }; rd.readAsDataURL(f);
    });
    $('#f-qris').addEventListener('submit', function (e) { e.preventDefault(); if ($('#q-merch').value.trim().length < 3) { $('#e-qris').textContent = 'Nama merchant wajib diisi.'; return; } Object.assign(S.payments.qris, { enabled: $('#q-on').checked, merchant: $('#q-merch').value.trim(), nmid: $('#q-nmid').value.trim(), note: $('#q-note').value.trim() }); if (newImg) S.payments.qris.image = newImg; save('QRIS'); });
    $('#f-cod').addEventListener('submit', function (e) {
      e.preventDefault(); const ms = $('#pos-m').value.split(',').map(function (x) { return x.trim(); }).filter(Boolean); if (!ms.length) { $('#e-cod').textContent = 'Minimal satu metode kasir.'; return; }
      S.payments.cod = { enabled: $('#c-on').checked, zones: TB.$$('input[name=codz]:checked').map(function (c) { return c.value; }), note: $('#c-note').value.trim() }; S.payments.pickup.enabled = $('#pk-on').checked; S.payments.posMethods = ms; save('pembayaran');
    });
  }

  /* ---- Pengiriman ---- */
  function viewKirim() {
    const sh = S.shipping;
    $('#set-pengiriman').innerHTML = '<form id="f-kirim" novalidate><div class="card panel"><h3>Zona & Rentang Jarak</h3>' + sh.zones.map(function (z, i) { return '<div class="zone-edit" data-i="' + i + '">' + field('Nama zona', 'z-n' + i, z.name) + field('Dari km', 'z-a' + i, z.minKm, 'type="number" min="0" step="any"') + field('Sampai km', 'z-b' + i, z.maxKm, 'type="number" min="0" step="any"') + field('Biaya zona (Rp)', 'z-f' + i, z.fee, 'type="number" min="0" step="1000"') + '<button type="button" class="btn btn-outline btn-sm" data-delz="' + i + '" aria-label="Hapus zona">' + TB.icon('trash', 16) + '</button></div>'; }).join('') + '<button type="button" class="btn btn-outline btn-sm" id="add-z">+ Tambah zona</button></div>' +
      '<div class="card panel"><h3>Kendaraan & Kapasitas</h3>' + sh.vehicles.map(function (v, i) { return '<div class="veh-edit" data-i="' + i + '">' + field('Kendaraan', 'v-n' + i, v.name) + '<label class="field"><span>Kelas</span><select class="input" id="v-c' + i + '"><option value="ringan"' + (v.cls === 'ringan' ? ' selected' : '') + '>Ringan</option><option value="berat"' + (v.cls === 'berat' ? ' selected' : '') + '>Berat</option></select></label>' + field('Kapasitas (kg)', 'v-k' + i, v.capacityKg, 'type="number" min="1"') + field('Biaya dasar (Rp)', 'v-b' + i, v.baseFee, 'type="number" min="0" step="1000"') + field('Per km (Rp)', 'v-p' + i, v.perKmFee, 'type="number" min="0" step="500"') + '<button type="button" class="btn btn-outline btn-sm" data-delv="' + i + '" aria-label="Hapus kendaraan">' + TB.icon('trash', 16) + '</button></div>'; }).join('') + '<button type="button" class="btn btn-outline btn-sm" id="add-v">+ Tambah kendaraan</button></div>' +
      '<div class="card panel"><h3>Barang Berat & Estimasi Jarak</h3><div class="form-grid">' + field('Ambang barang berat (kg)', 'h-th', sh.heavyThresholdKg, 'type="number" min="0"') + field('Biaya tambahan per 100 kg di atas ambang (Rp)', 'h-sc', sh.heavySurchargePer100Kg, 'type="number" min="0" step="1000"') + '</div><div class="form-grid">' + sh.zones.map(function (z, i) { return field('Jarak rata-rata ' + TB.esc(z.name) + ' (km)', 'z-avg' + i, (sh.zoneAvgKm || {})[z.id] != null ? sh.zoneAvgKm[z.id] : (z.minKm + z.maxKm) / 2, 'type="number" min="0" step="any"'); }).join('') + '</div>' + field('Catatan di halaman checkout', 'h-note', sh.note) + '<p class="small muted">Rumus per rit: biaya dasar kendaraan + (jarak rata-rata zona × biaya per km) + biaya zona. Jika berat melebihi kapasitas, jumlah rit dihitung otomatis. Ini estimasi berbasis zona, bukan jarak peta otomatis.</p><p class="form-error" id="e-kirim" role="alert"></p><button class="btn btn-primary" type="submit">Simpan Tarif</button></div></form>';
  }
  function collectKirim() {
    const sh = TB.clone(S.shipping); const err = $('#e-kirim'); err.textContent = '';
    sh.zones = sh.zones.map(function (z, i) { return { id: z.id, name: $('#z-n' + i).value.trim(), minKm: num($('#z-a' + i).value), maxKm: num($('#z-b' + i).value), fee: num($('#z-f' + i).value) }; });
    sh.vehicles = sh.vehicles.map(function (v, i) { return { id: v.id, name: $('#v-n' + i).value.trim(), cls: $('#v-c' + i).value, capacityKg: num($('#v-k' + i).value), baseFee: num($('#v-b' + i).value), perKmFee: num($('#v-p' + i).value) }; });
    sh.zoneAvgKm = {}; sh.zones.forEach(function (z, i) { sh.zoneAvgKm[z.id] = num($('#z-avg' + i).value); });
    sh.heavyThresholdKg = num($('#h-th').value); sh.heavySurchargePer100Kg = num($('#h-sc').value); sh.note = $('#h-note').value.trim();
    return sh;
  }
  function validKirim(sh) {
    if (sh.zones.some(function (z) { return !z.name || z.maxKm <= z.minKm; })) return 'Setiap zona harus punya nama dan jarak akhir lebih besar dari jarak awal.';
    if (sh.vehicles.some(function (v) { return !v.name || v.capacityKg <= 0; })) return 'Setiap kendaraan harus punya nama dan kapasitas lebih dari 0.';
    if (!sh.vehicles.some(function (v) { return v.cls === 'ringan'; }) || !sh.vehicles.some(function (v) { return v.cls === 'berat'; })) return 'Harus ada minimal satu kendaraan kelas ringan dan satu kelas berat.'; return '';
  }
  $('#set-pengiriman').addEventListener('click', function (e) {
    const d = e.target.closest('[data-delz],[data-delv],#add-z,#add-v'); if (!d) return;
    const sh = collectKirim(); S.shipping = sh;
    if (d.id === 'add-z') sh.zones.push({ id: 'z' + Date.now().toString(36), name: 'Zona baru', minKm: 35, maxKm: 50, fee: 200000 });
    else if (d.id === 'add-v') sh.vehicles.push({ id: 'v' + Date.now().toString(36), name: 'Kendaraan baru', cls: 'ringan', capacityKg: 1000, baseFee: 50000, perKmFee: 4000 });
    else if (d.hasAttribute('data-delz')) { if (sh.zones.length <= 1) { $('#e-kirim').textContent = 'Minimal satu zona.'; return; } const z = sh.zones.splice(+d.getAttribute('data-delz'), 1)[0]; S.payments.cod.zones = S.payments.cod.zones.filter(function (x) { return x !== z.id; }); }
    else { if (sh.vehicles.length <= 1) { $('#e-kirim').textContent = 'Minimal satu kendaraan.'; return; } sh.vehicles.splice(+d.getAttribute('data-delv'), 1); }
    viewKirim(); TB.hydrate(document);
  });
  $('#set-pengiriman').addEventListener('submit', function (e) { e.preventDefault(); const sh = collectKirim(); const m = validKirim(sh); if (m) { $('#e-kirim').textContent = m; return; } S.shipping = sh; save('tarif pengiriman'); viewKirim(); viewBayar(); });

  /* ---- Diskon ---- */
  function viewDiskon() {
    $('#set-diskon').innerHTML = '<div class="card panel"><h3>Aturan Diskon Otomatis</h3><p class="muted small">Diskon diterapkan pada subtotal barang. Jika beberapa aturan terpenuhi, diskon terbesar dipakai.</p><form id="f-disc" novalidate>' + S.discountRules.map(function (r, i) { return '<div class="zone-edit" style="grid-template-columns:2fr 1fr 1fr auto">' + field('Keterangan', 'd-l' + i, r.label) + field('Min. subtotal (Rp)', 'd-m' + i, r.minSubtotal, 'type="number" min="0" step="1000"') + field('Diskon (%)', 'd-p' + i, r.percent, 'type="number" min="0" max="50" step="0.5"') + '<button type="button" class="btn btn-outline btn-sm" data-deld="' + i + '" aria-label="Hapus aturan">' + TB.icon('trash', 16) + '</button></div>'; }).join('') + '<button type="button" class="btn btn-outline btn-sm" id="add-d">+ Tambah aturan</button><p class="form-error" id="e-disc" role="alert"></p><button class="btn btn-primary" type="submit">Simpan Diskon</button></form></div>';
    const collect = function () { return S.discountRules.map(function (r, i) { return { id: r.id, label: $('#d-l' + i).value.trim(), minSubtotal: num($('#d-m' + i).value), percent: num($('#d-p' + i).value) }; }); };
    $('#f-disc').addEventListener('click', function (e) { const b = e.target.closest('#add-d,[data-deld]'); if (!b) return; S.discountRules = collect(); if (b.id === 'add-d') S.discountRules.push({ id: 'd' + Date.now().toString(36), label: 'Diskon baru', minSubtotal: 1000000, percent: 1 }); else S.discountRules.splice(+b.getAttribute('data-deld'), 1); viewDiskon(); TB.hydrate(document); });
    $('#f-disc').addEventListener('submit', function (e) { e.preventDefault(); const rs = collect(); if (rs.some(function (r) { return !r.label || r.percent <= 0 || r.percent > 50 || r.minSubtotal <= 0; })) { $('#e-disc').textContent = 'Isi keterangan, minimal subtotal > 0, dan diskon antara 0–50%.'; return; } S.discountRules = rs; save('aturan diskon'); });
  }

  /* ---- Pengguna ---- */
  function viewUser() {
    const us = TB.store.getUsers();
    $('#set-pengguna').innerHTML = '<div class="card panel"><h3><span>Pengguna & Role</span><button class="btn btn-primary btn-sm" id="u-add">+ Tambah Pengguna</button></h3><div class="tbl-wrap"><table class="tbl cards-sm"><thead><tr><th>Nama</th><th>Email</th><th>Role</th><th>Status</th><th class="actions">Aksi</th></tr></thead><tbody>' + us.map(function (u) { return '<tr><td data-label="Nama"><b>' + TB.esc(u.name) + '</b>' + (u.mustChange ? ' <span class="pill warn">password demo</span>' : '') + '</td><td data-label="Email">' + TB.esc(u.email) + '</td><td data-label="Role">' + TB.ROLES[u.role].label + '</td><td data-label="Status"><span class="pill ' + (u.active ? 'ok' : '') + '">' + (u.active ? 'Aktif' : 'Nonaktif') + '</span></td><td class="actions"><button class="btn btn-outline btn-sm" data-ue="' + u.id + '">Ubah</button> <button class="btn btn-outline btn-sm" data-ur="' + u.id + '">Reset Password</button></td></tr>'; }).join('') + '</tbody></table></div><div class="alert warn" style="margin-top:14px">' + TB.icon('alert', 18) + '<span>Role dan sesi disimpan di browser dan <b>dapat dimanipulasi</b>. Untuk produksi, gunakan Firebase Authentication dengan role yang diverifikasi di server/Security Rules.</span></div></div>';
  }
  function userForm(u) {
    const isNew = !u; u = u || { role: 'kasir', active: true };
    TB.modal({ title: isNew ? 'Tambah Pengguna' : 'Ubah Pengguna', body: '<form id="uf" novalidate>' + field('Nama *', 'uf-n', u.name) + field('Email *', 'uf-e', u.email, 'type="email"') + '<label class="field"><span>Role</span><select class="input" id="uf-r">' + Object.keys(TB.ROLES).map(function (r) { return '<option value="' + r + '"' + (u.role === r ? ' selected' : '') + '>' + TB.ROLES[r].label + '</option>'; }).join('') + '</select></label>' + (isNew ? field('Password awal * (min. 8, huruf & angka)', 'uf-p', '', 'type="password" autocomplete="new-password"') : '<label class="check"><input type="checkbox" id="uf-a"' + (u.active ? ' checked' : '') + '> Akun aktif</label>') + '<p class="form-error" id="uf-err" role="alert"></p></form>',
      actions: [{ label: 'Batal', cls: 'btn-ghost' }, { label: 'Simpan', cls: 'btn-primary', close: false, onClick: function (close, wrap) {
        const r = TB.auth.saveUser({ id: u.id, name: TB.$('#uf-n', wrap).value, email: TB.$('#uf-e', wrap).value, role: TB.$('#uf-r', wrap).value, password: isNew ? TB.$('#uf-p', wrap).value : undefined, active: isNew ? true : TB.$('#uf-a', wrap).checked });
        if (!r.ok) { TB.$('#uf-err', wrap).innerHTML = r.errors.map(TB.esc).join('<br>'); return false; } TB.toast('Pengguna disimpan.', 'ok'); close(true); viewUser(); } }] });
  }
  $('#set-pengguna').addEventListener('click', function (e) {
    if (e.target.closest('#u-add')) return userForm(null); const ed = e.target.closest('[data-ue]'), rs = e.target.closest('[data-ur]');
    if (ed) userForm(TB.store.getUsers().find(function (x) { return x.id === ed.getAttribute('data-ue'); }));
    if (rs) { const u = TB.store.getUsers().find(function (x) { return x.id === rs.getAttribute('data-ur'); }); TB.prompt('Password baru untuk ' + u.email + ' (min. 8 karakter, huruf & angka)', { title: 'Reset Password', required: true }).then(function (pw) { if (!pw) return; const r = TB.auth.changePassword(u.id, null, pw, true); TB.toast(r.ok ? 'Password direset. Pengguna disarankan menggantinya saat login.' : r.error, r.ok ? 'ok' : 'error'); viewUser(); }); }
  });

  /* ---- Backup & data ---- */
  function viewData() {
    let used = 0; try { Object.keys(localStorage).forEach(function (k) { if (k.indexOf('tb_') === 0) used += (localStorage.getItem(k) || '').length * 2; }); } catch (e) { /* abaikan */ }
    $('#set-data').innerHTML = '<div class="grid-2e"><div class="card panel"><h3>Backup & Pemulihan</h3><p class="small muted">Penyimpanan terpakai ±' + TB.num(used / 1024) + ' KB dari kuota browser (±5 MB). LocalStorage terpisah per browser & perangkat dan tidak tersinkron antar pengguna.</p><button class="btn btn-primary" id="bk-export">' + TB.icon('download', 18) + ' Unduh Backup (JSON)</button><hr style="border:0;border-top:1px solid var(--line);margin:16px 0"><label class="field"><span>Pulihkan dari berkas backup</span><input class="input" type="file" id="bk-file" accept="application/json,.json"></label><p class="form-error" id="bk-err" role="alert"></p><p class="small muted">Memulihkan akan <b>menimpa</b> semua produk, transaksi, pengguna, dan pengaturan. Anda akan diminta konfirmasi.</p></div>' +
      '<div class="card panel"><h3>Reset ke Data Demo</h3><p class="small">Menghapus seluruh data toko di browser ini (produk, transaksi, stok, pengguna, pengaturan) dan memuat ulang data demo. Tidak dapat dibatalkan — unduh backup dulu.</p><button class="btn btn-danger" id="bk-reset">Reset Data Demo…</button></div></div>';
    $('#bk-export').addEventListener('click', function () { TB.downloadFile('backup-toko-bangunan-' + TB.dateKey(new Date()) + '.json', JSON.stringify(TB.store.exportBackup(), null, 2), 'application/json'); TB.store.addAudit({ action: 'backup.unduh', userId: user.id, userName: user.name, detail: 'Backup diunduh' }); TB.toast('Backup diunduh.', 'ok'); });
    $('#bk-file').addEventListener('change', function () {
      const f = this.files[0], input = this; if (!f) return; const err = $('#bk-err'); err.textContent = '';
      const rd = new FileReader(); rd.onerror = function () { err.textContent = 'Gagal membaca berkas.'; };
      rd.onload = function () {
        let obj; try { obj = JSON.parse(rd.result); } catch (e) { err.textContent = 'Berkas bukan JSON yang valid.'; input.value = ''; return; }
        const m = TB.store.validateBackup(obj); if (m) { err.textContent = m; input.value = ''; return; }
        TB.confirm('Pulihkan backup tanggal ' + TB.fmtDateTime(obj.exportedAt) + '?\n' + obj.data.products.length + ' produk, ' + obj.data.transactions.length + ' transaksi.\nSemua data saat ini akan DITIMPA.', { danger: true, okLabel: 'Ya, timpa data' }).then(function (ok) { if (!ok) { input.value = ''; return; } try { TB.store.importBackup(rd.result); TB.toast('Data dipulihkan. Memuat ulang…', 'ok'); setTimeout(function () { TB.auth.logout(); location.href = 'login.html'; }, 1200); } catch (e2) { err.textContent = e2.message; } });
      }; rd.readAsText(f);
    });
    $('#bk-reset').addEventListener('click', function () {
      TB.confirm('Semua data akan dihapus dan diganti data demo. Lanjutkan?', { danger: true, okLabel: 'Lanjut' }).then(function (ok) { if (!ok) return;
        TB.prompt('Konfirmasi kedua: ketik RESET untuk melanjutkan.', { title: 'Konfirmasi Reset', mustEqual: 'RESET', danger: true, okLabel: 'Reset Sekarang' }).then(function (v) { if (v !== 'RESET') return; TB.store.resetDemo(); TB.toast('Data demo dimuat ulang.', 'ok'); setTimeout(function () { location.href = 'login.html'; }, 900); }); });
    });
  }

  viewToko(); viewBayar(); viewKirim(); viewDiskon(); viewUser(); viewData(); tab(location.hash.slice(1)); TB.hydrate(document);
});
