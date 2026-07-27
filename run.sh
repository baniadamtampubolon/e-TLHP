#!/bin/bash
# Script Quick Run untuk Aplikasi e-TLHP

echo "🚀 Memulai Backend FastAPI Server pada http://localhost:8000 ..."
./venv/bin/uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload &

sleep 2

echo "🌐 Membuka Frontend e-TLHP di Browser..."
open frontend/index.html

echo "✅ Aplikasi berjalan! Tekan Ctrl+C pada terminal ini jika ingin menghentikan server."
wait
