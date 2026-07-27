# 🚀 Rekomendasi Pengembangan Fitur Lanjutan (Next Features) e-TLHP

Dokumen ini mencatat rencana penambahan fitur lanjutan dan peningkatan UX/UI untuk aplikasi **e-TLHP Kemenko Pangan**. Fitur-fitur ini direkomendasikan berdasarkan analisis kebutuhan kerja audit lapangan Inspektorat Jenderal (Itjen) & BPK-RI, dan siap dieksekusi setelah penyelesaian tahap penataan sistem utama.

---

## 📋 Daftar Rencana Fitur Lanjutan

### 1. 📝 Alur Verifikasi Bukti & Catatan Penolakan (*Rejection Notes & Review Flow*)
- **Deskripsi**: Saat Auditor menolak bukti tindak lanjut dari Satker, Auditor dapat memasukkan alasan/catatan revisi secara spesifik (misal: *"Kuitansi pembayaran belum dilegalisir"*).
- **Manfaat**:
  - Satker mengetahui secara pasti alasan penolakan dan perbaikan apa yang harus diunggah ulang.
  - Status Rekomendasi secara otomatis berubah menjadi `REVISI` atau `NEED_FIX` sampai bukti baru dikirimkan.

---

### 2. ⏳ Indikator Batas Waktu 60 Hari (*60-Day Overdue Countdown*)
- **Deskripsi**: Penambahan kalkulasi batas waktu 60 hari sejak LHP diterbitkan (sesuai aturan UU / BPK-RI).
- **Fitur UI**:
  - Badge sisa hari pada setiap Rekomendasi:
    - 🟢 `Sisa 24 Hari` (Waktu masih aman)
    - 🟡 `Sisa 5 Hari` (Mendekati tenggat)
    - 🔴 `Terlewat 12 Hari` (Overdue)
- **Manfaat**: Memberikan urgensi visual bagi Satker dan Inspektorat untuk menuntaskan rekomendasi sebelum jatuh tempo.

---

### 3. 📊 Fitur Ekspor Matriks LHP (*Export to Excel & PDF*)
- **Deskripsi**: Fitur 1-klik untuk mengunduh rekapitulasi data LHA, Temuan, Rekomendasi, dan Status Bukti dalam bentuk file Excel (`.xlsx`) dan PDF.
- **Format**: Mengikuti format resmi **Matriks Pemantauan Tindak Lanjut BPK-RI / Itjen** (Form 1 & Form 2).
- **Manfaat**: Memudahkan Auditor saat membawa bahan ke Rapat Pembahasan Bersama (*Konsolidasi TLHP*) dengan BPK-RI.

---

### 4. 📜 Riwayat Aktivitas & Audit Trail (*Recommendation Activity Logs*)
- **Deskripsi**: Tab kronologi pada detail rekomendasi yang mencatat seluruh jejak digital aksi pengguna:
  - *"Satker Biro SDMO mengunggah bukti Surat Tugas.pdf pada 15 Juli 2026 10:15"*
  - *"Auditor Ahmad menolak bukti dengan catatan revisi pada 16 Juli 2026 14:20"*
  - *"Satker Biro SDMO mengunggah revisi bukti Kuitansi.pdf pada 17 Juli 2026 09:00"*
  - *"Auditor Ahmad memverifikasi status TUNTAS pada 17 Juli 2026 11:30"*
- **Manfaat**: Menjaga akuntabilitas dan keterlacakan (*traceability*) seluruh alur verifikasi audit.

---

### 5. ⚡ Verifikasi Bukti Massal (*Bulk Approval / Batch Actions*)
- **Deskripsi**: Kemampuan bagi Auditor untuk menyeleksi beberapa rekomendasi sekaligus (multi-select checkbox) dan mengubah statusnya secara bersamaan.
- **Manfaat**: Menghemat waktu auditor secara signifikan saat melakukan pemutakhiran data massal pasca sidang/rapat konsolidasi.

---

📌 *Dokumen ini dibuat untuk acuan eksekusi pengembangan tahap berikutnya.*
