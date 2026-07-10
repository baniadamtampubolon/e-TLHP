# 📋 Development Log — Sistem e-TLHP Kemenko Pangan

Catatan kronologis seluruh perkembangan pengembangan sistem elektronik Tindak Lanjut Hasil Pemeriksaan (e-TLHP) Kementerian Koordinator Pangan.

---

## Fase 1 — Inisialisasi Proyek & Dashboard Prototype
**Tanggal:** 8 Juli 2026  
**Commit:** `82ce5db` — *Initial commit: e-TLHP system structure with modular backend and Material You UI*

### Pekerjaan yang Diselesaikan:
- ✅ Membuat **dashboard prototype** (`dashboard-prototype.html`) dengan desain **Material You (MD3)** — palet warna tonal ungu/violet, bentuk kapsul, kartu rounded-3xl, micro-animations.
- ✅ Integrasi data riil dari file Excel yang dinormalisasi (47 temuan, 30 rekomendasi).
- ✅ Implementasi **KPI Cards** dinamis: Total Temuan, Rekomendasi, % Penyelesaian, Pemulihan Finansial.
- ✅ Implementasi **filter interaktif**: Search bar, Sumber Audit, Unit PIC, Status.
- ✅ Implementasi **grafik Chart.js**: Donut Chart (status) dan Bar Chart (sebaran PIC).
- ✅ Implementasi **panel detail relasional** untuk menelusuri temuan → rekomendasi → progres.

---

## Fase 2 — Backend API & Database
**Tanggal:** 8 Juli 2026

### Pekerjaan yang Diselesaikan:
- ✅ Setup **FastAPI** backend dengan arsitektur modular (routers terpisah per domain).
- ✅ Definisi model database **SQLAlchemy** (`models.py`): LHA, Temuan, Rekomendasi, Bukti, BATL, User.
- ✅ Skema validasi **Pydantic v2** (`schemas.py`) untuk input/output API.
- ✅ Script **seeding database** (`seed.py`): migrasi data Excel → SQLite.
- ✅ Endpoint REST API lengkap untuk semua entitas (CRUD).
- ✅ Fitur upload file PDF bukti tindak lanjut.

### Struktur Router Backend:
| Router | File | Endpoint |
|:---|:---|:---|
| LHA | `routers/lha.py` | GET, POST, PUT, DELETE |
| Temuan | `routers/temuan.py` | GET, POST, PUT, DELETE |
| Rekomendasi | `routers/rekomendasi.py` | GET, POST, PUT, DELETE |
| Bukti | `routers/bukti.py` | POST (upload), PUT (review) |
| BATL | `routers/batl.py` | POST (terbitkan) |
| Auth | `routers/auth.py` | POST (login) |

---

## Fase 3 — Integrasi Frontend Dinamis & Alur Kolaboratif
**Tanggal:** 8 Juli 2026

### Pekerjaan yang Diselesaikan:
- ✅ Koneksi penuh frontend ↔ backend API.
- ✅ Alur kolaborasi **dua peran**:
  - **Auditor (Itjen)**: Dashboard pemantauan, verifikasi bukti, penerbitan BATL.
  - **Satuan Kerja**: Lihat penugasan, unggah bukti tindak lanjut.
- ✅ Form unggah bukti dengan uraian progres, nomor NTPN, dan file PDF.
- ✅ Evaluasi auditor (Setujui/Tolak) dengan catatan review.
- ✅ Penerbitan BATL (Berita Acara Tindak Lanjut) dengan nomor berita acara.

---

## Fase 4 — Modularisasi Kode
**Tanggal:** 8 Juli 2026

### Pekerjaan yang Diselesaikan:
- ✅ Pemecahan frontend monolitik menjadi file modular:
  - `css/style.css` — Gaya visual Material You.
  - `js/api.js` — API client fetch wrapper.
  - `js/charts.js` — Logika Chart.js.
  - `js/app.js` — Logika aplikasi utama.
- ✅ Pemecahan backend `main.py` menjadi sub-router terpisah.

---

## Fase 5 — Autentikasi & RBAC (Role-Based Access Control)
**Tanggal:** 9 Juli 2026

### Pekerjaan yang Diselesaikan:
- ✅ Halaman login portal (`index.html`) menggantikan prototype.
- ✅ Sistem login berbasis `localStorage` session.
- ✅ **Isolasi data Satker**: Setiap unit kerja hanya melihat rekomendasi yang ditugaskan kepadanya.
- ✅ 6 akun pengujian default (1 auditor + 5 satker).

