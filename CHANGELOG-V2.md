# TOKO BANGUNAN V2 Premium 2026 — Dokumentasi Perubahan

## Prinsip
Redesign UI/UX + peningkatan terkontrol. **Tidak ada perubahan skema data**: semua key LocalStorage (`tb_products`, `tb_transactions`, `tb_users`, `tb_stock_movements`, `tb_settings`, `tb_cart`, `tb_categories`, `tb_units`, `tb_audit`, `tb_counters`, `tb_seeded`, `tb_session`, `tb_theme`), harga, stok, dan data demo tetap sama. Tidak perlu migrasi; data V1 di browser langsung terbaca. Logika bisnis (`TB.store`, `TB.svc`, `TB.auth`, kalkulasi ongkir/diskon) tidak diubah. Backup source V1: `TOKO-BANGUNAN-ORIGINAL-BACKUP.zip`.

## Fitur existing yang dipertahankan (semua diuji)
Katalog + filter/sort/pagination · keranjang & checkout WhatsApp · estimasi ongkir per zona/kendaraan/berat · diskon bertingkat · QRIS/COD/ambil di toko · login 3 role (Owner, Kasir, Admin Stok) dengan hash SHA-256+salt, lockout, ganti password · POS kasir (tunai/QRIS/transfer, struk cetak, riwayat, konfirmasi bayar) · inventaris, stok masuk/keluar/koreksi, riwayat stok, kategori & satuan, ekspor CSV · dashboard owner (KPI nyata, grafik, metode bayar, terlaris, stok kritis) · laporan & audit · pengaturan toko/pembayaran/tarif/diskon/pengguna/backup · tema terang/gelap · PWA (manifest + service worker, offline) · loading screen.

## Ditingkatkan
- **Visual**: palet Deep Navy #0B1422 / Orange #FF7626 / Concrete #F2F4F7, font Inter + Plus Jakarta Sans (fallback system-ui), header navy, hero 2 kolom, katalog putih, footer navy, kartu 12–20 px, toast ber-ikon, skeleton gambar.
- **Home**: hero, trust strip, Kategori Material (hanya yang punya produk), Material Pilihan (badge Terlaris dari data penjualan), Promo (hanya promo aktif, tanggal dicek, tanpa countdown), Kebutuhan Proyek (tautan ke katalog, tanpa harga paket), Pengiriman + **kalkulator estimasi ongkir** (memakai `TB.calcShipping`), Keunggulan, Pengalaman Belanja (pengganti testimoni palsu), footer lengkap.
- **Katalog**: sidebar filter (desktop) / drawer (HP), pencarian di atas, chip kategori, filter proyek multi-kategori, kartu produk dengan qty selector.
- **Detail produk baru** `produk.html?id=` (data dari LocalStorage), tanya via WhatsApp, produk terkait.
- **Keranjang**: item berfoto, berat, CTA "Checkout via WhatsApp"; format pesan WhatsApp lebih rapi (zona, diskon, total).
- **Login**: layar navy, tampil/sembunyi password, tombol kembali, **Akun Demo dalam panel collapsible** (tertutup).
- **Dashboard**: sidebar navy + drawer di HP, KPI 2 kolom di HP, tabel → kartu di HP, POS keranjang sebagai bottom-sheet di HP.
- **Gambar produk**: 42 render studio (`assets/p/*.webp`) yang dipilih per jenis produk; fallback SVG runtime; dukungan foto asli via field `photo`.
- **Kejujuran status demo**: klaim "stok real-time" dan "Toko Buka" dihapus; pill dashboard "Data lokal · demo"; footer & checkout menyatakan data di browser, bukan server.

## Catatan / keterbatasan
- Gambar produk adalah **render ilustrasi**, bukan foto sungguhan (tidak ada akses unduh foto). Ganti dengan foto asli lewat `photo`.
- Kategori tetap 11 kategori existing (bukan 9 seperti mock-up) agar tidak membuat kategori palsu.
- Font dimuat dari Google Fonts; jika offline, otomatis system-ui.
- Loading screen dipersingkat 3000→1200 ms (`LOADER_MS`).
- Login/data masih LocalStorage: bukan keamanan produksi, tidak tersinkron antar perangkat.

## Pembaruan loading screen (v2.0.1)
- Durasi 4 detik, latar blueprint + cahaya oranye, logo dengan animasi atap, 6 "bata" tersusun, bar progres + persen + status, tombol Lewati.
- Hanya animasi CSS transform/opacity; menghormati prefers-reduced-motion; tampil sekali per sesi.
