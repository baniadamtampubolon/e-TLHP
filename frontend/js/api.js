// Deteksi URL API dan Uploads Otomatis (Kompatibel dengan Hostinger & Lokal Dev)
const isFileProtocol = window.location.protocol === 'file:';
const isLocalDevPort = window.location.port === '8000' || window.location.port === '5500' || window.location.port === '3000';
const host = window.location.hostname || "127.0.0.1";

let API_BASE;
let UPLOADS_BASE;

if (isFileProtocol || (isLocalDevPort && host === '127.0.0.1') || (isLocalDevPort && host === 'localhost')) {
    // Mode Lokal Dev (FastAPI / Uvicorn Port 8000)
    API_BASE = `http://${host}:8000/api`;
    UPLOADS_BASE = `http://${host}:8000/uploads`;
} else {
    // Mode Produksi Hostinger (Domain aktif dengan PHP API)
    API_BASE = `${window.location.origin}/api`;
    UPLOADS_BASE = `${window.location.origin}/uploads`;
}

const MAX_UPLOAD_SIZE_MB = 10;
const MAX_UPLOAD_SIZE_BYTES = MAX_UPLOAD_SIZE_MB * 1024 * 1024;
const ALLOWED_FILE_EXTENSIONS = ['pdf', 'png', 'jpg', 'jpeg', 'doc', 'docx', 'xls', 'xlsx'];

// Load data from FastAPI Backend
async function loadDataFromAPI() {
    try {
        const response = await fetch(`${API_BASE}/lha`);
        if (!response.ok) throw new Error("Gagal mengambil data dari API backend.");
        const lhaData = await response.json();
        
        // Clear state
        masterLHP = [];
        tabelTemuan = [];
        tabelRekomendasi = [];
        tabelProgres = [];

        // Unpack nested relational database schema
        lhaData.forEach(lha => {
            masterLHP.push({
                "Kode LHP": lha.kode_lha,
                "Sumber Audit": lha.sumber_audit,
                "Jenis Audit": lha.jenis_audit || "Audit Kinerja",
                "Tahun": lha.tahun,
                "Status Laporan": lha.status_laporan,
                "Tanggal Input": lha.tanggal_input
            });
            lha.temuan.forEach(tem => {
                tabelTemuan.push({
                    "Kode Temuan": tem.kode_temuan,
                    "Kode LHP": tem.kode_lha,
                    "Parent Temuan": tem.parent_temuan,
                    "Kondisi": tem.kondisi || null,
                    "Kriteria": tem.kriteria,
                    "Sebab": tem.sebab || null,
                    "Akibat": tem.akibat || null,
                    "Tanggal Input": tem.tanggal_input
                });
                
                tem.rekomendasi.forEach(rec => {
                    tabelRekomendasi.push({
                        "Kode Rekomendasi": rec.kode_rekomendasi,
                        "Kode Temuan": rec.kode_temuan,
                        "Rekomendasi": rec.rekomendasi,
                        "PIC": rec.pic,
                        "Rencana Aksi": rec.rencana_aksi,
                        "Jadwal Pelaksanaan": rec.jadwal_pelaksanaan,
                        "Status": rec.status,
                        "Nilai Temuan": parseFloat(rec.nilai_temuan) || 0.0,
                        "Nilai Realisasi": parseFloat(rec.nilai_realisasi) || 0.0,
                        "Selisih": parseFloat(rec.selisih) || 0.0,
                        "Tanggal Input": rec.tanggal_input
                    });
                    
                    rec.bukti.forEach(buk => {
                        tabelProgres.push({
                            "id": buk.id,
                            "Kode Rekomendasi": buk.kode_rekomendasi,
                            "Output Aktual (Progres)": buk.output_aktual,
                            "Status": buk.status_review,
                            "File Bukti Path": buk.file_bukti_path,
                            "NTPN": buk.ntpn,
                            "Catatan Auditor": buk.catatan_auditor,
                            "Tanggal Mulai": buk.tanggal_mulai || buk.tanggal_submit,
                            "Tanggal Selesai": buk.tanggal_selesai || buk.tanggal_review || buk.tanggal_submit,
                            "Tanggal Submit": buk.tanggal_submit,
                            "Tanggal Review": buk.tanggal_review
                        });
                    });
                });
            });
        });

        // Apply RBAC filtering if user is SATKER (or simulating SATKER)
        let targetPic = null;
        let isSatker = false;
        
        if (typeof simulatedPic !== "undefined" && simulatedPic) {
            targetPic = simulatedPic;
            isSatker = true;
        } else if (typeof currentUser !== "undefined" && currentUser && currentUser.role === "SATKER" && currentUser.pic) {
            targetPic = currentUser.pic;
            isSatker = true;
        }
        
        if (isSatker && targetPic) {
            tabelRekomendasi = tabelRekomendasi.filter(r => r.PIC === targetPic);
            
            const validTemuanIds = new Set(tabelRekomendasi.map(r => r["Kode Temuan"]));
            tabelTemuan = tabelTemuan.filter(t => validTemuanIds.has(t["Kode Temuan"]) || 
                tabelTemuan.some(c => c["Parent Temuan"] === t["Kode Temuan"] && validTemuanIds.has(c["Kode Temuan"]))
            );
            
            const validLhaIds = new Set(tabelTemuan.map(t => t["Kode LHP"]));
            masterLHP = masterLHP.filter(l => validLhaIds.has(l["Kode LHP"]));
        }

        setupPicOptions();
        applyFilters();

        // Refresh details if already open
        if (selectedLhaId) {
            showLhaDetail(selectedLhaId);
        }
    } catch (err) {
        console.error("Error loading data from API:", err);
        alert("Gagal memuat data dari server. Pastikan API backend telah aktif.");
    }
}

