// Local state mirroring API
let masterLHP = [];
let tabelTemuan = [];
let tabelRekomendasi = [];
let tabelProgres = [];

let filteredLHA = [];
let selectedLhaId = null;
let selectedTemuanId = null;

let currentRole = "AUDITOR"; // Default Role: AUDITOR or SATKER
let currentUser = null;      // Logged in user object
let simulatedPic = null;     // Simulated Satker PIC in Dev Mode

// Initialize App
window.addEventListener('DOMContentLoaded', () => {
    checkAuthSession();
});

// Check if user is logged in (persisted in localStorage)
function checkAuthSession() {
    const savedUser = localStorage.getItem("currentUser");
    const loginCard = document.getElementById("loginCardSection");
    const dashboardMain = document.getElementById("dashboardMainSection");
    const headerProfile = document.getElementById("headerProfileSection");

    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        currentRole = currentUser.role;
        
        // Show/Hide page layouts
        if (loginCard) loginCard.classList.add("hidden");
        if (dashboardMain) dashboardMain.classList.remove("hidden");
        if (headerProfile) {
            headerProfile.classList.remove("hidden");
            renderHeaderProfile();
        }
        
        // Show/Hide Add LHA Button based on role
        const addLhaBtn = document.getElementById("addLhaBtn");
        if (currentUser.role === "AUDITOR") {
            if (addLhaBtn) addLhaBtn.classList.remove("hidden");
        } else {
            if (addLhaBtn) addLhaBtn.classList.add("hidden");
        }
        
        loadDataFromAPI();
    } else {
        // Show login view
        currentUser = null;
        if (loginCard) loginCard.classList.remove("hidden");
        if (dashboardMain) dashboardMain.classList.add("hidden");
        if (headerProfile) headerProfile.classList.add("hidden");
    }
}

// Render profile badge in the top header
function renderHeaderProfile() {
    const badge = document.getElementById('roleBadge');
    if (!badge || !currentUser) return;
    
    if (currentUser.role === "AUDITOR") {
        badge.className = "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-md-primary/10 text-md-primary";
        badge.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-md-primary animate-pulse"></span> Auditor: ${currentUser.username.toUpperCase()}`;
        
        // Show role switcher only for Auditor (admin feature for simulation)
        const switcher = document.getElementById("roleSwitcherContainer");
        if (switcher) switcher.classList.remove("hidden");
        const roleSel = document.getElementById("roleSelector");
        if (roleSel) roleSel.value = currentRole;
    } else {
        badge.className = "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-md-tertiary/10 text-md-tertiary";
        badge.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-md-tertiary animate-pulse"></span> Satker: ${currentUser.pic}`;
        
        // Hide role switcher for Satker
        const switcher = document.getElementById("roleSwitcherContainer");
        if (switcher) switcher.classList.add("hidden");
    }
}

// Handle Login Form Submit
async function handleLoginSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const username = form.username.value.trim();
    const password = form.password.value;
    const errorMsg = document.getElementById("loginErrorMessage");
    
    if (errorMsg) errorMsg.classList.add("hidden");
    
    try {
        const userData = await submitLogin(username, password);
        localStorage.setItem("currentUser", JSON.stringify(userData));
        form.reset();
        checkAuthSession();
    } catch (err) {
        console.error(err);
        if (errorMsg) {
            errorMsg.textContent = err.message;
            errorMsg.classList.remove("hidden");
        } else {
            alert(err.message);
        }
    }
}

// Handle Logout
function handleLogout() {
    localStorage.removeItem("currentUser");
    closeDetail();
    checkAuthSession();
}

// Switch user role (Only visible for Auditor for simulation/review convenience)
async function switchRole() {
    if (!currentUser || currentUser.role !== "AUDITOR") return;
    const roleVal = document.getElementById('roleSelector').value;
    
    const badge = document.getElementById('roleBadge');
    const addLhaBtn = document.getElementById("addLhaBtn");
    
    if (roleVal === "AUDITOR") {
        currentRole = "AUDITOR";
        simulatedPic = null;
        badge.className = "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-md-primary/10 text-md-primary";
        badge.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-md-primary animate-pulse"></span> Auditor: ${currentUser.username.toUpperCase()}`;
        if (addLhaBtn) addLhaBtn.classList.remove("hidden");
    } else if (roleVal.startsWith("SATKER:")) {
        currentRole = "SATKER";
        simulatedPic = roleVal.substring(7);
        badge.className = "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-md-tertiary/10 text-md-tertiary";
        badge.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-md-tertiary animate-pulse"></span> Simulasi: ${simulatedPic}`;
        if (addLhaBtn) addLhaBtn.classList.add("hidden");
    }
    
    // Reload and refilter data based on simulatedPic
    await loadDataFromAPI();
}

// Generate PIC options dynamically based on dataset
function setupPicOptions() {
    const pics = new Set();
    tabelRekomendasi.forEach(rec => {
        if (rec.PIC) {
            rec.PIC.split(',').forEach(p => pics.add(p.trim()));
        }
    });
    
    const picFilter = document.getElementById('picFilter');
    if (!picFilter) return;
    
    const currentSelection = picFilter.value;
    picFilter.innerHTML = '<option value="ALL">Semua PIC</option>';
    
    // If logged in as Satker, lock the PIC filter to their PIC
    if (currentUser && currentUser.role === "SATKER") {
        const opt = document.createElement('option');
        opt.value = currentUser.pic;
        opt.textContent = currentUser.pic;
        picFilter.appendChild(opt);
        picFilter.value = currentUser.pic;
        picFilter.disabled = true; // Lock filter for Satker
    } else {
        picFilter.disabled = false;
        Array.from(pics).sort().forEach(pic => {
            const opt = document.createElement('option');
            opt.value = pic;
            opt.textContent = pic;
            picFilter.appendChild(opt);
        });
        picFilter.value = currentSelection;
    }
}

// Compute aggregated status for an LHA based on all its recommendations
function computeLhaStatus(kodeLha) {
    const temuanList = tabelTemuan.filter(t => t["Kode LHP"] === kodeLha);
    if (temuanList.length === 0) return "KOSONG";
    
    let allRecs = [];
    temuanList.forEach(t => {
        allRecs = allRecs.concat(getRecommendationsForFinding(t["Kode Temuan"]));
    });
    
    const uniqueRecs = Array.from(new Set(allRecs.map(r => r["Kode Rekomendasi"])))
        .map(id => allRecs.find(r => r["Kode Rekomendasi"] === id));
    
    if (uniqueRecs.length === 0) return "KOSONG";
    
    const allTuntas = uniqueRecs.every(r => r.Status === "TUNTAS");
    if (allTuntas) return "TUNTAS";
    
    return "PENDING";
}

function computeTemuanStatus(temuanId) {
    const recs = getRecommendationsForFinding(temuanId);
    if (recs.length === 0) return "KOSONG";
    
    const allTuntas = recs.every(r => r.Status === "TUNTAS");
    if (allTuntas) return "TUNTAS";
    
    const anyProses = recs.some(r => r.Status === "PROSES" || r.Status === "TUNTAS");
    if (anyProses) return "PROSES";
    
    return "PENDING";
}

function formatTemuanDate(dateStr) {
    if (!dateStr) return "-";
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr.split('T')[0];
        return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch(e) {
        return dateStr;
    }
}

// Get all unique recommendations under an LHA
function getRecommendationsForLha(kodeLha) {
    const temuanList = tabelTemuan.filter(t => t["Kode LHP"] === kodeLha);
    let allRecs = [];
    temuanList.forEach(t => {
        allRecs = allRecs.concat(getRecommendationsForFinding(t["Kode Temuan"]));
    });
    return Array.from(new Set(allRecs.map(r => r["Kode Rekomendasi"])))
        .map(id => allRecs.find(r => r["Kode Rekomendasi"] === id));
}

