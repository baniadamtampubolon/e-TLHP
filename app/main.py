# pyrefly: ignore [missing-import]
from fastapi import FastAPI
# pyrefly: ignore [missing-import]
from fastapi.middleware.cors import CORSMiddleware
# pyrefly: ignore [missing-import]
from fastapi.staticfiles import StaticFiles

from .database import engine, Base
from .config import UPLOAD_DIR
from .routers import lha, temuan, rekomendasi, bukti, batl, auth

# Initialize database tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="e-TLHP Kemenko Pangan API Backend",
    description="Layanan API Pemantauan Tindak Lanjut Hasil Pemeriksaan (TLHP) Inspektorat Jenderal Kemenko Pangan (Modular)",
    version="1.0.0"
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount upload directory as static files for evidence file viewing
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Include modular API routers
app.include_router(auth.router)
app.include_router(lha.router)
app.include_router(temuan.router)
app.include_router(rekomendasi.router)
app.include_router(bukti.router)
app.include_router(batl.router)

@app.get("/")
def read_root():
    return {"message": "Selamat datang di API e-TLHP Kemenko Pangan. Silakan akses /docs untuk dokumentasi Swagger."}
