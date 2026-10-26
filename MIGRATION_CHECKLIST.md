# 📋 Checklist Migrasi e-TLHP: Python FastAPI ke PHP & MySQL (Hostinger)

Dokumen ini adalah panduan kontrol kualitas (*Quality Assurance Checklist*) untuk memastikan seluruh logika bisnis, validasi, struktur data relasional, dan keamanan sistem **e-TLHP Kemenko Pangan** termigrasi secara utuh dari versi **FastAPI (Python)** ke **PHP & MySQL (Hostinger)** tanpa ada fitur yang tertinggal.

---

## 🏗️ Ringkasan Arsitektur Migrasi

| Komponen | Versi Python (Branch `main`) | Versi PHP Hostinger (Branch `hostinger-deploy`) | Status Migrasi |
| :--- | :--- | :--- | :--- |
| **Backend Runtime** | Python 3.9+ / FastAPI / Uvicorn | PHP 7.4 / 8.0+ (Apache / LiteSpeed) | ✅ **Selesai (100%)** |
| **Database Engine** | SQLite 3 (`database/tlhp.db`) | MySQL / MariaDB (phpMyAdmin Hostinger) | ✅ **Selesai (100%)** |
| **Database Driver** | SQLAlchemy ORM 2.0 | PHP Data Objects (PDO) Prepared Statements | ✅ **Selesai (100%)** |
| **File Storage** | `database/uploads/` (StaticFiles) | `uploads/` (Apache Public / Permissions 755) | ✅ **Selesai (100%)** |
| **Frontend UI** | HTML5, Tailwind CSS, Chart.js | Sama Persis (100% Reused) | ✅ **Selesai (100%)** |
| **API Endpoints** | RESTful JSON API (`/api/*`) | RESTful JSON API (`/api/*` via `.htaccess`) | ✅ **Selesai (100%)** |

---

## 🗄️ 1. Skema Database & Migrasi Data (SQLite $\rightarrow$ MySQL)

- [x] **Tabel `master_lha`**:
  - [x] Primary Key: `kode_lha` (VARCHAR 50)
  - [x] Fields: `sumber_audit` (VARCHAR 50), `tahun` (INT), `status_laporan` (VARCHAR 50), `tanggal_input` (DATETIME)
  - [x] Data Awal: 7 baris LHA baseline termigrasi
- [x] **Tabel `tabel_temuan`**:
  - [x] Primary Key: `kode_temuan` (VARCHAR 50)
  - [x] Foreign Key: `kode_lha` $\rightarrow$ `master_lha(kode_lha)` ON DELETE CASCADE
  - [x] Self-Referencing FK: `parent_temuan` $\rightarrow$ `tabel_temuan(kode_temuan)` ON DELETE SET NULL
  - [x] Fields: `kriteria` (TEXT), `sebab` (TEXT), `tanggal_input` (DATETIME)
  - [x] Data Awal: 49 baris temuan (termasuk relasi sub-temuan) termigrasi
- [x] **Tabel `tabel_rekomendasi`**:
  - [x] Primary Key: `kode_rekomendasi` (VARCHAR 50)
  - [x] Foreign Key: `kode_temuan` $\rightarrow$ `tabel_temuan(kode_temuan)` ON DELETE CASCADE
  - [x] Fields: `rekomendasi` (TEXT), `pic` (VARCHAR 255), `rencana_aksi` (TEXT), `jadwal_pelaksanaan` (VARCHAR 100)
  - [x] Fields Finansial: `nilai_temuan` (DECIMAL 15,2), `nilai_realisasi` (DECIMAL 15,2), `selisih` (DECIMAL 15,2)
  - [x] Status Field: `status` ('PENDING', 'PROSES', 'TUNTAS')
  - [x] Data Awal: 60 baris rekomendasi termigrasi
- [x] **Tabel `tabel_bukti_tindak_lanjut`**:
  - [x] Primary Key: `id` (INT AUTO_INCREMENT)
  - [x] Foreign Key: `kode_rekomendasi` $\rightarrow$ `tabel_rekomendasi(kode_rekomendasi)` ON DELETE CASCADE
  - [x] Fields: `output_aktual` (TEXT), `file_bukti_path` (VARCHAR 255), `ntpn` (VARCHAR 50)
  - [x] Date Range Fields: `tanggal_mulai` (DATETIME), `tanggal_selesai` (DATETIME)
  - [x] Audit Fields: `status_review` ('PENDING', 'PROSES', 'TUNTAS'), `catatan_auditor` (TEXT), `tanggal_submit` (DATETIME), `tanggal_review` (DATETIME)
  - [x] Data Awal: 57 baris riwayat bukti termigrasi
