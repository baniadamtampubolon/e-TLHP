from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from .. import models, schemas

router = APIRouter(
    prefix="/api/rekomendasi",
    tags=["Rekomendasi"]
)

@router.post("", response_model=schemas.Rekomendasi, status_code=status.HTTP_201_CREATED)
def create_rekomendasi(rekomendasi: schemas.RekomendasiCreate, db: Session = Depends(get_db)):
    # Verify temuan exists
    db_temuan = db.query(models.TabelTemuan).filter(models.TabelTemuan.kode_temuan == rekomendasi.kode_temuan).first()
    if not db_temuan:
        raise HTTPException(status_code=404, detail="Temuan tidak ditemukan")
        
    db_rec = db.query(models.TabelRekomendasi).filter(models.TabelRekomendasi.kode_rekomendasi == rekomendasi.kode_rekomendasi).first()
    if db_rec:
        raise HTTPException(status_code=400, detail="Kode rekomendasi sudah terdaftar")
        
    new_rec = models.TabelRekomendasi(**rekomendasi.model_dump())
    db.add(new_rec)
    db.commit()
    db.refresh(new_rec)
    return new_rec

@router.put("/{kode_rekomendasi}/status", response_model=schemas.Rekomendasi)
def update_rekomendasi_status(kode_rekomendasi: str, status_update: schemas.RekomendasiUpdateStatus, db: Session = Depends(get_db)):
    db_rec = db.query(models.TabelRekomendasi).filter(models.TabelRekomendasi.kode_rekomendasi == kode_rekomendasi).first()
    if not db_rec:
        raise HTTPException(status_code=404, detail="Rekomendasi tidak ditemukan")
    db_rec.status = status_update.status
    db.commit()
    db.refresh(db_rec)
    return db_rec

@router.get("/pic/{pic_name}", response_model=List[schemas.Rekomendasi])
def get_rekomendasi_by_pic(pic_name: str, db: Session = Depends(get_db)):
    """Mendapatkan semua rekomendasi yang ditugaskan kepada PIC Satuan Kerja tertentu (misal: 'Biro SDMO')"""
    return db.query(models.TabelRekomendasi).filter(models.TabelRekomendasi.pic.like(f"%{pic_name}%")).all()

@router.put("/{kode_rekomendasi}", response_model=schemas.Rekomendasi)
def update_rekomendasi(kode_rekomendasi: str, rec_update: schemas.RekomendasiUpdate, db: Session = Depends(get_db)):
    db_rec = db.query(models.TabelRekomendasi).filter(models.TabelRekomendasi.kode_rekomendasi == kode_rekomendasi).first()
    if not db_rec:
        raise HTTPException(status_code=404, detail="Rekomendasi tidak ditemukan")
        
    db_rec.rekomendasi = rec_update.rekomendasi
    db_rec.pic = rec_update.pic
    db_rec.rencana_aksi = rec_update.rencana_aksi
    db_rec.jadwal_pelaksanaan = rec_update.jadwal_pelaksanaan
    
    # Recalculate selisih if financial
    db_rec.nilai_temuan = rec_update.nilai_temuan
    db_rec.selisih = db_rec.nilai_temuan - db_rec.nilai_realisasi
    
    db.commit()
    db.refresh(db_rec)
    return db_rec

@router.delete("/{kode_rekomendasi}")
def delete_rekomendasi(kode_rekomendasi: str, db: Session = Depends(get_db)):
    db_rec = db.query(models.TabelRekomendasi).filter(models.TabelRekomendasi.kode_rekomendasi == kode_rekomendasi).first()
    if not db_rec:
        raise HTTPException(status_code=404, detail="Rekomendasi tidak ditemukan")
        
    db.delete(db_rec)
    db.commit()
    return {"message": "Rekomendasi berhasil dihapus"}
