const host = window.location.hostname || "127.0.0.1";
const API_BASE = `http://${host}:8000/api`;
const UPLOADS_BASE = `http://${host}:8000/uploads`;

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
                "Tahun": lha.tahun,
                "Status Laporan": lha.status_laporan
            });
            lha.temuan.forEach(tem => {
                tabelTemuan.push({
                    "Kode Temuan": tem.kode_temuan,
                    "Kode LHP": tem.kode_lha,
                    "Parent Temuan": tem.parent_temuan,
                    "Kriteria": tem.kriteria,
                    "Sebab": tem.sebab,
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
                        "Selisih": parseFloat(rec.selisih) || 0.0
                    });
                    
                    rec.bukti.forEach(buk => {
                        tabelProgres.push({
                            "id": buk.id,
                            "Kode Rekomendasi": buk.kode_rekomendasi,
                            "Output Aktual (Progres)": buk.output_aktual,
                            "Status": buk.status_review,
                            "File Bukti Path": buk.file_bukti_path,
                            "NTPN": buk.ntpn,
                            "Catatan Auditor": buk.catatan_auditor
                        });
                    });
                });
            });
        });

        // Apply RBAC filtering if user is SATKER
        if (typeof currentUser !== "undefined" && currentUser && currentUser.role === "SATKER" && currentUser.pic) {
            const userPic = currentUser.pic;
            tabelRekomendasi = tabelRekomendasi.filter(r => r.PIC && r.PIC.includes(userPic));
            
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
        alert("Gagal memuat data dari server. Pastikan API FastAPI telah berjalan di http://127.0.0.1:8000");
    }
}

// Handle Bukti Submission by Satker
async function handleBuktiSubmit(event, kode_rekomendasi) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    formData.append("kode_rekomendasi", kode_rekomendasi);
    
    try {
        const response = await fetch(`${API_BASE}/bukti`, {
            method: "POST",
            body: formData
        });
        
        if (!response.ok) throw new Error("Gagal mengirimkan bukti tindak lanjut.");
        
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
    
    if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || "Login gagal. Username atau password salah.");
    }
    
    return await response.json();
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