// Validate and preview selected file in Form Bukti Tindak Lanjut
function handleBuktiFileChange(inputEl, previewId) {
    const previewEl = document.getElementById(previewId);
    if (!previewEl) return;

    const file = inputEl.files && inputEl.files[0];
    if (!file) {
        previewEl.classList.add("hidden");
        previewEl.innerHTML = "";
        return;
    }

    const ext = file.name.split('.').pop().toLowerCase();
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    const sizeKB = (file.size / 1024).toFixed(0);
    const displaySize = file.size >= 1024 * 1024 ? `${sizeMB} MB` : `${sizeKB} KB`;

    previewEl.classList.remove("hidden");

    if (!ALLOWED_FILE_EXTENSIONS.includes(ext)) {
        previewEl.className = "mt-2 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium flex items-center gap-2";
        previewEl.innerHTML = `<i class="fa-solid fa-triangle-exclamation text-rose-600"></i> <span>Format <strong>.${ext}</strong> tidak didukung! Pilih file PDF, PNG, JPG, JPEG, DOC/DOCX, atau XLS/XLSX.</span>`;
        inputEl.value = "";
        return;
    }

    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
        previewEl.className = "mt-2 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium flex items-center gap-2";
        previewEl.innerHTML = `<i class="fa-solid fa-triangle-exclamation text-rose-600"></i> <span>Ukuran file (<strong>${displaySize}</strong>) melebihi batas maksimal <strong>${MAX_UPLOAD_SIZE_MB} MB</strong>!</span>`;
        inputEl.value = "";
        return;
    }

    previewEl.className = "mt-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium flex items-center justify-between gap-2";
    previewEl.innerHTML = `
        <div class="flex items-center gap-2 truncate">
            <i class="fa-solid fa-circle-check text-emerald-600"></i>
            <span class="truncate font-semibold">${file.name}</span>
        </div>
        <span class="px-2.5 py-0.5 rounded-md bg-white border border-emerald-200 text-xs font-bold text-emerald-700 shrink-0">${ext.toUpperCase()} • ${displaySize}</span>
    `;
}

// Handle Bukti Submission by Satker
async function handleBuktiSubmit(event, kode_rekomendasi) {
    event.preventDefault();
    const form = event.target;
    const realisasiVal = form.tanggal_realisasi ? form.tanggal_realisasi.value : (form.tanggal_mulai ? form.tanggal_mulai.value : "");

    const fileInput = form.querySelector('input[type="file"]');

    if (fileInput && fileInput.files && fileInput.files[0]) {
        const file = fileInput.files[0];
        const ext = file.name.split('.').pop().toLowerCase();
        if (!ALLOWED_FILE_EXTENSIONS.includes(ext)) {
            alert(`Format file .${ext} tidak didukung. Harap unggah file berformat PDF, PNG, JPG, JPEG, DOC/DOCX, atau XLS/XLSX.`);
            return;
        }
        if (file.size > MAX_UPLOAD_SIZE_BYTES) {
            alert(`Ukuran file melebihi batas maksimal ${MAX_UPLOAD_SIZE_MB} MB.`);
            return;
        }
    }

    const formData = new FormData(form);
    formData.append("kode_rekomendasi", kode_rekomendasi);
    
    try {
        const response = await fetch(`${API_BASE}/bukti`, {
            method: "POST",
            body: formData
        });
        
        if (!response.ok) {
            let errMsg = "Gagal mengirimkan bukti tindak lanjut.";
            try {
                const errData = await response.json();
                if (errData.detail) errMsg = errData.detail;
            } catch (_) {}
            throw new Error(errMsg);
        }
        
        alert("Bukti tindak lanjut berhasil dikirim! Status berubah menjadi PROSES menunggu review auditor.");
        form.reset();
        loadDataFromAPI(); // reload data from backend
    } catch (err) {
        console.error(err);
        alert("Gagal mengirimkan bukti: " + err.message);
    }
}

