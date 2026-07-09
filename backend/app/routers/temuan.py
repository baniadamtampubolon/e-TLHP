from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from .. import models, schemas

router = APIRouter(
    prefix="/api/temuan",
    tags=["Temuan"]
)

@router.post("", response_model=schemas.Temuan, status_code=status.HTTP_201_CREATED)
def create_temuan(temuan: schemas.TemuanCreate, db: Session = Depends(get_db)):
    # Verify LHA exists
    db_lha = db.query(models.MasterLHA).filter(models.MasterLHA.kode_lha == temuan.kode_lha).first()
    if not db_lha:
        raise HTTPException(status_code=404, detail="LHA tidak ditemukan")
        
    db_temuan = db.query(models.TabelTemuan).filter(models.TabelTemuan.kode_temuan == temuan.kode_temuan).first()
    if db_temuan:
        raise HTTPException(status_code=400, detail="Kode temuan sudah terdaftar")
        
    new_temuan = models.TabelTemuan(**temuan.model_dump())
    db.add(new_temuan)
    db.commit()
    db.refresh(new_temuan)
    return new_temuan

@router.put("/{kode_temuan}", response_model=schemas.Temuan)
def update_temuan(kode_temuan: str, temuan_update: schemas.TemuanUpdate, db: Session = Depends(get_db)):
    db_temuan = db.query(models.TabelTemuan).filter(models.TabelTemuan.kode_temuan == kode_temuan).first()
    if not db_temuan:
        raise HTTPException(status_code=404, detail="Temuan tidak ditemukan")
        
    db_temuan.kriteria = temuan_update.kriteria
    db_temuan.sebab = temuan_update.sebab
    db.commit()
    db.refresh(db_temuan)
    return db_temuan

@router.delete("/{kode_temuan}")
def delete_temuan(kode_temuan: str, db: Session = Depends(get_db)):
    db_temuan = db.query(models.TabelTemuan).filter(models.TabelTemuan.kode_temuan == kode_temuan).first()
    if not db_temuan:
        raise HTTPException(status_code=404, detail="Temuan tidak ditemukan")
        
    db.delete(db_temuan)
    db.commit()
    return {"message": "Temuan berhasil dihapus"}
