-- ====================================================================
-- SKEMA DATABASE RELASIONAL e-TLHP KEMENKO BIDANG PANGAN (POSTGRESQL)
-- ====================================================================

-- 1. Tabel Master LHA (Laporan Hasil Audit)
CREATE TABLE master_lha (
    kode_lha VARCHAR(50) PRIMARY KEY,
    sumber_audit VARCHAR(50) NOT NULL, -- e.g., 'BPK-RI', 'Inspektorat'
    tahun INT NOT NULL,
    status_laporan VARCHAR(50) NOT NULL DEFAULT 'Dalam Pemantauan',
    tanggal_input TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabel Temuan Pemeriksaan
CREATE TABLE tabel_temuan (
    kode_temuan VARCHAR(50) PRIMARY KEY,
    kode_lha VARCHAR(50) NOT NULL REFERENCES master_lha(kode_lha) ON DELETE CASCADE,
    parent_temuan VARCHAR(50) REFERENCES tabel_temuan(kode_temuan) ON DELETE SET NULL, -- Relasi Induk-Anak (Sub-temuan)
    kriteria TEXT NOT NULL,
    sebab TEXT,
    tanggal_input TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabel Rekomendasi Auditor
CREATE TABLE tabel_rekomendasi (
    kode_rekomendasi VARCHAR(50) PRIMARY KEY,
    kode_temuan VARCHAR(50) NOT NULL REFERENCES tabel_temuan(kode_temuan) ON DELETE CASCADE,
    rekomendasi TEXT NOT NULL,
    pic VARCHAR(255) NOT NULL, -- Unit Kerja / Satuan Kerja (e.g., 'Biro SDMO', 'Biro MKDI')
    rencana_aksi TEXT,
    jadwal_pelaksanaan VARCHAR(100), -- Target tenggat waktu
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROSES', 'TUNTAS')),
    nilai_temuan NUMERIC(15, 2) DEFAULT 0.00, -- Target pemulihan keuangan (jika ada)
    nilai_realisasi NUMERIC(15, 2) DEFAULT 0.00, -- Realisasi setoran keuangan
    selisih NUMERIC(15, 2) DEFAULT 0.00, -- Sisa defisit (target - realisasi)
    tanggal_input TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabel Bukti Tindak Lanjut (Eviden oleh Satuan Kerja)
CREATE TABLE tabel_bukti_tindak_lanjut (
    id SERIAL PRIMARY KEY,
    kode_rekomendasi VARCHAR(50) NOT NULL REFERENCES tabel_rekomendasi(kode_rekomendasi) ON DELETE CASCADE,
    output_aktual TEXT NOT NULL, -- Deskripsi tindakan yang telah dilakukan
    file_bukti_path VARCHAR(255), -- Lokasi penyimpanan berkas PDF bukti dukung
    ntpn VARCHAR(50), -- Nomor Transaksi Penerimaan Negara (khusus temuan keuangan)
    status_review VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status_review IN ('PENDING', 'PROSES', 'TUNTAS')), -- Status penilaian auditor
    catatan_auditor TEXT, -- Komentar/evaluasi dari auditor
    tanggal_submit TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    tanggal_review TIMESTAMP
);

-- 5. Tabel BATL (Berita Acara Tindak Lanjut - Final Step)
CREATE TABLE tabel_batl (
    id SERIAL PRIMARY KEY,
    kode_lha VARCHAR(50) NOT NULL REFERENCES master_lha(kode_lha) ON DELETE CASCADE,
    nomor_batl VARCHAR(100) UNIQUE NOT NULL,
    tanggal_penerbitan DATE NOT NULL,
    file_path VARCHAR(255) NOT NULL, -- Lokasi penyimpanan dokumen PDF BATL resmi
    tanda_tangan_auditor BOOLEAN DEFAULT FALSE, -- Status tanda tangan digital auditor
    tanda_tangan_satker BOOLEAN DEFAULT FALSE, -- Status tanda tangan digital pimpinan satker
    tanggal_input TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ====================================================================
-- INDEKS OPTIMALISASI PENCARIAN
-- ====================================================================
CREATE INDEX idx_temuan_lha ON tabel_temuan(kode_lha);
CREATE INDEX idx_rekomendasi_temuan ON tabel_rekomendasi(kode_temuan);
CREATE INDEX idx_rekomendasi_pic ON tabel_rekomendasi(pic);
CREATE INDEX idx_bukti_rekomendasi ON tabel_bukti_tindak_lanjut(kode_rekomendasi);
CREATE INDEX idx_batl_lha ON tabel_batl(kode_lha);
