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

ALLOWED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg", ".doc", ".docx", ".xls", ".xlsx"}
MAX_FILE_SIZE_MB = 10
MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024

def _parse_iso_date(date_str: Optional[str], fallback: Optional[datetime] = None) -> Optional[datetime]:
    if not date_str:
        return fallback
    try:
        return datetime.fromisoformat(date_str)
    except ValueError:
        try:
            return datetime.strptime(date_str, "%Y-%m-%d")
        except ValueError:
            return fallback

@router.post("", response_model=schemas.BuktiTindakLanjut, status_code=status.HTTP_201_CREATED)
def submit_bukti_tindak_lanjut(
    kode_rekomendasi: str = Form(...),
    output_aktual: str = Form(...),
    ntpn: Optional[str] = Form(None),
    tanggal_mulai: Optional[str] = Form(None),
    tanggal_selesai: Optional[str] = Form(None),
    tanggal_tindak_lanjut: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    # Verify recommendation exists
    db_rec = db.query(models.TabelRekomendasi).filter(models.TabelRekomendasi.kode_rekomendasi == kode_rekomendasi).first()
    if not db_rec:
        raise HTTPException(status_code=404, detail="Rekomendasi tidak ditemukan")

    file_path = None
    if file and file.filename:
        file_ext = os.path.splitext(file.filename)[1].lower()
        if file_ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"Format file {file_ext} tidak didukung. Gunakan: PDF, PNG, JPG, JPEG, DOC/DOCX, atau XLS/XLSX."
            )
        file_bytes = file.file.read()
        if len(file_bytes) > MAX_FILE_SIZE_BYTES:
            raise HTTPException(
                status_code=400,
                detail=f"Ukuran file melebihi batas maksimal {MAX_FILE_SIZE_MB} MB."
            )
        filename = f"{kode_rekomendasi}_{datetime.now().strftime('%Y%m%d%H%M%S')}{file_ext}"
        file_path = os.path.join(UPLOAD_DIR, filename)
        with open(file_path, "wb") as buffer:
            buffer.write(file_bytes)

    now = datetime.now()
    parsed_mulai = _parse_iso_date(tanggal_mulai or tanggal_tindak_lanjut, fallback=now)
    parsed_selesai = _parse_iso_date(tanggal_selesai or tanggal_tindak_lanjut, fallback=parsed_mulai)

    if parsed_mulai and parsed_selesai and parsed_selesai < parsed_mulai:
        raise HTTPException(
            status_code=400,
            detail="Tanggal Selesai tidak boleh lebih awal dari Tanggal Mulai."
        )

    # Create progress log
    new_bukti = models.TabelBuktiTindakLanjut(
        kode_rekomendasi=kode_rekomendasi,
        output_aktual=output_aktual,
        ntpn=ntpn,
        file_bukti_path=file_path,
        status_review="PENDING", # default status waiting for auditor
        tanggal_mulai=parsed_mulai,
        tanggal_selesai=parsed_selesai,
        tanggal_submit=parsed_selesai or now
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
