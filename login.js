/* login.js — Halaman login staf */
TB.ready(function () {
  'use strict';
  const $ = TB.$; const cur = TB.auth.current();
  const next = TB.param('next');
  function go(user) {
    const allowed = TB.ROLES[user.role].pages; const target = next && allowed.indexOf(next.split('#')[0]) >= 0 ? next : TB.ROLES[user.role].home; location.replace(target);
  }
  if (cur) { go(cur); return; }
  const pw = $('#l-pass'), tg = $('#pw-toggle'); tg.innerHTML = TB.icon('eye');
  tg.addEventListener('click', function () { const show = pw.type === 'password'; pw.type = show ? 'text' : 'password'; tg.innerHTML = TB.icon(show ? 'eyeoff' : 'eye'); tg.setAttribute('aria-label', show ? 'Sembunyikan password' : 'Tampilkan password'); });
  $('#login-form').addEventListener('submit', function (e) {
    e.preventDefault(); const err = $('#l-error'); err.textContent = '';
    const r = TB.auth.login($('#l-email').value, pw.value);
    if (!r.ok) { err.textContent = r.error; pw.value = ''; pw.focus(); return; }
    $('#l-submit').disabled = true; go(r.user);
  });
  /* Akun demo: tampil selama akun masih memakai password demo (mustChange). Password tidak diisi otomatis. */
  const demo = TB.store.getUsers().filter(function (u) { return u.mustChange && u.active; });
  if (demo.length) {
    const box = $('#demo-accounts'); box.hidden = false;
    const pwd = { owner: 'Owner#2026', kasir: 'Kasir#2026', admin: 'Stok#2026' };
    box.innerHTML = '<b>Akun demo</b> <span class="muted">(tampil selama password belum diganti)</span>' + demo.map(function (u) { return '<div class="acc"><div><b>' + TB.ROLES[u.role].label + '</b><span>' + TB.esc(u.email) + '</span><span><span class="kbd">' + TB.esc(pwd[u.role] || '') + '</span></span></div><button class="btn btn-outline btn-sm" type="button" data-fill="' + TB.esc(u.email) + '" data-pw="' + TB.esc(pwd[u.role] || '') + '">Isi</button></div>'; }).join('');
    box.addEventListener('click', function (e) { const b = e.target.closest('[data-fill]'); if (!b) return; $('#l-email').value = b.getAttribute('data-fill'); pw.value = b.getAttribute('data-pw'); $('#l-submit').focus(); });
  }
  TB.hydrate(document);
});
