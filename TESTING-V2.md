# Hasil Pengujian V2 (Playwright headless, Chromium)

Seluruh ~37 pemeriksaan otomatis LULUS:
- Beranda: render, pencarian, kategori, produk pilihan
- Katalog: filter (multi-kategori), urutan, kondisi kosong, drawer filter di HP
- Keranjang: tambah/ubah qty/hapus, ongkir, validasi form, checkout -> tautan WhatsApp, stok berkurang, transaksi tersimpan
- Login: error salah password, panel Akun Demo tertutup secara default
- Owner: KPI, grafik, laporan, pengaturan. Kasir: transaksi tunai, riwayat, penolakan akses role. Admin Stok: stok masuk, filter
- Logout, PWA (service worker, manifest, offline), tanpa error JavaScript
- Overflow horizontal: 8 lebar layar (360-1920) x 10 halaman = 0 masalah

Catatan: diuji dengan font Google diblokir (offline) sehingga memakai font cadangan. Uji manual di perangkat nyata tetap disarankan.
