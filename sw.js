/* sw.js — Service worker sederhana (opsional): cache aset statis agar cepat & bisa dibuka offline.
   Data toko tetap di LocalStorage. Naikkan VERSION saat memperbarui file agar cache diganti. */
const VERSION = 'tb-v1.1.0';
const ASSETS = ['./', 'index.html', 'katalog.html', 'keranjang.html', 'login.html', 'kasir.html', 'admin-stok.html', 'owner.html', 'laporan.html', 'pengaturan.html',
  'style.css', 'responsive.css', 'app.js', 'data.js', 'auth.js', 'home.js', 'katalog.js', 'keranjang.js', 'login.js', 'kasir.js', 'admin-stok.js', 'owner.js', 'laporan.js', 'pengaturan.js',
  'qris.png', 'icon.svg', 'icon-192.png', 'icon-512.png', 'manifest.json'];
self.addEventListener('install', e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(fetch(e.request).then(r => { const copy = r.clone(); caches.open(VERSION).then(c => c.put(e.request, copy)); return r; }).catch(() => caches.match(e.request)));
});
