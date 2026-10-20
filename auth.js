/* =====================================================================
   auth.js — Autentikasi & hak akses PROTOTIPE (LocalStorage)
   PERINGATAN: ini hanya untuk demonstrasi. Role & sesi yang disimpan di
   browser dapat dimanipulasi pengguna. Sebelum dipakai sungguhan, ganti
   dengan Firebase Authentication / autentikasi server + Security Rules.
   Password tidak disimpan sebagai teks biasa (hash SHA-256 + salt).
   ===================================================================== */
(function () {
  'use strict';
  const FAIL_KEY = 'tb_login_fail';
  const auth = TB.auth = {};

  function sessionRaw() { return TB.store.read(TB.KEYS.session, null); }
  function publicUser(u) { return { id: u.id, name: u.name, email: u.email, role: u.role, active: u.active, mustChange: !!u.mustChange }; }

  auth.current = function () {
    const s = sessionRaw(); if (!s || !s.userId || !s.expiresAt) return null;
    if (Date.now() > s.expiresAt) { auth.logout(); return null; }
    const u = TB.store.getUsers().find(function (x) { return x.id === s.userId; });
    if (!u || !u.active || !TB.ROLES[u.role]) { auth.logout(); return null; }
    return publicUser(u);
  };
  auth.lockInfo = function () {
    const f = TB.store.read(FAIL_KEY, null); if (!f || !f.until) return 0; const left = f.until - Date.now(); return left > 0 ? Math.ceil(left / 1000) : 0;
  };
  auth.login = function (email, password) {
    email = String(email || '').trim().toLowerCase();
    if (!email || !password) return { ok: false, error: 'Email dan password wajib diisi.' };
    if (!/^\S+@\S+\.\S+$/.test(email)) return { ok: false, error: 'Format email tidak valid.' };
    const left = auth.lockInfo(); if (left) return { ok: false, error: 'Terlalu banyak percobaan gagal. Coba lagi dalam ' + left + ' detik.' };
    const u = TB.store.getUsers().find(function (x) { return String(x.email).toLowerCase() === email; });
    if (!u || TB.hashPassword(u.salt, password) !== u.passwordHash) {
      const f = TB.store.read(FAIL_KEY, { count: 0 }) || { count: 0 }; f.count = (f.count || 0) + 1; if (f.count >= 5) { f.until = Date.now() + 30000; f.count = 0; }
      try { TB.store.write(FAIL_KEY, f); } catch (e) { /* abaikan */ }
      return { ok: false, error: 'Email atau password salah.' };
    }
    if (!u.active) return { ok: false, error: 'Akun ini dinonaktifkan. Hubungi owner.' };
    try { localStorage.removeItem(FAIL_KEY); } catch (e) { /* abaikan */ }
    TB.store.write(TB.KEYS.session, { userId: u.id, role: u.role, issuedAt: Date.now(), expiresAt: Date.now() + TB.CONFIG.SESSION_HOURS * 3600000 });
    TB.store.addAudit({ action: 'login', userId: u.id, userName: u.name, detail: 'Login berhasil (' + u.role + ')' });
    return { ok: true, user: publicUser(u) };
  };
  auth.logout = function () { try { localStorage.removeItem(TB.KEYS.session); } catch (e) { /* abaikan */ } };
  auth.requireRole = function (roles) {
    const u = auth.current(); const page = location.pathname.split('/').pop() || 'index.html';
    if (!u) { location.replace('login.html?next=' + encodeURIComponent(page + location.hash)); return false; }
    if (roles.indexOf(u.role) < 0) { location.replace(TB.ROLES[u.role].home + '?denied=1'); return false; }
    return true;
  };
  auth.can = function (action) {
    const u = auth.current(); if (!u) return false; const r = u.role;
    const map = { 'viewCost': ['owner', 'admin'], 'cancelTx': ['owner'], 'confirmPayment': ['owner', 'kasir'], 'editProduct': ['owner', 'admin'], 'settings': ['owner'], 'users': ['owner'], 'viewAllTx': ['owner'], 'viewProfit': ['owner'], 'viewAudit': ['owner'] };
    return (map[action] || []).indexOf(r) >= 0;
  };
  function strongEnough(pw) { return pw && pw.length >= 8 && /[A-Za-z]/.test(pw) && /[0-9]/.test(pw); }
  auth.changePassword = function (userId, oldPw, newPw, byOwner) {
    const users = TB.store.getUsers(); const u = users.find(function (x) { return x.id === userId; }); if (!u) return { ok: false, error: 'Pengguna tidak ditemukan.' };
    if (!byOwner && TB.hashPassword(u.salt, oldPw) !== u.passwordHash) return { ok: false, error: 'Password lama salah.' };
    if (!strongEnough(newPw)) return { ok: false, error: 'Password baru minimal 8 karakter dan mengandung huruf serta angka.' };
    u.salt = 'tb-' + Math.random().toString(36).slice(2, 10); u.passwordHash = TB.hashPassword(u.salt, newPw); u.mustChange = !!byOwner;
    TB.store.saveUsers(users); const cur = auth.current(); TB.store.addAudit({ action: 'password.ubah', userId: cur ? cur.id : u.id, userName: cur ? cur.name : u.name, detail: 'Password ' + u.email + (byOwner ? ' direset oleh owner' : ' diganti') });
    return { ok: true };
  };
  auth.saveUser = function (input) {
    const users = TB.store.getUsers(); const errs = []; const email = String(input.email || '').trim().toLowerCase();
    if (!input.name || String(input.name).trim().length < 2) errs.push('Nama wajib diisi.');
    if (!/^\S+@\S+\.\S+$/.test(email)) errs.push('Email tidak valid.');
    if (!TB.ROLES[input.role]) errs.push('Role tidak valid.');
    if (users.some(function (u) { return u.id !== input.id && String(u.email).toLowerCase() === email; })) errs.push('Email sudah dipakai.');
    if (!input.id && !strongEnough(input.password)) errs.push('Password minimal 8 karakter dengan huruf dan angka.');
    if (errs.length) return { ok: false, errors: errs };
    const cur = auth.current();
    if (input.id) {
      const u = users.find(function (x) { return x.id === input.id; }); if (!u) return { ok: false, errors: ['Pengguna tidak ditemukan.'] };
      const owners = users.filter(function (x) { return x.role === 'owner' && x.active && x.id !== u.id; });
      if (u.role === 'owner' && (input.role !== 'owner' || input.active === false) && !owners.length) return { ok: false, errors: ['Harus ada minimal satu owner aktif.'] };
      u.name = String(input.name).trim(); u.email = email; u.role = input.role; u.active = input.active !== false;
    } else {
      const salt = 'tb-' + Math.random().toString(36).slice(2, 10);
      users.push({ id: TB.uid('u'), name: String(input.name).trim(), email: email, role: input.role, active: true, salt: salt, passwordHash: TB.hashPassword(salt, input.password), mustChange: false });
    }
    TB.store.saveUsers(users); TB.store.addAudit({ action: input.id ? 'user.ubah' : 'user.tambah', userId: cur && cur.id, userName: cur && cur.name, detail: email + ' (' + input.role + ')' }); return { ok: true };
  };
  auth.openChangePassword = function () {
    const u = auth.current(); if (!u) return;
    const m = TB.modal({ title: 'Ganti Password', body: '<label class="field"><span>Password lama</span><input class="input" type="password" id="pw-old" autocomplete="current-password"></label><label class="field"><span>Password baru (min. 8 karakter, huruf & angka)</span><input class="input" type="password" id="pw-new" autocomplete="new-password"></label><label class="field"><span>Ulangi password baru</span><input class="input" type="password" id="pw-new2" autocomplete="new-password"></label><p class="form-error" id="pw-err" role="alert"></p>',
      actions: [{ label: 'Batal', cls: 'btn-ghost' }, { label: 'Simpan', cls: 'btn-primary', close: false, onClick: function (close, wrap) {
        const o = TB.$('#pw-old', wrap).value, n = TB.$('#pw-new', wrap).value, n2 = TB.$('#pw-new2', wrap).value, err = TB.$('#pw-err', wrap);
        if (n !== n2) { err.textContent = 'Konfirmasi password tidak sama.'; return false; }
        const r = auth.changePassword(u.id, o, n, false); if (!r.ok) { err.textContent = r.error; return false; }
        TB.toast('Password berhasil diganti.', 'ok'); close(true); } }] });
    return m;
  };
})();