### Akun Pengujian:
| Username | Password | Peran | Unit Kerja |
|:---|:---|:---|:---|
| `itjen` | `admin123` | AUDITOR | Inspektorat Jenderal |
| `sdmo` | `sdmo123` | SATKER | Biro SDMO |
| `ukk` | `ukk123` | SATKER | Biro UKK |
| `mkdi` | `mkdi123` | SATKER | Biro MKDI |
| `hks` | `hks123` | SATKER | Biro HKS |
| `sesdep` | `sesdep123` | SATKER | Sesdep |

---

## Fase 6 — Pemisahan PIC & Pencegahan Kebocoran Data
**Tanggal:** 9 Juli 2026

### Pekerjaan yang Diselesaikan:
- ✅ Logika `split_pics()` di `seed.py` — memotong PIC gabungan menjadi unit tunggal.
- ✅ Duplikasi baris rekomendasi otomatis per biro.
- ✅ Duplikasi log bukti historis per biro.
- ✅ Proteksi nama biro yang mengandung kata "dan" (misal: "Biro Hukum dan Kerja Sama").

---

## Fase 7 — Panel Navigasi Berbasis LHA & Status Agregat
**Tanggal:** 9–10 Juli 2026  
**Commit:** `8aa165b` — *ui: group findings into Material 3 cards with accented Kriteria/Sebab and dynamic host resolution*

### Pekerjaan yang Diselesaikan:
- ✅ Panel kiri diubah dari daftar temuan → **daftar dokumen LHA**.
- ✅ Setiap kartu LHA menampilkan: Kode LHP, Sumber Audit, Tahun, Jumlah Temuan/Rekomendasi, Mini Progress Bar.
- ✅ **Status agregat LHA** dihitung real-time: TUNTAS / PROSES / PENDING / KOSONG.
- ✅ Desain kartu temuan terstruktur di panel kanan:
  - Temuan Container Card (bg-white, rounded-3xl, shadow).
  - Aksen garis kiri ungu (Kriteria) dan kuning (Sebab).
  - Rekomendasi dikemas sebagai sub-kartu.
  - Sub-temuan menjorok dengan border putus-putus.

---

## Fase 8 — Koneksi Dinamis LAN & Resolusi Host
**Tanggal:** 10 Juli 2026

### Pekerjaan yang Diselesaikan:
- ✅ `api.js` diubah dari hardcoded `127.0.0.1` → dinamis `window.location.hostname`.
- ✅ Backend dijalankan dengan `--host 0.0.0.0` agar bisa diakses lintas perangkat LAN.
- ✅ IP server: `10.80.13.155`, akses klien: `http://10.80.13.155:5500/index.html`.

---

## Fase 9 — Navigasi Temuan Dua Tingkat (List → Detail)
**Tanggal:** 10 Juli 2026  
**Commit:** `db55bcb` — *feat: implement two-state LHA detail panel with findings list and detailed cards view*

### Pekerjaan yang Diselesaikan:
- ✅ Variabel state baru: `selectedTemuanId`.
- ✅ Fungsi navigasi baru: `selectTemuanDetail()`, `goBackToFindings()`.
- ✅ **State 1 — Daftar Temuan Ringkas**: Kartu ringkas per temuan (Kode, Tanggal, Status, Cuplikan Kriteria 2 baris, Jumlah Rekomendasi).
- ✅ **State 2 — Detail Temuan Terfokus**: Detail lengkap (Kriteria, Sebab, Rekomendasi, Form Bukti) + tombol "Kembali ke Daftar Temuan".

---

## Fase 10 — Sub-Temuan Bersarang (Nested Cards)
**Tanggal:** 10 Juli 2026  
**Commit:** `03d59c2` — *feat: add nested sub-temuan cards in findings list view*

### Pekerjaan yang Diselesaikan:
- ✅ Sub-temuan (misal `T-002-A`, `T-002-B`) ditampilkan **menjorok ke kanan** di bawah temuan induknya (`T-002`) di daftar ringkas.
- ✅ Border putus-putus ungu (`border-dashed border-md-primary/25`) sebagai penanda hierarki.
- ✅ Setiap sub-temuan memiliki tombol **Detail** sendiri.
- ✅ Klik detail temuan induk → memuat temuan beserta semua sub-temuannya.
- ✅ Klik detail sub-temuan langsung → hanya memuat sub-temuan tersebut.

---

## Fase Selanjutnya (Rencana)

- [ ] Deployment ke server produksi / hosting.
- [ ] Penambahan fitur notifikasi otomatis (email/WhatsApp).
- [ ] Halaman laporan ringkasan / cetak PDF.
- [ ] Audit trail logging (siapa melakukan apa, kapan).
- [ ] Integrasi Tanda Tangan Elektronik (TTE) resmi.

---

> **Terakhir diperbarui:** 10 Juli 2026  
> **Repository:** [github.com/baniadamtampubolon/e-TLHP](https://github.com/baniadamtampubolon/e-TLHP)