// Filter and Refresh everything
function applyFilters() {
    const searchVal = document.getElementById('searchInput').value.toLowerCase();
    const sourceVal = document.getElementById('sourceFilter').value;
    const picVal = document.getElementById('picFilter').value;
    const statusVal = document.getElementById('statusFilter').value;

    filteredLHA = masterLHP.filter(lha => {
        // Search: match kode LHP, or any temuan kriteria/sebab under it, or any rekomendasi text
        let matchSearch = !searchVal;
        if (!matchSearch) {
            if (lha["Kode LHP"] && lha["Kode LHP"].toLowerCase().includes(searchVal)) matchSearch = true;
            if (!matchSearch) {
                const temuanList = tabelTemuan.filter(t => t["Kode LHP"] === lha["Kode LHP"]);
                matchSearch = temuanList.some(t => 
                    (t.Kriteria && t.Kriteria.toLowerCase().includes(searchVal)) ||
                    (t["Kode Temuan"] && t["Kode Temuan"].toLowerCase().includes(searchVal)) ||
                    (t.Sebab && t.Sebab.toLowerCase().includes(searchVal))
                );
            }
        }

        // Source filter
        const matchSource = (sourceVal === "ALL") || (lha["Sumber Audit"] === sourceVal);

        // PIC filter: check if any recommendation under this LHA matches the PIC
        let matchPic = (picVal === "ALL");
        if (!matchPic) {
            const recs = getRecommendationsForLha(lha["Kode LHP"]);
            matchPic = recs.some(r => r.PIC && r.PIC.includes(picVal));
        }

        // Status filter: compare against computed LHA status
        let matchStatus = (statusVal === "ALL");
        if (!matchStatus) {
            const lhaStatus = computeLhaStatus(lha["Kode LHP"]);
            matchStatus = (lhaStatus === statusVal);
        }

        return matchSearch && matchSource && matchPic && matchStatus;
    });

    renderLhaList();
    calculateKPIs();
    renderCharts();
    
    if (selectedLhaId) {
        const selectedStillVisible = filteredLHA.some(l => l["Kode LHP"] === selectedLhaId);
        if (selectedStillVisible) {
            showLhaDetail(selectedLhaId);
        } else {
            closeDetail();
        }
    }
}

function resetFilters() {
    document.getElementById('searchInput').value = "";
    document.getElementById('sourceFilter').value = "ALL";
    if (currentUser && currentUser.role !== "SATKER") {
        document.getElementById('picFilter').value = "ALL";
    }
    document.getElementById('statusFilter').value = "ALL";
    applyFilters();
}

function getRecommendationsForFinding(temuanId) {
    let recs = tabelRekomendasi.filter(r => r["Kode Temuan"] === temuanId);
    const children = tabelTemuan.filter(t => t["Parent Temuan"] === temuanId);
    children.forEach(c => {
        recs = recs.concat(tabelRekomendasi.filter(r => r["Kode Temuan"] === c["Kode Temuan"]));
    });
    return recs;
}

function getRecommendationStatus(recId) {
    const rec = tabelRekomendasi.find(r => r["Kode Rekomendasi"] === recId);
    return rec ? rec.Status : "PENDING";
}

// KPI Calculations — now based on filteredLHA
function calculateKPIs() {
    // Gather all temuan under filtered LHAs
    let allFilteredTemuan = [];
    filteredLHA.forEach(lha => {
        allFilteredTemuan = allFilteredTemuan.concat(tabelTemuan.filter(t => t["Kode LHP"] === lha["Kode LHP"]));
    });

    document.getElementById('kpiTotalTemuan').textContent = allFilteredTemuan.length;
    
    const subFindings = allFilteredTemuan.filter(t => t["Parent Temuan"] !== null);
    document.getElementById('kpiSubTemuanCount').textContent = subFindings.length + ' Sub-temuan';

    let assocRecs = [];
    allFilteredTemuan.forEach(t => {
        assocRecs = assocRecs.concat(getRecommendationsForFinding(t["Kode Temuan"]));
    });
    const uniqueRecs = Array.from(new Set(assocRecs.map(r => r["Kode Rekomendasi"])))
        .map(id => assocRecs.find(r => r["Kode Rekomendasi"] === id));

    document.getElementById('kpiTotalRekomendasi').textContent = uniqueRecs.length;
    
    const planCount = uniqueRecs.filter(r => r["Rencana Aksi"]).length;
    document.getElementById('kpiRencanaAksiCount').textContent = planCount + ' Rencana Aksi';

    let finishedCount = 0;
    uniqueRecs.forEach(r => {
        if (r.Status === "TUNTAS") finishedCount++;
    });
    
    const percent = uniqueRecs.length > 0 ? (finishedCount / uniqueRecs.length) * 100 : 0.0;
    document.getElementById('kpiPercentPenyelesaian').textContent = percent.toFixed(1) + '%';
    document.getElementById('kpiProgressBar').style.width = percent + '%';
    document.getElementById('kpiFinishedRecs').textContent = finishedCount + ' Selesai';

    // Financial Calculations
    let targetTotal = 0;
    let realisasiTotal = 0;
    let selisihTotal = 0;

    uniqueRecs.forEach(r => {
        if (r["Kode Rekomendasi"].startsWith("R-INSP")) {
            targetTotal += r["Nilai Temuan"] || 0;
            realisasiTotal += r["Nilai Realisasi"] || 0;
            selisihTotal += r["Selisih"] || 0;
        }
    });

    document.getElementById('kpiRecoveryTarget').textContent = 'dari Target Rp ' + formatIDR(targetTotal);
    document.getElementById('kpiRecoveryRealisasi').textContent = 'Rp ' + formatIDR(realisasiTotal);
    document.getElementById('kpiRecoverySelisih').textContent = 'Sisa: Rp ' + formatIDR(selisihTotal);

    const recoveryPercent = targetTotal > 0 ? (realisasiTotal / targetTotal) * 100 : 0;
    document.getElementById('kpiRecoveryPercent').textContent = recoveryPercent.toFixed(0) + '% Setor';
    document.getElementById('kpiRecoveryProgressBar').style.width = recoveryPercent + '%';
}

function formatIDR(num) {
    if (num >= 1000000000) {
        return (num / 1000000000).toFixed(2) + ' Miliar';
    } else if (num >= 1000000) {
        return (num / 1000000).toFixed(2) + ' Juta';
    } else {
        return num.toLocaleString('id-ID');
    }
}

// Render the LHA list in the left panel
function renderLhaList() {
    const listContainer = document.getElementById('lhaListContainer');
    listContainer.innerHTML = "";

    if (filteredLHA.length === 0) {
        listContainer.innerHTML = `
            <div class="text-center p-8 text-md-on-surface-variant/60">
                <i class="fa-solid fa-folder-open text-3xl mb-2"></i>
                <p class="text-xs">Tidak ada dokumen LHA yang cocok dengan filter.</p>
            </div>`;
        document.getElementById('filteredLhaCount').textContent = "0";
        return;
    }

    document.getElementById('filteredLhaCount').textContent = filteredLHA.length;

    filteredLHA.forEach(lha => {
        const el = createLhaListEl(lha);
        listContainer.appendChild(el);
    });
}