// Handle Auditor Review Submission
async function submitReview(bukti_id, status_review, event) {
    event.preventDefault();
    const commentInput = document.getElementById(`reviewComment_${bukti_id}`);
    const catatan_auditor = commentInput ? commentInput.value : "";
    
    try {
        const response = await fetch(`${API_BASE}/bukti/${bukti_id}/review`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                status_review: status_review,
                catatan_auditor: catatan_auditor
            })
        });
        
        if (!response.ok) throw new Error("Gagal menyimpan hasil evaluasi.");
        
        alert(`Evaluasi disimpan! Rekomendasi di-update menjadi status: ${status_review}`);
        loadDataFromAPI();
    } catch (err) {
        console.error(err);
        alert("Gagal menyimpan review: " + err.message);
    }
}

// Handle BATL Generation by Auditor
async function handleBatlCreate(event, kode_lha) {
    event.preventDefault();
    const nomor_batl = document.getElementById('nomorBatlInput').value;
    
    try {
        const response = await fetch(`${API_BASE}/batl`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                kode_lha: kode_lha,
                nomor_batl: nomor_batl,
                tanggal_penerbitan: new Date().toISOString()
            })
        });
        
        if (!response.ok) throw new Error("Gagal menerbitkan Berita Acara.");
        
        alert(`Berita Acara Tindak Lanjut (BATL) dengan Nomor: ${nomor_batl} berhasil diterbitkan & ditandatangani!`);
        loadDataFromAPI();
    } catch (err) {
        console.error(err);
        alert("Gagal menerbitkan BATL: " + err.message);
    }
}

// Submit login credentials to backend
async function submitLogin(username, password) {
    const response = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, password })
    });
    
    let responseData = null;
    try {
        responseData = await response.json();
    } catch (_) {}

    if (!response.ok) {
        throw new Error((responseData && responseData.detail) || "Login gagal. Username atau password salah.");
    }
    
    return responseData || {};
}

// CRUD Operations for Master Data Audit
async function submitLHA(lhaData, isEdit = false, oldKode = "") {
    const url = isEdit ? `${API_BASE}/lha/${oldKode}` : `${API_BASE}/lha`;
    const method = isEdit ? "PUT" : "POST";
    const response = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(lhaData)
    });
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || "Gagal menyimpan LHA.");
    }
    return await response.json();
}

async function deleteLHA(kode_lha) {
    const response = await fetch(`${API_BASE}/lha/${kode_lha}`, { method: "DELETE" });
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || "Gagal menghapus LHA.");
    }
    return await response.json();
}

async function submitTemuan(temuanData, isEdit = false, oldKode = "") {
    const url = isEdit ? `${API_BASE}/temuan/${oldKode}` : `${API_BASE}/temuan`;
    const method = isEdit ? "PUT" : "POST";
    const response = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(temuanData)
    });
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || "Gagal menyimpan Temuan.");
    }
    return await response.json();
}

async function deleteTemuan(kode_temuan) {
    const response = await fetch(`${API_BASE}/temuan/${kode_temuan}`, { method: "DELETE" });
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || "Gagal menghapus Temuan.");
    }
    return await response.json();
}

async function submitRekomendasi(recData, isEdit = false, oldKode = "") {
    const url = isEdit ? `${API_BASE}/rekomendasi/${oldKode}` : `${API_BASE}/rekomendasi`;
    const method = isEdit ? "PUT" : "POST";
    const response = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(recData)
    });
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || "Gagal menyimpan Rekomendasi.");
    }
    return await response.json();
}

async function deleteRekomendasi(kode_rekomendasi) {
    const response = await fetch(`${API_BASE}/rekomendasi/${kode_rekomendasi}`, { method: "DELETE" });
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || "Gagal menghapus Rekomendasi.");
    }
    return await response.json();
}
