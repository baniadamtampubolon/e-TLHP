import pandas as pd
import openpyxl
import re
import os

def clean_text(text):
    if pd.isna(text):
        return ""
    # Remove leading/trailing spaces and keep formatting clean
    return str(text).strip()

def split_bullet_points(text):
    if not text:
        return []
    # Split by newlines followed by a dash or dot list item
    lines = text.split('\n')
    bullets = []
    current_bullet = []
    
    for line in lines:
        stripped = line.strip()
        # Detect new bullet point starting with '-' or a number
        if stripped.startswith('-') or re.match(r'^\d+\.', stripped) or re.match(r'^[a-z]\.', stripped):
            if current_bullet:
                bullets.append(" ".join(current_bullet).strip())
                current_bullet = []
            # Remove bullet char/number at the beginning for sub-finding names
            cleaned = re.sub(r'^[-\d\.\s]+', '', stripped).strip()
            # If the line had sub-bullets or letters like a. or b., clean them slightly or keep them
            if stripped.startswith('-'):
                cleaned = stripped.lstrip('-').strip()
            current_bullet.append(cleaned)
        else:
            if stripped:
                current_bullet.append(stripped)
                
    if current_bullet:
        bullets.append(" ".join(current_bullet).strip())
        
    return [b for b in bullets if b]

def split_kriteria_causes(text):
    if not text:
        return "", []
    # Split by the first bullet point
    lines = text.split('\n')
    parent_lines = []
    bullets = []
    in_bullets = False
    
    current_bullet = []
    for line in lines:
        stripped = line.strip()
        if stripped.startswith('-') or re.match(r'^\d+\.', stripped):
            in_bullets = True
            if current_bullet:
                bullets.append("\n".join(current_bullet).strip())
                current_bullet = []
            current_bullet.append(line)
        else:
            if in_bullets:
                current_bullet.append(line)
            else:
                if stripped:
                    parent_lines.append(line)
                    
    if current_bullet:
        bullets.append("\n".join(current_bullet).strip())
        
    parent = "\n".join(parent_lines).strip()
    # Clean up bullets list: remove starting dash for clean sub-findings
    clean_bullets = []
    for b in bullets:
        # remove leading dash and whitespace
        cb = re.sub(r'^[-\s\u2013\u2014]+', '', b).strip()
        clean_bullets.append(cb)
        
    return parent, clean_bullets

