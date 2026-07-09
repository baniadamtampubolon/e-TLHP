from datetime import datetime
from typing import List, Optional
# pyrefly: ignore [missing-import]
from pydantic import BaseModel, Field, ConfigDict
from decimal import Decimal

# Base Schema Config
class BaseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

# ----------------------------------------------------
# 1. BUKTI TINDAK LANJUT SCHEMAS
# ----------------------------------------------------
class BuktiTindakLanjutBase(BaseSchema):
    output_aktual: str
    ntpn: Optional[str] = None

class BuktiTindakLanjutCreate(BuktiTindakLanjutBase):
    kode_rekomendasi: str

class BuktiTindakLanjutReview(BaseSchema):
    status_review: str = Field(description="Must be PENDING, PROSES, or TUNTAS")
    catatan_auditor: Optional[str] = None

class BuktiTindakLanjut(BuktiTindakLanjutBase):
    id: int
    kode_rekomendasi: str
    file_bukti_path: Optional[str] = None
    status_review: str
    catatan_auditor: Optional[str] = None
    tanggal_submit: datetime
    tanggal_review: Optional[datetime] = None

# ----------------------------------------------------
# 2. REKOMENDASI SCHEMAS
# ----------------------------------------------------
class RekomendasiBase(BaseSchema):
    rekomendasi: str
    pic: str
    rencana_aksi: Optional[str] = None
    jadwal_pelaksanaan: Optional[str] = None
    nilai_temuan: Decimal = Decimal("0.00")
    nilai_realisasi: Decimal = Decimal("0.00")
    selisih: Decimal = Decimal("0.00")

class RekomendasiCreate(RekomendasiBase):
    kode_rekomendasi: str
    kode_temuan: str

class RekomendasiUpdateStatus(BaseSchema):
    status: str = Field(description="Must be PENDING, PROSES, or TUNTAS")

class Rekomendasi(RekomendasiBase):
    kode_rekomendasi: str
    kode_temuan: str
    status: str
    tanggal_input: datetime
    bukti: List[BuktiTindakLanjut] = []

# ----------------------------------------------------
# 3. TEMUAN SCHEMAS
# ----------------------------------------------------
class TemuanBase(BaseSchema):
    kriteria: str
    sebab: Optional[str] = None

class TemuanCreate(TemuanBase):
    kode_temuan: str
    kode_lha: str
    parent_temuan: Optional[str] = None

class Temuan(TemuanBase):
    kode_temuan: str
    kode_lha: str
    parent_temuan: Optional[str] = None
    tanggal_input: datetime
    rekomendasi: List[Rekomendasi] = []
    sub_temuan: List['Temuan'] = []

# ----------------------------------------------------
# 4. LHA SCHEMAS
# ----------------------------------------------------
class LHABase(BaseSchema):
    sumber_audit: str
    tahun: int
    status_laporan: str = "Dalam Pemantauan"

class LHACreate(LHABase):
    kode_lha: str

class LHA(LHABase):
    kode_lha: str
    tanggal_input: datetime
    temuan: List[Temuan] = []

# ----------------------------------------------------
# 5. BATL SCHEMAS
# ----------------------------------------------------
class BATLBase(BaseSchema):
    nomor_batl: str
    tanggal_penerbitan: datetime

class BATLCreate(BATLBase):
    kode_lha: str

class BATL(BATLBase):
    id: int
    kode_lha: str
    file_path: str
    tanda_tangan_auditor: bool
    tanda_tangan_satker: bool
    tanggal_input: datetime


# ----------------------------------------------------
# 6. USER & AUTH SCHEMAS
# ----------------------------------------------------
class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(BaseSchema):
    username: str
    role: str
    pic: Optional[str] = None


# ----------------------------------------------------
# 7. UPDATE SCHEMAS (FOR CRUD OPERATIONS)
# ----------------------------------------------------
class LHAUpdate(BaseSchema):
    sumber_audit: str
    tahun: int
    status_laporan: str

class TemuanUpdate(BaseSchema):
    kriteria: str
    sebab: Optional[str] = None

class RekomendasiUpdate(BaseSchema):
    rekomendasi: str
    pic: str
    rencana_aksi: Optional[str] = None
    jadwal_pelaksanaan: Optional[str] = None
    nilai_temuan: Decimal
