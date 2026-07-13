import pandas as pd
# pyrefly: ignore [missing-import]
import numpy as np
import os
import sys
from decimal import Decimal
from datetime import datetime

# Adjust path to find the backend app
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from app.database import SessionLocal, Base, engine
from app import models

# Double check that the tables exist
Base.metadata.create_all(bind=engine)

EXCEL_PATH = "./data/Data-TLHP-Normalized.xlsx"

def clean_value(val):
    if pd.isna(val) or val is None or str(val).strip().lower() == "nan":
        return None
    return val

def split_pics(pic_str):
    if not pic_str:
        return []
    pic_str = str(pic_str).strip()
    
    # Exceptions that contain 'dan' but represent a single entity
    exceptions = [
        "Biro Hukum dan Kerja Sama",
        "Deputi Bidang Koordinasi Keterjangkauan dan Pangan",
        "Deputi Bidang Koordinasi Tata Niaga dan Distribusi Pangan",
        "Deputi Bidang Koordinasi Tata Nidaga dan Distribusi Pangan"
    ]
    
    # Temporarily mask these exceptions to avoid splitting them
    masked_str = pic_str
    mask_map = {}
    for idx, exc in enumerate(exceptions):
        mask_key = f"__EXC_{idx}__"
        if exc in masked_str:
            masked_str = masked_str.replace(exc, mask_key)
            mask_map[mask_key] = exc
            
    # Delimiters to split joint PICs
    delimiters = [" dan/atau ", " dan ", " dan\n", "/", ";"]
    for delim in delimiters:
        masked_str = masked_str.replace(delim, ",")
        
    # Split by comma
    parts = [p.strip() for p in masked_str.split(",") if p.strip()]
    
    # Unmask the parts back to original names
    unmasked_parts = []
    for part in parts:
        for mask_key, exc in mask_map.items():
            part = part.replace(mask_key, exc)
        unmasked_parts.append(part)
        
    return unmasked_parts

def map_pic_name(pic):
    if not pic:
        return "Belum Ditentukan"
    pic = str(pic).strip()
    
    mapping = {
        # Hukum -> HKS
        "Hukum": "HKS",
        "Biro Hukum": "HKS",
        "Hukum dan Kerjasama": "HKS",
        "Biro Hukum dan Kerja Sama": "HKS",
        "Biro HKS": "HKS",
        "HKS": "HKS",
        
        # Distribusi Pangan, Deputi Bidang Tata Niaga -> Deputi 1
        "Deputi Bidang Koordinasi Tata Nidaga dan Distribusi Pangan": "Deputi 1",
        "Deputi Bidang Koordinasi Tata Niaga dan Distribusi Pangan": "Deputi 1",
        "Deputi Bidang Tata Niaga": "Deputi 1",
        "Deputi Bidang Tata Nidaga": "Deputi 1",
        "Distribusi Pangan": "Deputi 1",
        "Deputi 1": "Deputi 1",
        
        # Deputi Bidang Koordinasi Keterjangkauan dan Pangan -> Deputi 3
        "Deputi Bidang Koordinasi Keterjangkauan dan Pangan": "Deputi 3",
        "Deputi 3": "Deputi 3",
        
        # Staf Ahli Bidang Konektivitas -> Staf Ahli Bid. Konektifitas
        "Staf Ahli Bidang Konektivitas": "Staf Ahli Bid. Konektifitas",
        "Staf Ahli Bid. Konektivitas": "Staf Ahli Bid. Konektifitas",
        "Staf Ahli Bid. Konektifitas": "Staf Ahli Bid. Konektifitas",
    }
    
    return mapping.get(pic, pic)