def normalize_data():
    raw_path = "/Users/adamtampubolon/Project/TLHP/TL BPK_EXIT MEETING.xlsx"
    out_path = "/Users/adamtampubolon/Project/TLHP/Data-TLHP-Normalized.xlsx"
    
    # ------------------ SHEET 1: MASTER LHP ------------------
    master_rows = [
        {"Kode LHP": "LHP-BPK-2025-01", "Sumber Audit": "BPK-RI", "Tahun": 2025, "Status Laporan": "Dalam Pemantauan"},
        {"Kode LHP": "LHP-BPK-2025-02", "Sumber Audit": "BPK-RI", "Tahun": 2025, "Status Laporan": "Dalam Pemantauan"},
        {"Kode LHP": "LHP-BPK-2025-03", "Sumber Audit": "BPK-RI", "Tahun": 2025, "Status Laporan": "Dalam Pemantauan"},
        {"Kode LHP": "LHP-BPK-2025-04", "Sumber Audit": "BPK-RI", "Tahun": 2025, "Status Laporan": "Dalam Pemantauan"},
        {"Kode LHP": "LHP-INSP-2025-01", "Sumber Audit": "Inspektorat", "Tahun": 2025, "Status Laporan": "Dalam Pemantauan"}
    ]
    df_master = pd.DataFrame(master_rows)
    
    # ------------------ SHEET 2 & 3 & 4 FOR BPK KINERJA ------------------
    xls = pd.ExcelFile(raw_path)
    df_bpk = pd.read_excel(raw_path, sheet_name="BPK Kinerja")
    
    temuan_rows = []
    rekomendasi_rows = []
    progres_rows = []
    
    # Let's map each row (we skip row 0-3 as headers)
    # The columns are: 0: No, 1: Kriteria, 2: Sebab, 3: Rekomendasi, 4: PIC, 5: Rencana Aksi, 6: Jadwal Pelaksanaan, 7: Output
    
    # Row 4 (No: 1)
    r4_no = "1"
    r4_lhp = "LHP-BPK-2025-01"
    r4_krit_raw = df_bpk.iloc[4, 1]
    r4_sebab_raw = df_bpk.iloc[4, 2]
    
    r4_parent_krit, r4_subs = split_kriteria_causes(r4_krit_raw)
    # Add parent finding T-001
    temuan_rows.append({
        "Kode Temuan": "T-001",
        "Kode LHP": r4_lhp,
        "Parent Temuan": None,
        "Kriteria": r4_parent_krit,
        "Sebab": None
    })
    
    # Split cause raw
    _, r4_causes = split_kriteria_causes(r4_sebab_raw)
    
    # Add sub findings T-001-A, T-001-B
    sub_codes = ["T-001-A", "T-001-B"]
    for i, sub_krit in enumerate(r4_subs):
        cause = r4_causes[i] if i < len(r4_causes) else None
        temuan_rows.append({
            "Kode Temuan": sub_codes[i],
            "Kode LHP": r4_lhp,
            "Parent Temuan": "T-001",
            "Kriteria": sub_krit,
            "Sebab": cause
        })
        
    # Recommendations for Row 4 (R-001-A, R-001-B)
    rekomendasi_rows.append({
        "Kode Rekomendasi": "R-001-A",
        "Kode Temuan": "T-001-A",
        "Rekomendasi": "Melakukan Kajian dan Evaluasi terhadap Struktur Organisasi kemenko Pangan yang belum sepenuhnya mendukung pelaksanaan tugas pokok dan fungsinya serta digunakan sebagai bahan rancangan perubahan struktur Organisasi Kemenko pangan.",
        "PIC": "Biro SDMO",
        "Rencana Aksi": "Rapat internal kemenko bidang pangan untuk melakukan kajian dan evaluasi terhadap Struktur Organisasi Kemenko Pangan yang belum sepenuhnya mendukung pelaksanaan tugas pokok dan fungsinya serta digunakan sebagai bahan rancangan perubahan Struktur Organisasi Kemenko Pangan",
        "Jadwal Pelaksanaan": "Semester I 2026",
        "Nilai Temuan": None,
        "Nilai Realisasi": None,
        "Selisih": None
    })
    
    # Reconstructed R-001-B recommendation
    rekomendasi_rows.append({
        "Kode Rekomendasi": "R-001-B",
        "Kode Temuan": "T-001-B",
        "Rekomendasi": "Merumuskan dan menetapkan kebijakan dalam rangka sinkronisasi dan koordinasi kebijakan terkait sistem Informasi Pangan yang belum mampu menghasilkan informasi yang akurat, mutakhir, dan terpadu antar kementerian/ Lembaga untuk menyusun perencanaan pangan nasional dan neraca pangan nasional dan daerah",
        "PIC": "Biro MKDI",
        "Rencana Aksi": "Rapat sinkronisasi dan koordinasi terkait evaluasi pemanfaatan sistem informasi pangan yang sudah dibangun oleh BAPANAS untuk menghasilkan informasi yang akurat, mutakhir, dan terpadu antar kementerian/lembaga mendukung penyusunan perencanaan pangan nasional dan neraca pangan nasional dan daerah.",
        "Jadwal Pelaksanaan": "Semester I 2026",
        "Nilai Temuan": None,
        "Nilai Realisasi": None,
        "Selisih": None
    })
    
    # Progress for R-001-A
    r4_progres_sdmo = [
        "Sudah ada SK Tim",
        "Sudah dilakukan rapat internal",
        "Sudah dilakukan rapat dengan Menpan",
        "Naskah Akademik"
    ]
    for p in r4_progres_sdmo:
        progres_rows.append({
            "Kode Progres": f"P-{len(progres_rows)+1:03d}",
            "Kode Rekomendasi": "R-001-A",
            "Output Aktual (Progres)": p,
            "Status": "Dalam Proses"
        })
        
    # Progress for R-001-B
    r4_progres_mkdi = [
        "Rapat Koordinasi dengan BAPENAS",
        "Rapat Koordinasi dengan Kementan",
        "akan dijadwalkan rapat dengan BGN, KKP, dan Bappenas"
    ]
    for p in r4_progres_mkdi:
        progres_rows.append({
            "Kode Progres": f"P-{len(progres_rows)+1:03d}",
            "Kode Rekomendasi": "R-001-B",
            "Output Aktual (Progres)": p,
            "Status": "Dalam Proses"
        })

    # Row 6 (No: 2)
    temuan_rows.append({
        "Kode Temuan": "T-002",
        "Kode LHP": "LHP-BPK-2025-02",
        "Parent Temuan": None,
        "Kriteria": "Perencanaan Pangan Nasional Belum Memadai dan Berkelanjutan",
        "Sebab": None
    })

    # Row 7 (No: 2.1)
    r7_lhp = "LHP-BPK-2025-02"
    r7_krit_raw = df_bpk.iloc[7, 1]
    r7_sebab_raw = df_bpk.iloc[7, 2]
    
    r7_parent_krit, r7_subs = split_kriteria_causes(r7_krit_raw)
    temuan_rows.append({
        "Kode Temuan": "T-002-A",
        "Kode LHP": r7_lhp,
        "Parent Temuan": "T-002",
        "Kriteria": r7_parent_krit,
        "Sebab": None
    })
    
    sub_codes_21 = ["T-002-A1", "T-002-A2", "T-002-A3"]
    for i, sub_krit in enumerate(r7_subs):
        temuan_rows.append({
            "Kode Temuan": sub_codes_21[i],
            "Kode LHP": r7_lhp,
            "Parent Temuan": "T-002-A",
            "Kriteria": sub_krit,
            "Sebab": r7_sebab_raw
        })
        
    # Recommendations for Row 7 (R-002-A, R-002-B, R-002-C)
    rekomendasi_rows.extend([
        {
            "Kode Rekomendasi": "R-002-A",
            "Kode Temuan": "T-002-A1",
            "Rekomendasi": "Mengkoordinasikan BAPANAS untuk melengkapi unsur RPN yang belum memuat strategi dan kebijakan perencanaan pada rancangan RPN Tahun 2025-2029",
            "PIC": "Staf Ahli Bidang Konektivitas, semua Deputi dan Biro MKDI, Biro Hukum",
            "Rencana Aksi": "Rapat Koordinasi dengan Bapanas dan Kementerian/Lembaga terkait untuk menyempurnakan RPN guna memuat strategi dan kebijakan perencanaan pada Rancangan RPN Tahun 2025-2029",
            "Jadwal Pelaksanaan": "Semester I 2026",
            "Nilai Temuan": None, "Nilai Realisasi": None, "Selisih": None
        },
        {
            "Kode Rekomendasi": "R-002-B",
            "Kode Temuan": "T-002-A2",
            "Rekomendasi": "Melakukan Sinkronisasi dan Koordinasi dengan pihak-pihak terkait untuk mempercepat penetapan dokumen RPN tahun 2025-2029 serta sosialisasi kepada pemerintah daerah terkait penyusunan RPD tahun 2025-2029",
            "PIC": "Staf Ahli Bidang Konektivitas, semua Deputi dan Biro MKDI, Biro Hukum",
            "Rencana Aksi": "Rapat Koordinasi dengan pihak-pihak terkait untuk mempercepat penetapan dokumen RPN Tahun 2025-2029 serta sosialisasi kepada pemerintah daerah terkait penyusunan RPD Tahun 2025-2029; dan",
            "Jadwal Pelaksanaan": "Semester I 2026",
            "Nilai Temuan": None, "Nilai Realisasi": None, "Selisih": None
        },
        {
            "Kode Rekomendasi": "R-002-C",
            "Kode Temuan": "T-002-A3",
            "Rekomendasi": "Merumuskan dan menetapkan kebijakan dalam rangka sinkronissi dan koordinasi terkait kecukupan peraturan untuk penyusunan RPD tahun 2025-2029",
            "PIC": "Staf Ahli Bidang Konektivitas, semua Deputi dan Biro MKDI, Biro Hukum",
            "Rencana Aksi": "Rapat Koordinasi untuk merumuskan dan menetapkan kebijakan dalam rangka sinkronisasi dan koordinasi terkait kecukupan peraturan untuk penyusunan RPD Tahun 2025-2029",
            "Jadwal Pelaksanaan": "Semester I 2026",
            "Nilai Temuan": None, "Nilai Realisasi": None, "Selisih": None
        }
    ])
    
    # Row 7 Jadwal Pelaksanaan contains progress items!
    r7_progres = [
        "Rapat dengan para deputi untuk mensosialisaskikan RPN setelah rapat awal dengan Bapanas (Biro Hukum), 25-26 Mei 2026",
        "Memasukkan catatan audit BPK ke dalam RPN",
        "Mengadakan rapat dengan Bapanas dan K/L lainnya yang terhubung dengan RPN",
        "Mempercepat penetapan dokumen RPN 2025-2029",
        "Rapat koordinasi dengan kemendagri dan bapanas",
        "Sosialisasi kepada Pemda terkait penyusunan RPD 2025-2026"
    ]
    for p in r7_progres:
        progres_rows.append({
            "Kode Progres": f"P-{len(progres_rows)+1:03d}",
            # Map progress to the main recommendation R-002-B (acceleration/penetapan & sosialisasi)
            "Kode Rekomendasi": "R-002-B",
            "Output Aktual (Progres)": p,
            "Status": "Dalam Proses"
        })

    # Row 8 (No: 2.2)
    r8_krit_raw = df_bpk.iloc[8, 1]
    r8_sebab_raw = df_bpk.iloc[8, 2]
    
    temuan_rows.append({
        "Kode Temuan": "T-002-B",
        "Kode LHP": "LHP-BPK-2025-02",
        "Parent Temuan": "T-002",
        "Kriteria": clean_text(r8_krit_raw),
        "Sebab": clean_text(r8_sebab_raw)
    })
    
    rekomendasi_rows.extend([
        {
            "Kode Rekomendasi": "R-002-D",
            "Kode Temuan": "T-002-B",
            "Rekomendasi": "Mengkaji kendala dan memastikan penyelesaian atas permasalahan penggabungan RAD PG dengan RAD P3BPSDL menjadi RAD BPSDL",
            "PIC": "Staf Ahli Bidang Konektivitas, semua Deputi dan Biro MKDI",
            "Rencana Aksi": "Rapat Koordinasi terkait kendala dan memastikan penyelesaian atas permasalahan penggabungan RAD PG dengan RAD P3BPSDL menjadi RAD BPSDL",
            "Jadwal Pelaksanaan": "Semester I 2026",
            "Nilai Temuan": None, "Nilai Realisasi": None, "Selisih": None
        },
        {
            "Kode Rekomendasi": "R-002-E",
            "Kode Temuan": "T-002-B",
            "Rekomendasi": "melakukan Sinkronisasi dan Koordinasi dengan pihak-pihak terkait untuk mempercepat penetapan dokumen RAN PG tahun 2025-2029 dan sosialisasi kepada pemerintah daerah terkait penyusunan RAD PG tahun 2025-2029 dan RAD PGBPSDL tahun 2025-2030",
            "PIC": "Staf Ahli Bidang Konektivitas, semua Deputi dan Biro MKDI",
            "Rencana Aksi": "Rapat sinkronisasi dan koordinasi dengan pihak-pihak terkait untuk mempercepat penetapan dokumen RAN PG Tahun 2025-2029 dan sosialisasi kepada pemerintah daerah terkait penyusunan RAD PG Tahun 2025-2029 dan RAD PGBPSDL Tahun 2025-2030",
            "Jadwal Pelaksanaan": "Semester I 2026",
            "Nilai Temuan": None, "Nilai Realisasi": None, "Selisih": None
        },
        {
            "Kode Rekomendasi": "R-002-F",
            "Kode Temuan": "T-002-B",
            "Rekomendasi": "Merumuskan dan menetapkan kebijakan dalam rangka sinkronisasi dan koordinasi terkait kecukupan peraturan untuk penyusunan RAN PG tahun 2025-2029, RAD PG Tahun 2025-2029 dan RAD PGBPSDL Tahun 2025-2030",
            "PIC": "Staf Ahli Bidang Konektivitas, semua Deputi dan Biro MKDI",
            "Rencana Aksi": "Rapat koordinasi untuk merumuskan dan menetapkan kebijakan dalam rangka sinkronisasi dan koordinasi terkait kecukupan peraturan untuk penyusunan RAN PG Tahun 2025-2029, RAD PG Tahun 2025-2029 dan RAD PGBPSDL Tahun 2025-2030",
            "Jadwal Pelaksanaan": "Semester I 2026",
            "Nilai Temuan": None, "Nilai Realisasi": None, "Selisih": None
        }
    ])
    
    r8_progres = [
        "Rapat awal dengan bappenas untuk persamaan persepsi",
        "rapat koordinasi bappenas dengan K/L terkait"
    ]
    for p in r8_progres:
        progres_rows.append({
            "Kode Progres": f"P-{len(progres_rows)+1:03d}",
            "Kode Rekomendasi": "R-002-E",
            "Output Aktual (Progres)": p,
            "Status": "Dalam Proses"
        })

    # Row 9 (No: 2.3)
    r9_lhp = "LHP-BPK-2025-02"
    r9_krit_raw = df_bpk.iloc[9, 1]
    r9_sebab_raw = df_bpk.iloc[9, 2]
    
    r9_parent_krit, r9_subs = split_kriteria_causes(r9_krit_raw)
    temuan_rows.append({
        "Kode Temuan": "T-002-C",
        "Kode LHP": r9_lhp,
        "Parent Temuan": "T-002",
        "Kriteria": r9_parent_krit,
        "Sebab": None
    })
    
    sub_codes_23 = ["T-002-C1", "T-002-C2", "T-002-C3", "T-002-C4"]
    for i, sub_krit in enumerate(r9_subs):
        temuan_rows.append({
            "Kode Temuan": sub_codes_23[i],
            "Kode LHP": r9_lhp,
            "Parent Temuan": "T-002-C",
            "Kriteria": sub_krit,
            "Sebab": r9_sebab_raw
        })
        
    rekomendasi_rows.extend([
        {
            "Kode Rekomendasi": "R-002-G",
            "Kode Temuan": "T-002-C1",
            "Rekomendasi": "Sekretaris Kemenko berkoordinasi dengan Bappenas dan Bapanas terkait penempatan indikator PoU yang belum sesuai dan target PoU yang belum mengikuti Peta Jalan TPB/SDGs tahun 2023-2030",
            "PIC": "Deputi 3 dan Biro MKDI",
            "Rencana Aksi": "Rapat Koordinasi dengan Kementerian PPN/Bappenas untuk menempatkan indikator PoU yang belum sesuai dan target PoU yang belum mengikuti Peta Jalan TPB/SDGs Tahun 2023-2030",
            "Jadwal Pelaksanaan": "Semester I 2026",
            "Nilai Temuan": None, "Nilai Realisasi": None, "Selisih": None
        },
        {
            "Kode Rekomendasi": "R-002-H",
            "Kode Temuan": "T-002-C4",
            "Rekomendasi": "Sekretaris Kemenko berkoordinasi dengan Bappenas dan Bapanas terkait pemutakhiran Rancangan RAN PG Tahun 2025-2029 yang belum memuat seluruh aksi atas program dan kegiatan prioritas dalam RPJMN tahun 2025-2029 untuk mengakhiri kelaparan",
            "PIC": "Deputi 3 dan Biro MKDI",
            "Rencana Aksi": "Rapat Koordinasi dengan Kementerian PPN/Bappenas dalam rangka pemutakhiran Rancangan RAN PG Tahun 2025-2029 yang belum memuat seluruh aksi atas program dan kegiatan prioritas dalam RPJMN Tahun 2025-2029 untuk mengakhiri kelaparan",
            "Jadwal Pelaksanaan": "Semester I 2026",
            "Nilai Temuan": None, "Nilai Realisasi": None, "Selisih": None
        }
    ])

    # Row 10 (No: 2.4)
    r10_lhp = "LHP-BPK-2025-02"
    r10_krit_raw = df_bpk.iloc[10, 1]
    r10_sebab_raw = df_bpk.iloc[10, 2]
    
    r10_parent_krit, r10_subs = split_kriteria_causes(r10_krit_raw)
    temuan_rows.append({
        "Kode Temuan": "T-002-D",
        "Kode LHP": r10_lhp,
        "Parent Temuan": "T-002",
        "Kriteria": r10_parent_krit,
        "Sebab": None
    })
    
    sub_codes_24 = ["T-002-D1", "T-002-D2", "T-002-D3", "T-002-D4", "T-002-D5", "T-002-D6"]
    for i, sub_krit in enumerate(r10_subs):
        temuan_rows.append({
            "Kode Temuan": sub_codes_24[i],
            "Kode LHP": r10_lhp,
            "Parent Temuan": "T-002-D",
            "Kriteria": sub_krit,
            "Sebab": r10_sebab_raw
        })
        
    rekomendasi_rows.extend([
        {
            "Kode Rekomendasi": "R-002-I",
            "Kode Temuan": "T-002-D4",
            "Rekomendasi": "Merumuskan dan menetapkan kebijakan dalam rangka sinkronisasi dan koordinasi penyusunan peta jalan swasembada pangan yang mutakhir serta Exit strategy terhadap kemungkinan kelebihan produksi beras dan jagung",
            "PIC": "Deputi 2 dan Biro MKDI",
            "Rencana Aksi": "Rapat sinkronisasi dan koordinasi penyusunan Peta Jalan Swasembada Pangan yang mutakhir serta exit strategy terhadap kemungkinan kelebihan produksi beras dan jagung",
            "Jadwal Pelaksanaan": "Semester I 2026",
            "Nilai Temuan": None, "Nilai Realisasi": None, "Selisih": None
        },
        {
            "Kode Rekomendasi": "R-002-J",
            "Kode Temuan": "T-002-D1",
            "Rekomendasi": "Sinkronisasi dan Koordinasi (perumusan, penetapan dan pelaksanaan ) terkait belum Sinkronnya RPN tahun 2025-2029, RPJMN Tahun 2025-2029 dan Peta jalan Swasembada Pangan",
            "PIC": "Deputi 2 dan Biro MKDI",
            "Rencana Aksi": "Rapat Sinkronisasi dan koordinasi (perumusan, penetapan, dan pelaksanaan) terkait belum sinkronnya RPN Tahun 2025-2029, RPJMN Tahun 2025-2029 dan Peta Jalan Swasembada Pangan; dan",
            "Jadwal Pelaksanaan": "Semester I 2026",
            "Nilai Temuan": None, "Nilai Realisasi": None, "Selisih": None
        },
        {
            "Kode Rekomendasi": "R-002-K",
            "Kode Temuan": "T-002-D",
            "Rekomendasi": "Melaksanakan Pemantauan dan evaluasi dalam rangka sinkrinisasi dan koordinasi dengan Kementerian PPN/Bappenas atas dapat diterapkannya RPJMN Tahun 2025-2029 terkait Pangan dan Pertanian",
            "PIC": "Deputi 2 dan Biro MKDI",
            "Rencana Aksi": "Rapat Sinkronisasi dan koordinasi dalam melaksanakan pemantauan dan evaluasi dengan Kementerian PPN/Bappenas atas dapat diterapkannya RPJMN Tahun 2025-2029 terkait Pangan dan Pertanian",
            "Jadwal Pelaksanaan": "Semester I 2026",
            "Nilai Temuan": None, "Nilai Realisasi": None, "Selisih": None
        }
    ])

    # Row 11 (No: 2.5)
    r11_lhp = "LHP-BPK-2025-02"
    r11_krit_raw = df_bpk.iloc[11, 1]
    r11_sebab_raw = df_bpk.iloc[11, 2]
    
    r11_parent_krit, r11_subs = split_kriteria_causes(r11_krit_raw)
    temuan_rows.append({
        "Kode Temuan": "T-002-E",
        "Kode LHP": r11_lhp,
        "Parent Temuan": "T-002",
        "Kriteria": r11_parent_krit,
        "Sebab": None
    })
    
    sub_codes_25 = ["T-002-E1", "T-002-E2", "T-002-E3", "T-002-E4", "T-002-E5"]
    for i, sub_krit in enumerate(r11_subs):
        temuan_rows.append({
            "Kode Temuan": sub_codes_25[i],
            "Kode LHP": r11_lhp,
            "Parent Temuan": "T-002-E",
            "Kriteria": sub_krit,
            "Sebab": r11_sebab_raw
        })
        
    rekomendasi_rows.extend([
        {
            "Kode Rekomendasi": "R-002-L",
            "Kode Temuan": "T-002-E3",
            "Rekomendasi": "Merumuskan dan menetapkan kebijakan dalam rangka sinkronisasi dan koordinasi kebijakan penetapan KSPP/Lumbung Pangan dan KSPEAN Papua Selatan sebagai Kawasan Khusus",
            "PIC": "Deputi 2 dan Biro MKDI",
            "Rencana Aksi": "Rapat Sinkronisasi dan koordinasi dengan Kementerian/Lembaga terkait dalam merumuskan dan menetapkan kebijakan penetapan KSPP/Lumbung Pangan dan KSPEAN Papua Selatan sebagai kawasan khusus",
            "Jadwal Pelaksanaan": "Semester I 2026",
            "Nilai Temuan": None, "Nilai Realisasi": None, "Selisih": None
        },
        {
            "Kode Rekomendasi": "R-002-M",
            "Kode Temuan": "T-002-E",
            "Rekomendasi": "Melaksanakan Pemantauan dan Evaluasi dalam rangka sinkronisasi dan koordinasi dengan Kementerian PPN/Bappenas dan Kementerian/Lembaga yang terkait dalam hal ketercapaian indikator produksi cetak sawah pada KSPP/Lumbung Pangan dan laju deforestasi KSPEAN Papua Selatan tidak melebihi luasan 130.000 hektar per tahun",
            "PIC": "Deputi 2 dan Biro MKDI",
            "Rencana Aksi": "Rapat Koordinasi dengan PPN/Bappenas dan Kementerian/Lembaga terkait dalam pemantauan dan evaluasi ketercapaian indikator produksi cetak sawah pada KSPP/Lumbung Pangan pada RPJMN Tahun 2025-2029; dan Perubahan fungsi dan pelepasan kawasan hutan untuk KSPEAN Papua Selatan agar laju deforestasi dipertahankan tidak melebihi 130.000 hektar per tahun",
            "Jadwal Pelaksanaan": "Semester I 2026",
            "Nilai Temuan": None, "Nilai Realisasi": None, "Selisih": None
        }
    ])

    # Row 12 (No: 3)
    r12_lhp = "LHP-BPK-2025-03"
    r12_krit_raw = df_bpk.iloc[12, 1]
    r12_sebab_raw = df_bpk.iloc[12, 2]
    
    r12_parent_krit, r12_subs = split_kriteria_causes(r12_krit_raw)
    temuan_rows.append({
        "Kode Temuan": "T-003",
        "Kode LHP": r12_lhp,
        "Parent Temuan": None,
        "Kriteria": r12_parent_krit,
        "Sebab": None
    })
    
    sub_codes_3 = [f"T-003-{chr(65+i)}" for i in range(len(r12_subs))]
    for i, sub_krit in enumerate(r12_subs):
        temuan_rows.append({
            "Kode Temuan": sub_codes_3[i],
            "Kode LHP": r12_lhp,
            "Parent Temuan": "T-003",
            "Kriteria": sub_krit,
            "Sebab": r12_sebab_raw
        })
        
    rekomendasi_rows.extend([
        {
            "Kode Rekomendasi": "R-003-A",
            "Kode Temuan": "T-003",
            "Rekomendasi": "Mereviu dan menelaah semua ketentuan perundangan perencanaan Pangan yang terindikasi menjadi penghambat perwujudan Ketahanan Pangan",
            "PIC": "Staf Ahli Bid. Konektivitas, semua Deputi, Biro MKDI dan Biro HKS",
            "Rencana Aksi": "Kemenko Pangan akan Mereviu dan menelaah semua ketentuan perundangan perencanaan pangan yang terindikasi menjadi penghambat perwujudan ketahanan pangan",
            "Jadwal Pelaksanaan": "Semester I 2026",
            "Nilai Temuan": None, "Nilai Realisasi": None, "Selisih": None
        },
        {
            "Kode Rekomendasi": "R-003-B",
            "Kode Temuan": "T-003-F",
            "Rekomendasi": "Menelah kebutuhan regulasi pelaksanaan teknis kegiatan di Lingkungan Kemenko Pangan; dan",
            "PIC": "Biro HKS, Sesdep, Biro lingkup kemenko pangan dan Inspektorat",
            "Rencana Aksi": "Sekretaris Kemenko Bidang Pangan akan menelaah kebutuhan regulasi pelaksanaan teknis kegiatan di lingkungan Kemenko Pangan; dan",
            "Jadwal Pelaksanaan": "Semester I 2026",
            "Nilai Temuan": None, "Nilai Realisasi": None, "Selisih": None
        },
        {
            "Kode Rekomendasi": "R-003-C",
            "Kode Temuan": "T-003",
            "Rekomendasi": "Melaksanakan Sinkronisasi dan Evaluasi atas regulasi yang terkait dengan penyelenggaraan pertanian dan pangan yang sudah ada",
            "PIC": "Biro HKS dan Sesdep",
            "Rencana Aksi": "Rapat evaluasi atas regulasi yang terkait dengan penyelenggaraan pertanian dan pangan yang sudah ada",
            "Jadwal Pelaksanaan": "Semester I 2026",
            "Nilai Temuan": None, "Nilai Realisasi": None, "Selisih": None
        }
    ])
    
    r12_progres = [
        "akan dilakukan PKS Kemenko Pangan dengan Unpad bandung untuk mereviu peraturan terkait",
        "melibatkan tim ahli menko pangan dalam mereviu (Pak Surya)"
    ]
    for p in r12_progres:
        progres_rows.append({
            "Kode Progres": f"P-{len(progres_rows)+1:03d}",
            "Kode Rekomendasi": "R-003-A",
            "Output Aktual (Progres)": p,
            "Status": "Dalam Proses"
        })

    # Row 13 (No: 4)
    r13_lhp = "LHP-BPK-2025-04"
    r13_krit_raw = df_bpk.iloc[13, 1]
    r13_sebab_raw = df_bpk.iloc[13, 2]
    
    r13_parent_krit, r13_subs = split_kriteria_causes(r13_krit_raw)
    temuan_rows.append({
        "Kode Temuan": "T-004",
        "Kode LHP": r13_lhp,
        "Parent Temuan": None,
        "Kriteria": r13_parent_krit,
        "Sebab": None
    })
    
    sub_codes_4 = ["T-004-A", "T-004-B"]
    for i, sub_krit in enumerate(r13_subs):
        temuan_rows.append({
            "Kode Temuan": sub_codes_4[i],
            "Kode LHP": r13_lhp,
            "Parent Temuan": "T-004",
            "Kriteria": sub_krit,
            "Sebab": r13_sebab_raw
        })
        
    rekomendasi_rows.extend([
        {
            "Kode Rekomendasi": "R-004-A",
            "Kode Temuan": "T-004-A",
            "Rekomendasi": "Deputi Bidang Koordinasi Tata Niaga dan Distribusi Pangan melaksanakan Sinkronisasi, koordinasi dan Pengendalian terhadap penyusunan dokumen tata kelola dan manajemen risiko pembangunan nasional KDKMP dan Proses Bisnis Stabilisasi Pasokan dan Harga Pangan melalui KDKMP; serta melakukan telaahan atas Potensi resiko pembangunan Gerai KDKMP",
            "PIC": "Deputi Bidang Koordinasi Tata Nidaga dan Distribusi Pangan",
            "Rencana Aksi": "Rapat sinkronisasi, koordinasi dan pengendalian terhadap penyusunan dokumen tata kelola KDKMP, Proses Bisnis Stabilisasi Pasokan, dan regulasi terkait; serta rapat koordinasi pembahasan hasil telaahan potensi resiko pembangunan gerai KDKMP",
            "Jadwal Pelaksanaan": "Semester I 2026",
            "Nilai Temuan": None, "Nilai Realisasi": None, "Selisih": None
        },
        {
            "Kode Rekomendasi": "R-004-B",
            "Kode Temuan": "T-004-B",
            "Rekomendasi": "Deputi Bidang Koordinasi Keterjangkauan dan Pangan merumuskan dan menetapkan kebijakan terkait Kelembagaan Pangan Masyarakat (KDMP, BUMDesa, TTIC dan LPM) untuk mendukung swasembada pangan berkelanjutan dan program ketahanan pangan nasional dimulai dari desa",
            "PIC": "Deputi Bidang Koordinasi Keterjangkauan dan Pangan",
            "Rencana Aksi": "Rapat Koordinasi lintas K/L untuk penyusunan pedoman integrasi LPM dan CPPDes, instrumen monev alokasi Dana Desa, payung hukum pembagian peran, pemetaan kesiapan infrastruktur gudang BUMDes, penelaahan usulan fisik LPM, dan penyusunan Dashboard monitoring CPPDes",
            "Jadwal Pelaksanaan": "Semester I 2026",
            "Nilai Temuan": None, "Nilai Realisasi": None, "Selisih": None
        }
    ])


    # ------------------ SHEET 5: PARSING INSPEKTORAT SHEET (FINANCIAL) ------------------
    df_insp = pd.read_excel(raw_path, sheet_name="Inspektorat")
    
    current_pic = ""
    # Header starts at row 4, data starts at row 5
    for idx in range(5, len(df_insp)):
        row = df_insp.iloc[idx]
        col0 = clean_text(row.iloc[0])
        col1 = clean_text(row.iloc[1])
        
        # Check if this row is a PIC header
        if col0 and not col1 and col0 != "Jumlah":
            current_pic = col0
            continue
            
        if col0 == "Jumlah":
            break # end of data
            
        if col0 and col1: # This is a finding row
            finding_no = col0
            finding_text = col1
            
            # Read financial columns
            pengembalian = row.iloc[2]
            realisasi = row.iloc[3]
            selisih = row.iloc[4]
            keterangan = clean_text(row.iloc[5])
            
            # Handle empty values
            pengembalian_val = float(pengembalian) if pd.notna(pengembalian) and str(pengembalian).strip() != "" else 0.0
            realisasi_val = float(realisasi) if pd.notna(realisasi) and str(realisasi).strip() != "" else 0.0
            selisih_val = float(selisih) if pd.notna(selisih) and str(selisih).strip() != "" else 0.0
            
            t_code = f"T-INSP-{int(finding_no):03d}"
            r_code = f"R-INSP-{int(finding_no):03d}"
            
            # Add to Temuan
            temuan_rows.append({
                "Kode Temuan": t_code,
                "Kode LHP": "LHP-INSP-2025-01",
                "Parent Temuan": None,
                "Kriteria": finding_text,
                "Sebab": "Ketidakpatuhan administrasi pertanggungjawaban keuangan / kelebihan pembayaran"
            })
            
            # Add to Rekomendasi
            rekomendasi_rows.append({
                "Kode Rekomendasi": r_code,
                "Kode Temuan": t_code,
                "Rekomendasi": f"Melakukan penyetoran kembali ke kas negara senilai Rp {pengembalian_val:,.0f} sesuai dengan temuan audit.",
                "PIC": current_pic,
                "Rencana Aksi": "Menyetorkan dana ke Kas Negara dan menyerahkan bukti setor (NTPN) ke Inspektorat",
                "Jadwal Pelaksanaan": "Segera",
                "Nilai Temuan": pengembalian_val,
                "Nilai Realisasi": realisasi_val,
                "Selisih": selisih_val
            })
            
            # Add to Progres
            status_progres = "Selesai" if selisih_val == 0.0 else "Belum Tindak Lanjut" if realisasi_val == 0.0 else "Dalam Proses"
            progres_rows.append({
                "Kode Progres": f"P-{len(progres_rows)+1:03d}",
                "Kode Rekomendasi": r_code,
                "Output Aktual (Progres)": keterangan if keterangan else "Bukti setor diserahkan",
                "Status": status_progres
            })

    # Convert all lists of dicts to DataFrames
    df_temuan = pd.DataFrame(temuan_rows)
    df_rekomendasi = pd.DataFrame(rekomendasi_rows)
    df_progres = pd.DataFrame(progres_rows)
    
    # Save to Excel
    with pd.ExcelWriter(out_path, engine="openpyxl") as writer:
        df_master.to_excel(writer, sheet_name="Master_LHP", index=False)
        df_temuan.to_excel(writer, sheet_name="Tabel_Temuan", index=False)
        df_rekomendasi.to_excel(writer, sheet_name="Tabel_Rekomendasi", index=False)
        df_progres.to_excel(writer, sheet_name="Tabel_Progres_Tindak_Lanjut", index=False)
        
    print(f"Normalization complete. Output saved to: {out_path}")
    print(f"Master rows: {len(df_master)}")
    print(f"Temuan rows: {len(df_temuan)}")
    print(f"Rekomendasi rows: {len(df_rekomendasi)}")
    print(f"Progres rows: {len(df_progres)}")

if __name__ == "__main__":
    normalize_data()
