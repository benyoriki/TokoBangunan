# TOKO BANGUNAN — Website & Sistem Operasional (Prototipe)

*Semua Kebutuhan Bangunan, Harga Terbaik, Pengiriman Tepat.*

HTML5 + CSS3 + JavaScript vanilla. Tanpa build, tanpa Node. Data disimpan di **LocalStorage**.
Seluruh file ada langsung di root repository (tanpa subfolder).

## 1. Struktur repository (root)

| Berkas | Fungsi |
|---|---|
| `index.html` / `home.js` | Home publik |
| `katalog.html` / `katalog.js` | Katalog + pencarian & filter |
| `keranjang.html` / `keranjang.js` | Keranjang, ongkir, pembayaran, WhatsApp |
| `login.html` / `login.js` | Login staf |
| `kasir.html` / `kasir.js` | Dashboard kasir (POS, struk, riwayat) |
| `admin-stok.html` / `admin-stok.js` | Inventaris, stok masuk/keluar, kategori |
| `owner.html` / `owner.js` | Dashboard owner (statistik nyata) |
| `laporan.html` / `laporan.js` | Laporan transaksi, penjualan, stok, audit |
| `pengaturan.html` / `pengaturan.js` | Toko, pembayaran, tarif kirim, diskon, pengguna, backup |
| `style.css`, `responsive.css` | Desain (terang/gelap) & responsif 320 px → layar lebar |
| `data.js` | Data demo & konfigurasi bawaan |
| `app.js` | Utilitas, **lapisan penyimpanan `TB.store`**, **logika bisnis `TB.svc`**, UI bersama |
| `auth.js` | Login & hak akses prototipe |
| `manifest.json`, `sw.js`, `icon*.png/svg` | PWA opsional |
| `qris.png` | QRIS resmi toko (dari lampiran Anda) |

## 2. Cara menjalankan lokal
Buka `index.html` langsung di browser — semua fitur berfungsi. Hanya **service worker/PWA** yang butuh `http(s)` (otomatis aktif di GitHub Pages).

## 3. Deploy ke GitHub Pages
1. Buat akun & login di github.com → **New repository** (mis. `toko-bangunan`), Public.
2. Klik **uploading an existing file**, seret **semua file** dari folder ini (jangan folder induknya — file harus di root), lalu **Commit changes**.
3. **Settings → Pages** → *Source*: **Deploy from a branch** → Branch: `main`, folder `/ (root)` → **Save**.
4. Tunggu 1–3 menit; alamat: `https://USERNAME.github.io/toko-bangunan/`.
5. Uji setelah publish: buka Home, tambah barang, checkout (tombol WhatsApp), login tiap role, ganti tema, buka di HP.

## 4. Akun demo (WAJIB diganti)
| Role | Email | Password demo | Halaman |
|---|---|---|---|
| Owner | `owner@tokobangunan.demo` | `Owner#2026` | `owner.html` |
| Kasir | `kasir@tokobangunan.demo` | `Kasir#2026` | `kasir.html` |
| Admin Stok | `admin@tokobangunan.demo` | `Stok#2026` | `admin-stok.html` |

Password disimpan sebagai hash SHA-256 + salt (bukan teks biasa). Login → menu **Ganti Password**; owner dapat reset/tambah pengguna di **Pengaturan → Pengguna & Role**. Daftar akun demo di halaman login otomatis hilang setelah semua password diganti.

> ⚠️ **Login LocalStorage hanya prototipe.** Role & sesi tersimpan di browser dan bisa dimanipulasi siapa pun yang membuka DevTools; menyembunyikan tombol/halaman **bukan** pengamanan data. Jangan dipakai untuk data sungguhan sebelum migrasi ke autentikasi server (bagian 6).

## 5. Konfigurasi awal yang harus diubah
Login owner → **Pengaturan**:
- **Identitas Toko**: nama, alamat, telepon, **nomor WhatsApp** (format `62…`, saat ini nomor contoh), jam buka. Matikan banner "data demo" setelah data asli masuk.
- **Pembayaran**: QRIS (sudah memakai `qris.png` — RIKI HERMAWAN, DIGITAL & KREATIF, NMID ID1026615097429; ganti jika pemilik toko berbeda), zona COD.
- **Tarif Pengiriman**: zona, kendaraan, kapasitas, biaya dasar, per km, tambahan barang berat.
- **Produk**: semua harga & stok awal adalah **data demo**, bukan harga pasar. Ubah di Admin Stok.
- Foto hero: taruh `hero.jpg` di root lalu isi `HERO_IMAGE: 'hero.jpg'` di `data.js`.
- Loading screen 3 detik: `LOADER_MS` di `data.js` (tampil sekali per sesi browser; set `LOADER_ONCE_PER_SESSION: false` agar tampil di setiap halaman).

## 6. Keterbatasan LocalStorage
- Data **terpisah per browser & perangkat**: kasir di HP dan owner di laptop **tidak berbagi data**.
- Tidak ada sinkronisasi multi-pengguna real-time; kapasitas ±5 MB; hilang jika pengguna menghapus data situs (gunakan **Pengaturan → Backup**).
- Pesanan pelanggan hanya tercatat di browser pelanggan; **toko menerimanya lewat WhatsApp**. Untuk pesanan online masuk otomatis ke dashboard dibutuhkan backend (Firebase).
- QRIS statis tidak bisa diverifikasi otomatis; status "Menunggu Pembayaran" diubah manual oleh kasir/owner.
- Ongkir adalah **estimasi berbasis zona**, bukan jarak peta otomatis (butuh layanan peta untuk itu).

## 7. Migrasi ke Firebase
Kode sudah memisahkan data dari UI: seluruh akses data lewat `TB.store.*` (baca/tulis), logika bisnis lewat `TB.svc.*`, auth lewat `TB.auth.*`.
1. Buat proyek Firebase; aktifkan **Authentication** (Email/Password) dan **Cloud Firestore**.
2. Koleksi: `products`, `transactions`, `stockMovements`, `users` (role), `settings`, `audit`.
3. Ganti implementasi `TB.store` (app.js) dengan SDK Firestore; jadikan fungsi asinkron (`await`) dan sesuaikan pemanggil.
4. Ganti `TB.auth` dengan Firebase Auth; simpan role sebagai **custom claims** (di-set lewat Cloud Function/Admin SDK).
5. Pindahkan `TB.svc.createTransaction/cancelTransaction/adjustStock` ke **Firestore transaction** atau Cloud Function agar stok & pembayaran atomik.
6. Tulis **Security Rules**: publik hanya baca produk aktif & buat pesanan; kasir/admin/owner dibatasi per role; `audit` hanya tulis-tambah.
7. Jangan menaruh secret/kunci server di JavaScript publik (config web Firebase memang publik; pengamanan ada di Rules).

## 8. Checklist sebelum dipakai toko
- [ ] Ganti 3 password demo; hapus akun yang tidak dipakai
- [ ] Isi identitas toko & **nomor WhatsApp asli**; tes tombol WhatsApp
- [ ] Ganti/cek QRIS milik toko
- [ ] Input produk, harga modal/jual, stok awal asli; hapus/nonaktifkan data demo
- [ ] Atur zona, kendaraan, dan tarif ongkir; cek COD per zona
- [ ] Uji: checkout → WA, transaksi kasir → stok berkurang, batal → stok kembali
- [ ] Unduh backup rutin; uji pemulihan
- [ ] Putuskan: tetap prototipe (satu perangkat) atau migrasi Firebase untuk multi-pengguna

Website & Sistem Developer — [benyoriki.com](https://benyoriki.com)
