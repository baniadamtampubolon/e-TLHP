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

// Demo Mode state: true by default or persisted in localStorage
let isDemoMode = localStorage.getItem("isDemoMode") !== null ? localStorage.getItem("isDemoMode") === "true" : true;

// Initialize App safely whether DOM is loading or already parsed
function initApp() {
    applyDemoModeUI(false);
    checkAuthSession();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

// Check if user is logged in (persisted in localStorage)
function checkAuthSession() {
    const savedUser = localStorage.getItem("currentUser");
    const loginCard = document.getElementById("loginCardSection");
    const dashboardMain = document.getElementById("dashboardMainSection");
    const headerProfile = document.getElementById("headerProfileSection");

    applyDemoModeUI(false);

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
        if (simulatedPic) {
            badge.className = "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-semibold bg-md-tertiary/10 text-md-tertiary";
            badge.innerHTML = `<span class="w-2 h-2 rounded-full bg-md-tertiary animate-pulse"></span> Simulasi: ${simulatedPic}`;
        } else {
            badge.className = "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-semibold bg-md-primary/10 text-md-primary";
            badge.innerHTML = `<span class="w-2 h-2 rounded-full bg-md-primary animate-pulse"></span> Auditor: ${currentUser.username.toUpperCase()}`;
        }
        
        // Show role switcher only for Auditor in Demo Mode
        const switcher = document.getElementById("roleSwitcherContainer");
        if (switcher) {
            if (isDemoMode) {
                switcher.classList.remove("hidden");
                const roleSel = document.getElementById("roleSelector");
                if (roleSel) roleSel.value = simulatedPic ? `SATKER:${simulatedPic}` : "AUDITOR";
            } else {
                switcher.classList.add("hidden");
            }
        }
    } else {
        badge.className = "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-semibold bg-md-tertiary/10 text-md-tertiary";
        badge.innerHTML = `<span class="w-2 h-2 rounded-full bg-md-tertiary animate-pulse"></span> Satker: ${currentUser.pic}`;
        
        // Hide role switcher for Satker
        const switcher = document.getElementById("roleSwitcherContainer");
        if (switcher) switcher.classList.add("hidden");
    }
}

// Toggle Demo Mode (Active vs Launch/Production Ready)
function toggleDemoMode() {
    isDemoMode = !isDemoMode;
    localStorage.setItem("isDemoMode", isDemoMode ? "true" : "false");
    
    // When switching to Production Mode: reset simulation and ensure real user role
    if (!isDemoMode) {
        simulatedPic = null;
        if (currentUser) {
            currentRole = currentUser.role;
            const roleSel = document.getElementById("roleSelector");
            if (roleSel) roleSel.value = "AUDITOR";
        }
    }
    
    // Apply UI state changes
    applyDemoModeUI(true);
    
    // Re-render dashboard header and reload data if logged in
    if (currentUser) {
        renderHeaderProfile();
        loadDataFromAPI();
    }
}

// Apply visual representation for Demo Mode vs Production Mode
function applyDemoModeUI(showToast = false) {
    const toggleBtn = document.getElementById("demoModeToggleBtn");
    const demoAccounts = document.getElementById("demoAccountsContainer");
    const switcher = document.getElementById("roleSwitcherContainer");
    
    // Close password preview & reset eye icon
    const passInput = document.getElementById("loginPasswordInput");
    const passIcon = document.getElementById("passwordToggleIcon");
    if (passInput) passInput.type = "password";
    if (passIcon) {
        passIcon.className = "fa-solid fa-eye-slash text-sm";
    }

    // Update Toggle Button UI in Navbar
    if (toggleBtn) {
        if (isDemoMode) {
            toggleBtn.className = "h-9 px-3 sm:px-3.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-2 shadow-sm active:scale-95 bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100";
            toggleBtn.title = "Mode Demo Aktif. Klik untuk beralih ke Mode Produksi (Siap Rilis).";
            toggleBtn.innerHTML = `
                <span class="relative flex h-2 w-2">
                    <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span class="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
                <i class="fa-solid fa-flask text-amber-600"></i>
                <span class="hidden sm:inline text-amber-700">Mode:</span>
                <span class="uppercase tracking-wider font-extrabold text-amber-900">Demo</span>
            `;
        } else {
            toggleBtn.className = "h-9 px-3 sm:px-3.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-2 shadow-sm active:scale-95 bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100";
            toggleBtn.title = "Mode Produksi Aktif (Siap Launch). Klik untuk mengaktifkan Mode Demo.";
            toggleBtn.innerHTML = `
                <i class="fa-solid fa-rocket text-emerald-600"></i>
                <span class="hidden sm:inline text-emerald-700">Mode:</span>
                <span class="uppercase tracking-wider font-extrabold text-emerald-900">Produksi (Live)</span>
            `;
        }
    }

    // Toggle demo accounts list on login card
    if (demoAccounts) {
        if (isDemoMode) {
            demoAccounts.classList.remove("hidden");
        } else {
            demoAccounts.classList.add("hidden");
        }
    }

    // Toggle simulation dropdown in header
    if (switcher) {
        if (isDemoMode && currentUser && currentUser.role === "AUDITOR") {
            switcher.classList.remove("hidden");
        } else {
            switcher.classList.add("hidden");
        }
    }

    // Trigger toast notification if requested
    if (showToast) {
        if (isDemoMode) {
            showToastNotification("Mode Demo diaktifkan. Fitur simulasi peran Auditor & daftar akun pengujian tersedia.", "warning");
        } else {
            showToastNotification("Mode Produksi siap rilis. Mode simulasi dinonaktifkan & daftar password ditutup.", "success");
        }
    }
}

// Toggle login password visibility (Eye icon)
function togglePasswordVisibility() {
    const input = document.getElementById("loginPasswordInput");
    const icon = document.getElementById("passwordToggleIcon");
    if (!input || !icon) return;
    
    if (input.type === "password") {
        input.type = "text";
        icon.className = "fa-solid fa-eye text-sm text-emerald-600";
    } else {
        input.type = "password";
        icon.className = "fa-solid fa-eye-slash text-sm text-slate-400";
    }
}

// Auto fill credentials when clicking test accounts in Demo Mode
function fillDemoLogin(username, password) {
    if (!isDemoMode) return;
    const userField = document.querySelector('input[name="username"]');
    const passField = document.getElementById('loginPasswordInput');
    if (userField) userField.value = username;
    if (passField) {
        passField.value = password;
        passField.type = "password";
        const icon = document.getElementById("passwordToggleIcon");
        if (icon) icon.className = "fa-solid fa-eye-slash text-sm text-slate-400";
    }
}