function createLhaListEl(lha) {
    const el = document.createElement('div');
    const kodeLha = lha["Kode LHP"];
    const isSelected = selectedLhaId === kodeLha;
    
    const selectedClass = isSelected 
        ? "bg-md-secondary-container ring-1 ring-md-primary/30" 
        : "bg-md-background hover:bg-md-surface-container-low/50 shadow-sm";

    el.className = 'rounded-2xl transition-all duration-300 flex flex-col gap-2.5 border border-md-outline/5 p-4 ' + selectedClass + ' hover:scale-[1.01] active:scale-[0.99]';

    const source = lha["Sumber Audit"] || "Audit";
    const sourceBadgeColor = source === "BPK-RI" ? "bg-md-primary text-white" : "bg-md-tertiary text-white";

    const temuanCount = tabelTemuan.filter(t => t["Kode LHP"] === kodeLha).length;
    const recs = getRecommendationsForLha(kodeLha);
    const finishedRecs = recs.filter(r => r.Status === "TUNTAS");
    const lhaStatus = computeLhaStatus(kodeLha);

    const statusConfig = {
        "TUNTAS": { bg: "bg-green-100 text-green-800 border-green-200", icon: "fa-circle-check" },
        "PROSES": { bg: "bg-amber-100 text-amber-800 border-amber-200", icon: "fa-spinner" },
        "PENDING": { bg: "bg-red-100 text-red-800 border-red-200", icon: "fa-clock" },
        "KOSONG": { bg: "bg-gray-100 text-gray-500 border-gray-200", icon: "fa-minus" },
    };
    const sc = statusConfig[lhaStatus] || statusConfig["PENDING"];

    const progressPercent = recs.length > 0 ? (finishedRecs.length / recs.length) * 100 : 0;

    el.innerHTML = `
        <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-2 flex-wrap">
                <span class="text-xs font-bold text-md-on-background bg-md-surface-container-low/75 px-2.5 py-0.5 rounded-full">${kodeLha}</span>
                <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${sourceBadgeColor}">${source}</span>
                <span class="text-[10px] font-medium text-md-on-surface-variant bg-md-surface-container-low px-2 py-0.5 rounded-full">${lha.Tahun || '2025'}</span>
            </div>
            <span class="text-[10px] font-bold border px-2 py-0.5 rounded-full ${sc.bg} flex items-center gap-1">
                <i class="fa-solid ${sc.icon} text-[8px]"></i> ${lhaStatus}
            </span>
        </div>
        <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-3 text-[10px] text-md-on-surface-variant">
                <span class="font-medium"><i class="fa-solid fa-magnifying-glass text-[9px] mr-0.5"></i> ${temuanCount} Temuan</span>
                <span class="font-medium"><i class="fa-solid fa-clipboard-list text-[9px] mr-0.5"></i> ${recs.length} Rekomendasi</span>
            </div>
            <span class="text-[10px] font-semibold text-md-on-surface-variant">${finishedRecs.length}/${recs.length} Tuntas</span>
        </div>
        <!-- Mini Progress Bar -->
        <div class="w-full bg-md-surface-container-low rounded-full h-1.5 mt-2">
            <div class="h-1.5 rounded-full transition-all duration-500 ${lhaStatus === 'TUNTAS' ? 'bg-green-500' : lhaStatus === 'PROSES' ? 'bg-amber-500' : 'bg-red-400'}" style="width: ${progressPercent}%"></div>
        </div>
        <button onclick="selectLha('${kodeLha}')" class="self-end px-3.5 py-1.5 rounded-full bg-md-primary text-white text-[10px] font-bold hover:shadow-md active:scale-95 transition-all flex items-center gap-1.5 mt-2 cursor-pointer">
            <i class="fa-solid fa-eye text-[9px]"></i> Detail
        </button>
    `;
    return el;
}

function selectLha(kodeLha) {
    selectedLhaId = kodeLha;
    selectedTemuanId = null; // Reset to list of findings
    renderLhaList();
    showLhaDetail(kodeLha);
}

function closeDetail() {
    selectedLhaId = null;
    selectedTemuanId = null;
    const fallbackState = document.getElementById('detailFallbackState');
    const contentState = document.getElementById('detailContentState');
    if (fallbackState) fallbackState.classList.remove('hidden');
    if (contentState) contentState.classList.add('hidden');
}

function selectTemuanDetail(temuanId) {
    selectedTemuanId = temuanId;
    showLhaDetail(selectedLhaId);
}

function goBackToFindings() {
    selectedTemuanId = null;
    showLhaDetail(selectedLhaId);
}

