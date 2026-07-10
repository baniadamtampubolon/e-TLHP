# Perubahan Panel Kiri: Daftar Temuan → Daftar LHA

## Deskripsi Masalah
Tim auditor terbiasa bekerja berbasis **dokumen LHA** (Laporan Hasil Audit), bukan temuan individual. Panel kiri saat ini menampilkan daftar Temuan langsung, yang tidak sesuai dengan alur kerja audit. Perlu diubah menjadi **daftar LHA** dengan tombol "Detail" untuk menelusuri temuan, rekomendasi, sebab, dan akibat di dalamnya.

### Rumus Status LHA (Computed/Agregat)
Status LHA dihitung otomatis berdasarkan status seluruh rekomendasi di bawahnya:

| Kondisi | Status LHA |
|:---|:---|
| **Seluruh** rekomendasi berstatus `TUNTAS` | ✅ **TUNTAS** |
| Minimal **satu** rekomendasi berstatus `PROSES` (sisanya `PENDING` atau `TUNTAS`) | 🔄 **PROSES** |
| **Seluruh** rekomendasi berstatus `PENDING` | ⏳ **PENDING** |
| Belum ada temuan/rekomendasi | ⚪ **KOSONG** |

## Proposed Changes

### Frontend

#### [MODIFY] [index.html](file:///Users/adamtampubolon/Project/TLHP/frontend/index.html)

**Panel Kiri (Baris ~317-338):**
- Ubah judul header dari `"Daftar Temuan"` menjadi `"Daftar Dokumen LHA"`.
- Ubah counter dari `filteredTemuanCount` → `filteredLhaCount`.
- Rename container ID dari `temuanListContainer` → `lhaListContainer`.
- Tombol `+ LHA` dan `+ Temuan` tetap dipertahankan.

**Panel Kanan Fallback (Baris ~343-349):**
- Ubah teks instruksi dari "Pilih Temuan dari Daftar" menjadi "Pilih Dokumen LHA dari Daftar" dan "Klik salah satu LHA di panel sebelah kiri untuk menampilkan detail temuan, rekomendasi, dan log progres tindak lanjutnya."

---

#### [MODIFY] [app.js](file:///Users/adamtampubolon/Project/TLHP/frontend/js/app.js)

Ini adalah inti perubahan terbesar. Perubahan pada beberapa fungsi:

**1. Variabel Global (baris 1-11):**
- Ganti `filteredTemuan` → `filteredLHA` (array LHA yang sudah difilter).
- Ganti `selectedTemuanId` → `selectedLhaId` (kode LHA yang sedang dipilih).

**2. Fungsi `applyFilters()` (baris 179-222):**
- Ubah logika filter agar beroperasi pada `masterLHP` (bukan `tabelTemuan`).
- Filter berdasarkan:
  - Pencarian teks (cocokkan dengan kode LHP, kriteria temuan di bawahnya, atau teks rekomendasi).
  - Sumber audit (BPK-RI / Inspektorat).
  - PIC (cocokkan dengan PIC rekomendasi di bawah LHA).
  - Status (cocokkan dengan status terhitung LHA).
- Hasilnya disimpan ke `filteredLHA`.

**3. Fungsi `renderTemuanList()` → `renderLhaList()` (baris 310-383):**
- Fungsi baru yang me-render daftar kartu LHA di panel kiri.
- Setiap kartu LHA menampilkan:
  - Kode LHP
  - Badge Sumber Audit (BPK-RI / Inspektorat)
  - Tahun
  - Jumlah temuan
  - **Status terhitung** (berdasarkan rumus agregat)
  - Progress bar kecil (X/Y Tuntas)
  - Tombol **"Detail"** untuk membuka panel kanan

**4. Fungsi baru `computeLhaStatus(kodeLha)`:**
- Mengumpulkan semua temuan di bawah LHA → semua rekomendasi di bawah temuan-temuan tersebut.
- Menerapkan rumus status: TUNTAS jika semua TUNTAS, PROSES jika ada minimal satu PROSES, PENDING jika semua PENDING.

**5. Fungsi `showDetail()` (baris 400-728):**
- Diubah menjadi `showLhaDetail(kodeLha)` yang menerima Kode LHA sebagai parameter.
- Menampilkan **seluruh temuan** di bawah LHA tersebut secara berurutan, masing-masing dengan:
  - Header temuan + kriteria + sebab
  - Daftar rekomendasi di bawah temuan tersebut (sama seperti sekarang)
  - Log progres & formulir bukti

**6. Fungsi `selectTemuan()` → `selectLha()`:**
- Memilih LHA dan memanggil `showLhaDetail()`.

**7. Fungsi `calculateKPIs()` (baris 248-297):**
- Tetap berfungsi sama, tapi mengumpulkan temuan dan rekomendasi dari `filteredLHA` (bukan `filteredTemuan`).

## Verification Plan

### Manual Verification
1. Login sebagai `itjen` → Pastikan panel kiri menampilkan daftar LHA (bukan temuan).
2. Klik "Detail" pada salah satu LHA → Panel kanan menampilkan seluruh temuan + rekomendasi di dalamnya.
3. Pastikan status LHA terhitung otomatis sesuai rumus.
4. Filter berdasarkan PIC / Status / Sumber Audit → LHA yang tampil harus sesuai.
5. Login sebagai Satker (`hks`) → Pastikan hanya LHA yang memiliki rekomendasi untuk Biro HKS yang tampil.
