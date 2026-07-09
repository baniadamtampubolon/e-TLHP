from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
import os

from ..database import get_db
from .. import models, schemas
from ..config import UPLOAD_DIR

router = APIRouter(
    prefix="/api/batl",
    tags=["BATL"]
)

@router.get("", response_model=List[schemas.BATL])
def get_all_batl(db: Session = Depends(get_db)):
    return db.query(models.TabelBATL).all()

@router.post("", response_model=schemas.BATL, status_code=status.HTTP_201_CREATED)
def create_batl(batl: schemas.BATLCreate, db: Session = Depends(get_db)):
    # Verify LHA exists
    db_lha = db.query(models.MasterLHA).filter(models.MasterLHA.kode_lha == batl.kode_lha).first()
    if not db_lha:
        raise HTTPException(status_code=404, detail="LHA tidak ditemukan")
        
    # Generate mock PDF BATL path
    filename = f"BATL_{batl.kode_lha}_{datetime.now().strftime('%Y%m%d')}.pdf"
    file_path = os.path.join(UPLOAD_DIR, filename)
    
    # Write a mock file just to simulate pdf generation
    with open(file_path, "w") as f:
        f.write(f"Berita Acara Tindak Lanjut untuk LHA {batl.kode_lha}\nNomor: {batl.nomor_batl}\nTanggal: {batl.tanggal_penerbitan}")

    new_batl = models.TabelBATL(
        kode_lha=batl.kode_lha,
        nomor_batl=batl.nomor_batl,
        tanggal_penerbitan=batl.tanggal_penerbitan,
        file_path=file_path,
        tanda_tangan_auditor=True, # auditor automatically signs upon creation
        tanda_tangan_satker=False # satker signs later
    )
    
    # Update LHA status
    db_lha.status_laporan = "Selesai (BATL Terbit)"
    
    db.commit()
    db.refresh(new_batl)
    return new_batl

@router.put("/{id}/sign-satker", response_model=schemas.BATL)
def sign_batl_satker(id: int, db: Session = Depends(get_db)):
    db_batl = db.query(models.TabelBATL).filter(models.TabelBATL.id == id).first()
    if not db_batl:
        raise HTTPException(status_code=404, detail="BATL tidak ditemukan")
    db_batl.tanda_tangan_satker = True
    db.commit()
    db.refresh(db_batl)
    return db_batl