- [x] **Tabel `tabel_batl`**:
  - [x] Primary Key: `id` (INT AUTO_INCREMENT)
  - [x] Foreign Key: `kode_lha` $\rightarrow$ `master_lha(kode_lha)` ON DELETE CASCADE
  - [x] Fields: `nomor_batl` (VARCHAR 100 UNIQUE), `tanggal_penerbitan` (DATETIME), `file_path` (VARCHAR 255)
  - [x] Signature Flags: `tanda_tangan_auditor` (TINYINT 1), `tanda_tangan_satker` (TINYINT 1)
- [x] **Tabel `tabel_user`**:
  - [x] Primary Key: `id` (INT AUTO_INCREMENT)
  - [x] Fields: `username` (VARCHAR 50 UNIQUE), `password` (VARCHAR 100), `role` (VARCHAR 20), `pic` (VARCHAR 100)
  - [x] Akun Default: 14 akun (1 Auditor `itjen` + 13 Satker: `sdmo`, `ukk`, `mkdi`, `hks`, `deputi1-4`, dll.)

---

## ⚡ 2. Endpoint API & Logika Bisnis (FastAPI $\rightarrow$ PHP)

### A. Autentikasi (`/api/auth`)
- [x] `POST /api/auth/login`:
  - [x] Validasi username dan password
  - [x] Return JSON: `{ username, role, pic }`
  - [x] HTTP 401 jika kredensial salah

### B. Master LHA (`/api/lha`)
- [x] `GET /api/lha`:
  - [x] **Kritis**: Harus mengembalikan **Struktur Pohon Hirarki Bersarang (Nested Tree)**:
    - `LHA` $\rightarrow$ memuat array `temuan`
    - `Temuan` $\rightarrow$ memuat array `rekomendasi`
    - `Rekomendasi` $\rightarrow$ memuat array `bukti`
  - [x] Format field JSON identik dengan Pydantic Schema
- [x] `POST /api/lha`:
  - [x] Cek duplikasi `kode_lha` (HTTP 400 jika sudah ada)
  - [x] Simpan LHA baru
- [x] `PUT /api/lha/{kode_lha}`:
  - [x] Update `sumber_audit`, `tahun`, `status_laporan`
- [x] `DELETE /api/lha/{kode_lha}`:
  - [x] Hapus LHA beserta relasi temuan, rekomendasi, bukti, dan BATL (Cascade)

### C. Temuan Pemeriksaan (`/api/temuan`)
- [x] `POST /api/temuan`:
  - [x] Validasi keberadaan induk LHA
  - [x] Cek duplikasi `kode_temuan`
  - [x] Simpan temuan (mendukung `parent_temuan` untuk sub-temuan)
- [x] `PUT /api/temuan/{kode_temuan}`:
  - [x] Update `kriteria` dan `sebab`
- [x] `DELETE /api/temuan/{kode_temuan}`:
  - [x] Hapus temuan beserta rekomendasi dan sub-temuannya

### D. Rekomendasi Auditor (`/api/rekomendasi`)
- [x] `POST /api/rekomendasi`:
  - [x] Validasi temuan induk
  - [x] Perhitungan otomatis: `selisih = max(0, nilai_temuan - nilai_realisasi)`
  - [x] Simpan rekomendasi baru
- [x] `PUT /api/rekomendasi/{kode_rekomendasi}`:
  - [x] Update teks rekomendasi, PIC, rencana aksi, jadwal
  - [x] Rekalkulasi otomatis finansial: `selisih = max(0, nilai_temuan - nilai_realisasi)`
- [x] `PUT /api/rekomendasi/{kode_rekomendasi}/status`:
  - [x] Update status manual ('PENDING' / 'PROSES' / 'TUNTAS')
  - [x] **Logika Finansial**: Jika diubah ke `TUNTAS` dan `nilai_temuan > 0`, maka `nilai_realisasi = nilai_temuan` dan `selisih = 0.00`
- [x] `DELETE /api/rekomendasi/{kode_rekomendasi}`:
  - [x] Hapus rekomendasi beserta bukti tindak lanjutnya

