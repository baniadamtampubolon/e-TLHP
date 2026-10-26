# 🚀 Panduan Deploy e-TLHP ke Web Hosting Hostinger

Panduan ini berisi langkah-langkah praktis untuk meng-upload dan mengaktifkan sistem **e-TLHP Kemenko Pangan** (versi PHP & MySQL) ke web hosting **Hostinger** Anda.

---

## 📋 Langkah 1: Buat Database MySQL di hPanel Hostinger

1. Masuk ke panel kontrol Hostinger: [hpanel.hostinger.com](https://hpanel.hostinger.com/).
2. Pada menu navigasi sisi kiri, pilih **Databases** $\rightarrow$ **MySQL Databases**.
3. Buat database baru:
   - **MySQL Database Name**: misal `etlhp_db` (nama akhir akan menjadi `u123456789_etlhp_db`).
   - **MySQL Username**: misal `etlhp_admin` (nama akhir akan menjadi `u123456789_etlhp_admin`).
   - **Password**: Buat password yang kuat dan catat.
4. Klik tombol **Create / Buat**.

---

## 📥 Langkah 2: Impor Data Awal via phpMyAdmin

1. Pada halaman **MySQL Databases** di hPanel, temukan database yang baru Anda buat, lalu klik tombol **Enter phpMyAdmin**.
2. Di dalam phpMyAdmin, klik tab **Import** pada bagian atas layar.
3. Klik **Choose File / Pilih File**, lalu pilih file:
   ```text
   database/database_mysql.sql
   ```
   *(File ini sudah memuat seluruh skema 6 tabel relasional dan 170+ baris data baseline audit BPK/Itjen serta akun pengguna demo).*
4. Gulir ke bawah dan klik tombol **Import**.
5. Tunggu beberapa detik hingga muncul pesan sukses berwarna hijau: *"Import has been successfully finished"*.

---

## ⚙️ Langkah 3: Sesuaikan Kredensial di `api/config.php`

Buka file `api/config.php` (bisa lewat File Manager Hostinger atau sebelum di-upload), lalu sesuaikan baris 13–16 dengan detail database Hostinger Anda:

```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'u123456789_etlhp_db');     // Ganti dengan nama database Hostinger Anda
define('DB_USER', 'u123456789_etlhp_admin');  // Ganti dengan username database Hostinger Anda
define('DB_PASS', 'PasswordDatabaseAnda');     // Ganti dengan password yang Anda buat
```

---

## 📤 Langkah 4: Unggah File Proyek ke `public_html`

Ada 2 cara mudah untuk mengunggah file ke Hostinger:

### Cara A: Melalui File Manager (Paling Populer)
1. Di komputer lokal Anda, buat file **ZIP** yang berisi folder proyek (pastikan file `.htaccess`, folder `api/`, `frontend/`, dan `uploads/` ikut terkompresi).
   *(Anda **tidak perlu** mengikutsertakan folder `venv/`, `backend/`, atau file `.git` untuk menghemat kuota).*
2. Di hPanel Hostinger, buka menu **Files** $\rightarrow$ **File Manager**.
3. Buka direktori:
   ```text
   public_html/
   ```
4. Klik ikon **Upload** $\rightarrow$ pilih file ZIP tadi $\rightarrow$ klik **Extract** di dalam `public_html`.
5. Pastikan susunan file di dalam `public_html` terlihat seperti ini:
   ```text
   public_html/
   ├── .htaccess
   ├── api/
   │   ├── .htaccess
   │   ├── config.php
   │   ├── db.php
   │   └── index.php
   ├── frontend/
   │   ├── index.html
   │   ├── Kemenkopangan-logo.png
   │   ├── css/
   │   └── js/
   └── uploads/
   ```

### Cara B: Melalui Fitur Git Deploy di Hostinger
Jika paket hosting Anda mendukung menu **Git**:
1. Di hPanel, pilih **Advanced** $\rightarrow$ **Git**.
2. Masukkan URL repositori GitHub Anda: `https://github.com/baniadamtampubolon/e-TLHP.git`.
3. Pilih Branch: **`hostinger-deploy`**.
4. Install Path: `/public_html`.
5. Klik **Create / Deploy**.

---

## 🔒 Langkah 5: Pastikan Izin Folder Uploads (Permissions)

Untuk memastikan upload berkas dokumen bukti (PDF) oleh Satker berjalan mulus:
1. Di File Manager Hostinger, klik kanan folder:
   ```text
   public_html/uploads/
   ```
2. Pilih **Permissions**.
3. Atur nilai permissions menjadi **`755`** (atau `775`), lalu centang opsi *"Apply to child directories"* jika ada, lalu klik **Save**.

---

## 🌐 Langkah 6: Buka Domain Anda di Browser!

Buka alamat domain yang sudah Anda beli di Hostinger:
```text
https://domainanda.com
```

### ✅ Pengujian Sistem:
1. **Dashboard Utama**: Seluruh metrik audit, donut chart status, dan tabel LHA akan langsung tampil membaca database MySQL.
2. **Uji Login (RBAC)**:
   - Login sebagai Auditor: Username `itjen` / Password `admin123`.
   - Login sebagai Satker: Username `sdmo` / Password `sdmo123` (hanya menampilkan rekomendasi Biro SDMO).
3. **Uji Unggah Bukti**: Masuk ke salah satu rekomendasi, klik tombol *Tindak Lanjut*, upload file PDF bukti, dan verifikasi status berubah menjadi *PROSES*.

Selesai! Sistem e-TLHP kini resmi aktif melayani publik dan pengawasan internal Kemenko Pangan RI secara online.