function showLhaDetail(kodeLha) {
    const lha = masterLHP.find(l => l["Kode LHP"] === kodeLha);
    if (!lha) return;

    const fallbackState = document.getElementById('detailFallbackState');
    const content = document.getElementById('detailContentState');
    if (fallbackState) fallbackState.classList.add('hidden');
    if (content) content.classList.remove('hidden');

    const source = lha["Sumber Audit"] || "BPK-RI";
    const sourceBadgeColor = source === "BPK-RI" ? "bg-md-primary text-white" : "bg-md-tertiary text-white";
    const lhaStatus = computeLhaStatus(kodeLha);
    const statusConfig = {
        "TUNTAS": { bg: "bg-green-100 text-green-800 border-green-200", icon: "fa-circle-check" },
        "PROSES": { bg: "bg-amber-100 text-amber-800 border-amber-200", icon: "fa-spinner" },
        "PENDING": { bg: "bg-red-100 text-red-800 border-red-200", icon: "fa-clock" },
        "KOSONG": { bg: "bg-gray-100 text-gray-500 border-gray-200", icon: "fa-minus" },
    };
    const sc = statusConfig[lhaStatus] || statusConfig["PENDING"];

    // Get all temuan under this LHA
    const temuanList = tabelTemuan.filter(t => t["Kode LHP"] === kodeLha);
    const parentTemuan = temuanList.filter(t => t["Parent Temuan"] === null);

    // All recs under this LHA for BATL calculation
    const allLhaRecs = getRecommendationsForLha(kodeLha);
    const isAllTuntas = allLhaRecs.length > 0 && allLhaRecs.every(r => r.Status === "TUNTAS");
    const isBatlIssued = lha["Status Laporan"] && lha["Status Laporan"].includes("BATL");

    // BATL Section
    let batlHTML = "";
    if (isBatlIssued) {
        batlHTML = `
            <div class="p-4 rounded-2xl bg-green-50 border border-green-200 text-center">
                <i class="fa-solid fa-file-signature text-green-600 text-3xl mb-2"></i>
                <h5 class="text-xs font-bold text-green-800">Berita Acara Tindak Lanjut (BATL) Terbit</h5>
                <p class="text-[10px] text-green-700 mt-1">Laporan Hasil Audit ini telah resmi ditutup dengan penandatanganan BATL.</p>
                <div class="mt-3 flex justify-center gap-2">
                    <a href="#" onclick="alert('Mengunduh dokumen BATL PDF...')" class="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-green-600 text-white text-[10px] font-bold hover:bg-green-700 transition-all">
                        <i class="fa-solid fa-file-arrow-down"></i> Unduh Dokumen BATL
                    </a>
                </div>
            </div>
        `;
    } else if (isAllTuntas && currentRole === "AUDITOR") {
        batlHTML = `
            <div class="p-4 rounded-2xl bg-md-secondary-container/50 border border-md-primary/10 text-center flex flex-col gap-2">
                <i class="fa-solid fa-clipboard-check text-md-primary text-3xl mb-1 animate-pulse"></i>
                <h5 class="text-xs font-bold text-md-on-secondary-container">Terbitkan Berita Acara Tindak Lanjut (BATL)</h5>
                <p class="text-[10px] text-md-on-surface-variant">Seluruh rekomendasi pada LHA ini telah TUNTAS. Penerbitan BATL menandai penutupan resmi.</p>
                <form onsubmit="handleBatlCreate(event, '${kodeLha}')" class="flex flex-col gap-2 mt-2">
                    <input type="text" id="nomorBatlInput" required placeholder="Masukkan Nomor BATL (contoh: BA-2025-001)..." class="w-full p-2 text-xs rounded-xl border border-md-outline/20 focus:outline-none bg-white">
                    <button type="submit" class="w-full py-2 rounded-full bg-md-primary text-white text-[10px] font-bold hover:shadow-md active:scale-95 transition-all">
                        Terbitkan & Tandatangani BATL (TTE)
                    </button>
                </form>
            </div>
        `;
    }

    // Build temuan sections HTML
    let temuanSectionsHTML = "";
    if (parentTemuan.length === 0 && temuanList.length === 0) {
        temuanSectionsHTML = `
            <div class="text-center p-8 text-md-on-surface-variant/60">
                <i class="fa-solid fa-clipboard-question text-3xl mb-2"></i>
                <p class="text-xs">Belum ada temuan pada dokumen LHA ini.</p>
                ${currentRole === "AUDITOR" ? `
                <button onclick="openTemuanModal('${kodeLha}', false)" class="mt-3 px-4 py-1.5 rounded-full bg-md-primary text-white text-[10px] font-bold hover:shadow-md active:scale-95 transition-all">
                    <i class="fa-solid fa-plus text-[9px]"></i> Tambah Temuan Pertama
                </button>` : ''}
            </div>
        `;
    } else {
        // Build each temuan block with its children and recommendations
        const processTemuan = (t, isChild = false) => {
            const recs = getRecommendationsForFinding(t["Kode Temuan"]);
            
            let recsHTML = "";
            if (recs.length > 0) {
                recsHTML = recs.map(rec => {
                    const status = rec.Status;
                    const statusBadgeClass = status === "TUNTAS" 
                        ? "bg-green-100 text-green-800 border-green-200" 
                        : status === "PROSES" 
                        ? "bg-amber-100 text-amber-800 border-amber-200" 
                        : "bg-red-100 text-red-800 border-red-200";

                    // Financial metrics
                    let financialHTML = "";
                    if (rec["Kode Rekomendasi"].startsWith("R-INSP")) {
                        financialHTML = `
                            <div class="mt-3 grid grid-cols-3 gap-2 bg-md-surface-container-low/50 p-2.5 rounded-xl border border-md-outline/5 text-center">
                                <div>
                                    <p class="text-[9px] text-md-on-surface-variant font-bold">TARGET PENYETORAN</p>
                                    <p class="text-xs font-bold text-md-on-background">Rp ${(rec["Nilai Temuan"] || 0).toLocaleString('id-ID')}</p>
                                </div>
                                <div>
                                    <p class="text-[9px] text-green-700 font-bold">REALISASI SETOR</p>
                                    <p class="text-xs font-bold text-green-600">Rp ${(rec["Nilai Realisasi"] || 0).toLocaleString('id-ID')}</p>
                                </div>
                                <div>
                                    <p class="text-[9px] text-red-700 font-bold">DEFISIT/SELISIH</p>
                                    <p class="text-xs font-bold text-red-600">Rp ${(rec["Selisih"] || 0).toLocaleString('id-ID')}</p>
                                </div>
                            </div>
                        `;
                    }

                    // Progress logs
                    const progressLogs = tabelProgres.filter(p => p["Kode Rekomendasi"] === rec["Kode Rekomendasi"]);
                    let progressHTML = "";
                    if (progressLogs.length > 0) {
                        progressHTML = `
                            <div class="mt-3">
                                <h5 class="text-[10px] font-bold text-md-on-surface-variant mb-1.5 tracking-wider uppercase">Log Capaian / Progres Tindak Lanjut:</h5>
                                <ul class="space-y-2">
                                    ${progressLogs.map(log => {
                                        let fileLinkHTML = "";
                                        if (log["File Bukti Path"]) {
                                            const filename = log["File Bukti Path"].split(/[\/\\]/).pop();
                                            fileLinkHTML = `
                                                <div class="mt-1">
                                                    <a href="${UPLOADS_BASE}/${filename}" target="_blank" class="inline-flex items-center gap-1 text-[10px] text-md-primary font-bold hover:underline bg-md-primary/5 px-2 py-0.5 rounded-full">
                                                        <i class="fa-solid fa-file-pdf"></i> Lihat Bukti Dokumen
                                                    </a>
                                                </div>
                                            `;
                                        }

                                        let reviewFormHTML = "";
                                        if (currentRole === "AUDITOR" && log["Status"] === "PENDING") {
                                            reviewFormHTML = `
                                                <div class="mt-2 p-2 bg-md-surface-container-low rounded-xl border border-md-outline/10">
                                                    <p class="text-[9px] font-bold text-md-on-background uppercase mb-1"><i class="fa-solid fa-gavel text-md-primary"></i> Evaluasi Auditor:</p>
                                                    <div class="flex flex-col gap-1.5">
                                                        <div class="flex gap-2">
                                                            <button onclick="submitReview(${log.id}, 'TUNTAS', event)" class="px-2.5 py-1 text-[10px] font-bold rounded-full bg-green-600 text-white hover:bg-green-700 active:scale-95 transition-all">Setujui (TUNTAS)</button>
                                                            <button onclick="submitReview(${log.id}, 'PROSES', event)" class="px-2.5 py-1 text-[10px] font-bold rounded-full bg-amber-600 text-white hover:bg-amber-700 active:scale-95 transition-all">Tolak / Revisi (PROSES)</button>
                                                        </div>
                                                        <input type="text" id="reviewComment_${log.id}" placeholder="Catatan evaluasi (opsional)..." class="w-full px-2 py-1 text-[10px] rounded-lg border border-md-outline/20 bg-white">
                                                    </div>
                                                </div>
                                            `;
                                        }

                                        let auditorNotesHTML = "";
                                        if (log["Catatan Auditor"]) {
                                            auditorNotesHTML = `<p class="text-[10px] text-md-on-surface-variant italic mt-0.5">Catatan Auditor: "${log["Catatan Auditor"]}"</p>`;
                                        }

                                        const logStatusClass = log["Status"] === "TUNTAS" 
                                            ? "bg-green-100 text-green-800" 
                                            : log["Status"] === "PROSES" 
                                            ? "bg-amber-100 text-amber-800" 
                                            : "bg-red-100 text-red-800";

                                        return `
                                            <li class="p-2.5 bg-md-surface-container-low/50 rounded-xl border border-md-outline/5">
                                                <div class="flex items-start justify-between gap-1">
                                                    <p class="text-xs font-medium text-md-on-background leading-relaxed">${log["Output Aktual (Progres)"]}</p>
                                                    <span class="text-[9px] font-bold px-1.5 py-0.2 rounded ${logStatusClass}">${log["Status"]}</span>
                                                </div>
                                                ${log["NTPN"] ? `<p class="text-[9px] text-md-primary font-bold mt-0.5">NTPN: ${log["NTPN"]}</p>` : ""}
                                                ${fileLinkHTML}
                                                ${auditorNotesHTML}
                                                ${reviewFormHTML}
                                            </li>
                                        `;
                                    }).join('')}
                                </ul>
                            </div>
                        `;
                    }

                    // Satker upload form
                    let satkerInputFormHTML = "";
                    if (currentRole === "SATKER" && status !== "TUNTAS") {
                        const isFinancial = rec["Kode Rekomendasi"].startsWith("R-INSP");
                        satkerInputFormHTML = `
                            <div class="mt-3 p-3 bg-md-surface-container-low/60 rounded-2xl border border-dashed border-md-outline/20">
                                <h6 class="text-[10px] font-bold text-md-primary uppercase tracking-wider mb-2"><i class="fa-solid fa-upload"></i> Unggah Bukti Tindak Lanjut:</h6>
                                <form id="form_${rec["Kode Rekomendasi"]}" onsubmit="handleBuktiSubmit(event, '${rec["Kode Rekomendasi"]}')" class="flex flex-col gap-2">
                                    <textarea name="output_aktual" required rows="2" placeholder="Uraikan progres tindak lanjut..." class="w-full p-2 text-xs rounded-xl border border-md-outline/20 focus:outline-none focus:ring-1 focus:ring-md-primary bg-white"></textarea>
                                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        <div>
                                            <label class="text-[9px] font-bold text-md-on-surface-variant ml-1 block mb-0.5">Berkas Bukti (PDF)</label>
                                            <input type="file" name="file" accept="application/pdf" class="w-full text-[10px] cursor-pointer">
                                        </div>
                                        ${isFinancial ? `
                                        <div>
                                            <label class="text-[9px] font-bold text-md-on-surface-variant ml-1 block mb-0.5">Nomor NTPN (Penyetoran)</label>
                                            <input type="text" name="ntpn" placeholder="Masukkan NTPN..." class="w-full p-1 text-xs rounded-lg border border-md-outline/20 bg-white">
                                        </div>` : ''}
                                    </div>
                                    <button type="submit" class="mt-1 px-4 py-1.5 self-end rounded-full bg-md-primary text-white text-[10px] font-bold hover:shadow-md active:scale-95 transition-all duration-300">
                                        Kirim Bukti
                                    </button>
                                </form>
                            </div>
                        `;
                    }

                    return `
                        <div class="p-3.5 rounded-2xl bg-md-background border border-md-outline/10 shadow-sm flex flex-col gap-3">
                            <div class="flex items-center justify-between gap-2">
                                <div class="flex items-center gap-2 flex-wrap">
                                    <span class="text-xs font-bold text-md-primary bg-md-secondary-container px-2 py-0.5 rounded-full">${rec["Kode Rekomendasi"]}</span>
                                    <span class="text-[10px] font-bold bg-md-surface-container-low text-md-on-surface-variant px-2.5 py-0.5 rounded-full">PIC: ${rec["PIC"]}</span>
                                </div>
                                <div class="flex items-center gap-1.5">
                                    <span class="text-[10px] font-bold border px-2 py-0.5 rounded-full ${statusBadgeClass}">${status}</span>
                                    ${currentRole === "AUDITOR" ? `
                                    <button onclick="openRekomendasiModal('${t["Kode Temuan"]}', true, '${rec["Kode Rekomendasi"]}')" class="p-1 rounded-full text-md-primary hover:bg-md-primary/10 active:scale-90 transition-all text-[10px]" title="Edit Rekomendasi"><i class="fa-solid fa-pen"></i></button>
                                    <button onclick="triggerDeleteRekomendasi('${rec["Kode Rekomendasi"]}')" class="p-1 rounded-full text-red-600 hover:bg-red-50 active:scale-90 transition-all text-[10px]" title="Hapus Rekomendasi"><i class="fa-solid fa-trash"></i></button>
                                    ` : ''}
                                </div>
                            </div>
                            <div>
                                <h5 class="text-[10px] font-bold text-md-on-surface-variant tracking-wider uppercase">Rekomendasi BPK/Inspektorat:</h5>
                                <p class="text-xs text-md-on-background mt-0.5 leading-relaxed">${rec["Rekomendasi"]}</p>
                            </div>
                            ${rec["Rencana Aksi"] ? `
                            <div>
                                <h5 class="text-[10px] font-bold text-md-on-surface-variant tracking-wider uppercase">Rencana Aksi Unit Kerja:</h5>
                                <p class="text-xs text-md-on-background mt-0.5 leading-relaxed">${rec["Rencana Aksi"]}</p>
                            </div>` : ''}
                            ${rec["Jadwal Pelaksanaan"] && rec["Jadwal Pelaksanaan"] !== "nan" ? `
                            <div class="text-[10px] text-md-on-surface-variant">
                                <span class="font-bold">Target Pelaksanaan:</span> ${rec["Jadwal Pelaksanaan"]}
                            </div>` : ''}
                            ${financialHTML}
                            ${progressHTML}
                            ${satkerInputFormHTML}
                        </div>
                    `;
                }).join('<hr class="border-md-outline/10 my-1">');
            }

            const childTemuan = temuanList.filter(c => c["Parent Temuan"] === t["Kode Temuan"]);
            let childrenHTML = "";
            if (childTemuan.length > 0) {
                childrenHTML = childTemuan.map(child => processTemuan(child, true)).join('');
            }

            const borderStyle = isChild ? "ml-6 border-l-2 border-dashed border-md-primary/25 pl-4 bg-md-surface-container-low/30" : "bg-white border border-md-outline/10 shadow-sm";

            return `
                <div class="flex flex-col gap-4 p-5 rounded-3xl transition-all duration-300 ${borderStyle}">
                    <!-- Temuan Header -->
                    <div class="flex items-center justify-between border-b border-md-outline/5 pb-3">
                        <div class="flex items-center gap-2 flex-wrap">
                            <span class="text-xs font-bold text-md-primary bg-md-primary/10 px-3 py-1 rounded-full flex items-center gap-1.5">
                                <i class="fa-solid fa-folder-open text-[10px]"></i>
                                ${t["Kode Temuan"]}
                            </span>
                            ${isChild ? '<span class="text-[9px] font-bold text-md-tertiary bg-md-tertiary/10 px-2 py-0.5 rounded-full">Sub-temuan</span>' : ''}
                            <span class="text-[10px] font-bold text-md-on-surface-variant uppercase tracking-wider">Temuan Pemeriksaan</span>
                        </div>
                        ${currentRole === "AUDITOR" ? `
                        <div class="flex gap-1 shrink-0">
                            <button onclick="openTemuanModal('${kodeLha}', true, '${t["Kode Temuan"]}')" class="p-1.5 rounded-full text-md-primary hover:bg-md-primary/10 active:scale-90 transition-all text-xs" title="Edit Temuan"><i class="fa-solid fa-pen"></i></button>
                            <button onclick="triggerDeleteTemuan('${t["Kode Temuan"]}')" class="p-1.5 rounded-full text-red-600 hover:bg-red-50 active:scale-90 transition-all text-xs" title="Hapus Temuan"><i class="fa-solid fa-trash"></i></button>
                        </div>` : ''}
                    </div>

                    <!-- Kriteria & Sebab Content Block -->
                    <div class="flex flex-col gap-3">
                        <!-- Kriteria -->
                        <div class="border-l-4 border-md-primary bg-md-primary/5 p-4 rounded-r-2xl">
                            <h4 class="text-[9px] font-bold text-md-primary tracking-wider uppercase mb-1 flex items-center gap-1">
                                <i class="fa-solid fa-triangle-exclamation"></i> Kriteria Temuan (Masalah / Kondisi)
                            </h4>
                            <p class="text-xs font-medium text-md-on-background leading-relaxed whitespace-pre-line">${t.Kriteria || 'Tidak ada kriteria'}</p>
                        </div>

                        <!-- Sebab -->
                        ${t.Sebab ? `
                        <div class="border-l-4 border-amber-500 bg-amber-500/5 p-4 rounded-r-2xl">
                            <h4 class="text-[9px] font-bold text-amber-700 tracking-wider uppercase mb-1 flex items-center gap-1">
                                <i class="fa-solid fa-circle-question"></i> Penyebab (Sebab)
                            </h4>
                            <p class="text-xs text-md-on-surface-variant leading-relaxed whitespace-pre-line">${t.Sebab}</p>
                        </div>` : ''}
                    </div>

                    <!-- Recommendations under this temuan -->
                    <div class="flex flex-col gap-3 border-t border-md-outline/5 pt-4 mt-1">
                        <div class="flex items-center justify-between">
                            <h4 class="text-xs font-bold text-md-on-background tracking-wider uppercase flex items-center gap-1.5">
                                <i class="fa-solid fa-clipboard-list text-md-primary"></i>
                                Rekomendasi (${recs.length})
                            </h4>
                            ${currentRole === "AUDITOR" ? `
                            <button onclick="openRekomendasiModal('${t["Kode Temuan"]}', false)" class="px-3 py-1 rounded-full bg-md-primary text-white text-[10px] font-bold hover:shadow active:scale-90 transition-all flex items-center gap-1 cursor-pointer">
                                <i class="fa-solid fa-plus text-[9px]"></i> Rekomendasi
                            </button>` : ''}
                        </div>
                        
                        ${recs.length > 0 ? `
                        <div class="flex flex-col gap-3.5 mt-1">
                            ${recsHTML}
                        </div>` : `
                        <div class="text-center py-4 bg-md-surface-container-low/30 rounded-2xl border border-dashed border-md-outline/10">
                            <p class="text-[10px] text-md-on-surface-variant/60">Belum ada rekomendasi untuk temuan ini.</p>
                            ${currentRole === "AUDITOR" ? `
                            <button onclick="openRekomendasiModal('${t["Kode Temuan"]}', false)" class="mt-2 px-3 py-1 rounded-full bg-md-primary/10 text-md-primary text-[10px] font-bold hover:bg-md-primary/20 active:scale-95 transition-all inline-flex items-center gap-1 cursor-pointer">
                                <i class="fa-solid fa-plus text-[9px]"></i> Tambah Rekomendasi
                            </button>` : ''}
                        </div>
                        `}
                    </div>

                    <!-- Child sub-findings nested -->
                    ${childrenHTML ? `
                    <div class="flex flex-col gap-3 border-t border-md-outline/5 pt-4 mt-1">
                        <h5 class="text-[10px] font-bold text-md-on-surface-variant uppercase tracking-wider">Sub-Temuan Turunan:</h5>
                        <div class="flex flex-col gap-4">
                            ${childrenHTML}
                        </div>
                    </div>` : ''}
                </div>
            `;
        };

        if (selectedTemuanId === null) {
            // Render Findings List
            const listItems = parentTemuan.map(t => {
                const status = computeTemuanStatus(t["Kode Temuan"]);
                const recs = getRecommendationsForFinding(t["Kode Temuan"]);
                const dateStr = formatTemuanDate(t["Tanggal Input"]);
                
                const statusConfig = {
                    "TUNTAS": { bg: "bg-green-100 text-green-800 border-green-200", icon: "fa-circle-check" },
                    "PROSES": { bg: "bg-amber-100 text-amber-800 border-amber-200", icon: "fa-spinner" },
                    "PENDING": { bg: "bg-red-100 text-red-800 border-red-200", icon: "fa-clock" },
                    "KOSONG": { bg: "bg-gray-100 text-gray-500 border-gray-200", icon: "fa-minus" },
                };
                const sc = statusConfig[status] || statusConfig["PENDING"];

                // Find sub-findings under this parent finding
                const children = temuanList.filter(c => c["Parent Temuan"] === t["Kode Temuan"]);
                let childrenHTML = "";
                if (children.length > 0) {
                    childrenHTML = `
                        <div class="flex flex-col gap-3 ml-6 border-l-2 border-dashed border-md-primary/25 pl-4 mt-2">
                            ${children.map(child => {
                                const childStatus = computeTemuanStatus(child["Kode Temuan"]);
                                const childRecs = getRecommendationsForFinding(child["Kode Temuan"]);
                                const childDateStr = formatTemuanDate(child["Tanggal Input"]);
                                const childSc = statusConfig[childStatus] || statusConfig["PENDING"];

                                return `
                                    <div class="bg-md-surface-container-low/50 border border-md-outline/10 p-3.5 rounded-2xl flex flex-col gap-2.5">
                                        <div class="flex items-center justify-between gap-2 border-b border-md-outline/5 pb-2">
                                            <div class="flex items-center gap-1.5 flex-wrap">
                                                <span class="text-[10px] font-bold text-md-primary bg-md-primary/10 px-2.5 py-0.5 rounded-full">
                                                    ${child["Kode Temuan"]}
                                                </span>
                                                <span class="text-[9px] font-medium text-md-on-surface-variant bg-md-surface-container-low px-2 py-0.5 rounded-full">
                                                    Sub-temuan
                                                </span>
                                            </div>
                                            <span class="text-[9px] font-bold border px-2 py-0.2 rounded-full ${childSc.bg} flex items-center gap-0.5">
                                                <i class="fa-solid ${childSc.icon} text-[7px]"></i> ${childStatus}
                                            </span>
                                        </div>
                                        <p class="text-xs text-md-on-surface-variant line-clamp-2 leading-relaxed">
                                            ${child.Kriteria || 'Tidak ada kriteria'}
                                        </p>
                                        <div class="flex items-center justify-between gap-2 border-t border-md-outline/5 pt-2 mt-0.5">
                                            <span class="text-[9px] text-md-on-surface-variant font-medium">
                                                <i class="fa-solid fa-clipboard-list text-[8px] mr-0.5"></i> ${childRecs.length} Rekomendasi
                                            </span>
                                            <div class="flex gap-1.5 items-center">
                                                ${currentRole === "AUDITOR" ? `
                                                <button onclick="openTemuanModal('${kodeLha}', true, '${child["Kode Temuan"]}')" class="p-0.5 rounded-full text-md-primary hover:bg-md-primary/10 active:scale-90 transition-all text-[10px]" title="Edit Temuan"><i class="fa-solid fa-pen"></i></button>
                                                <button onclick="triggerDeleteTemuan('${child["Kode Temuan"]}')" class="p-0.5 rounded-full text-red-600 hover:bg-red-50 active:scale-90 transition-all text-[10px]" title="Hapus Temuan"><i class="fa-solid fa-trash"></i></button>
                                                ` : ''}
                                                <button onclick="selectTemuanDetail('${child["Kode Temuan"]}')" class="px-2.5 py-1 rounded-full bg-md-primary text-white text-[9px] font-bold hover:shadow active:scale-95 transition-all flex items-center gap-1 cursor-pointer">
                                                    <i class="fa-solid fa-eye text-[8px]"></i> Detail
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    `;
                }

                return `
                    <div class="flex flex-col gap-1">
                        <div class="bg-white border border-md-outline/10 p-5 rounded-3xl shadow-sm hover:shadow-md transition-all duration-300 flex flex-col gap-3">
                            <div class="flex items-center justify-between gap-2 border-b border-md-outline/5 pb-2.5">
                                <div class="flex items-center gap-2 flex-wrap">
                                    <span class="text-xs font-bold text-md-primary bg-md-primary/10 px-3 py-1 rounded-full flex items-center gap-1.5">
                                        <i class="fa-solid fa-folder-open text-[10px]"></i>
                                        ${t["Kode Temuan"]}
                                    </span>
                                    <span class="text-[10px] font-medium text-md-on-surface-variant bg-md-surface-container-low px-2 py-0.5 rounded-full">
                                        Tanggal: ${dateStr}
                                    </span>
                                </div>
                                <span class="text-[10px] font-bold border px-2.5 py-0.5 rounded-full ${sc.bg} flex items-center gap-1">
                                    <i class="fa-solid ${sc.icon} text-[8px]"></i> ${status}
                                </span>
                            </div>
                            <p class="text-xs font-medium text-md-on-background line-clamp-2 leading-relaxed">
                                ${t.Kriteria || 'Tidak ada kriteria'}
                            </p>
                            <div class="flex items-center justify-between gap-2 border-t border-md-outline/5 pt-2.5 mt-1">
                                <span class="text-[10px] text-md-on-surface-variant font-semibold">
                                    <i class="fa-solid fa-clipboard-list text-[9px] mr-0.5"></i> ${recs.length} Rekomendasi
                                </span>
                                <div class="flex gap-1.5 items-center">
                                    ${currentRole === "AUDITOR" ? `
                                    <button onclick="openTemuanModal('${kodeLha}', true, '${t["Kode Temuan"]}')" class="p-1 rounded-full text-md-primary hover:bg-md-primary/10 active:scale-90 transition-all text-xs" title="Edit Temuan"><i class="fa-solid fa-pen"></i></button>
                                    <button onclick="triggerDeleteTemuan('${t["Kode Temuan"]}')" class="p-1 rounded-full text-red-600 hover:bg-red-50 active:scale-90 transition-all text-xs" title="Hapus Temuan"><i class="fa-solid fa-trash"></i></button>
                                    ` : ''}
                                    <button onclick="selectTemuanDetail('${t["Kode Temuan"]}')" class="px-3.5 py-1.5 rounded-full bg-md-primary text-white text-[10px] font-bold hover:shadow active:scale-95 transition-all flex items-center gap-1 cursor-pointer">
                                        <i class="fa-solid fa-eye text-[9px]"></i> Detail Temuan
                                    </button>
                                </div>
                            </div>
                        </div>
                        ${childrenHTML}
                    </div>
                `;
            }).join('');

            temuanSectionsHTML = `
                <div class="flex flex-col gap-4">
                    <div class="flex items-center justify-between">
                        <h3 class="text-xs font-bold text-md-on-background tracking-wider uppercase flex items-center gap-1.5">
                            <i class="fa-solid fa-list-check text-md-primary"></i>
                            Daftar Temuan (${parentTemuan.length})
                        </h3>
                        ${currentRole === "AUDITOR" ? `
                        <button onclick="openTemuanModal('${kodeLha}', false)" class="px-3 py-1 rounded-full bg-md-primary text-white text-[10px] font-bold hover:shadow active:scale-90 transition-all flex items-center gap-1 cursor-pointer">
                            <i class="fa-solid fa-plus text-[9px]"></i> Temuan
                        </button>` : ''}
                    </div>
                    <div class="flex flex-col gap-4">
                        ${listItems}
                    </div>
                </div>
            `;
        } else {
            // Render specific Temuan Details
            const t = temuanList.find(x => x["Kode Temuan"] === selectedTemuanId);
            if (!t) {
                selectedTemuanId = null;
                showLhaDetail(kodeLha);
                return;
            }
            
            temuanSectionsHTML = `
                <div class="flex flex-col gap-4">
                    <button onclick="goBackToFindings()" class="self-start px-3.5 py-1.5 rounded-full bg-md-primary/10 text-md-primary text-[10px] font-bold hover:bg-md-primary/20 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer">
                        <i class="fa-solid fa-arrow-left text-[9px]"></i> Kembali ke Daftar Temuan
                    </button>
                    ${processTemuan(t)}
                </div>
            `;
        }
    }

    content.innerHTML = `
        <!-- LHA Detail Header -->
        <div class="p-5 border-b border-md-outline/10 flex items-center justify-between bg-md-surface-container-low/20">
            <div class="flex items-center gap-3 flex-wrap">
                <span class="text-xs font-bold text-md-on-background bg-md-surface-container-low/75 px-3 py-1 rounded-full">${kodeLha}</span>
                <span class="text-xs font-bold px-3 py-1 rounded-full ${sourceBadgeColor}">${source}</span>
                <span class="text-[10px] font-medium text-md-on-surface-variant bg-md-surface-container-low px-2 py-0.5 rounded-full">${lha.Tahun || '2025'}</span>
                <span class="text-[10px] font-bold border px-2.5 py-0.5 rounded-full ${sc.bg} flex items-center gap-1">
                    <i class="fa-solid ${sc.icon} text-[8px]"></i> ${lhaStatus}
                </span>
            </div>
            <div class="flex items-center gap-2">
                ${currentRole === "AUDITOR" ? `
                <button onclick="openTemuanModal('${kodeLha}', false)" class="px-2.5 py-1 rounded-full bg-md-primary text-white text-[10px] font-semibold hover:shadow-sm active:scale-90 transition-all flex items-center gap-1" title="Tambah Temuan ke LHA ini">
                    <i class="fa-solid fa-plus text-[9px]"></i> Temuan
                </button>
                <button onclick="openLhaModal(true, '${kodeLha}')" class="p-1.5 rounded-full text-md-primary hover:bg-md-primary/10 active:scale-90 transition-all text-xs" title="Edit LHA">
                    <i class="fa-solid fa-pen"></i>
                </button>
                <button onclick="triggerDeleteLha('${kodeLha}')" class="p-1.5 rounded-full text-red-600 hover:bg-red-50 active:scale-90 transition-all text-xs" title="Hapus LHA">
                    <i class="fa-solid fa-trash"></i>
                </button>
                ` : ''}
                <button onclick="closeDetail()" class="w-8 h-8 rounded-full bg-md-surface-container-low flex items-center justify-center hover:bg-md-primary/10 active:scale-95 transition-all text-md-on-background">
                    <i class="fa-solid fa-xmark text-sm"></i>
                </button>
            </div>
        </div>

        <!-- Detail Body (Scrollable) -->
        <div class="flex-1 overflow-y-auto p-5 flex flex-col gap-5">
            
            <!-- BATL Section (if applicable) -->
            ${batlHTML}
            ${batlHTML ? '<hr class="border-md-outline/15">' : ''}

            <!-- Dynamically Loaded Findings List or Finding Details -->
            <div class="flex flex-col gap-5">
                ${temuanSectionsHTML}
            </div>
        </div>
    `;
}

// ==========================================
// CRUD DIALOG MODAL HANDLERS
// ==========================================

// 1. LHA Modal
function openLhaModal(isEdit = false, oldKode = "") {
    const modal = document.getElementById("lhaModal");
    const title = document.getElementById("lhaModalTitle");
    const isEditInput = document.getElementById("lhaFormIsEdit");
    const oldKodeInput = document.getElementById("lhaFormOldKode");
    const kodeInput = document.getElementById("lhaFormKode");
    const sumberInput = document.getElementById("lhaFormSumber");
    const tahunInput = document.getElementById("lhaFormTahun");
    const statusInput = document.getElementById("lhaFormStatus");
    
    if (!modal) return;
    modal.classList.remove("hidden");
    
    if (isEdit) {
        title.textContent = "Edit LHA";
        isEditInput.value = "true";
        oldKodeInput.value = oldKode;
        kodeInput.value = oldKode;
        kodeInput.disabled = true; // Cannot edit primary key
        
        const lha = masterLHP.find(l => l["Kode LHP"] === oldKode);
        if (lha) {
            sumberInput.value = lha["Sumber Audit"] || "BPK-RI";
            tahunInput.value = lha["Tahun"] || new Date().getFullYear();
            statusInput.value = lha["Status Laporan"] || "";
        }
    } else {
        title.textContent = "Tambah LHA Baru";
        isEditInput.value = "false";
        oldKodeInput.value = "";
        kodeInput.value = "";
        kodeInput.disabled = false;
        sumberInput.value = "BPK-RI";
        tahunInput.value = new Date().getFullYear();
        statusInput.value = "Dalam Pemantauan";
    }
}

function closeLhaModal() {
    document.getElementById("lhaModal")?.classList.add("hidden");
}

async function handleLhaFormSubmit(event) {
    event.preventDefault();
    const isEdit = document.getElementById("lhaFormIsEdit").value === "true";
    const oldKode = document.getElementById("lhaFormOldKode").value;
    
    const lhaData = {
        kode_lha: document.getElementById("lhaFormKode").value.trim(),
        sumber_audit: document.getElementById("lhaFormSumber").value,
        tahun: parseInt(document.getElementById("lhaFormTahun").value),
        status_laporan: document.getElementById("lhaFormStatus").value.trim()
    };
    
    try {
        await submitLHA(lhaData, isEdit, oldKode);
        alert(isEdit ? "LHA berhasil diperbarui!" : "LHA baru berhasil ditambahkan!");
        closeLhaModal();
        loadDataFromAPI();
    } catch (err) {
        alert(err.message);
    }
}

async function triggerDeleteLha(kode_lha) {
    if (!confirm(`Apakah Anda yakin ingin menghapus LHA dengan kode ${kode_lha}?\nPERINGATAN: Seluruh Temuan, Rekomendasi, dan Bukti di bawah LHA ini akan dihapus secara permanen!`)) return;
    try {
        await deleteLHA(kode_lha);
        alert("LHA berhasil dihapus!");
        closeDetail();
        loadDataFromAPI();
    } catch (err) {
        alert(err.message);
    }
}

// 2. Temuan Modal
function openTemuanModal(lhaKode, isEdit = false, oldKode = "") {
    const modal = document.getElementById("temuanModal");
    const title = document.getElementById("temuanModalTitle");
    const isEditInput = document.getElementById("temuanFormIsEdit");
    const oldKodeInput = document.getElementById("temuanFormOldKode");
    const lhaSelect = document.getElementById("temuanFormLha");
    const kodeInput = document.getElementById("temuanFormKode");
    const kriteriaInput = document.getElementById("temuanFormKriteria");
    const sebabInput = document.getElementById("temuanFormSebab");
    
    if (!modal) return;
    modal.classList.remove("hidden");
    
    // Populate LHP dropdown options dynamically
    if (lhaSelect) {
        lhaSelect.innerHTML = masterLHP.map(l => 
            `<option value="${l["Kode LHP"]}">${l["Kode LHP"]} (${l["Sumber Audit"]})</option>`
        ).join('');
    }
    
    if (isEdit) {
        title.textContent = "Edit Temuan";
        isEditInput.value = "true";
        oldKodeInput.value = oldKode;
        kodeInput.value = oldKode;
        kodeInput.disabled = true;
        
        const tem = tabelTemuan.find(t => t["Kode Temuan"] === oldKode);
        if (tem) {
            if (lhaSelect) {
                lhaSelect.value = tem["Kode LHP"] || "";
                lhaSelect.disabled = true;
            }
            kriteriaInput.value = tem.Kriteria || "";
            sebabInput.value = tem.Sebab || "";
        }
    } else {
        title.textContent = "Tambah Temuan Baru";
        isEditInput.value = "false";
        oldKodeInput.value = "";
        kodeInput.value = "";
        kodeInput.disabled = false;
        kriteriaInput.value = "";
        sebabInput.value = "";
        
        if (lhaSelect) {
            if (lhaKode) {
                lhaSelect.value = lhaKode;
                lhaSelect.disabled = true;
            } else {
                lhaSelect.disabled = false;
                if (masterLHP.length > 0) {
                    lhaSelect.selectedIndex = 0;
                }
            }
        }
    }
}

function closeTemuanModal() {
    document.getElementById("temuanModal")?.classList.add("hidden");
}

async function handleTemuanFormSubmit(event) {
    event.preventDefault();
    const isEdit = document.getElementById("temuanFormIsEdit").value === "true";
    const oldKode = document.getElementById("temuanFormOldKode").value;
    const lhaKode = document.getElementById("temuanFormLha").value;
    
    const temuanData = {
        kode_temuan: document.getElementById("temuanFormKode").value.trim(),
        kode_lha: lhaKode,
        kriteria: document.getElementById("temuanFormKriteria").value.trim(),
        sebab: document.getElementById("temuanFormSebab").value.trim() || null,
        parent_temuan: null
    };
    
    try {
        await submitTemuan(temuanData, isEdit, oldKode);
        alert(isEdit ? "Temuan berhasil diperbarui!" : "Temuan baru berhasil ditambahkan!");
        closeTemuanModal();
        
        if (!isEdit) {
            selectedLhaId = temuanData.kode_lha;
        }
        loadDataFromAPI();
    } catch (err) {
        alert(err.message);
    }
}

async function triggerDeleteTemuan(kode_temuan) {
    if (!confirm(`Apakah Anda yakin ingin menghapus Temuan ${kode_temuan}?`)) return;
    try {
        await deleteTemuan(kode_temuan);
        alert("Temuan berhasil dihapus!");
        closeDetail();
        loadDataFromAPI();
    } catch (err) {
        alert(err.message);
    }
}

// 3. Rekomendasi Modal
function openRekomendasiModal(temuanKode, isEdit = false, oldKode = "") {
    const modal = document.getElementById("rekomendasiModal");
    const title = document.getElementById("rekomendasiModalTitle");
    const isEditInput = document.getElementById("recFormIsEdit");
    const oldKodeInput = document.getElementById("recFormOldKode");
    const temuanInput = document.getElementById("recFormTemuan");
    const kodeInput = document.getElementById("recFormKode");
    const textInput = document.getElementById("recFormText");
    const picInput = document.getElementById("recFormPic");
    const rencanaInput = document.getElementById("recFormRencanaAksi");
    const jadwalInput = document.getElementById("recFormJadwal");
    const nilaiInput = document.getElementById("recFormNilaiTemuan");
    
    if (!modal) return;
    modal.classList.remove("hidden");
    
    temuanInput.value = temuanKode;
    
    if (isEdit) {
        title.textContent = "Edit Rekomendasi";
        isEditInput.value = "true";
        oldKodeInput.value = oldKode;
        kodeInput.value = oldKode;
        kodeInput.disabled = true;
        
        const rec = tabelRekomendasi.find(r => r["Kode Rekomendasi"] === oldKode);
        if (rec) {
            textInput.value = rec.Rekomendasi || "";
            picInput.value = rec.PIC || "Biro SDMO";
            rencanaInput.value = rec["Rencana Aksi"] || "";
            jadwalInput.value = rec["Jadwal Pelaksanaan"] || "";
            nilaiInput.value = rec["Nilai Temuan"] || 0;
        }
    } else {
        title.textContent = "Tambah Rekomendasi Baru";
        isEditInput.value = "false";
        oldKodeInput.value = "";
        kodeInput.value = "";
        kodeInput.disabled = false;
        textInput.value = "";
        picInput.value = "Biro SDMO";
        rencanaInput.value = "";
        jadwalInput.value = "";
        nilaiInput.value = 0;
    }
}

function closeRekomendasiModal() {
    document.getElementById("rekomendasiModal")?.classList.add("hidden");
}

async function handleRekomendasiFormSubmit(event) {
    event.preventDefault();
    const isEdit = document.getElementById("recFormIsEdit").value === "true";
    const oldKode = document.getElementById("recFormOldKode").value;
    const temuanKode = document.getElementById("recFormTemuan").value;
    
    const recData = {
        kode_rekomendasi: document.getElementById("recFormKode").value.trim(),
        kode_temuan: temuanKode,
        rekomendasi: document.getElementById("recFormText").value.trim(),
        pic: document.getElementById("recFormPic").value,
        rencana_aksi: document.getElementById("recFormRencanaAksi").value.trim() || null,
        jadwal_pelaksanaan: document.getElementById("recFormJadwal").value.trim() || null,
        nilai_temuan: parseFloat(document.getElementById("recFormNilaiTemuan").value) || 0
    };
    
    try {
        await submitRekomendasi(recData, isEdit, oldKode);
        alert(isEdit ? "Rekomendasi berhasil diperbarui!" : "Rekomendasi baru berhasil ditambahkan!");
        closeRekomendasiModal();
        loadDataFromAPI();
    } catch (err) {
        alert(err.message);
    }
}

async function triggerDeleteRekomendasi(kode_rekomendasi) {
    if (!confirm(`Apakah Anda yakin ingin menghapus Rekomendasi ${kode_rekomendasi}?`)) return;
    try {
        await deleteRekomendasi(kode_rekomendasi);
        alert("Rekomendasi berhasil dihapus!");
        loadDataFromAPI();
    } catch (err) {
        alert(err.message);
    }
}
