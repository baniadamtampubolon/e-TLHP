from datetime import datetime
# pyrefly: ignore [missing-import]
from sqlalchemy import Column, String, Integer, Text, Numeric, Boolean, DateTime, ForeignKey
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import relationship
from .database import Base

class MasterLHA(Base):
    __tablename__ = "master_lha"

    kode_lha = Column(String(50), primary_key=True)
    sumber_audit = Column(String(50), nullable=False) # e.g., 'BPK-RI', 'Inspektorat'
    tahun = Column(Integer, nullable=False)
    status_laporan = Column(String(50), nullable=False, default="Dalam Pemantauan")
    tanggal_input = Column(DateTime, default=datetime.utcnow)

    temuan = relationship("TabelTemuan", back_populates="lha", cascade="all, delete-orphan")
    batl = relationship("TabelBATL", back_populates="lha", cascade="all, delete-orphan")


class TabelTemuan(Base):
    __tablename__ = "tabel_temuan"

    kode_temuan = Column(String(50), primary_key=True)
    kode_lha = Column(String(50), ForeignKey("master_lha.kode_lha", ondelete="CASCADE"), nullable=False)
    parent_temuan = Column(String(50), ForeignKey("tabel_temuan.kode_temuan", ondelete="SET NULL"), nullable=True)
    kriteria = Column(Text, nullable=False)
    sebab = Column(Text, nullable=True)
    tanggal_input = Column(DateTime, default=datetime.utcnow)

    lha = relationship("MasterLHA", back_populates="temuan")
    rekomendasi = relationship("TabelRekomendasi", back_populates="temuan", cascade="all, delete-orphan")
    
    # Self-referential relationship for parent-child findings
    parent = relationship("TabelTemuan", remote_side=[kode_temuan], back_populates="sub_temuan")
    sub_temuan = relationship("TabelTemuan", back_populates="parent", cascade="all, delete-orphan")


class TabelRekomendasi(Base):
    __tablename__ = "tabel_rekomendasi"

    kode_rekomendasi = Column(String(50), primary_key=True)
    kode_temuan = Column(String(50), ForeignKey("tabel_temuan.kode_temuan", ondelete="CASCADE"), nullable=False)
    rekomendasi = Column(Text, nullable=False)
    pic = Column(String(255), nullable=False) # Unit Kerja (e.g., 'Biro SDMO')
    rencana_aksi = Column(Text, nullable=True)
    jadwal_pelaksanaan = Column(String(100), nullable=True)
    status = Column(String(20), nullable=False, default="PENDING") # PENDING, PROSES, TUNTAS
    nilai_temuan = Column(Numeric(15, 2), default=0.00)
    nilai_realisasi = Column(Numeric(15, 2), default=0.00)
    selisih = Column(Numeric(15, 2), default=0.00)
    tanggal_input = Column(DateTime, default=datetime.utcnow)

    temuan = relationship("TabelTemuan", back_populates="rekomendasi")
    bukti = relationship("TabelBuktiTindakLanjut", back_populates="rekomendasi", cascade="all, delete-orphan")


class TabelBuktiTindakLanjut(Base):
    __tablename__ = "tabel_bukti_tindak_lanjut"

    id = Column(Integer, primary_key=True, autoincrement=True)
    kode_rekomendasi = Column(String(50), ForeignKey("tabel_rekomendasi.kode_rekomendasi", ondelete="CASCADE"), nullable=False)
    output_aktual = Column(Text, nullable=False)
    file_bukti_path = Column(String(255), nullable=True) # Path to uploaded PDF
    ntpn = Column(String(50), nullable=True) # Transaction ID for finance
    status_review = Column(String(20), nullable=False, default="PENDING") # PENDING, PROSES, TUNTAS
    catatan_auditor = Column(Text, nullable=True)
    tanggal_submit = Column(DateTime, default=datetime.utcnow)
    tanggal_review = Column(DateTime, nullable=True)

    rekomendasi = relationship("TabelRekomendasi", back_populates="bukti")


class TabelBATL(Base):
    __tablename__ = "tabel_batl"

    id = Column(Integer, primary_key=True, autoincrement=True)
    kode_lha = Column(String(50), ForeignKey("master_lha.kode_lha", ondelete="CASCADE"), nullable=False)
    nomor_batl = Column(String(100), unique=True, nullable=False)
    tanggal_penerbitan = Column(DateTime, nullable=False)
    file_path = Column(String(255), nullable=False)
    tanda_tangan_auditor = Column(Boolean, default=False)
    tanda_tangan_satker = Column(Boolean, default=False)
    tanggal_input = Column(DateTime, default=datetime.utcnow)

    lha = relationship("MasterLHA", back_populates="batl")


class TabelUser(Base):
    __tablename__ = "tabel_user"

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(50), unique=True, nullable=False)
    password = Column(String(100), nullable=False)
    role = Column(String(20), nullable=False) # AUDITOR, SATKER
    pic = Column(String(100), nullable=True) # e.g. 'Biro SDMO' if role is SATKER
    tanggal_input = Column(DateTime, default=datetime.utcnow)