// Floating Toast Notification
function showToastNotification(message, type = "info") {
    const container = document.getElementById("toastContainer");
    if (!container) return;
    
    const toast = document.createElement("div");
    const isWarn = type === "warning";
    const bgClass = isWarn 
        ? "bg-slate-900/95 text-white border-amber-500/50 shadow-amber-900/20" 
        : "bg-slate-900/95 text-white border-emerald-500/50 shadow-emerald-900/20";
    
    toast.className = `pointer-events-auto px-4 py-3 rounded-xl shadow-2xl border text-sm flex items-center gap-3 backdrop-blur-md transform transition-all duration-300 translate-y-[-10px] opacity-0 ${bgClass}`;
    
    const icon = isWarn ? "fa-flask text-amber-400" : "fa-rocket text-emerald-400";
    const badgeText = isWarn ? "Mode Demo Aktif" : "Mode Produksi Siap Launch";
    const badgeColor = isWarn ? "text-amber-400" : "text-emerald-400";
    
    toast.innerHTML = `
        <div class="w-8 h-8 rounded-lg ${isWarn ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'} flex items-center justify-center shrink-0">
            <i class="fa-solid ${icon}"></i>
        </div>
        <div class="flex-1">
            <p class="font-extrabold text-[11px] uppercase tracking-wider ${badgeColor}">${badgeText}</p>
            <p class="text-xs font-medium text-slate-200 mt-0.5">${message}</p>
        </div>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.remove("translate-y-[-10px]", "opacity-0");
        toast.classList.add("translate-y-0", "opacity-100");
    }, 10);
    
    setTimeout(() => {
        toast.classList.remove("translate-y-0", "opacity-100");
        toast.classList.add("translate-y-[-10px]", "opacity-0");
        setTimeout(() => toast.remove(), 350);
    }, 3800);
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
    simulatedPic = null;
    closeDetail();
    checkAuthSession();
}

// Switch user role (Only visible for Auditor for simulation/review convenience)
async function switchRole() {
    if (!isDemoMode || !currentUser || currentUser.role !== "AUDITOR") return;
    const roleVal = document.getElementById('roleSelector').value;
    
    const badge = document.getElementById('roleBadge');
    const addLhaBtn = document.getElementById("addLhaBtn");
    
    if (roleVal === "AUDITOR") {
        currentRole = "AUDITOR";
        simulatedPic = null;
        badge.className = "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-semibold bg-md-primary/10 text-md-primary";
        badge.innerHTML = `<span class="w-2 h-2 rounded-full bg-md-primary animate-pulse"></span> Auditor: ${currentUser.username.toUpperCase()}`;
        if (addLhaBtn) addLhaBtn.classList.remove("hidden");
    } else if (roleVal.startsWith("SATKER:")) {
        currentRole = "SATKER";
        simulatedPic = roleVal.substring(7);
        badge.className = "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-semibold bg-md-tertiary/10 text-md-tertiary";
        badge.innerHTML = `<span class="w-2 h-2 rounded-full bg-md-tertiary animate-pulse"></span> Simulasi: ${simulatedPic}`;
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
    
    const anyProses = uniqueRecs.some(r => r.Status === "PROSES" || r.Status === "TUNTAS");
    if (anyProses) return "PROSES";
    
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
        return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch(e) {
        return dateStr;
    }
}

function formatDateRangeText(startStr, endStr) {
    if (!startStr && !endStr) return "Belum ada TL";
    const s = startStr ? formatTemuanDate(startStr) : "-";
    const e = endStr ? formatTemuanDate(endStr) : s;
    return `${s} – ${e}`;
}

// Get follow-up date range (startDate, endDate) for a specific recommendation
function getFollowUpRangeForRec(kodeRec) {
    const logs = tabelProgres.filter(p => p["Kode Rekomendasi"] === kodeRec);
    if (logs.length === 0) return { startDate: null, endDate: null, count: 0 };
    let earliest = null;
    let latest = null;
    logs.forEach(l => {
        const startRaw = l["Tanggal Mulai"] || l["Tanggal Submit"] || l["Tanggal Review"];
        const endRaw = l["Tanggal Selesai"] || l["Tanggal Review"] || l["Tanggal Submit"];
        if (startRaw) {
            const ds = new Date(startRaw);
            if (!isNaN(ds.getTime()) && (!earliest || ds < earliest)) {
                earliest = ds;
            }
        }
        if (endRaw) {
            const de = new Date(endRaw);
            if (!isNaN(de.getTime()) && (!latest || de > latest)) {
                latest = de;
            }
        }
    });
    return {
        startDate: earliest ? earliest.toISOString() : null,
        endDate: latest ? latest.toISOString() : (earliest ? earliest.toISOString() : null),
        count: logs.length
    };
}

// Get follow-up date range across all recommendations under a finding (and its sub-findings)
function getFollowUpRangeForTemuan(temuanId) {
    const recs = getRecommendationsForFinding(temuanId);
    let earliest = null;
    let latest = null;
    let totalCount = 0;
    recs.forEach(r => {
        const range = getFollowUpRangeForRec(r["Kode Rekomendasi"]);
        totalCount += range.count;
        if (range.startDate) {
            const ds = new Date(range.startDate);
            if (!isNaN(ds.getTime()) && (!earliest || ds < earliest)) earliest = ds;
        }
        if (range.endDate) {
            const de = new Date(range.endDate);
            if (!isNaN(de.getTime()) && (!latest || de > latest)) latest = de;
        }
    });
    return {
        startDate: earliest ? earliest.toISOString() : null,
        endDate: latest ? latest.toISOString() : (earliest ? earliest.toISOString() : null),
        count: totalCount
    };
}

// Get follow-up date range and total follow-up count across an LHA
function getFollowUpInfoForLha(kodeLha) {
    const recs = getRecommendationsForLha(kodeLha);
    let earliest = null;
    let latest = null;
    let totalLogs = 0;
    recs.forEach(r => {
        const range = getFollowUpRangeForRec(r["Kode Rekomendasi"]);
        totalLogs += range.count;
        if (range.startDate) {
            const ds = new Date(range.startDate);
            if (!isNaN(ds.getTime()) && (!earliest || ds < earliest)) earliest = ds;
        }
        if (range.endDate) {
            const de = new Date(range.endDate);
            if (!isNaN(de.getTime()) && (!latest || de > latest)) latest = de;
        }
    });
    return {
        startDate: earliest ? earliest.toISOString() : null,
        endDate: latest ? latest.toISOString() : (earliest ? earliest.toISOString() : null),
        totalLogs
    };
}

// Menghitung Batas Waktu (Deadline) Yuridis 60 Hari sesuai regulasi audit (UU No. 15/2004)
function getLhaDeadlineInfo(lha) {
    const baseDateStr = lha["Tanggal Input"] || `${lha.Tahun || 2025}-01-01`;
    const baseDate = new Date(baseDateStr);
    const validBase = isNaN(baseDate.getTime()) ? new Date() : baseDate;
    
    // Deadline resmi 60 hari kalender sejak penerbitan LHA
    const deadlineDate = new Date(validBase.getTime() + 60 * 24 * 60 * 60 * 1000);
    const today = new Date();
    
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const lhaStatus = computeLhaStatus(lha["Kode LHP"]);
    const isTuntas = (lhaStatus === "TUNTAS");
    const isOverdue = diffDays < 0 && !isTuntas;
    
    return {
        deadlineDate,
        deadlineFormatted: formatTemuanDate(deadlineDate.toISOString()),
        diffDays,
        isOverdue,
        isTuntas,
        lhaStatus
    };
}

function getRecDeadlineInfo(rec, lha) {
    const baseDateStr = rec["Tanggal Input"] || (lha ? lha["Tanggal Input"] : null) || "2025-01-01";
    const baseDate = new Date(baseDateStr);
    const validBase = isNaN(baseDate.getTime()) ? new Date() : baseDate;
    
    const deadlineDate = new Date(validBase.getTime() + 60 * 24 * 60 * 60 * 1000);
    const today = new Date();
    
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const isTuntas = (rec.Status === "TUNTAS");
    const isOverdue = diffDays < 0 && !isTuntas;
    
    let statusBadgeText = "";
    let statusText = "";
    
    if (isTuntas) {
        statusBadgeText = "Tuntas";
        statusText = "Tuntas Tepat Waktu";
    } else if (isOverdue) {
        statusBadgeText = `Lewat ${Math.abs(diffDays)} Hari`;
        statusText = `Melampaui batas waktu 60 hari (${Math.abs(diffDays)} hari)`;
    } else {
        statusBadgeText = `Sisa ${diffDays} Hari`;
        statusText = `Sisa waktu ${diffDays} hari kalender`;
    }
    
    return {
        deadlineDate,
        deadlineText: formatTemuanDate(deadlineDate.toISOString()),
        diffDays,
        isOverdue,
        isTuntas,
        statusBadgeText,
        statusText
    };
}

// Get unique PICs for a specific finding (including sub-findings)
function getUniquePicsForTemuan(temuanId) {
    const recs = getRecommendationsForFinding(temuanId);
    const pics = new Set();
    recs.forEach(r => {
        if (r.PIC) {
            r.PIC.split(',').forEach(p => {
                const trimmed = p.trim();
                if (trimmed) pics.add(trimmed);
            });
        }
    });
    return Array.from(pics);
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
    const searchVal = document.getElementById('searchInput')?.value.toLowerCase() || "";
    const sourceVal = document.getElementById('sourceFilter')?.value || "ALL";
    const jenisAuditVal = document.getElementById('jenisAuditFilter')?.value || "ALL";
    const picVal = document.getElementById('picFilter')?.value || "ALL";
    const statusVal = document.getElementById('statusFilter')?.value || "ALL";
    const tahunVal = document.getElementById('tahunFilter')?.value || "ALL";

    filteredLHA = masterLHP.filter(lha => {
        let matchSearch = !searchVal;
        if (!matchSearch) {
            if (lha["Kode LHP"] && lha["Kode LHP"].toLowerCase().includes(searchVal)) matchSearch = true;
            if (!matchSearch && lha["Jenis Audit"] && lha["Jenis Audit"].toLowerCase().includes(searchVal)) matchSearch = true;
            if (!matchSearch) {
                const temuanList = tabelTemuan.filter(t => t["Kode LHP"] === lha["Kode LHP"]);
                matchSearch = temuanList.some(t => 
                    (t.Kondisi && t.Kondisi.toLowerCase().includes(searchVal)) ||
                    (t.Kriteria && t.Kriteria.toLowerCase().includes(searchVal)) ||
                    (t["Kode Temuan"] && t["Kode Temuan"].toLowerCase().includes(searchVal)) ||
                    (t.Sebab && t.Sebab.toLowerCase().includes(searchVal)) ||
                    (t.Akibat && t.Akibat.toLowerCase().includes(searchVal))
                );
            }
            if (!matchSearch) {
                const recs = getRecommendationsForLha(lha["Kode LHP"]);
                matchSearch = recs.some(r =>
                    (r.Rekomendasi && r.Rekomendasi.toLowerCase().includes(searchVal)) ||
                    (r.PIC && r.PIC.toLowerCase().includes(searchVal)) ||
                    (r["Kode Rekomendasi"] && r["Kode Rekomendasi"].toLowerCase().includes(searchVal))
                );
            }
        }

        // Source filter
        const matchSource = (sourceVal === "ALL") || (lha["Sumber Audit"] === sourceVal);

        // Jenis Audit filter (Audit Kinerja, Audit Keuangan, Audit Kepatuhan, Audit Khusus)
        const matchJenisAudit = (jenisAuditVal === "ALL") || ((lha["Jenis Audit"] || "Audit Kinerja") === jenisAuditVal);

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

        // Tahun filter
        const matchTahun = (tahunVal === "ALL") || (lha.Tahun && lha.Tahun.toString() === tahunVal);

        return matchSearch && matchSource && matchJenisAudit && matchPic && matchStatus && matchTahun;
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

// Get unique PIC list for an LHA
function getUniquePicsForLha(kodeLha) {
    const recs = getRecommendationsForLha(kodeLha);
    const pics = new Set();
    recs.forEach(r => {
        if (r.PIC) {
            r.PIC.split(',').forEach(p => pics.add(p.trim()));
        }
    });
    return Array.from(pics);
}

// Quick status filter chip handler for LHA Data Table
function filterLhaStatusChip(status) {
    const statusSelect = document.getElementById('statusFilter');
    if (statusSelect) {
        statusSelect.value = status;
    }
    
    // Update chip active styling
    const chips = ['ALL', 'PROSES', 'TUNTAS', 'PENDING'];
    chips.forEach(c => {
        const btn = document.getElementById(`chipStatus${c}`);
        if (btn) {
            if (c === status) {
                btn.className = "lha-status-chip active px-4 py-1.5 rounded-md text-sm font-bold bg-emerald-700 text-white transition-all shadow-sm shrink-0 border border-emerald-700";
            } else {
                const colors = {
                    'PROSES': 'text-amber-600 bg-amber-50 border border-amber-200 hover:bg-amber-100',
                    'TUNTAS': 'text-emerald-600 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100',
                    'PENDING': 'text-rose-600 bg-rose-50 border border-rose-200 hover:bg-rose-100',
                    'ALL': 'text-slate-600 bg-slate-100 border border-slate-200 hover:bg-slate-200'
                };
                btn.className = `lha-status-chip px-4 py-1.5 rounded-md text-sm font-bold ${colors[c] || 'bg-gray-100 text-gray-700'} transition-all shrink-0`;
            }
        }
    });

    applyFilters();
}

function resetFilters() {
    document.getElementById('searchInput').value = "";
    document.getElementById('sourceFilter').value = "ALL";
    if (document.getElementById('jenisAuditFilter')) {
        document.getElementById('jenisAuditFilter').value = "ALL";
    }
    if (document.getElementById('tahunFilter')) {
        document.getElementById('tahunFilter').value = "ALL";
    }
    if (currentUser && currentUser.role !== "SATKER") {
        document.getElementById('picFilter').value = "ALL";
    }
    document.getElementById('statusFilter').value = "ALL";
    
    // Reset status chips UI
    filterLhaStatusChip('ALL');
}

function getRecommendationsForFinding(temuanId) {
    let recs = tabelRekomendasi.filter(r => r["Kode Temuan"] === temuanId);
    const children = tabelTemuan.filter(t => t["Parent Temuan"] === temuanId);
    children.forEach(c => {
        recs = recs.concat(getRecommendationsForFinding(c["Kode Temuan"]));
    });
    return recs;
}

function getRecommendationStatus(recId) {
    const rec = tabelRekomendasi.find(r => r["Kode Rekomendasi"] === recId);
    return rec ? rec.Status : "PENDING";
}

// KPI Calculations — based on filteredLHA
function calculateKPIs() {
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
        if (r["Kode Rekomendasi"].startsWith("R-INSP") || (r["Nilai Temuan"] || 0) > 0) {
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

// Parse string Rupiah berformat titik (misal "3.000.000") menjadi angka murni (3000000)
function parseRupiahValue(raw) {
    if (raw === null || raw === undefined) return 0;
    const digitsOnly = String(raw).replace(/[^0-9]/g, '');
    return digitsOnly ? parseFloat(digitsOnly) : 0;
}

// Format angka menjadi string ribuan Indonesia (misal 3000000 -> "3.000.000")
function formatRupiahNumber(num) {
    const val = parseRupiahValue(num);
    if (!val) return "0";
    return val.toLocaleString('id-ID');
}

// Auto-format input kolom uang Rupiah saat pengguna mengetik
function formatRupiahInput(inputEl, previewId = null) {
    if (!inputEl) return;
    const rawDigits = inputEl.value.replace(/[^0-9]/g, '');
    if (!rawDigits) {
        inputEl.value = "";
        if (previewId) {
            const previewEl = document.getElementById(previewId);
            if (previewEl) {
                previewEl.textContent = "Isi 0 jika rekomendasi bersifat administratif (non-finansial)";
                previewEl.className = "text-xs text-emerald-700 font-medium mt-1.5";
            }
        }
        return;
    }

    const numericVal = parseInt(rawDigits, 10) || 0;
    inputEl.value = numericVal === 0 ? "0" : numericVal.toLocaleString('id-ID');

    if (previewId) {
        const previewEl = document.getElementById(previewId);
        if (previewEl) {
            if (numericVal > 0) {
                previewEl.innerHTML = `<i class="fa-solid fa-coins mr-1"></i> Target Finansial: <strong>Rp ${numericVal.toLocaleString('id-ID')}</strong> (${formatIDR(numericVal)})`;
                previewEl.className = "text-xs text-emerald-800 font-bold mt-1.5";
            } else {
                previewEl.textContent = "Rp 0 — Rekomendasi bersifat administratif (non-finansial)";
                previewEl.className = "text-xs text-emerald-700 font-medium mt-1.5";
            }
        }
    }
}

// Keep table search input in sync with main search input
function syncTableSearch(val) {
    const mainSearch = document.getElementById('searchInput');
    if (mainSearch) {
        mainSearch.value = val;
    }
    applyFilters();
}

// Render the LHA data table in full-size layout
function renderLhaList() {
    const tableBody = document.getElementById('lhaTableBody');
    const emptyState = document.getElementById('lhaEmptyState');
    const filteredCountEl = document.getElementById('filteredLhaCount');
    const totalCountEl = document.getElementById('totalLhaCount');
    const footerTotalEl = document.getElementById('footerTotalLha');

    if (totalCountEl) totalCountEl.textContent = masterLHP.length;
    if (footerTotalEl) footerTotalEl.textContent = filteredLHA.length;

    if (!tableBody) return;
    
    tableBody.innerHTML = "";

    if (filteredLHA.length === 0) {
        if (emptyState) emptyState.classList.remove('hidden');
        if (filteredCountEl) filteredCountEl.textContent = "0";
        return;
    }

    if (emptyState) emptyState.classList.add('hidden');
    if (filteredCountEl) filteredCountEl.textContent = filteredLHA.length;

    filteredLHA.forEach((lha, index) => {
        const tr = createLhaTableRowEl(lha, index + 1);
        tableBody.appendChild(tr);
    });
}

// Helper badge rendering for 4 Audit Types
function getJenisAuditBadge(jenis = "Audit Kinerja") {
    const j = jenis || "Audit Kinerja";
    const map = {
        "Audit Kinerja": {
            label: "Audit Kinerja",
            bg: "bg-blue-50 text-blue-700 border-blue-200",
            icon: "fa-chart-line"
        },
        "Audit Keuangan": {
            label: "Audit Keuangan",
            bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
            icon: "fa-money-bill-wave"
        },
        "Audit Kepatuhan": {
            label: "Audit Kepatuhan",
            bg: "bg-purple-50 text-purple-700 border-purple-200",
            icon: "fa-scale-balanced"
        },
        "Audit Khusus": {
            label: "Audit Khusus",
            bg: "bg-rose-50 text-rose-700 border-rose-200",
            icon: "fa-shield-halved"
        }
    };
    const config = map[j] || map["Audit Kinerja"];
    return `<span class="inline-flex items-center gap-1.5 text-[11px] font-bold px-2 py-0.5 rounded-md border ${config.bg} whitespace-nowrap">
        <i class="fa-solid ${config.icon} text-[10px]"></i> ${config.label}
    </span>`;
}

function createLhaTableRowEl(lha, index) {
    const tr = document.createElement('tr');
    const kodeLha = lha["Kode LHP"];
    const isSelected = selectedLhaId === kodeLha;
    
    tr.className = `transition-colors duration-150 cursor-pointer ${isSelected ? 'bg-indigo-50/70' : 'hover:bg-slate-50'}`;
    tr.onclick = (e) => {
        if (e.target.closest('button')) return;
        selectLha(kodeLha);
    };

    const source = lha["Sumber Audit"] || "Audit";

    const temuanList = tabelTemuan.filter(t => t["Kode LHP"] === kodeLha);
    const temuanCount = temuanList.length;
    
    const kriteriaList = temuanList
        .filter(t => t.Kriteria)
        .map(t => t.Kriteria);
    const mainKriteria = kriteriaList.length > 0 
        ? kriteriaList[0] 
        : "Pemeriksaan atas Laporan Hasil Audit";

    const recs = getRecommendationsForLha(kodeLha);
    const finishedRecs = recs.filter(r => r.Status === "TUNTAS");
    const lhaStatus = computeLhaStatus(kodeLha);

    const progressPercent = recs.length > 0 ? Math.round((finishedRecs.length / recs.length) * 100) : 0;

    // Status styling
    const statusMap = {
        "TUNTAS":  { label: "Selesai",       dotColor: "bg-green-500",  textColor: "text-green-700",  bgColor: "bg-green-50" },
        "PROSES":  { label: "On Progress",   dotColor: "bg-blue-500",   textColor: "text-blue-700",   bgColor: "bg-blue-50" },
        "PENDING": { label: "Belum TL",      dotColor: "bg-orange-500", textColor: "text-orange-700", bgColor: "bg-orange-50" },
        "KOSONG":  { label: "Kosong",        dotColor: "bg-gray-400",   textColor: "text-gray-500",   bgColor: "bg-gray-50" },
    };
    const st = statusMap[lhaStatus] || statusMap["PENDING"];

    // Progress bar color
    const barColor = progressPercent === 100 ? 'bg-green-500' 
        : progressPercent >= 50 ? 'bg-blue-500' 
        : progressPercent > 0 ? 'bg-orange-400' 
        : 'bg-gray-300';

    // PIC list
    const pics = getUniquePicsForLha(kodeLha);
    let picHTML = '';
    if (pics.length === 0) {
        picHTML = '<span class="text-slate-400 italic text-sm">—</span>';
    } else if (pics.length <= 2) {
        picHTML = pics.map(p => `<span class="inline-flex items-center px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200">${p}</span>`).join(' ');
    } else {
        picHTML = pics.slice(0, 2).map(p => `<span class="inline-flex items-center px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200">${p}</span>`).join(' ');
        picHTML += `<span class="inline-flex items-center px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-100">+${pics.length - 2} lainnya</span>`;
    }

    // Batas Waktu (Deadline) Kepatuhan 60 Hari & Status
    const dlInfo = getLhaDeadlineInfo(lha);
    let deadlineHTML = '';
    if (dlInfo.isTuntas) {
        deadlineHTML = `
            <div class="flex flex-col gap-1 text-xs">
                <div class="flex items-center gap-1.5 text-slate-700">
                    <span class="font-bold text-slate-500">Jatuh Tempo:</span>
                    <span class="font-bold text-slate-800">${dlInfo.deadlineFormatted}</span>
                </div>
                <div>
                    <span class="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <i class="fa-solid fa-check text-[10px]"></i> Tuntas Tepat Waktu
                    </span>
                </div>
            </div>
        `;
    } else if (dlInfo.isOverdue) {
        deadlineHTML = `
            <div class="flex flex-col gap-1 text-xs">
                <div class="flex items-center gap-1.5 text-slate-700">
                    <span class="font-bold text-slate-500">Jatuh Tempo:</span>
                    <span class="font-bold text-rose-700">${dlInfo.deadlineFormatted}</span>
                </div>
                <div>
                    <span class="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200">
                        <i class="fa-solid fa-triangle-exclamation text-[10px]"></i> Lewat ${Math.abs(dlInfo.diffDays)} Hari
                    </span>
                </div>
            </div>
        `;
    } else {
        deadlineHTML = `
            <div class="flex flex-col gap-1 text-xs">
                <div class="flex items-center gap-1.5 text-slate-700">
                    <span class="font-bold text-slate-500">Jatuh Tempo:</span>
                    <span class="font-bold text-slate-900">${dlInfo.deadlineFormatted}</span>
                </div>
                <div>
                    <span class="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                        <i class="fa-regular fa-clock text-[10px]"></i> Sisa ${dlInfo.diffDays} Hari
                    </span>
                </div>
            </div>
        `;
    }

    tr.innerHTML = `
        <td class="py-4 px-6 align-top">
            <div class="flex flex-col gap-1">
                <span class="text-sm font-bold text-slate-900">${kodeLha}</span>
                <span class="text-xs font-semibold text-slate-500">Tahun ${lha.Tahun || '2025'}</span>
            </div>
        </td>
        <td class="py-4 px-4 align-top">
            <div class="flex flex-col gap-1.5 pr-4">
                <p class="text-sm font-semibold text-slate-800 leading-relaxed line-clamp-2">${mainKriteria}</p>
                <span class="text-xs font-medium text-slate-500">${temuanCount} Temuan · ${recs.length} Rekomendasi</span>
            </div>
        </td>
        <td class="py-4 px-4 align-top">
            <div class="flex flex-col gap-1.5 items-start">
                <span class="inline-block text-xs font-bold px-2.5 py-0.5 rounded-md ${source === 'BPK-RI' ? 'bg-indigo-100 text-indigo-700' : 'bg-pink-100 text-pink-700'}">${source}</span>
                ${getJenisAuditBadge(lha["Jenis Audit"])}
            </div>
        </td>
        <td class="py-4 px-4 align-top">
            <div class="flex flex-wrap items-center gap-1.5 leading-relaxed">
                ${picHTML}
            </div>
        </td>
        <td class="py-4 px-4 align-top">
            ${deadlineHTML}
        </td>
        <td class="py-4 px-4 align-top text-center">
            <span class="inline-flex items-center gap-1.5 text-xs font-bold ${st.textColor} ${st.bgColor} px-3 py-1.5 rounded-md">
                <span class="w-2 h-2 rounded-full ${st.dotColor} ${lhaStatus === 'PROSES' ? 'animate-pulse' : ''}"></span>
                ${st.label}
            </span>
        </td>
        <td class="py-4 px-4 align-top">
            <div class="flex flex-col gap-2 min-w-[155px]">
                <div class="flex items-center justify-between">
                    <span class="text-xs text-slate-600 font-semibold">${finishedRecs.length}/${recs.length} Tuntas</span>
                    <span class="text-xs font-bold ${progressPercent === 100 ? 'text-green-600' : progressPercent > 0 ? 'text-blue-600' : 'text-slate-400'}">${progressPercent}%</span>
                </div>
                <div class="w-full bg-slate-200 rounded-full h-2">
                    <div class="h-2 rounded-full transition-all duration-500 ${barColor}" style="width: ${progressPercent}%"></div>
                </div>
                <button onclick="selectLha('${kodeLha}')" class="self-end mt-1 px-3.5 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 active:scale-95 transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-xs">
                    <i class="fa-solid fa-eye"></i> Detail
                </button>
            </div>
        </td>
    `;

    return tr;
}

function selectLha(kodeLha) {
    selectedLhaId = kodeLha;
    selectedTemuanId = null; // Reset to list of findings
    
    const tableSection = document.getElementById('lhaTableViewSection');
    const detailPanel = document.getElementById('detailPanel');
    if (tableSection) tableSection.classList.add('hidden');
    if (detailPanel) {
        detailPanel.classList.remove('hidden');
        detailPanel.classList.add('animate-in', 'fade-in', 'slide-in-from-right-4', 'duration-300');
    }
    
    showLhaDetail(kodeLha);
}

function closeDetail() {
    selectedLhaId = null;
    selectedTemuanId = null;
    
    const tableSection = document.getElementById('lhaTableViewSection');
    const detailPanel = document.getElementById('detailPanel');
    if (tableSection) {
        tableSection.classList.remove('hidden');
        tableSection.classList.add('animate-in', 'fade-in', 'slide-in-from-left-4', 'duration-300');
    }
    if (detailPanel) detailPanel.classList.add('hidden');

    const fallbackState = document.getElementById('detailFallbackState');
    const contentState = document.getElementById('detailContentState');
    if (fallbackState) fallbackState.classList.remove('hidden');
    if (contentState) contentState.classList.add('hidden');

    renderLhaList();
}

function selectTemuanDetail(temuanId) {
    selectedTemuanId = temuanId;
    showLhaDetail(selectedLhaId);
}

function goBackToFindings() {
    selectedTemuanId = null;
    showLhaDetail(selectedLhaId);
}

// Helper to get file icon & label based on extension
function getFileBadgeMeta(filepath) {
    if (!filepath) return { icon: "fa-file", label: "Lihat Dokumen Bukti", color: "text-emerald-700 bg-emerald-50 border-emerald-200" };
    const ext = filepath.split('.').pop().toLowerCase();
    if (ext === 'pdf') {
        return { icon: "fa-file-pdf", label: "Lihat Dokumen PDF", color: "text-rose-700 bg-rose-50 border-rose-200" };
    } else if (['png', 'jpg', 'jpeg'].includes(ext)) {
        return { icon: "fa-file-image", label: `Lihat Bukti Gambar (${ext.toUpperCase()})`, color: "text-indigo-700 bg-indigo-50 border-indigo-200" };
    } else if (['doc', 'docx'].includes(ext)) {
        return { icon: "fa-file-word", label: `Unduh Dokumen Word (${ext.toUpperCase()})`, color: "text-blue-700 bg-blue-50 border-blue-200" };
    } else if (['xls', 'xlsx'].includes(ext)) {
        return { icon: "fa-file-excel", label: `Unduh Dokumen Excel (${ext.toUpperCase()})`, color: "text-emerald-700 bg-emerald-50 border-emerald-200" };
    }
    return { icon: "fa-file-lines", label: `Lihat Berkas (${ext.toUpperCase()})`, color: "text-slate-700 bg-slate-100 border-slate-200" };
}

function showLhaDetail(kodeLha) {
    const lha = masterLHP.find(l => l["Kode LHP"] === kodeLha);
    if (!lha) return;

    const fallbackState = document.getElementById('detailFallbackState');
    const content = document.getElementById('detailContentState');
    if (fallbackState) fallbackState.classList.add('hidden');
    if (content) content.classList.remove('hidden');

    const source = lha["Sumber Audit"] || "BPK-RI";
    const isBpkAudit = (source === "BPK-RI" || kodeLha.includes("BPK"));
    const lhaStatus = computeLhaStatus(kodeLha);
    const statusConfig = {
        "TUNTAS":  { bg: "bg-green-100 text-green-800 border-green-200", dotColor: "bg-green-500", textColor: "text-green-700", icon: "fa-circle-check" },
        "PROSES":  { bg: "bg-amber-100 text-amber-800 border-amber-200", dotColor: "bg-blue-500",  textColor: "text-blue-700",  icon: "fa-spinner" },
        "PENDING": { bg: "bg-red-100 text-red-800 border-red-200",       dotColor: "bg-orange-500",textColor: "text-orange-700",icon: "fa-clock" },
        "KOSONG":  { bg: "bg-gray-100 text-gray-500 border-gray-200",    dotColor: "bg-gray-400",  textColor: "text-gray-500",  icon: "fa-minus" },
    };
    const sc = statusConfig[lhaStatus] || statusConfig["PENDING"];

    // Get all temuan under this LHA
    const temuanList = tabelTemuan.filter(t => t["Kode LHP"] === kodeLha);
    const parentTemuan = temuanList.filter(t => t["Parent Temuan"] === null);

    // All recs under this LHA for BATL calculation
    const allLhaRecs = getRecommendationsForLha(kodeLha);
    const isAllTuntas = allLhaRecs.length > 0 && allLhaRecs.every(r => r.Status === "TUNTAS");
    const isBatlIssued = lha["Status Laporan"] && lha["Status Laporan"].includes("BATL");
    const lhaDeadline = getLhaDeadlineInfo(lha);

    // BATL Section
    let batlHTML = "";
    if (isBatlIssued) {
        batlHTML = `
            <div class="p-6 rounded-2xl bg-green-50 border border-green-200 text-center">
                <i class="fa-solid fa-file-signature text-green-600 text-3xl mb-2"></i>
                <h5 class="text-base font-bold text-green-800">Berita Acara Tindak Lanjut (BATL) Terbit</h5>
                <p class="text-sm text-green-700 mt-1">Laporan Hasil Audit ini telah resmi ditutup dengan penandatanganan BATL.</p>
                <div class="mt-4 flex justify-center gap-2">
                    <a href="#" onclick="alert('Mengunduh dokumen BATL PDF...')" class="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-green-600 text-white text-sm font-bold hover:bg-green-700 transition-all">
                        <i class="fa-solid fa-file-arrow-down"></i> Unduh Dokumen BATL
                    </a>
                </div>
            </div>
        `;
    } else if (isAllTuntas && currentRole === "AUDITOR") {
        batlHTML = `
            <div class="p-6 rounded-2xl bg-md-secondary-container/50 border border-md-primary/20 text-center flex flex-col gap-3">
                <i class="fa-solid fa-clipboard-check text-md-primary text-3xl mb-1 animate-pulse"></i>
                <h5 class="text-base font-bold text-md-on-secondary-container">Terbitkan Berita Acara Tindak Lanjut (BATL)</h5>
                <p class="text-sm text-md-on-surface-variant">Seluruh rekomendasi pada LHA ini telah TUNTAS. Penerbitan BATL menandai penutupan resmi.</p>
                <form onsubmit="handleBatlCreate(event, '${kodeLha}')" class="flex flex-col sm:flex-row gap-3 mt-2 max-w-xl mx-auto w-full">
                    <input type="text" id="nomorBatlInput" required placeholder="Masukkan Nomor BATL (contoh: BA-2025-001)..." class="flex-1 p-3 text-sm rounded-xl border border-md-outline/30 focus:outline-none bg-white">
                    <button type="submit" class="px-6 py-3 rounded-xl bg-md-primary text-white text-sm font-bold hover:shadow-md active:scale-95 transition-all shrink-0">
                        Terbitkan & Tandatangani BATL (TTE)
                    </button>
                </form>
            </div>
        `;
    }

    const todayISO = new Date().toISOString().split('T')[0];

    // Build temuan sections HTML
    let temuanSectionsHTML = "";
    if (parentTemuan.length === 0 && temuanList.length === 0) {
        temuanSectionsHTML = `
            <div class="text-center p-10 text-slate-500">
                <i class="fa-solid fa-clipboard-question text-4xl mb-3 text-slate-300"></i>
                <p class="text-base font-medium">Belum ada temuan pada dokumen LHA ini.</p>
                ${currentRole === "AUDITOR" ? `
                <button onclick="openTemuanModal('${kodeLha}', false)" class="mt-4 px-5 py-2.5 rounded-full bg-md-primary text-white text-sm font-bold hover:shadow-md active:scale-95 transition-all">
                    <i class="fa-solid fa-plus mr-1"></i> Tambah Temuan Pertama
                </button>` : ''}
            </div>
        `;
    } else {
        // Build each temuan block with its children and recommendations
        const processTemuan = (t, isChild = false) => {
            const directRecs = tabelRekomendasi.filter(r => r["Kode Temuan"] === t["Kode Temuan"]);
            const nodePics = getUniquePicsForTemuan(t["Kode Temuan"]);
            const nodeRange = getFollowUpRangeForTemuan(t["Kode Temuan"]);
            const lhaDeadline = getLhaDeadlineInfo(lha);
            const temuanDateFormatted = formatTemuanDate(t["Tanggal Input"]);

            let recsHTML = "";
            if (directRecs.length > 0) {
                recsHTML = directRecs.map(rec => {
                    const status = rec.Status;
                    const recRange = getFollowUpRangeForRec(rec["Kode Rekomendasi"]);
                    const recDeadline = getRecDeadlineInfo(rec, lha);
                    const safeRecId = rec["Kode Rekomendasi"].replace(/[^a-zA-Z0-9_-]/g, '_');

                    // Financial metrics
                    const isFinancialRec = rec["Kode Rekomendasi"].startsWith("R-INSP") || (rec["Nilai Temuan"] || 0) > 0;
                    let financialHTML = "";
                    if (isFinancialRec) {
                        financialHTML = `
                            <div class="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                                <div class="p-2 rounded-lg bg-white border border-slate-100">
                                    <p class="text-xs text-slate-500 font-bold uppercase tracking-wider">Target Penyetoran</p>
                                    <p class="text-base font-extrabold text-slate-900 mt-1">Rp ${(rec["Nilai Temuan"] || 0).toLocaleString('id-ID')}</p>
                                </div>
                                <div class="p-2 rounded-lg bg-white border border-emerald-100">
                                    <p class="text-xs text-emerald-700 font-bold uppercase tracking-wider">Realisasi Setor</p>
                                    <p class="text-base font-extrabold text-emerald-600 mt-1">Rp ${(rec["Nilai Realisasi"] || 0).toLocaleString('id-ID')}</p>
                                </div>
                                <div class="p-2 rounded-lg bg-white border border-rose-100">
                                    <p class="text-xs text-rose-700 font-bold uppercase tracking-wider">Defisit / Selisih</p>
                                    <p class="text-base font-extrabold text-rose-600 mt-1">Rp ${(rec["Selisih"] || 0).toLocaleString('id-ID')}</p>
                                </div>
                            </div>
                        `;
                    }

                    // Progress logs (Tabel Riwayat Tindak Lanjut)
                    const progressLogs = tabelProgres.filter(p => p["Kode Rekomendasi"] === rec["Kode Rekomendasi"]);
                    let progressHTML = "";
                    if (progressLogs.length > 0) {
                        progressHTML = `
                            <div class="mt-4">
                                <div class="flex items-center justify-between mb-2.5">
                                    <h5 class="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                                        <i class="fa-solid fa-clock-rotate-left text-indigo-600"></i>
                                        Log Capaian / Progres Tindak Lanjut (${progressLogs.length})
                                    </h5>
                                </div>
                                <div class="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                                    <table class="w-full text-left border-collapse">
                                        <thead class="bg-slate-100 border-b border-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wider">
                                            <tr>
                                                <th class="py-3 px-4 w-[210px]">Tanggal Dokumen & Waktu Unggah</th>
                                                <th class="py-3 px-4">Uraian Progres / Output Aktual</th>
                                                <th class="py-3 px-4 w-[210px]">Bukti Dukung & NTPN</th>
                                                <th class="py-3 px-4 w-[140px] text-center">Status Review</th>
                                                ${currentRole === "AUDITOR" ? `<th class="py-3 px-4 w-[240px]">Evaluasi Auditor</th>` : ''}
                                            </tr>
                                        </thead>
                                        <tbody class="divide-y divide-slate-100">
                                            ${progressLogs.map(log => {
                                                let fileLinkHTML = `<span class="text-xs text-slate-400 italic">Tanpa lampiran berkas</span>`;
                                                if (log["File Bukti Path"]) {
                                                    const filename = log["File Bukti Path"].split(/[\/\\]/).pop();
                                                    const badgeMeta = getFileBadgeMeta(filename);
                                                    fileLinkHTML = `
                                                        <a href="${UPLOADS_BASE}/${filename}" target="_blank" class="inline-flex items-center gap-1.5 text-xs font-bold hover:underline px-3 py-1.5 rounded-lg border ${badgeMeta.color}">
                                                            <i class="fa-solid ${badgeMeta.icon}"></i> ${badgeMeta.label}
                                                        </a>
                                                    `;
                                                }

                                                let reviewFormHTML = "";
                                                if (currentRole === "AUDITOR") {
                                                    if (log["Status"] === "PENDING") {
                                                        reviewFormHTML = `
                                                            <div class="flex flex-col gap-2">
                                                                <input type="text" id="reviewComment_${log.id}" placeholder="Catatan evaluasi auditor..." class="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-indigo-500">
                                                                <div class="flex gap-2">
                                                                    <button onclick="submitReview(${log.id}, 'TUNTAS', event)" class="flex-1 px-3 py-1.5 text-xs font-bold rounded-lg bg-green-600 text-white hover:bg-green-700 active:scale-95 transition-all">Setujui</button>
                                                                    <button onclick="submitReview(${log.id}, 'PROSES', event)" class="flex-1 px-3 py-1.5 text-xs font-bold rounded-lg bg-amber-600 text-white hover:bg-amber-700 active:scale-95 transition-all">Revisi</button>
                                                                </div>
                                                            </div>
                                                        `;
                                                    } else {
                                                        reviewFormHTML = `
                                                            <div class="text-xs text-slate-600">
                                                                <span class="font-semibold text-slate-700">Telah direview</span>
                                                                ${log["Tanggal Review"] ? `<div class="text-slate-400 mt-0.5">${formatTemuanDate(log["Tanggal Review"])}</div>` : ''}
                                                            </div>
                                                        `;
                                                    }
                                                }

                                                let auditorNotesHTML = "";
                                                if (log["Catatan Auditor"]) {
                                                    auditorNotesHTML = `
                                                        <div class="mt-1.5 p-2 rounded-lg bg-amber-50/70 border border-amber-200/70 text-xs text-amber-900">
                                                            <span class="font-bold"><i class="fa-solid fa-comment-dots mr-1"></i>Catatan Auditor:</span> "${log["Catatan Auditor"]}"
                                                        </div>
                                                    `;
                                                }

                                                const logStatusClass = log["Status"] === "TUNTAS" 
                                                    ? "bg-green-100 text-green-800 border-green-200" 
                                                    : log["Status"] === "PROSES" 
                                                    ? "bg-amber-100 text-amber-800 border-amber-200" 
                                                    : "bg-rose-100 text-rose-800 border-rose-200";

                                                const tglMulaiFormatted = formatTemuanDate(log["Tanggal Mulai"] || log["Tanggal Submit"]);
                                                const tglSelesaiFormatted = formatTemuanDate(log["Tanggal Selesai"] || log["Tanggal Review"] || log["Tanggal Submit"]);

                                                return `
                                                    <tr class="hover:bg-slate-50/80">
                                                        <td class="py-3.5 px-4 align-top">
                                                            <div class="flex flex-col gap-1 text-xs">
                                                                <div class="flex items-center gap-1.5 text-slate-700">
                                                                    <i class="fa-regular fa-calendar text-indigo-600"></i>
                                                                    <span class="font-semibold text-slate-500">Tgl Dokumen:</span>
                                                                    <strong class="text-slate-900">${tglMulaiFormatted}</strong>
                                                                </div>
                                                                <div class="flex items-center gap-1.5 text-slate-500">
                                                                    <i class="fa-regular fa-clock text-slate-400"></i>
                                                                    <span class="font-semibold text-slate-500">Diunggah:</span>
                                                                    <strong class="text-slate-700 font-medium">${formatTemuanDate(log["Tanggal Submit"] || log["Tanggal Mulai"])}</strong>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td class="py-3.5 px-4 align-top">
                                                            <p class="text-sm font-medium text-slate-800 leading-relaxed">${log["Output Aktual (Progres)"]}</p>
                                                            ${auditorNotesHTML}
                                                        </td>
                                                        <td class="py-3.5 px-4 align-top">
                                                            <div class="flex flex-col gap-1.5 items-start">
                                                                ${fileLinkHTML}
                                                                ${log["NTPN"] ? `<span class="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold px-2.5 py-1 rounded-md"><i class="fa-solid fa-receipt"></i> NTPN: ${log["NTPN"]}</span>` : ""}
                                                            </div>
                                                        </td>
                                                        <td class="py-3.5 px-4 align-top text-center">
                                                            <span class="inline-block text-xs font-bold px-3 py-1 rounded-md border ${logStatusClass}">${log["Status"]}</span>
                                                        </td>
                                                        ${currentRole === "AUDITOR" ? `<td class="py-3.5 px-4 align-top">${reviewFormHTML}</td>` : ''}
                                                    </tr>
                                                `;
                                            }).join('')}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        `;
                    } else {
                        progressHTML = `
                            <div class="mt-3 p-4 rounded-xl bg-slate-100/70 border border-dashed border-slate-300 text-sm text-slate-500 flex items-center gap-2">
                                <i class="fa-solid fa-circle-info text-slate-400"></i>
                                Belum ada riwayat bukti tindak lanjut yang diunggah untuk rekomendasi ini.
                            </div>
                        `;
                    }

                    // Satker upload form — Dengan Tanggal Dokumen/Realisasi & Info Batas Waktu 60 Hari
                    let satkerInputFormHTML = "";
                    if (currentRole === "SATKER" && status !== "TUNTAS") {
                        const isFinancial = isFinancialRec;
                        const previewId = `filePreview_${safeRecId}`;
                        satkerInputFormHTML = `
                            <div class="mt-4 p-5 bg-white rounded-2xl border-2 border-emerald-600/20 shadow-sm">
                                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-4 border-b border-slate-100">
                                    <div class="flex items-center gap-2.5">
                                        <div class="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
                                            <i class="fa-solid fa-cloud-arrow-up text-base"></i>
                                        </div>
                                        <div>
                                            <h6 class="text-sm font-bold text-slate-900">Formulir Unggah Bukti Tindak Lanjut</h6>
                                            <p class="text-xs text-slate-500">Unggah dokumen pertanggungjawaban fisik dan catat capaian riil tindak lanjut rekomendasi</p>
                                        </div>
                                    </div>
                                    <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                        <i class="fa-solid fa-shield-check text-amber-600"></i> Menunggu Verifikasi Itjen
                                    </span>
                                </div>

                                <form id="form_${rec["Kode Rekomendasi"]}" onsubmit="handleBuktiSubmit(event, '${rec["Kode Rekomendasi"]}')" class="flex flex-col gap-4">
                                    
                                    <!-- Baris 1: Informasi Batas Waktu Regulasi & Tanggal Realisasi Fisik Dokumen -->
                                    <div class="p-4 rounded-xl bg-slate-50/80 border border-slate-200 flex flex-col gap-3">
                                        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg bg-indigo-50/80 border border-indigo-200/80 text-xs text-indigo-950">
                                            <div class="flex items-center gap-2">
                                                <i class="fa-solid fa-scale-balanced text-indigo-600 text-sm"></i>
                                                <span><strong>Batas Waktu Yuridis (UU No. 15/2004):</strong> 60 hari kalender sejak LHA diterbitkan (Jatuh tempo: <strong>${recDeadline.deadlineText}</strong>)</span>
                                            </div>
                                            <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[11px] ${recDeadline.isOverdue ? 'bg-rose-100 text-rose-800 border border-rose-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'}">
                                                <i class="fa-solid fa-hourglass-half"></i> ${recDeadline.statusBadgeText}
                                            </span>
                                        </div>

                                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label class="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                                                    <i class="fa-regular fa-calendar-check text-emerald-600 mr-1"></i> Tanggal Dokumen / Realisasi Riil <span class="text-rose-500">*</span>
                                                </label>
                                                <input type="date" name="tanggal_realisasi" value="${todayISO}" required
                                                    class="w-full h-10 px-3 text-sm rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-medium text-slate-800">
                                                <span class="text-[11px] text-slate-500 mt-1 block">Tanggal terbit dokumen surat dinas, kuitansi, atau bukti fisik pendukung.</span>
                                            </div>
                                            <div>
                                                <label class="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                                                    <i class="fa-regular fa-clock text-slate-400 mr-1"></i> Waktu Pengunggahan Sistem
                                                </label>
                                                <input type="text" value="Terekam Otomatis saat Unggah" disabled
                                                    class="w-full h-10 px-3 text-sm rounded-xl border border-slate-200 bg-slate-100 font-medium text-slate-500 cursor-not-allowed">
                                                <span class="text-[11px] text-slate-500 mt-1 block">Sistem otomatis mencatat timestamp untuk verifikasi ketepatan waktu.</span>
                                            </div>
                                        </div>
                                    </div>

                                    ${isFinancial ? `
                                    <!-- Baris Khusus Finansial: Nomor NTPN & Nominal Penyetoran Rupiah -->
                                    <div class="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label class="text-xs font-bold text-emerald-900 uppercase tracking-wider block mb-1.5">
                                                <i class="fa-solid fa-receipt text-emerald-600 mr-1"></i> Nomor NTPN (Bukti Setoran Kas Negara) <span class="text-rose-500">*</span>
                                            </label>
                                            <input type="text" name="ntpn" required placeholder="Masukkan 16 digit kode NTPN..."
                                                class="w-full h-10 px-3 text-sm rounded-xl border border-emerald-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-medium text-slate-800">
                                        </div>
                                        <div>
                                            <label class="text-xs font-bold text-emerald-900 uppercase tracking-wider block mb-1.5">
                                                <i class="fa-solid fa-money-bill-wave text-emerald-600 mr-1"></i> Nominal Setoran / Realisasi (Rp)
                                            </label>
                                            <div class="relative flex items-center">
                                                <span class="absolute left-3.5 text-sm font-extrabold text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-md border border-emerald-200 select-none pointer-events-none">Rp</span>
                                                <input type="text" name="nilai_setoran" inputmode="numeric" autocomplete="off"
                                                    value="${rec["Selisih"] > 0 ? formatRupiahNumber(rec["Selisih"]) : ''}"
                                                    placeholder="Contoh: 3.000.000"
                                                    oninput="formatRupiahInput(this)"
                                                    class="w-full h-10 pl-14 pr-3 text-sm font-bold text-slate-900 rounded-xl border border-emerald-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500">
                                            </div>
                                        </div>
                                    </div>` : ''}

                                    <!-- Baris 2: Uraian Progres -->
                                    <div>
                                        <label class="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                                            <i class="fa-solid fa-pen-to-square text-emerald-600 mr-1"></i> Uraian Progres / Tindak Lanjut Aktual <span class="text-rose-500">*</span>
                                        </label>
                                        <textarea name="output_aktual" required rows="3"
                                            placeholder="Jelaskan secara rinci tindakan nyata atau dokumen penyelesaian yang telah dilaksanakan oleh Unit Kerja..."
                                            class="w-full p-3 text-sm rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-800 leading-relaxed"></textarea>
                                    </div>

                                    <!-- Baris 3: Lampiran File Bukti Dukung dengan Informasi Spesifik -->
                                    <div>
                                        <label class="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                                            <i class="fa-solid fa-paperclip text-emerald-600 mr-1"></i> Unggah Berkas Bukti Dukung (Eviden)
                                        </label>
                                        
                                        <div class="p-4 rounded-xl bg-slate-50 border-2 border-dashed border-slate-300 hover:border-emerald-500 transition-colors">
                                            <div class="flex flex-col md:flex-row md:items-center justify-between gap-3">
                                                <div class="flex-1">
                                                    <input type="file" name="file"
                                                        accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx"
                                                        onchange="handleBuktiFileChange(this, '${previewId}')"
                                                        class="w-full text-sm text-slate-700 cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-emerald-700 file:text-white hover:file:bg-emerald-800 file:cursor-pointer">
                                                </div>
                                            </div>

                                            <!-- Spesifikasi Ketentuan File -->
                                            <div class="mt-3 pt-3 border-t border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
                                                <div class="flex items-start gap-2">
                                                    <i class="fa-solid fa-file-circle-check text-emerald-600 mt-0.5"></i>
                                                    <div>
                                                        <span class="font-bold text-slate-800">Format File Spesifik:</span>
                                                        <div class="flex flex-wrap gap-1 mt-1">
                                                            <span class="px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 font-bold">PDF (.pdf)</span>
                                                            <span class="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold">Gambar (.png, .jpg, .jpeg)</span>
                                                            <span class="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-bold">Word (.doc, .docx)</span>
                                                            <span class="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">Excel (.xls, .xlsx)</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div class="flex items-start gap-2">
                                                    <i class="fa-solid fa-hard-drive text-amber-600 mt-0.5"></i>
                                                    <div>
                                                        <span class="font-bold text-slate-800">Kapasitas & Ketentuan Unggah:</span>
                                                        <p class="mt-1 text-slate-600">Ukuran maksimal <strong class="text-slate-900">10 MB</strong> per file (Maks. 1 file setiap pengiriman progres).</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <!-- Preview File Terpilih -->
                                            <div id="${previewId}" class="hidden"></div>
                                        </div>
                                    </div>

                                    <!-- Tombol Submit -->
                                    <div class="flex items-center justify-end gap-3 pt-2">
                                        <button type="reset" onclick="document.getElementById('${previewId}')?.classList.add('hidden')" class="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-100 transition-all">
                                            Reset Form
                                        </button>
                                        <button type="submit" class="px-6 py-2.5 rounded-xl bg-md-primary text-white text-sm font-bold hover:bg-emerald-800 shadow-sm hover:shadow active:scale-95 transition-all flex items-center gap-2 cursor-pointer">
                                            <i class="fa-solid fa-paper-plane"></i> Kirim Bukti Tindak Lanjut
                                        </button>
                                    </div>
                                </form>
                            </div>
                        `;
                    }

                    let auditorVerifyHTML = "";
                    if (currentRole === "AUDITOR") {
                        auditorVerifyHTML = `
                            <div class="mt-4 bg-indigo-50/70 rounded-xl border border-indigo-200 p-4">
                                <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
                                    <h6 class="text-sm font-bold text-indigo-950 flex items-center gap-2">
                                        <i class="fa-solid fa-user-check text-indigo-600"></i> Verifikasi Status Evaluasi (Auditor Itjen):
                                    </h6>
                                    <span class="text-xs font-bold ${isBpkAudit ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-indigo-100 text-indigo-800 border border-indigo-200'} px-3 py-1 rounded-md">
                                        ${isBpkAudit ? '🛡️ Mode Verifikasi BPK-RI' : '✏️ Audit Internal Itjen'}
                                    </span>
                                </div>
                                <div class="flex flex-wrap items-center gap-2.5">
                                    <button onclick="updateRecStatusDirect('${rec["Kode Rekomendasi"]}', 'TUNTAS', event)" class="px-4 py-2 text-xs font-bold rounded-lg bg-green-600 text-white hover:bg-green-700 active:scale-95 transition-all shadow-xs cursor-pointer inline-flex items-center gap-1.5">
                                        <i class="fa-solid fa-circle-check"></i> Setujui TUNTAS
                                    </button>
                                    <button onclick="updateRecStatusDirect('${rec["Kode Rekomendasi"]}', 'PROSES', event)" class="px-4 py-2 text-xs font-bold rounded-lg bg-blue-600 text-white hover:bg-blue-700 active:scale-95 transition-all shadow-xs cursor-pointer inline-flex items-center gap-1.5">
                                        <i class="fa-solid fa-spinner"></i> Verifikasi PROSES
                                    </button>
                                    <button onclick="updateRecStatusDirect('${rec["Kode Rekomendasi"]}', 'PENDING', event)" class="px-4 py-2 text-xs font-bold rounded-lg bg-orange-600 text-white hover:bg-orange-700 active:scale-95 transition-all shadow-xs cursor-pointer inline-flex items-center gap-1.5">
                                        <i class="fa-solid fa-clock"></i> Set PENDING
                                    </button>
                                </div>
                            </div>
                        `;
                    }

                    const recStatusConfig = {
                        "TUNTAS":  { label: "Selesai",       dotColor: "bg-green-500",  textColor: "text-green-700",  bgColor: "bg-green-50 border-green-200" },
                        "PROSES":  { label: "On Progress",   dotColor: "bg-blue-500",   textColor: "text-blue-700",   bgColor: "bg-blue-50 border-blue-200" },
                        "PENDING": { label: "Belum TL",      dotColor: "bg-orange-500", textColor: "text-orange-700", bgColor: "bg-orange-50 border-orange-200" },
                    };
                    const rst = recStatusConfig[status] || recStatusConfig["PENDING"];

                    return `
                        <div class="p-5 rounded-2xl bg-slate-50/90 border border-slate-200 flex flex-col gap-4">
                            <!-- Header Rekomendasi -->
                            <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
                                <div class="flex items-center gap-2.5 flex-wrap">
                                    <span class="font-mono text-sm font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-200">${rec["Kode Rekomendasi"]}</span>
                                    <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-sm font-bold">
                                        <i class="fa-solid fa-building-user text-emerald-600"></i> PIC: ${rec["PIC"]}
                                    </span>
                                    <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg ${recDeadline.isOverdue ? 'bg-rose-50 text-rose-800 border-rose-200' : 'bg-white text-slate-700 border-slate-200'} border text-xs font-semibold">
                                        <i class="fa-solid fa-hourglass-half ${recDeadline.isOverdue ? 'text-rose-600' : 'text-indigo-600'}"></i>
                                        Batas Waktu (60 Hari): <strong>${recDeadline.deadlineText}</strong>
                                        <span class="text-[11px] font-bold ${recDeadline.isOverdue ? 'text-rose-700' : 'text-emerald-700'}">(${recDeadline.statusBadgeText})</span>
                                    </span>
                                </div>
                                <div class="flex items-center gap-2">
                                    <span class="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border ${rst.bgColor} ${rst.textColor}">
                                        <span class="w-2 h-2 rounded-full ${rst.dotColor}"></span>
                                        ${rst.label}
                                    </span>
                                    ${currentRole === "AUDITOR" && !isBpkAudit ? `
                                    <button onclick="openRekomendasiModal('${t["Kode Temuan"]}', true, '${rec["Kode Rekomendasi"]}')" class="p-2 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-white transition-colors text-sm" title="Edit Rekomendasi"><i class="fa-solid fa-pen"></i></button>
                                    <button onclick="triggerDeleteRekomendasi('${rec["Kode Rekomendasi"]}')" class="p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-white transition-colors text-sm" title="Hapus Rekomendasi"><i class="fa-solid fa-trash"></i></button>
                                    ` : ''}
                                </div>
                            </div>

                            <!-- Uraian Rekomendasi -->
                            <div class="bg-white p-4 rounded-xl border border-slate-200/80">
                                <h5 class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Rekomendasi Audit:</h5>
                                <p class="text-base text-slate-900 leading-relaxed font-semibold">${rec["Rekomendasi"]}</p>
                            </div>

                            <!-- Rencana Aksi & Target Waktu -->
                            <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div class="md:col-span-2 bg-white p-4 rounded-xl border border-slate-200/80 flex flex-col justify-between">
                                    <div>
                                        <div class="flex items-center justify-between mb-1.5">
                                            <h5 class="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                                <i class="fa-solid fa-list-check text-emerald-600"></i>
                                                Rencana Aksi Unit Kerja (Renaksi):
                                            </h5>
                                            ${currentRole === "SATKER" ? `
                                            <button onclick="openRenaksiModal('${rec["Kode Rekomendasi"]}')" 
                                                class="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-all flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95">
                                                <i class="fa-solid fa-pen-to-square"></i> ${rec["Rencana Aksi"] ? 'Ubah Renaksi' : '+ Buat Renaksi'}
                                            </button>` : ''}
                                        </div>
                                        <p class="text-sm text-slate-800 leading-relaxed font-medium">
                                            ${rec["Rencana Aksi"] || '<span class="text-slate-400 italic font-normal">Belum ada rencana aksi yang dicatat oleh Unit Kerja.</span>'}
                                        </p>
                                    </div>
                                </div>
                                <div class="bg-white p-4 rounded-xl border border-slate-200/80 flex flex-col justify-center gap-2">
                                    <div>
                                        <span class="text-xs font-bold text-slate-500 uppercase tracking-wider block">Target Pelaksanaan:</span>
                                        <span class="text-sm font-bold text-slate-800">${rec["Jadwal Pelaksanaan"] && rec["Jadwal Pelaksanaan"] !== "nan" ? rec["Jadwal Pelaksanaan"] : '<span class="text-slate-400 italic font-normal">Belum ditentukan</span>'}</span>
                                    </div>
                                    <div class="pt-2 border-t border-slate-100">
                                        <span class="text-xs font-bold text-slate-500 uppercase tracking-wider block">Batas Waktu Penyelesaian:</span>
                                        <span class="text-sm font-bold ${recDeadline.isOverdue ? 'text-rose-600' : 'text-indigo-900'}">${recDeadline.deadlineText}</span>
                                        <span class="text-xs font-semibold block ${recDeadline.isOverdue ? 'text-rose-600' : 'text-slate-500'}">${recDeadline.statusText}</span>
                                    </div>
                                </div>
                            </div>

                            ${currentRole === "SATKER" && !rec["Rencana Aksi"] ? `
                            <!-- Banner Pengingat Satker untuk Menyusun Renaksi -->
                            <div class="mt-3 p-4 rounded-xl bg-amber-50/90 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-900">
                                <div class="flex items-start gap-2.5">
                                    <i class="fa-solid fa-triangle-exclamation text-amber-600 mt-0.5 text-base"></i>
                                    <div>
                                        <p class="text-xs font-bold uppercase tracking-wider">Rencana Aksi (Renaksi) Belum Disusun</p>
                                        <p class="text-xs text-amber-800 mt-0.5">Unit Kerja dianjurkan menyusun Rencana Aksi dan target jadwal terlebih dahulu untuk acuan evaluasi pemantauan.</p>
                                    </div>
                                </div>
                                <button onclick="openRenaksiModal('${rec["Kode Rekomendasi"]}')" class="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-amber-600 hover:bg-amber-700 text-white shrink-0 shadow-sm transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer">
                                    <i class="fa-solid fa-plus"></i> Susun Renaksi Sekarang
                                </button>
                            </div>` : ''}

                            ${financialHTML}
                            ${progressHTML}
                            ${auditorVerifyHTML}
                            ${satkerInputFormHTML}
                        </div>
                    `;
                }).join('');
            }

            const childTemuan = temuanList.filter(c => c["Parent Temuan"] === t["Kode Temuan"]);
            let childrenHTML = "";
            if (childTemuan.length > 0) {
                childrenHTML = `
                    <div class="flex flex-col gap-5 mt-2">
                        <h4 class="text-sm font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-2">
                            <i class="fa-solid fa-diagram-project text-indigo-600"></i>
                            Daftar Sub-Temuan (${childTemuan.length})
                        </h4>
                        ${childTemuan.map(child => processTemuan(child, true)).join('')}
                    </div>
                `;
            }

            const borderStyle = isChild ? "ml-4 sm:ml-6 border-l-4 border-indigo-400 pl-4 sm:pl-6 bg-white border border-slate-200 shadow-xs" : "bg-white border border-slate-200 shadow-sm";

            const picBadgesHTML = nodePics.length > 0
                ? nodePics.map(p => `<span class="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold"><i class="fa-solid fa-building-user text-emerald-600"></i> ${p}</span>`).join('')
                : `<span class="text-xs text-slate-400 italic">PIC belum ditentukan</span>`;

            return `
                <div class="flex flex-col gap-5 p-6 rounded-2xl transition-all duration-200 ${borderStyle}">
                    <!-- Temuan Header -->
                    <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
                        <div class="flex items-center gap-2.5 flex-wrap">
                            <span class="font-mono text-sm font-bold text-slate-900 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 flex items-center gap-2">
                                <i class="fa-solid fa-folder-open text-indigo-600"></i>
                                ${t["Kode Temuan"]}
                            </span>
                            ${isChild ? '<span class="text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-200">Sub-temuan</span>' : '<span class="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">Temuan Induk</span>'}
                            <span class="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-50 px-3 py-1 rounded-lg border border-slate-200">
                                <i class="fa-regular fa-calendar text-slate-500"></i> Tgl Temuan: <strong>${temuanDateFormatted}</strong>
                            </span>
                            <span class="inline-flex items-center gap-1.5 text-xs font-semibold ${lhaDeadline.isOverdue ? 'text-rose-800 bg-rose-50 border-rose-200' : 'text-indigo-800 bg-indigo-50 border-indigo-200'} px-3 py-1 rounded-lg border">
                                <i class="fa-solid fa-hourglass-half ${lhaDeadline.isOverdue ? 'text-rose-600' : 'text-indigo-600'}"></i> Batas Waktu: <strong>${lhaDeadline.deadlineFormatted}</strong>
                            </span>
                        </div>
                        <div class="flex items-center gap-2 flex-wrap">
                            ${picBadgesHTML}
                            ${currentRole === "AUDITOR" && !isBpkAudit ? `
                            <div class="flex gap-1 shrink-0 ml-2">
                                <button onclick="openTemuanModal('${kodeLha}', true, '${t["Kode Temuan"]}')" class="p-2 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 transition-colors text-sm" title="Edit Temuan"><i class="fa-solid fa-pen"></i></button>
                                <button onclick="triggerDeleteTemuan('${t["Kode Temuan"]}')" class="p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors text-sm" title="Hapus Temuan"><i class="fa-solid fa-trash"></i></button>
                            </div>` : ''}
                        </div>
                    </div>

                    <!-- Struktur 4 Unsur Temuan Pemeriksaan -->
                    <div class="flex flex-col gap-3">
                        <div class="flex flex-wrap items-center justify-between gap-2 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200">
                            <div class="flex items-center gap-2">
                                <i class="fa-solid fa-list-ol text-indigo-600 text-sm"></i>
                                <span class="text-xs font-bold text-slate-800 uppercase tracking-wider">Struktur 4 Unsur Pokok Temuan Audit</span>
                            </div>
                            <div class="flex items-center gap-1.5 flex-wrap">
                                <span class="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200" title="Kriteria > Kondisi = Terjadi Deviasi/Temuan">
                                    <i class="fa-solid fa-scale-unbalanced text-[10px]"></i> Kriteria &gt; Kondisi = Temuan
                                </span>
                                <span class="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200" title="Rekomendasi meniadakan Sebab & memulihkan Akibat">
                                    <i class="fa-solid fa-wrench text-[10px]"></i> Rekomendasi = Solusi Atas Sebab & Akibat
                                </span>
                            </div>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                            <!-- 1. Kondisi -->
                            <div class="flex flex-col border-l-4 border-slate-800 bg-slate-50/70 p-4 rounded-r-xl border border-slate-200">
                                <div class="flex items-center justify-between mb-1.5">
                                    <h4 class="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                                        <span class="w-4 h-4 rounded-full bg-slate-900 text-white text-[10px] flex items-center justify-center font-bold">1</span>
                                        Kondisi (Fakta Riil di Lapangan)
                                    </h4>
                                    <span class="text-[10px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">Realita Aktual</span>
                                </div>
                                <p class="text-sm font-medium text-slate-900 leading-relaxed whitespace-pre-line flex-1">
                                    ${t.Kondisi || (t.Kriteria ? `<span class="text-slate-700">${t.Kriteria}</span>` : '<span class="text-slate-400 italic">Kondisi belum dirinci spesifik.</span>')}
                                </p>
                            </div>

                            <!-- 2. Kriteria -->
                            <div class="flex flex-col border-l-4 border-indigo-600 bg-indigo-50/50 p-4 rounded-r-xl border border-indigo-100">
                                <div class="flex items-center justify-between mb-1.5">
                                    <h4 class="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                                        <span class="w-4 h-4 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center font-bold">2</span>
                                        Kriteria (Dasar Hukum / SOP)
                                    </h4>
                                    <span class="text-[10px] font-semibold text-indigo-700 bg-white px-2 py-0.5 rounded border border-indigo-200">Tolok Ukur / Standar</span>
                                </div>
                                <p class="text-sm font-medium text-slate-900 leading-relaxed whitespace-pre-line flex-1">
                                    ${t.Kriteria || '<span class="text-slate-400 italic">Kriteria belum diisi.</span>'}
                                </p>
                            </div>

                            <!-- 3. Sebab -->
                            <div class="flex flex-col border-l-4 border-amber-500 bg-amber-50/50 p-4 rounded-r-xl border border-amber-100">
                                <div class="flex items-center justify-between mb-1.5">
                                    <h4 class="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                                        <span class="w-4 h-4 rounded-full bg-amber-600 text-white text-[10px] flex items-center justify-center font-bold">3</span>
                                        Sebab (Akar Penyebab Masalah)
                                    </h4>
                                    <span class="text-[10px] font-semibold text-amber-700 bg-white px-2 py-0.5 rounded border border-amber-200">Akar Masalah (Why)</span>
                                </div>
                                <p class="text-sm font-medium text-slate-800 leading-relaxed whitespace-pre-line flex-1">
                                    ${t.Sebab || '<span class="text-slate-400 italic">Sebab belum diuraikan.</span>'}
                                </p>
                            </div>

                            <!-- 4. Akibat -->
                            <div class="flex flex-col border-l-4 border-rose-500 bg-rose-50/50 p-4 rounded-r-xl border border-rose-100">
                                <div class="flex items-center justify-between mb-1.5">
                                    <h4 class="text-xs font-bold text-rose-900 uppercase tracking-wider flex items-center gap-1.5">
                                        <span class="w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] flex items-center justify-center font-bold">4</span>
                                        Akibat (Dampak / Kerugian Negara)
                                    </h4>
                                    <span class="text-[10px] font-semibold text-rose-700 bg-white px-2 py-0.5 rounded border border-rose-200">Dampak & Risiko</span>
                                </div>
                                <p class="text-sm font-medium text-slate-800 leading-relaxed whitespace-pre-line flex-1">
                                    ${t.Akibat || '<span class="text-slate-400 italic">Akibat belum diuraikan.</span>'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <!-- Recommendations directly under this temuan -->
                    ${(directRecs.length > 0 || childTemuan.length === 0) ? `
                    <div class="flex flex-col gap-4 border-t border-slate-200 pt-5 mt-1">
                        <div class="flex items-center justify-between">
                            <h4 class="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                                <i class="fa-solid fa-clipboard-list text-indigo-600"></i>
                                Rekomendasi (${directRecs.length})
                            </h4>
                            ${currentRole === "AUDITOR" && !isBpkAudit ? `
                            <button onclick="openRekomendasiModal('${t["Kode Temuan"]}', false)" class="px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer">
                                <i class="fa-solid fa-plus"></i> Tambah Rekomendasi
                            </button>` : ''}
                        </div>
                        
                        ${directRecs.length > 0 ? `
                        <div class="flex flex-col gap-4 mt-1">
                            ${recsHTML}
                        </div>` : `
                        <div class="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                            <p class="text-sm text-slate-500 font-medium">Belum ada rekomendasi langsung pada butir temuan ini.</p>
                            ${currentRole === "AUDITOR" && !isBpkAudit ? `
                            <button onclick="openRekomendasiModal('${t["Kode Temuan"]}', false)" class="mt-3 px-4 py-2 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-bold hover:bg-indigo-100 transition-all inline-flex items-center gap-1.5 cursor-pointer">
                                <i class="fa-solid fa-plus"></i> Tambah Rekomendasi
                            </button>` : ''}
                        </div>
                        `}
                    </div>` : ''}

                    <!-- Sub-Temuan (if any) -->
                    ${childrenHTML}
                </div>
            `;
        };

        if (selectedTemuanId === null) {
            // Render Findings List (with PIC, Tanggal Temuan, dan Batas Waktu Tindak Lanjut 60 Hari)
            const listItems = parentTemuan.map(t => {
                const dateFormatted = formatTemuanDate(t["Tanggal Input"]);
                const temuanRange = getFollowUpRangeForTemuan(t["Kode Temuan"]);
                const recs = getRecommendationsForFinding(t["Kode Temuan"]);
                const pics = getUniquePicsForTemuan(t["Kode Temuan"]);
                const status = computeTemuanStatus(t["Kode Temuan"]);
                
                const statusMap = {
                    "TUNTAS":  { label: "Selesai",       dotColor: "bg-green-500",  textColor: "text-green-700",  bgColor: "bg-green-50 border-green-200" },
                    "PROSES":  { label: "On Progress",   dotColor: "bg-blue-500",   textColor: "text-blue-700",   bgColor: "bg-blue-50 border-blue-200" },
                    "PENDING": { label: "Belum TL",      dotColor: "bg-orange-500", textColor: "text-orange-700", bgColor: "bg-orange-50 border-orange-200" },
                };
                const st = statusMap[status] || statusMap["PENDING"];

                const picBadges = pics.length > 0
                    ? pics.map(p => `<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold"><i class="fa-solid fa-building-user text-emerald-600"></i> ${p}</span>`).join('')
                    : `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-500 text-xs font-medium">PIC Belum Ditentukan</span>`;

                const childTemuan = temuanList.filter(c => c["Parent Temuan"] === t["Kode Temuan"]);
                let childrenHTML = "";
                if (childTemuan.length > 0) {
                    childrenHTML = childTemuan.map(child => {
                        const childRecs = getRecommendationsForFinding(child["Kode Temuan"]);
                        const childPics = getUniquePicsForTemuan(child["Kode Temuan"]);
                        const childDateFormatted = formatTemuanDate(child["Tanggal Input"]);
                        const childRange = getFollowUpRangeForTemuan(child["Kode Temuan"]);
                        const childStatus = computeTemuanStatus(child["Kode Temuan"]);
                        const cst = statusMap[childStatus] || statusMap["PENDING"];

                        const childPicBadges = childPics.length > 0
                            ? childPics.map(p => `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold"><i class="fa-solid fa-building-user text-emerald-600"></i> ${p}</span>`).join('')
                            : `<span class="text-xs text-slate-400 italic">PIC Belum Ditentukan</span>`;

                        return `
                            <div class="bg-slate-50/90 border border-slate-200 border-l-4 border-l-indigo-400 p-5 rounded-xl flex flex-col gap-3 ml-6 shadow-2xs">
                                <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
                                    <div class="flex items-center gap-2.5 flex-wrap">
                                        <span class="font-mono text-sm font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-md border border-indigo-200">
                                            ${child["Kode Temuan"]}
                                        </span>
                                        <span class="text-xs font-bold text-slate-600 bg-white px-2.5 py-1 rounded-md border border-slate-200">Sub-temuan</span>
                                        <span class="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-white px-2.5 py-1 rounded-md border border-slate-200">
                                            <i class="fa-regular fa-calendar text-slate-500"></i> Tgl Temuan: <strong>${childDateFormatted}</strong>
                                        </span>
                                        <span class="inline-flex items-center gap-1.5 text-xs font-semibold ${lhaDeadline.isOverdue ? 'text-rose-800 bg-rose-50 border-rose-200' : 'text-indigo-800 bg-indigo-50 border-indigo-200'} px-2.5 py-1 rounded-md border">
                                            <i class="fa-solid fa-hourglass-half ${lhaDeadline.isOverdue ? 'text-rose-600' : 'text-indigo-600'}"></i> Batas Waktu: <strong>${lhaDeadline.deadlineFormatted}</strong>
                                        </span>
                                    </div>
                                    <span class="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-md border ${cst.bgColor} ${cst.textColor}">
                                        <span class="w-2 h-2 rounded-full ${cst.dotColor}"></span> ${cst.label}
                                    </span>
                                </div>

                                <!-- 4 Unsur Temuan Preview Sub-Temuan -->
                                <div class="flex flex-col gap-2">
                                    <div class="flex items-start gap-2">
                                        <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-900 text-white shrink-0 mt-0.5">1. Kondisi</span>
                                        <p class="text-sm font-bold text-slate-900 line-clamp-2 leading-relaxed">
                                            ${child.Kondisi || child.Kriteria || 'Temuan Pemeriksaan'}
                                        </p>
                                    </div>
                                    <div class="flex items-start gap-2 text-xs text-slate-600">
                                        <span class="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0">2. Kriteria</span>
                                        <p class="line-clamp-1 italic text-slate-600">${child.Kriteria || '-'}</p>
                                    </div>
                                    ${(child.Sebab || child.Akibat) ? `
                                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1 pt-2 border-t border-slate-200/60 text-xs">
                                        ${child.Sebab ? `
                                        <div class="flex items-start gap-1.5 text-amber-900 bg-amber-50/80 p-2 rounded-lg border border-amber-200/70">
                                            <span class="font-bold text-[10px] uppercase bg-amber-200/60 px-1 py-0.2 rounded shrink-0">3. Sebab</span>
                                            <span class="line-clamp-1">${child.Sebab}</span>
                                        </div>` : ''}
                                        ${child.Akibat ? `
                                        <div class="flex items-start gap-1.5 text-rose-900 bg-rose-50/80 p-2 rounded-lg border border-rose-200/70">
                                            <span class="font-bold text-[10px] uppercase bg-rose-200/60 px-1 py-0.2 rounded shrink-0">4. Akibat</span>
                                            <span class="line-clamp-1">${child.Akibat}</span>
                                        </div>` : ''}
                                    </div>` : ''}
                                </div>

                                <!-- Baris PIC & Aksi Sub-Temuan -->
                                <div class="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200/80 pt-3 mt-0.5">
                                    <div class="flex flex-wrap items-center gap-2">
                                        <span class="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">PIC:</span>
                                        ${childPicBadges}
                                        <span class="text-slate-300 mx-1">•</span>
                                        <span class="text-xs text-slate-600 font-bold">
                                            <i class="fa-solid fa-clipboard-list text-indigo-600 mr-1"></i> ${childRecs.length} Rekomendasi
                                        </span>
                                    </div>
                                    <div class="flex gap-2 items-center">
                                        ${currentRole === "AUDITOR" && !isBpkAudit ? `
                                        <button onclick="openTemuanModal('${kodeLha}', true, '${child["Kode Temuan"]}')" class="p-2 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-white text-sm" title="Edit Temuan"><i class="fa-solid fa-pen"></i></button>
                                        <button onclick="triggerDeleteTemuan('${child["Kode Temuan"]}')" class="p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-white text-sm" title="Hapus Temuan"><i class="fa-solid fa-trash"></i></button>
                                        ` : ''}
                                        <button onclick="selectTemuanDetail('${child["Kode Temuan"]}')" class="px-4 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs">
                                            <i class="fa-solid fa-eye"></i> Detail Sub-Temuan
                                        </button>
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('');
                }

                return `
                    <div class="flex flex-col gap-2.5">
                        <div class="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs hover:border-slate-300 transition-all flex flex-col gap-4">
                            <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
                                <div class="flex items-center gap-2.5 flex-wrap">
                                    <span class="font-mono text-sm font-bold text-slate-900 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200 flex items-center gap-2">
                                        <i class="fa-solid fa-folder-open text-indigo-600"></i>
                                        ${t["Kode Temuan"]}
                                    </span>
                                    <span class="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-50 px-3 py-1 rounded-lg border border-slate-200">
                                        <i class="fa-regular fa-calendar text-slate-500"></i> Tgl Temuan: <strong>${dateFormatted}</strong>
                                    </span>
                                    <span class="inline-flex items-center gap-1.5 text-xs font-semibold ${lhaDeadline.isOverdue ? 'text-rose-800 bg-rose-50 border-rose-200' : 'text-indigo-800 bg-indigo-50 border-indigo-200'} px-3 py-1 rounded-lg border">
                                        <i class="fa-solid fa-hourglass-half ${lhaDeadline.isOverdue ? 'text-rose-600' : 'text-indigo-600'}"></i> Batas Waktu: <strong>${lhaDeadline.deadlineFormatted}</strong>
                                    </span>
                                </div>
                                <span class="inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-lg border ${st.bgColor} ${st.textColor}">
                                    <span class="w-2 h-2 rounded-full ${st.dotColor}"></span> ${st.label}
                                </span>
                            </div>

                            <!-- 4 Unsur Temuan Preview Temuan Induk -->
                            <div class="flex flex-col gap-2">
                                <div class="flex items-start gap-2">
                                    <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-900 text-white shrink-0 mt-0.5">1. Kondisi</span>
                                    <p class="text-base font-bold text-slate-900 line-clamp-2 leading-relaxed">
                                        ${t.Kondisi || t.Kriteria || 'Temuan Pemeriksaan'}
                                    </p>
                                </div>
                                <div class="flex items-start gap-2 text-xs text-slate-600">
                                    <span class="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0">2. Kriteria</span>
                                    <p class="line-clamp-1 italic text-slate-600">${t.Kriteria || '-'}</p>
                                </div>
                                ${(t.Sebab || t.Akibat) ? `
                                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1 pt-2 border-t border-slate-100 text-xs">
                                    ${t.Sebab ? `
                                    <div class="flex items-start gap-1.5 text-amber-900 bg-amber-50/80 p-2 rounded-lg border border-amber-200/70">
                                        <span class="font-bold text-[10px] uppercase bg-amber-200/60 px-1 py-0.2 rounded shrink-0">3. Sebab</span>
                                        <span class="line-clamp-1">${t.Sebab}</span>
                                    </div>` : ''}
                                    ${t.Akibat ? `
                                    <div class="flex items-start gap-1.5 text-rose-900 bg-rose-50/80 p-2 rounded-lg border border-rose-200/70">
                                        <span class="font-bold text-[10px] uppercase bg-rose-200/60 px-1 py-0.2 rounded shrink-0">4. Akibat</span>
                                        <span class="line-clamp-1">${t.Akibat}</span>
                                    </div>` : ''}
                                </div>` : ''}
                            </div>

                            <!-- Baris PIC & Aksi Temuan Induk -->
                            <div class="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3.5 mt-1">
                                <div class="flex flex-wrap items-center gap-2">
                                    <span class="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">PIC Terkait:</span>
                                    ${picBadges}
                                    <span class="text-slate-300 mx-1">•</span>
                                    <span class="text-sm text-slate-700 font-bold">
                                        <i class="fa-solid fa-clipboard-list text-indigo-600 mr-1"></i> ${recs.length} Rekomendasi Terkait
                                    </span>
                                </div>
                                <div class="flex gap-2 items-center">
                                    ${currentRole === "AUDITOR" && !isBpkAudit ? `
                                    <button onclick="openTemuanModal('${kodeLha}', true, '${t["Kode Temuan"]}')" class="p-2 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 text-sm" title="Edit Temuan"><i class="fa-solid fa-pen"></i></button>
                                    <button onclick="triggerDeleteTemuan('${t["Kode Temuan"]}')" class="p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 text-sm" title="Hapus Temuan"><i class="fa-solid fa-trash"></i></button>
                                    ` : ''}
                                    <button onclick="selectTemuanDetail('${t["Kode Temuan"]}')" class="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 active:scale-95 transition-all flex items-center gap-2 cursor-pointer shadow-xs">
                                        <i class="fa-solid fa-eye"></i> Detail Temuan
                                    </button>
                                </div>
                            </div>
                        </div>
                        ${childrenHTML}
                    </div>
                `;
            }).join('');

            temuanSectionsHTML = `
                <div class="flex flex-col gap-5">
                    <div class="flex items-center justify-between">
                        <h3 class="text-base font-bold text-slate-800 tracking-wide uppercase flex items-center gap-2">
                            <i class="fa-solid fa-list-check text-indigo-600"></i>
                            Daftar Temuan Pemeriksaan (${parentTemuan.length} Temuan Induk · ${temuanList.length} Total Butir)
                        </h3>
                        ${currentRole === "AUDITOR" && !isBpkAudit ? `
                        <button onclick="openTemuanModal('${kodeLha}', false)" class="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs">
                            <i class="fa-solid fa-plus"></i> Tambah Temuan
                        </button>` : isBpkAudit ? `<span class="text-xs font-bold text-amber-900 bg-amber-50 px-3.5 py-1.5 rounded-lg border border-amber-200 inline-flex items-center gap-1.5"><i class="fa-solid fa-shield-halved text-amber-600"></i> Temuan BPK-RI (ReadOnly)</span>` : ''}
                    </div>
                    <div class="flex flex-col gap-5">
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
                    <button onclick="goBackToFindings()" class="self-start px-4 py-2 rounded-xl bg-indigo-50 text-indigo-700 text-sm font-bold hover:bg-indigo-100 transition-all flex items-center gap-2 cursor-pointer border border-indigo-200/60">
                        <i class="fa-solid fa-arrow-left"></i> Kembali ke Daftar Temuan
                    </button>
                    ${processTemuan(t)}
                </div>
            `;
        }
    }

    content.innerHTML = `
        <!-- Executive LHA Document Header -->
        <div class="px-6 py-5 border-b border-slate-200 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div class="flex flex-col gap-2">
                <!-- Breadcrumb -->
                <nav class="flex items-center gap-2 text-sm text-slate-500 font-medium">
                    <button onclick="closeDetail()" class="hover:text-indigo-600 font-bold flex items-center gap-1.5 transition-colors cursor-pointer">
                        <i class="fa-solid fa-arrow-left text-slate-400"></i> Tabel Dokumen LHA
                    </button>
                    <span class="text-slate-300">•</span>
                    <span class="font-bold text-slate-900">${kodeLha}</span>
                    ${selectedTemuanId ? `
                    <span class="text-slate-300">•</span>
                    <span class="font-bold text-indigo-600">${selectedTemuanId}</span>
                    ` : ''}
                </nav>

                <!-- Document Title & Meta -->
                <div class="flex items-center gap-3 flex-wrap">
                    <h2 class="text-xl font-extrabold text-slate-900 tracking-tight">${kodeLha}</h2>
                    <span class="text-slate-300">|</span>
                    <span class="text-xs font-bold px-3 py-1 rounded-md ${source === 'BPK-RI' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-pink-50 text-pink-700 border border-pink-200'}">${source}</span>
                    ${getJenisAuditBadge(lha["Jenis Audit"])}
                    <span class="text-sm text-slate-600 font-semibold">Tahun ${lha.Tahun || '2025'}</span>
                    <span class="text-slate-300">•</span>
                    <span class="inline-flex items-center gap-1.5 text-sm font-bold ${sc.textColor || 'text-slate-700'}">
                        <span class="w-2.5 h-2.5 rounded-full ${sc.dotColor || 'bg-slate-400'}"></span>
                        ${lhaStatus === 'PROSES' ? 'On Progress' : lhaStatus === 'TUNTAS' ? 'Selesai' : 'Belum TL'}
                    </span>
                </div>
            </div>

            <!-- Actions Header -->
            <div class="flex items-center gap-2.5 shrink-0">
                ${currentRole === "AUDITOR" && !isBpkAudit ? `
                <button onclick="openTemuanModal('${kodeLha}', false)" class="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 active:scale-95 transition-all inline-flex items-center gap-2 shadow-xs cursor-pointer">
                    <i class="fa-solid fa-plus"></i> Tambah Temuan
                </button>
                <button onclick="openLhaModal(true, '${kodeLha}')" class="p-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 active:scale-90 transition-all text-sm" title="Edit LHA">
                    <i class="fa-solid fa-pen"></i>
                </button>
                <button onclick="triggerDeleteLha('${kodeLha}')" class="p-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 active:scale-90 transition-all text-sm" title="Hapus LHA">
                    <i class="fa-solid fa-trash"></i>
                </button>
                ` : isBpkAudit ? `
                <span class="text-xs font-bold px-3.5 py-1.5 rounded-lg bg-amber-50 text-amber-900 border border-amber-200 inline-flex items-center gap-1.5">
                    <i class="fa-solid fa-shield-halved text-amber-600"></i> Mode Verifikasi BPK-RI
                </span>
                ` : ''}

                <button onclick="closeDetail()" class="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 active:scale-95 transition-all text-sm font-bold cursor-pointer">
                    <i class="fa-solid fa-xmark mr-1"></i> Tutup
                </button>
            </div>
        </div>

        <!-- Detail Body (Scrollable) -->
        <div class="flex-1 overflow-y-auto p-6 flex flex-col gap-6 bg-slate-50/40">
            <!-- BATL Section (if applicable) -->
            ${batlHTML}

            <!-- Dynamically Loaded Findings List or Finding Details -->
            <div class="flex flex-col gap-6">
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
    const jenisInput = document.getElementById("lhaFormJenis");
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
            if (jenisInput) jenisInput.value = lha["Jenis Audit"] || "Audit Kinerja";
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
        if (jenisInput) jenisInput.value = "Audit Kinerja";
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
        jenis_audit: document.getElementById("lhaFormJenis")?.value || "Audit Kinerja",
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
    const kondisiInput = document.getElementById("temuanFormKondisi");
    const kriteriaInput = document.getElementById("temuanFormKriteria");
    const sebabInput = document.getElementById("temuanFormSebab");
    const akibatInput = document.getElementById("temuanFormAkibat");
    
    if (!modal) return;
    modal.classList.remove("hidden");
    
    // Populate LHP dropdown options dynamically
    if (lhaSelect) {
        lhaSelect.innerHTML = masterLHP.map(l => 
            `<option value="${l["Kode LHP"]}">${l["Kode LHP"]} (${l["Sumber Audit"]} - ${l["Jenis Audit"] || 'Audit Kinerja'})</option>`
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
            if (kondisiInput) kondisiInput.value = tem.Kondisi || "";
            if (kriteriaInput) kriteriaInput.value = tem.Kriteria || "";
            if (sebabInput) sebabInput.value = tem.Sebab || "";
            if (akibatInput) akibatInput.value = tem.Akibat || "";
        }
    } else {
        title.textContent = "Tambah Temuan Baru";
        isEditInput.value = "false";
        oldKodeInput.value = "";
        kodeInput.value = "";
        kodeInput.disabled = false;
        if (kondisiInput) kondisiInput.value = "";
        if (kriteriaInput) kriteriaInput.value = "";
        if (sebabInput) sebabInput.value = "";
        if (akibatInput) akibatInput.value = "";
        
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
        kondisi: document.getElementById("temuanFormKondisi")?.value.trim() || null,
        kriteria: document.getElementById("temuanFormKriteria").value.trim(),
        sebab: document.getElementById("temuanFormSebab")?.value.trim() || null,
        akibat: document.getElementById("temuanFormAkibat")?.value.trim() || null,
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

// 3. Rekomendasi Modal (Auditor: Rekomendasi, PIC, & Target Finansial)
function openRekomendasiModal(temuanKode, isEdit = false, oldKode = "") {
    const modal = document.getElementById("rekomendasiModal");
    const title = document.getElementById("rekomendasiModalTitle");
    const isEditInput = document.getElementById("recFormIsEdit");
    const oldKodeInput = document.getElementById("recFormOldKode");
    const temuanInput = document.getElementById("recFormTemuan");
    const kodeInput = document.getElementById("recFormKode");
    const textInput = document.getElementById("recFormText");
    const picInput = document.getElementById("recFormPic");
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
            nilaiInput.value = formatRupiahNumber(rec["Nilai Temuan"] || 0);
            formatRupiahInput(nilaiInput, 'recFormNilaiPreview');
        }
    } else {
        title.textContent = "Tambah Rekomendasi Baru";
        isEditInput.value = "false";
        oldKodeInput.value = "";
        kodeInput.value = "";
        kodeInput.disabled = false;
        textInput.value = "";
        picInput.value = "Biro SDMO";
        nilaiInput.value = "0";
        formatRupiahInput(nilaiInput, 'recFormNilaiPreview');
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
    
    const existingRec = isEdit ? tabelRekomendasi.find(r => r["Kode Rekomendasi"] === oldKode) : null;
    
    const recData = {
        kode_rekomendasi: document.getElementById("recFormKode").value.trim(),
        kode_temuan: temuanKode,
        rekomendasi: document.getElementById("recFormText").value.trim(),
        pic: document.getElementById("recFormPic").value,
        // Rencana Aksi & Jadwal Pelaksanaan diisi oleh Satker (tidak ditimpa Auditor)
        rencana_aksi: existingRec ? (existingRec["Rencana Aksi"] || null) : null,
        jadwal_pelaksanaan: existingRec ? (existingRec["Jadwal Pelaksanaan"] || null) : null,
        nilai_temuan: parseRupiahValue(document.getElementById("recFormNilaiTemuan").value)
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

// 4. Modal Rencana Aksi (RENAKSI) Unit Kerja (Satker)
function openRenaksiModal(kodeRekomendasi) {
    const modal = document.getElementById("renaksiModal");
    if (!modal) return;
    
    const rec = tabelRekomendasi.find(r => r["Kode Rekomendasi"] === kodeRekomendasi);
    if (!rec) return;

    document.getElementById("renaksiRecKodeHidden").value = kodeRekomendasi;
    document.getElementById("renaksiRecKode").textContent = kodeRekomendasi;
    document.getElementById("renaksiRecPic").textContent = `Unit PIC: ${rec.PIC || currentUser?.pic || 'Satker'}`;
    document.getElementById("renaksiRecText").textContent = rec.Rekomendasi || "";
    document.getElementById("renaksiInputText").value = rec["Rencana Aksi"] || "";
    document.getElementById("renaksiInputJadwal").value = (rec["Jadwal Pelaksanaan"] && rec["Jadwal Pelaksanaan"] !== "nan") ? rec["Jadwal Pelaksanaan"] : "";

    modal.classList.remove("hidden");
}

function closeRenaksiModal() {
    document.getElementById("renaksiModal")?.classList.add("hidden");
}

async function handleRenaksiFormSubmit(event) {
    event.preventDefault();
    const kodeRekomendasi = document.getElementById("renaksiRecKodeHidden").value;
    const rencanaAksi = document.getElementById("renaksiInputText").value.trim();
    const jadwalPelaksanaan = document.getElementById("renaksiInputJadwal").value.trim();

    if (!kodeRekomendasi) return;

    try {
        const response = await fetch(`${API_BASE}/rekomendasi/${encodeURIComponent(kodeRekomendasi)}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                rencana_aksi: rencanaAksi,
                jadwal_pelaksanaan: jadwalPelaksanaan
            })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || "Gagal menyimpan Rencana Aksi.");
        }

        closeRenaksiModal();
        showToastNotification("Rencana Aksi Unit Kerja (Renaksi) berhasil disimpan!", "success");
        await loadDataFromAPI();
    } catch (err) {
        console.error(err);
        alert(err.message || "Terjadi kesalahan saat menyimpan Rencana Aksi.");
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

// Direct Auditor Status Verification for Recommendation
async function updateRecStatusDirect(kode_rekomendasi, new_status, event) {
    if (event) event.preventDefault();
    try {
        const response = await fetch(`${API_BASE}/rekomendasi/${kode_rekomendasi}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: new_status })
        });
        
        if (!response.ok) {
            throw new Error("Gagal memperbarui status verifikasi rekomendasi");
        }
        
        alert(`Status verifikasi rekomendasi ${kode_rekomendasi} berhasil diubah menjadi: ${new_status}`);
        await loadDataFromAPI();
    } catch(err) {
        alert(err.message);
    }
}