def seed_database():
    print("Memulai proses seeding data dari Excel ke SQLite...")
    
    if not os.path.exists(EXCEL_PATH):
        print(f"Error: File Excel tidak ditemukan di path: {EXCEL_PATH}")
        return
        
    db = SessionLocal()
    
    try:
        # 1. Seed Master LHA
        print("Membaca data LHA...")
        df_lha = pd.read_excel(EXCEL_PATH, sheet_name="Master_LHP")
        for _, row in df_lha.iterrows():
            kode_lha = clean_value(row["Kode LHP"])
            if not kode_lha:
                continue
                
            # Check if exists
            exists = db.query(models.MasterLHA).filter(models.MasterLHA.kode_lha == kode_lha).first()
            if exists:
                continue
                
            new_lha = models.MasterLHA(
                kode_lha=kode_lha,
                sumber_audit=clean_value(row["Sumber Audit"]) or "BPK-RI",
                tahun=int(row["Tahun"]) if not pd.isna(row["Tahun"]) else datetime.now().year,
                status_laporan=clean_value(row["Status Laporan"]) or "Dalam Pemantauan"
            )
            db.add(new_lha)
        db.commit()
        print("LHA seeded.")

        # 2. Seed Tabel Temuan
        print("Membaca data Temuan...")
        df_temuan = pd.read_excel(EXCEL_PATH, sheet_name="Tabel_Temuan")
        # To avoid foreign key issues, sort so parent findings are inserted first, or handle parent setting
        for _, row in df_temuan.iterrows():
            kode_temuan = clean_value(row["Kode Temuan"])
            if not kode_temuan:
                continue
                
            exists = db.query(models.TabelTemuan).filter(models.TabelTemuan.kode_temuan == kode_temuan).first()
            if exists:
                continue
                
            new_temuan = models.TabelTemuan(
                kode_temuan=kode_temuan,
                kode_lha=clean_value(row["Kode LHP"]),
                parent_temuan=clean_value(row["Parent Temuan"]),
                kriteria=clean_value(row["Kriteria"]) or "Kriteria tidak spesifik",
                sebab=clean_value(row["Sebab"])
            )
            db.add(new_temuan)
        db.commit()
        print("Temuan seeded.")

        # 3. Seed Tabel Rekomendasi
        print("Membaca data Rekomendasi...")
        df_rec = pd.read_excel(EXCEL_PATH, sheet_name="Tabel_Rekomendasi")
        
        # We will need to map recommendation statuses dynamically. Let's pre-load progress logs
        df_prog = pd.read_excel(EXCEL_PATH, sheet_name="Tabel_Progres_Tindak_Lanjut")
        
        for _, row in df_rec.iterrows():
            kode_rec = clean_value(row["Kode Rekomendasi"])
            if not kode_rec:
                continue
                
            raw_pic = clean_value(row["PIC"]) or "Belum Ditentukan"
            pics = split_pics(raw_pic)
            
            # Map PIC names to unified names and deduplicate
            mapped_pics = [map_pic_name(p) for p in pics]
            pics = list(dict.fromkeys(mapped_pics))
            
            if not pics:
                pics = ["Belum Ditentukan"]
                
            for idx, pic in enumerate(pics):
                final_kode_rec = kode_rec
                if len(pics) > 1:
                    pic_clean = "".join([c for c in pic if c.isalnum() or c in (" ", "-", "_")]).strip()
                    final_kode_rec = f"{kode_rec}-{pic_clean}"
                
                exists = db.query(models.TabelRekomendasi).filter(models.TabelRekomendasi.kode_rekomendasi == final_kode_rec).first()
                if exists:
                    continue

                # Determine initial status
                initial_status = "PENDING"
                
                # If financial (Inspektorat), compute status based on Selisih
                nilai_temuan = clean_value(row["Nilai Temuan"]) or 0.0
                nilai_realisasi = clean_value(row["Nilai Realisasi"]) or 0.0
                selisih = clean_value(row["Selisih"]) or 0.0
                
                if kode_rec.startswith("R-INSP"):
                    if float(selisih) == 0.0 and float(nilai_temuan) > 0.0:
                        initial_status = "TUNTAS"
                    elif float(nilai_realisasi) > 0.0:
                        initial_status = "PROSES"
                else:
                    # BPK Kinerja: check progress logs
                    rec_logs = df_prog[df_prog["Kode Rekomendasi"] == kode_rec]
                    if len(rec_logs) > 0:
                        log_statuses = rec_logs["Status"].dropna().tolist()
                        if "Selesai" in log_statuses:
                            initial_status = "TUNTAS"
                        else:
                            initial_status = "PROSES"

                new_rec = models.TabelRekomendasi(
                    kode_rekomendasi=final_kode_rec,
                    kode_temuan=clean_value(row["Kode Temuan"]),
                    rekomendasi=clean_value(row["Rekomendasi"]) or "Rekomendasi tidak spesifik",
                    pic=pic,
                    rencana_aksi=clean_value(row["Rencana Aksi"]),
                    jadwal_pelaksanaan=clean_value(row["Jadwal Pelaksanaan"]),
                    status=initial_status,
                    nilai_temuan=Decimal(str(nilai_temuan)),
                    nilai_realisasi=Decimal(str(nilai_realisasi)),
                    selisih=Decimal(str(selisih))
                )
                db.add(new_rec)
        db.commit()
        print("Rekomendasi seeded.")

        # 4. Seed Tabel Bukti Tindak Lanjut
        print("Membaca data Progres/Bukti...")
        for _, row in df_prog.iterrows():
            kode_rec = clean_value(row["Kode Rekomendasi"])
            output = clean_value(row["Output Aktual (Progres)"])
            if not kode_rec or not output:
                continue
                
            # Find all recommendations in DB that match this code
            db_recs = db.query(models.TabelRekomendasi).filter(
                (models.TabelRekomendasi.kode_rekomendasi == kode_rec) |
                (models.TabelRekomendasi.kode_rekomendasi.like(f"{kode_rec}-%"))
            ).all()
            
            if not db_recs:
                continue
                
            # Map status
            status_ex = clean_value(row["Status"])
            status_review = "PROSES"
            if status_ex == "Selesai":
                status_review = "TUNTAS"
            elif status_ex == "Belum Tindak Lanjut" or status_ex is None:
                status_review = "PENDING"
                
            # Create bukti log for EACH matched recommendation in the DB
            for r in db_recs:
                new_bukti = models.TabelBuktiTindakLanjut(
                    kode_rekomendasi=r.kode_rekomendasi,
                    output_aktual=output,
                    status_review=status_review,
                    catatan_auditor="Seeded from Excel baseline",
                    tanggal_review=datetime.now()
                )
                db.add(new_bukti)
        db.commit()
        print("Progres Bukti seeded.")

        # 5. Seed Default Users
        print("Membaca data default users...")
        default_users = [
            {"username": "itjen", "password": "admin123", "role": "AUDITOR", "pic": None},
            {"username": "sdmo", "password": "sdmo123", "role": "SATKER", "pic": "Biro SDMO"},
            {"username": "ukk", "password": "ukk123", "role": "SATKER", "pic": "Biro UKK"},
            {"username": "mkdi", "password": "mkdi123", "role": "SATKER", "pic": "Biro MKDI"},
            {"username": "hks", "password": "hks123", "role": "SATKER", "pic": "HKS"},
            {"username": "sesdep", "password": "sesdep123", "role": "SATKER", "pic": "Sesdep"},
            {"username": "deputi1", "password": "deputi1123", "role": "SATKER", "pic": "Deputi 1"},
            {"username": "deputi2", "password": "deputi2123", "role": "SATKER", "pic": "Deputi 2"},
            {"username": "deputi3", "password": "deputi3123", "role": "SATKER", "pic": "Deputi 3"},
            {"username": "deputi4", "password": "deputi4123", "role": "SATKER", "pic": "Deputi 4"},
            {"username": "staf_konektifitas", "password": "staf123", "role": "SATKER", "pic": "Staf Ahli Bid. Konektifitas"},
            {"username": "biro_lingkup", "password": "biro123", "role": "SATKER", "pic": "Biro lingkup kemenko pangan"},
            {"username": "inspektorat", "password": "insp123", "role": "SATKER", "pic": "Inspektorat"},
            {"username": "semua_deputi", "password": "deputi123", "role": "SATKER", "pic": "semua Deputi"},
        ]
        
        for u in default_users:
            exists = db.query(models.TabelUser).filter(models.TabelUser.username == u["username"]).first()
            if exists:
                continue
            new_user = models.TabelUser(
                username=u["username"],
                password=u["password"],
                role=u["role"],
                pic=u["pic"]
            )
            db.add(new_user)
        db.commit()
        print("Users seeded.")
        
        print("Proses Seeding BERHASIL diselesaikan!")
        
    except Exception as e:
        db.rollback()
        print(f"Error during seeding: {str(e)}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
