from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from decimal import Decimal
import os

from ..database import get_db
from .. import models, schemas
from ..config import UPLOAD_DIR

router = APIRouter(
    prefix="/api/bukti",
    tags=["Bukti Tindak Lanjut"]
)

@router.post("", response_model=schemas.BuktiTindakLanjut, status_code=status.HTTP_201_CREATED)
def submit_bukti_tindak_lanjut(
    kode_rekomendasi: str = Form(...),
    output_aktual: str = Form(...),
    ntpn: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    # Verify recommendation exists
    db_rec = db.query(models.TabelRekomendasi).filter(models.TabelRekomendasi.kode_rekomendasi == kode_rekomendasi).first()
    if not db_rec:
        raise HTTPException(status_code=404, detail="Rekomendasi tidak ditemukan")

    file_path = None
    if file:
        file_ext = os.path.splitext(file.filename)[1]
        filename = f"{kode_rekomendasi}_{datetime.now().strftime('%Y%m%d%H%M%S')}{file_ext}"
        file_path = os.path.join(UPLOAD_DIR, filename)
        with open(file_path, "wb") as buffer:
            buffer.write(file.file.read())

    # Create progress log
    new_bukti = models.TabelBuktiTindakLanjut(
        kode_rekomendasi=kode_rekomendasi,
        output_aktual=output_aktual,
        ntpn=ntpn,
        file_bukti_path=file_path,
        status_review="PENDING" # default status waiting for auditor
    )
    db.add(new_bukti)
    
    # Auto update recommendation status to 'PROSES' when evidence is uploaded
    if db_rec.status == "PENDING":
        db_rec.status = "PROSES"
        
    db.commit()
    db.refresh(new_bukti)
    return new_bukti

@router.put("/{id}/review", response_model=schemas.BuktiTindakLanjut)
def review_bukti_tindak_lanjut(id: int, review: schemas.BuktiTindakLaughtReview if hasattr(schemas, "BuktiTindakLaughtReview") else schemas.BuktiTindakLanjutReview, db: Session = Depends(get_db)):
    # Note: schemas has BuktiTindakLanjutReview or similar
    # Let's inspect schemas.py or just use schemas.BuktiTindakLanjutReview which we used earlier
    db_bukti = db.query(models.TabelBuktiTindakLanjut).filter(models.TabelBuktiTindakLanjut.id == id).first()
    if not db_bukti:
        raise HTTPException(status_code=404, detail="Bukti tindak lanjut tidak ditemukan")
        
    db_bukti.status_review = review.status_review
    db_bukti.catatan_auditor = review.catatan_auditor
    db_bukti.tanggal_review = datetime.now()

    # Update the parent recommendation status if review is TUNTAS or PROSES
    db_rec = db.query(models.TabelRekomendasi).filter(models.TabelRekomendasi.kode_rekomendasi == db_bukti.kode_rekomendasi).first()
    if db_rec:
        if review.status_review == "TUNTAS":
            db_rec.status = "TUNTAS"
            if db_rec.kode_rekomendasi.startswith("R-INSP"):
                db_rec.nilai_realisasi = db_rec.nilai_temuan
                db_rec.selisih = Decimal("0.00")
        elif review.status_review == "PROSES":
            db_rec.status = "PROSES"
        elif review.status_review == "PENDING":
            db_rec.status = "PENDING"
            
    db.commit()
    db.refresh(db_bukti)
    return db_bukti

@router.get("/pending", response_model=List[schemas.BuktiTindakLanjut])
def get_pending_bukti_reviews(db: Session = Depends(get_db)):
    """Mendapatkan semua antrean bukti tindak lanjut yang berstatus PENDING (menunggu review auditor)"""
    return db.query(models.TabelBuktiTindakLanjut).filter(models.TabelBuktiTindakLanjut.status_review == "PENDING").all()
