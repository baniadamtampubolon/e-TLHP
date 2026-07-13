# Walkthrough Dashboard Pemantauan TLHP Interaktif

Kami telah memperbarui berkas `dashboard-prototype.html` secara menyeluruh menjadi sebuah aplikasi dashboard pemantauan mandiri yang interaktif, didorong oleh data riil hasil normalisasi, dan dibalut dengan bahasa desain **Material You (Material Design 3)**.

---

## Fitur & Fungsionalitas Dashboard Baru

### 1. Desain Visual Material You (MD3)
* **Warna Tema Tonal**: Menggunakan palet ungu/violet (`#6750A4`) sebagai seed color, warna latar belakang tonal off-white (`#FFFBFE`), serta kontras teks yang ramah (`#1C1B1F`).
* **Ambient Background Depth**: Menambahkan lingkaran gradien organik dengan efek kabur (`blur-3xl`) di latar belakang agar memberikan kesan kedalaman visual yang modern dan premium.
* **Bentuk Bulat & Tactile Feedback**:
  * Semua tombol, filter, dan badge menggunakan bentuk kapsul (`rounded-full`).
  * Seluruh kartu utama menggunakan radius besar (`24px` atau `rounded-3xl`).
  * Penekanan elemen interaktif merespons dengan animasi mikro `active:scale-95` untuk simulasi sentuhan fisik.
* **Tipografi**: Menggunakan font **Roboto** dari Google Fonts dengan ukuran dan ketebalan yang bervariasi sesuai hierarki Material 3.

### 2. Kalkulasi KPI Dinamis (Real-time)
KPI Card di bagian atas akan terhitung ulang secara dinamis sesuai dengan filter yang Anda gunakan:
* **Total Temuan**: Menghitung jumlah temuan induk yang sedang disaring (total 47 temuan jika tanpa filter).
* **Rekomendasi**: Menghitung rekomendasi unik yang terkait dengan temuan aktif (total 30 rekomendasi).
* **% Penyelesaian**: Menghitung persentase rekomendasi yang sudah diselesaikan (status **Selesai**).
* **Pemulihan Finansial**: Menghitung total target pengembalian, realisasi penyetoran, dan selisih kerugian negara (sisa defisit) secara khusus untuk audit finansial Inspektorat (Target: **Rp 83.6M**, Realisasi: **Rp 6.4M**, Sisa Defisit: **Rp 7.7M**).

### 3. Penapisan Interaktif (Filters)
* **Search Bar**: Cari kata kunci kriteria temuan, kode temuan, atau penyebab masalah secara instan.
* **Sumber Audit**: Pilih antara **BPK-RI** (audit kinerja) atau **Inspektorat** (audit keuangan).
* **Unit PIC**: Filter dropdown yang mendeteksi seluruh nama unit PIC secara dinamis dari data (misal: Biro SDMO, Biro MKDI, Biro Hukum, Deputi, dll.).
* **Status**: Saring temuan berdasarkan status penyelesaian (Selesai, Dalam Proses, Belum Tindak Lanjut).

### 4. Grafik Visual Interaktif (Chart.js)
Dua grafik di halaman tengah memperbarui datanya secara otomatis saat filter diubah:
* **Status Penyelesaian (Donut Chart)**: Visualisasi proporsi rekomendasi Selesai (hijau), Dalam Proses (kuning), dan Belum TL (merah).
* **Sebaran per PIC (Bar Chart)**: Menampilkan kontribusi jumlah rekomendasi terbanyak oleh 7 unit PIC utama.

### 5. Penampil Relasional Detail Temuan
Halaman bawah dibagi menjadi dua kolom:
* **Daftar Temuan**: Menampilkan kode temuan, asal LHP, cuplikan kriteria, dan badge jumlah progres tindak lanjut (misal: `1/2 Selesai`). Mendukung visualisasi indentasi hierarki (Temuan Induk vs Sub-temuan anak).
* **Panel Detail**: Ketika salah satu baris temuan diklik, panel kanan akan menampilkan secara lengkap:
  * Informasi Temuan Induk (jika yang diklik adalah sub-temuan).
  * Deskripsi Kriteria dan Penyebab (Sebab) secara utuh.
  * Daftar Rekomendasi terkait beserta unit PIC, deskripsi Rencana Aksi, Target Waktu, Nilai Keuangan (jika ada), dan log progres tindak lanjut secara mendalam.

