/* notifikasi.js — Pusat notifikasi (pesanan, pembayaran, stok, kas) */
TB.ready(function () {
  'use strict';
  const $ = TB.$, user = TB.auth.current(), role = user.role; let f = '', page = 1;
  if (role !== 'owner') { const k = $('#n-tabs [data-f="kas"]'); if (k) k.remove(); }
  function list() {
    return TB.notifs.mine(role).filter(function (n) { return !f || (f === 'unread' ? !n.read : f === 'stock' ? (n.type === 'stock' || n.type === 'stockin') : n.type === f); }).reverse();
  }
  function render() {
    const l = list(), pages = Math.max(1, Math.ceil(l.length / 20)); page = Math.min(page, pages); const un = TB.store.unreadCount();
    $('#n-title').textContent = 'Notifikasi' + (un ? ' · ' + un + ' belum dibaca' : '');
    $('#n-list').innerHTML = l.slice((page - 1) * 20, page * 20).map(function (n) { return TB.notifItem(n, role); }).join('') || '<div class="empty">Tidak ada notifikasi.</div>';
    TB.tablePager($('#n-pager'), page, pages, function (p) { page = p; render(); }); TB.notifs.badge();
  }
  $('#n-tabs').addEventListener('click', function (e) { const b = e.target.closest('[data-f]'); if (!b) return; f = b.getAttribute('data-f'); page = 1; TB.$$('#n-tabs button').forEach(function (x) { x.classList.toggle('active', x === b); }); render(); });
  $('#n-list').addEventListener('click', function (e) { const it = e.target.closest('[data-nid]'); if (it) { TB.notifs.markRead([it.getAttribute('data-nid')]); it.classList.remove('unread'); } });
  $('#n-readall').addEventListener('click', function () { TB.notifs.markRead('all'); render(); });
  $('#n-clear').addEventListener('click', function () { TB.confirm('Hapus semua notifikasi yang sudah dibaca?', { okLabel: 'Hapus' }).then(function (ok) { if (!ok) return; TB.store.saveNotifs(TB.store.getNotifs().filter(function (n) { return !n.read; })); render(); }); });
  render(); TB.hydrate(document);
});
