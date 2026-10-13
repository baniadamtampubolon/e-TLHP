# 🌾 e-TLHP Kemenko Pangan RI

> **Sistem Pemantauan & Penatausahaan Elektronik Tindak Lanjut Hasil Pemeriksaan (e-TLHP)**  
> **Inspektorat Jenderal Kementerian Koordinator Bidang Pangan Republik Indonesia**

[![Python Version](https://img.shields.io/badge/Python-3.9%2B-blue.svg?logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110%2B-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![SQLite / PostgreSQL](https://img.shields.io/badge/Database-SQLite%20%7C%20PostgreSQL-4169E1.svg?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Tailwind CSS](https://img.shields.io/badge/UI-Tailwind%20%26%20Material%20Design%203-38B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-Proprietary%20%2F%20Internal-orange.svg)]()

---

## 📌 Deskripsi Proyek

**e-TLHP Kemenko Pangan** adalah sistem informasi berbasis web yang dirancang khusus untuk mengelola, memantau, dan memverifikasi **Tindak Lanjut Hasil Pemeriksaan (TLHP)** secara digital, terintegrasi, transparan, dan akuntabel di lingkungan Kementerian Koordinator Bidang Pangan Republik Indonesia.

Sistem ini menjembatani proses tindak lanjut atas hasil pengawasan dan audit dari:
1. **Badan Pemeriksa Keuangan Republik Indonesia (BPK-RI)**
2. **Pengawasan Internal Inspektorat Jenderal (Itjen)**

Dengan e-TLHP, proses pemantauan dokumen rekomendasi audit yang sebelumnya tersebar dalam spreadsheet dapat diubah menjadi alur kerja relasional yang terstruktur dengan mekanisme verifikasi bertingkat, penatausahaan bukti dukung, perhitungan realisasi pengembalian kerugian negara, serta pencetakan Berita Acara Tindak Lanjut (BATL).

---

## ✨ Fitur-Fitur Unggulan

### 1. 📊 Executive Dashboard & Visualisasi Analitik
- **Metrik Utama Real-Time**: Ringkasan total temuan, rekomendasi berstatus **TUNTAS**, **PROSES**, dan **BELUM TL (PENDING)**.
- **Pemantauan Nilai Finansial**: Agregasi otomatis untuk total nilai kerugian/temuan, nilai realisasi setoran ke kas negara, dan sisa defisit/selisih secara presisi.
- **Grafik Interaktif (Chart.js)**:
  - *Donut Chart*: Persentase status penyelesaian tindak lanjut.
  - *Horizontal Bar Chart*: Distribusi beban temuan & rekomendasi per Unit Kerja / Satker (PIC).

### 2. 🔐 Role-Based Access Control (RBAC) & Isolasi Data
Sistem mengimplementasikan pemisahan hak akses berbasis peran:
- **Peran Auditor (Inspektorat Jenderal)**:
  - Akses pemantauan menyeluruh ke seluruh Laporan Hasil Audit (LHA).
  - Melakukan telaah dan review atas bukti dukung yang diunggah Satker.
  - Mengubah status telaah (*PENDING*, *PROSES*, *TUNTAS*) dan memberikan catatan rekomendasi/evaluasi.
  - Menerbitkan dan menandatangani Berita Acara Tindak Lanjut (BATL).
- **Peran Satker (Unit Kerja / PIC)**:
  - Tampilan otomatis difilter hanya menampilkan rekomendasi yang menjadi tanggung jawab unit kerja bersangkutan (e.g., Biro SDMO, Biro UKK, Biro MKDI, HKS, Deputi 1–4).
  - Mengunggah berkas bukti dukung (format PDF/dokumen) beserta ringkasan aksi nyata (*output aktual*).
  - Menginput Nomor Transaksi Penerimaan Negara (NTPN) untuk bukti setoran temuan finansial.

### 3. 📑 Struktur Data Relasional Berjenjang
Model data didesain relasional murni untuk mencegah redundansi:
- **Master LHA**: Informasi induk laporan audit (Kode LHA, sumber audit BPK/Itjen, tahun anggaran, status laporan).
- **Tabel Temuan**: Mencakup kriteria, sebab, dan mendukung relasi hirarki (*parent-child sub-temuan*).
- **Tabel Rekomendasi**: Penugasan rekomendasi, nama unit kerja (PIC), rencana aksi, jadwal target, nilai target finansial, realisasi, dan selisih.
- **Tabel Bukti Tindak Lanjut**: Riwayat unggahan dokumen eviden, catatan verifikasi auditor, dan status persetujuan.
- **Tabel BATL**: Berita acara final sebagai pengesahan administratif penyelesaian laporan.

### 4. 🔍 Pencarian & Filter Cerdas
- Filter instan berdasarkan **Sumber Audit** (Semua / BPK-RI / Inspektorat).
- Filter berdasarkan **Tahun Anggaran**.
- Filter berdasarkan **Status Penyelesaian** (Semua / Tuntas / Proses / Belum TL).
- Pencarian kata kunci real-time pada seluruh baris LHA, nomor temuan, narasi rekomendasi, maupun PIC.

### 5. 🎨 Desain Modern Enterprise (Material Design 3 / Material You)
- Tampilan antarmuka profesional dengan palet warna terkurasi, tipografi Roboto, kontainer berlayer, backdrop blur, status chip yang tajam, dan footer resmi institusi.

---

## 🛠️ Tumpukan Teknologi (Tech Stack)

| Komponen | Teknologi | Keterangan |
| :--- | :--- | :--- |
| **Backend Framework** | [FastAPI](https://fastapi.tiangolo.com/) (Python 3.9+) | RESTful API berkecepatan tinggi dengan auto Swagger UI |
| **ORM & Database Engine** | [SQLAlchemy 2.0](https://www.sqlalchemy.org/) | Relational ORM (mendukung SQLite & PostgreSQL) |
| **Data Validation** | [Pydantic v2](https://docs.pydantic.dev/) | Skema validasi request dan response data |
| **ASGI Server** | [Uvicorn](https://www.uvicorn.org/) | Web server asinkronus |
| **Data Processing & Seeding** | [Pandas](https://pandas.pydata.org/) & [OpenPyXL](https://openpyxl.readthedocs.io/) | Normalisasi data baseline dari format spreadsheet Excel |
| **Frontend UI** | HTML5, JavaScript (ES6+), Vanilla CSS | Arsitektur Single Page Interface (SPI) yang ringan tanpa build step |
| **Styling & Icons** | [Tailwind CSS](https://tailwindcss.com/) & [FontAwesome 6](https://fontawesome.com/) | Tema terinspirasi Material Design 3 |
| **Visualisasi Grafik** | [Chart.js](https://www.chartjs.org/) | Render grafik Donut & Bar interaktif |

---

## 📋 Prasyarat Sistem (Prerequisites)

Sebelum melakukan instalasi, pastikan sistem komputer Anda memiliki:
1. **Python 3.9 atau lebih baru** (disarankan Python 3.10 / 3.11). Cek dengan:
   ```bash
   python3 --version
   ```
2. **Git** untuk kloning repositori.
3. **Web Browser Modern** (Google Chrome, Microsoft Edge, Mozilla Firefox, atau Safari).
4. *(Opsional)* **PostgreSQL** jika ingin menggunakan database server selain SQLite bawaan.

---

## 🚀 Panduan Kloning & Instalasi

Ikuti langkah-langkah di bawah ini secara berurutan untuk memasang dan menjalankan sistem pada perangkat lokal Anda:

### 1. Kloning Repositori dari GitHub

Buka terminal (macOS/Linux) atau Command Prompt / PowerShell (Windows), lalu jalankan perintah:

```bash
git clone https://github.com/baniadamtampubolon/e-TLHP.git
cd e-TLHP
```

---

### 2. Buat dan Aktifkan Virtual Environment (Virtualenv)

Sangat disarankan menggunakan virtual environment agar paket dependensi terisolasi:

- **Pada macOS / Linux:**
  ```bash
  python3 -m venv venv
  source venv/bin/activate
  ```

- **Pada Windows (Command Prompt):**
  ```cmd
  python -m venv venv
  venv\Scripts\activate.bat
  ```

- **Pada Windows (PowerShell):**
  ```powershell
  python -m venv venv
  venv\Scripts\Activate.ps1
  ```

*(Setelah aktif, terminal Anda akan menampilkan awalan `(venv)`).*

---

### 3. Pasang Dependensi Python

Pasang semua pustaka yang dibutuhkan melalui `requirements.txt`:

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

---

### 4. Inisialisasi Database & Seeding Data Awal

Proyek ini telah dilengkapi script otomatisasi untuk membaca data baseline Excel (`data/Data-TLHP-Normalized.xlsx`), membuat tabel relasional, serta mengisi data akun demo pengguna:

```bash
python seed.py
```

Output yang diharapkan saat seeding sukses:
```text
Membersihkan data lama...
Membaca sheet Master_LHP...
Master LHP seeded.
Membaca sheet Tabel_Temuan...
Tabel Temuan seeded.
Membaca sheet Tabel_Rekomendasi...
Tabel Rekomendasi seeded.
Membaca data Progres...
Progres Bukti seeded.
Membaca data default users...
Users seeded.
Proses Seeding BERHASIL diselesaikan!
```

> **Catatan:** Secara bawaan (default), sistem menggunakan database SQLite lokal yang tersimpan di `database/tlhp.db`. Jika Anda ingin menggunakan PostgreSQL, atur environment variable `DATABASE_URL` sebelum menjalankan seed maupun aplikasi (lihat bagian [Konfigurasi Database](#-konfigurasi-database-opsional)).

---

## 💻 Cara Menjalankan Aplikasi

Anda dapat menjalankan aplikasi menggunakan salah satu dari dua cara berikut:

### Opsi A: Cara Cepat menggunakan Quick Run Script (macOS / Linux)

Proyek ini menyediakan file skrip eksekusi cepat `run.sh`:

```bash
chmod +x run.sh
./run.sh
```

Skrip ini akan secara otomatis:
1. Menyalakan FastAPI Backend di port `8000` dengan mode live-reload.
2. Membuka antarmuka Frontend `frontend/index.html` di web browser bawaan Anda.

---

### Opsi B: Cara Manual (Semua Sistem Operasi / Windows)

#### 1. Jalankan Backend Server
Pastikan virtual environment telah aktif, lalu jalankan Uvicorn dari direktori utama proyek:

```bash
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```

- Backend API akan aktif di: **`http://localhost:8000`**
- Dokumentasi Interaktif Swagger UI: **`http://localhost:8000/docs`**
- Dokumentasi Interaktif ReDoc: **`http://localhost:8000/redoc`**

#### 2. Buka Frontend Dashboard
Buka tab baru atau file explorer Anda, lalu buka file:
```
frontend/index.html
```
langsung di browser, atau gunakan command line:
- **macOS:** `open frontend/index.html`
- **Linux:** `xdg-open frontend/index.html`
- **Windows:** `start frontend/index.html`

*(Atau gunakan extension VS Code "Live Server" jika diinginkan).*

---

## 🔑 Akun Login Bawaan (Demo / Pengujian)

Untuk menguji fitur isolasi data dan verifikasi hak akses (RBAC), berikut daftar akun default yang telah disediakan:

### 1. Akun Auditor (Inspektorat Jenderal)
> Memiliki akses penuh melihat seluruh LHA, memverifikasi bukti tindak lanjut dari satker, dan menerbitkan BATL.

| Username | Password | Peran (Role) | Hak Akses Unit Kerja (PIC) |
| :--- | :--- | :--- | :--- |
| **`itjen`** | `admin123` | `AUDITOR` | Seluruh Unit Kerja / Global |

---

### 2. Akun Satuan Kerja / Unit Kerja (PIC)
> Hanya dapat melihat rekomendasi dan mengunggah eviden untuk unit kerjanya masing-masing.

| Username | Password | Peran (Role) | Unit Kerja Terikat (PIC) |
| :--- | :--- | :--- | :--- |
| **`sdmo`** | `sdmo123` | `SATKER` | Biro SDMO |
| **`ukk`** | `ukk123` | `SATKER` | Biro UKK |
| **`mkdi`** | `mkdi123` | `SATKER` | Biro MKDI |
| **`hks`** | `hks123` | `SATKER` | HKS |
| **`deputi1`** | `deputi1123` | `SATKER` | Deputi 1 |
| **`deputi2`** | `deputi2123` | `SATKER` | Deputi 2 |
| **`deputi3`** | `deputi3123` | `SATKER` | Deputi 3 |
| **`deputi4`** | `deputi4123` | `SATKER` | Deputi 4 |
| **`sesdep`** | `sesdep123` | `SATKER` | Sesdep |
| **`staf_konektifitas`** | `staf123` | `SATKER` | Staf Ahli Bid. Konektifitas |
| **`biro_lingkup`** | `biro123` | `SATKER` | Biro lingkup kemenko pangan |
| **`inspektorat`** | `insp123` | `SATKER` | Inspektorat |

---

## 📁 Struktur Direktori Proyek

```text
e-TLHP/
├── backend/
│   └── app/
│       ├── __init__.py
│       ├── config.py           # Konfigurasi path upload & direktori berkas
│       ├── database.py         # Inisialisasi SQLAlchemy engine & get_db session
│       ├── main.py             # Entry point FastAPI, CORS, router inclusion
│       ├── models.py           # Model relasional tabel database (SQLAlchemy)
│       ├── schemas.py          # Skema DTO & serialisasi request/response (Pydantic)
│       └── routers/
│           ├── auth.py         # Endpoint autentikasi & login
│           ├── batl.py         # Endpoint Berita Acara Tindak Lanjut
│           ├── bukti.py        # Endpoint upload dokumen bukti & review auditor
│           ├── lha.py          # Endpoint manajemen Laporan Hasil Audit (LHA)
│           ├── rekomendasi.py  # Endpoint rekomendasi temuan & update status
│           └── temuan.py       # Endpoint temuan audit & relasi hirarki
│
├── database/
│   ├── schema.sql              # DDL Skema PostgreSQL murni (referensi produksi)
│   ├── tlhp.db                 # Database SQLite aktif (lokal)
│   └── uploads/                # Direktori penyimpanan berkas PDF bukti dukung
│
├── frontend/
│   ├── Kemenkopangan-logo.png  # Aset logo resmi Kemenko Pangan RI
│   ├── index.html              # Antarmuka web utama (Dashboard & Detail Modal)
│   ├── css/
│   │   └── style.css           # Styling tambahan & animasi kustom
│   └── js/
│       ├── api.js              # Integrasi HTTP Fetch ke FastAPI backend
│       ├── app.js              # Logika state aplikasi, rendering UI, filter, RBAC
│       └── charts.js           # Konfigurasi render grafik Chart.js
│
├── data/
│   ├── Data-TLHP-Normalized.xlsx # Sumber data referensi yang sudah dinormalisasi
│   └── TL BPK_EXIT MEETING.xlsx  # Dokumen baseline temuan BPK-RI
│
├── docs/
│   └── notes.txt               # Dokumentasi pedoman desain (Material Design 3)
│
├── normalize_tlhp.py           # Skrip pembersih data tabular dari Excel mentah
├── requirements.txt            # Daftar pustaka & dependensi Python
├── run.sh                      # Skrip auto-start backend & frontend (macOS/Linux)
├── seed.py                     # Skrip pembuat skema tabel & seeder data awal
└── README.md                   # Dokumentasi panduan instalasi & deskripsi sistem
```

---

## ⚙️ Konfigurasi Database (Opsional)

Secara default, aplikasi langsung berjalan tanpa konfigurasi tambahan menggunakan **SQLite** (`database/tlhp.db`).

Jika Anda ingin beralih ke **PostgreSQL** untuk lingkungan staging / produksi:
1. Pastikan PostgreSQL server telah terpasang dan database kosong telah dibuat (misal: `tlhp_db`).
2. Set variabel lingkungan `DATABASE_URL`:
   - **macOS / Linux:**
     ```bash
     export DATABASE_URL="postgresql://username:password@localhost:5432/tlhp_db"
     ```
   - **Windows:**
     ```cmd
     set DATABASE_URL=postgresql://username:password@localhost:5432/tlhp_db
     ```
3. Jalankan skrip `python seed.py` untuk menginisialisasi skema tabel dan mengisi data awal ke PostgreSQL.

---

## 📡 Ringkasan Endpoint API Utama

Dokumentasi lengkap dan pengujian API interaktif tersedia di **`http://localhost:8000/docs`**.

| Metode | Endpoint | Deskripsi |
| :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Login pengguna dan validasi hak akses RBAC |
| `GET` | `/api/lha` | Mengambil seluruh daftar LHA beserta temuan & rekomendasi |
| `POST` | `/api/lha` | Menambahkan data LHA baru |
| `GET` | `/api/temuan` | Mengambil daftar temuan pemeriksaan |
| `POST` | `/api/temuan` | Menambahkan temuan baru (mendukung sub-temuan) |
| `GET` | `/api/rekomendasi` | Mengambil daftar rekomendasi auditor |
| `PUT` | `/api/rekomendasi/{kode}/status` | Mengubah status rekomendasi (*PENDING/PROSES/TUNTAS*) |
| `POST` | `/api/bukti` | Mengunggah berkas bukti dukung (PDF) dan input progres |
| `PUT` | `/api/bukti/{id}/review` | Auditor mereview bukti dukung dan memberi catatan |
| `GET` | `/api/batl` | Mengambil daftar Berita Acara Tindak Lanjut |
| `POST` | `/api/batl` | Menerbitkan Berita Acara Tindak Lanjut (BATL) baru |

---

## 🛡️ Hak Cipta & Lisensi

© 2026 **Inspektorat Jenderal Kementerian Koordinator Bidang Pangan Republik Indonesia**.  
Semua hak cipta dilindungi undang-undang. Dikembangkan untuk efisiensi, integritas, dan transparansi pengawasan internal governan.