---

## Modul Backend API & Seeding Data

Kami telah membangun fondasi API Backend menggunakan **FastAPI** yang berjalan secara dinamis di atas database SQLite.

### Struktur Kode backend/
* **`requirements.txt`**: Menyimpan daftar pustaka Python backend.
* **`app/database.py`**: Mengatur sesi koneksi database menggunakan SQLAlchemy.
* **`app/models.py`**: Representasi tabel relasional LHA, Temuan, Rekomendasi, Bukti, dan BATL dalam kode Python.
* **`app/schemas.py`**: Skema Pydantic v2 untuk validasi masukan data dan format keluaran API.
* **`app/main.py`**: Mengatur inisialisasi tabel, manajemen upload file PDF bukti tindak lanjut, serta router API endpoints.
* **`seed.py`**: Script pemindah data dari file Excel hasil normalisasi ke database SQLite secara otomatis dengan penyesuaian logika bisnis.

### Cara Menjalankan & Memverifikasi Backend
* **Seeding Data**: Skrip migrasi telah dijalankan untuk memindahkan data awal dari Excel ke file `database/tlhp.db`.
* **Menjalankan Server API**: `uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload`
* **Dokumentasi Swagger UI**: http://127.0.0.1:8000/docs

---

## Integrasi Frontend Dinamis & Alur Kerja Kolaboratif

### Fitur Kolaborasi Peran Utama:
* **Auditor (Itjen)**: Melihat dashboard pemantauan, melakukan verifikasi bukti dukung yang dikirim satker, menetapkan status, serta menerbitkan BATL.
* **Satuan Kerja (MKDI/HKS/SDMO)**: Melihat rekomendasi penugasan mereka, dan mengunggah rencana aksi serta dokumen bukti fisik.

---

## Modulasi & Refactoring Kode

### Backend Modular (FastAPI Routers)
* `config.py` — Konfigurasi global (`UPLOAD_DIR`).
* `routers/lha.py` — Endpoint LHA.
* `routers/temuan.py` — Endpoint Temuan.
* `routers/rekomendasi.py` — Endpoint Rekomendasi & penugasan PIC.
* `routers/bukti.py` — Unggah bukti & persetujuan review.
* `routers/batl.py` — Pembuatan & penandatanganan dokumen BATL.

### Frontend Modular (Separation of Concerns)
* `frontend/css/style.css` — Gaya visual Material You.
* `frontend/js/api.js` — API client fetch wrapper.
* `frontend/js/charts.js` — Logika Chart.js.
* `frontend/js/app.js` — Logika aplikasi utama.

---

## Autentikasi & RBAC

### Akun Pengujian:
| Username | Password | Peran | Unit Kerja |
|:---|:---|:---|:---|
| `itjen` | `admin123` | AUDITOR | Inspektorat Jenderal |
| `sdmo` | `sdmo123` | SATKER | Biro SDMO |
| `ukk` | `ukk123` | SATKER | Biro UKK |
| `mkdi` | `mkdi123` | SATKER | Biro MKDI |
| `hks` | `hks123` | SATKER | HKS |
| `sesdep` | `sesdep123` | SATKER | Sesdep |

---

## Navigasi Temuan Dua Tingkat

Untuk mengakomodasi LHA yang memiliki puluhan temuan, panel kanan dibagi menjadi alur navigasi dua tingkat:

1. **Daftar Temuan Ringkas (Summary List)**: Kartu ringkas per temuan (Kode, Tanggal, Status, Cuplikan Kriteria, Jumlah Rekomendasi). Sub-temuan ditampilkan bersarang di bawah induknya.
2. **Detail Temuan Terfokus**: Detail lengkap (Kriteria, Sebab, Rekomendasi, Form Bukti) + tombol "Kembali ke Daftar Temuan".