### E. Bukti Tindak Lanjut & Review Auditor (`/api/bukti`)
- [x] `POST /api/bukti` (Unggah Bukti Satker):
  - [x] Validasi ekstensi file: `.pdf, .png, .jpg, .jpeg, .doc, .docx, .xls, .xlsx`
  - [x] Validasi ukuran file maksimal: **10 MB**
  - [x] Penyimpanan file ke folder `uploads/` dengan penamaan: `{kode_rekomendasi}_{YYYYMMDDHHIISS}.{ext}`
  - [x] Validasi rentang tanggal: `tanggal_selesai >= tanggal_mulai` (HTTP 400 jika tidak valid)
  - [x] **Logika Setoran Finansial**:
    - Parsing angka murni dari `nilai_setoran`
    - Tambahkan ke `nilai_realisasi` rekomendasi (maksimal sebesar `nilai_temuan`)
    - Update `selisih = max(0, nilai_temuan - nilai_realisasi)`
  - [x] **Logika Status Otomatis**: Jika rekomendasi berstatus `PENDING`, otomatis berubah menjadi `PROSES`
  - [x] Return data bukti yang baru dibuat
- [x] `PUT /api/bukti/{id}/review` (Verifikasi Bukti oleh Auditor):
  - [x] Update `status_review`, `catatan_auditor`, dan `tanggal_review = NOW()`
  - [x] **Sinkronisasi Status Induk**:
    - Jika review `TUNTAS`: status rekomendasi menjadi `TUNTAS`. Jika temuan bertarget finansial, lunaskan `nilai_realisasi = nilai_temuan` dan `selisih = 0.00`.
    - Jika review `PROSES`: status rekomendasi menjadi `PROSES`.
    - Jika review `PENDING`: status rekomendasi menjadi `PENDING`.
- [x] `GET /api/bukti/pending`:
  - [x] Ambil semua daftar bukti berstatus `PENDING` untuk verifikasi auditor

### F. Berita Acara Tindak Lanjut (`/api/batl`)
- [x] `POST /api/batl`:
  - [x] Generate file mock PDF BATL ke folder `uploads/BATL_{kode_lha}_{tanggal}.pdf`
  - [x] Simpan record BATL (Auditor otomatis menandatangani: `tanda_tangan_auditor = 1`)
  - [x] Update status LHA menjadi `"Selesai (BATL Terbit)"`
- [x] `GET /api/batl`:
  - [x] Ambil seluruh daftar BATL
- [x] `PUT /api/batl/{id}/sign-satker`:
  - [x] Set `tanda_tangan_satker = 1`

---

## 🔒 3. Aspek Keamanan & Performa PHP

- [x] **SQL Injection Prevention**: 100% query database menggunakan PDO Prepared Statements (`$stmt->prepare()` dan binding parameter).
- [x] **CORS Support**: Header `Access-Control-Allow-Origin: *`, `Methods`, dan `Headers` aktif di setiap respon API.
- [x] **Secure File Upload**:
  - Filter ekstensi ketat (whitelist).
  - Pengecekan ukuran bytes file.
  - Sanitasi nama file untuk mencegah directory traversal.
- [x] **Clean Routing**:
  - File `.htaccess` untuk meneruskan request `GET/POST/PUT/DELETE /api/...` ke router controller secara elegan.

---

## 🌐 4. Penyelarasan Frontend (`frontend/js/api.js`)

- [x] **Deteksi Host Otomatis**:
  - Jika dibuka di Hostinger (`https://domainanda.com`), API URL otomatis menggunakan `/api` (port 80/443 standar tanpa `:8000`).
  - Jika dibuka di lokal dengan port FastAPI, tetap bisa fallback ke `http://127.0.0.1:8000/api`.
- [x] **Akses File Bukti (`UPLOADS_BASE`)**:
  - Mengarah ke path `/uploads/` di server Hostinger.

---

## 🚀 5. Panduan Rilis Hostinger (Deployment Ready)

- [x] File database MySQL lengkap dengan dump data awal siap di-import: `database/database_mysql.sql`.
- [x] Konfigurasi database terpusat yang mudah disesuaikan: `api/config.php` (DB_HOST, DB_NAME, DB_USER, DB_PASS).
- [x] Panduan langkah demi langkah cara upload ke `public_html` Hostinger: `HOSTINGER_DEPLOYMENT.md`.
