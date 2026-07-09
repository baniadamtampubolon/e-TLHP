from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from .. import models, schemas

router = APIRouter(
    prefix="/api/lha",
    tags=["LHA"]
)

@router.get("", response_model=List[schemas.LHA])
def get_all_lha(db: Session = Depends(get_db)):
    return db.query(models.MasterLHA).all()

@router.post("", response_model=schemas.LHA, status_code=status.HTTP_201_CREATED)
def create_lha(lha: schemas.LHACreate, db: Session = Depends(get_db)):
    db_lha = db.query(models.MasterLHA).filter(models.MasterLHA.kode_lha == lha.kode_lha).first()
    if db_lha:
        raise HTTPException(status_code=400, detail="Kode LHA sudah terdaftar")
    new_lha = models.MasterLHA(**lha.model_dump())
    db.add(new_lha)
    db.commit()
    db.refresh(new_lha)
    return new_lha

@router.get("/{kode_lha}", response_model=schemas.LHA)
def get_lha_details(kode_lha: str, db: Session = Depends(get_db)):
    db_lha = db.query(models.MasterLHA).filter(models.MasterLHA.kode_lha == kode_lha).first()
    if not db_lha:
        raise HTTPException(status_code=404, detail="LHA tidak ditemukan")
    return db_lha

@router.put("/{kode_lha}", response_model=schemas.LHA)
def update_lha(kode_lha: str, lha_update: schemas.LHAUpdate, db: Session = Depends(get_db)):
    db_lha = db.query(models.MasterLHA).filter(models.MasterLHA.kode_lha == kode_lha).first()
    if not db_lha:
        raise HTTPException(status_code=404, detail="LHA tidak ditemukan")
    
    db_lha.sumber_audit = lha_update.sumber_audit
    db_lha.tahun = lha_update.tahun
    db_lha.status_laporan = lha_update.status_laporan
    db.commit()
    db.refresh(db_lha)
    return db_lha

@router.delete("/{kode_lha}")
def delete_lha(kode_lha: str, db: Session = Depends(get_db)):
    db_lha = db.query(models.MasterLHA).filter(models.MasterLHA.kode_lha == kode_lha).first()
    if not db_lha:
        raise HTTPException(status_code=404, detail="LHA tidak ditemukan")
    
    db.delete(db_lha)
    db.commit()
    return {"message": "LHA berhasil dihapus"}
