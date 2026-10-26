<?php
/**
 * ====================================================================
 * e-TLHP Kemenko Pangan RI - Master API Router (PHP & MySQL)
 * ====================================================================
 * Router terpadu yang memetakan seluruh endpoint RESTful API
 * identik dengan versi FastAPI (Python).
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';

// Inisialisasi CORS dan Headers
setup_cors_and_headers();

// Tangkap Method & URI
$method = $_SERVER['REQUEST_METHOD'];
$request_uri = $_SERVER['REQUEST_URI'] ?? '/';
$path = parse_url($request_uri, PHP_URL_PATH);

// Resolusi path fleksibel (Apache rewrite, query string, atau direct script)
if (!empty($_GET['route'])) {
    $path = '/' . ltrim($_GET['route'], '/');
} else {
    $script_dir = dirname($_SERVER['SCRIPT_NAME'] ?? '');
    if ($script_dir !== '/' && strpos($path, $script_dir) === 0) {
        $path = substr($path, strlen($script_dir));
    }
    if (strpos($path, '/api') === 0) {
        $path = substr($path, 4);
    }
}
$path = '/' . trim($path, '/');
$segments = array_values(array_filter(explode('/', $path)));
$count = count($segments);

$db = get_db_connection();

// ====================================================================
// 0. HEALTHCHECK / ROOT ENDPOINT
// ====================================================================
if ($count === 0 || ($count === 1 && $segments[0] === '')) {
    json_response([
        'message' => 'Selamat datang di API e-TLHP Kemenko Pangan (PHP Version). Sistem Berjalan Normal.',
        'version' => '1.0.0-php'
    ]);
}

// ====================================================================
// 1. AUTENTIKASI: /api/auth/login
// ====================================================================
if ($count === 2 && $segments[0] === 'auth' && $segments[1] === 'login') {
    if ($method !== 'POST') {
        json_error("Method tidak diizinkan", 405);
    }
    $input = get_json_input();
    $username = trim($input['username'] ?? '');
    $password = trim($input['password'] ?? '');

    if (empty($username) || empty($password)) {
        json_error("Username atau Password salah", 401);
    }

    $stmt = $db->prepare("SELECT * FROM tabel_user WHERE username = ?");
    $stmt->execute([$username]);
    $user = $stmt->fetch();

    if (!$user || $user['password'] !== $password) {
        json_error("Username atau Password salah", 401);
    }

    json_response([
        'username' => $user['username'],
        'role'     => $user['role'],
        'pic'      => $user['pic']
    ]);
}

// ====================================================================
// 2. MASTER LHA: /api/lha & /api/lha/{kode_lha}
// ====================================================================
if ($count >= 1 && $segments[0] === 'lha') {
    // GET /api/lha -> Nested Hierarchical Tree LHA -> Temuan -> Rekomendasi -> Bukti
    if ($count === 1 && $method === 'GET') {
        $all_lha = $db->query("SELECT * FROM master_lha ORDER BY tahun DESC, tanggal_input DESC")->fetchAll();
        $all_temuan = $db->query("SELECT * FROM tabel_temuan ORDER BY tanggal_input ASC")->fetchAll();
        $all_rec = $db->query("SELECT * FROM tabel_rekomendasi ORDER BY tanggal_input ASC")->fetchAll();
        $all_bukti = $db->query("SELECT * FROM tabel_bukti_tindak_lanjut ORDER BY tanggal_submit ASC")->fetchAll();

        // 1. Group bukti by kode_rekomendasi
        $bukti_by_rec = [];
        foreach ($all_bukti as $b) {
            $b['id'] = (int)$b['id'];
            $b['tanggal_mulai'] = $b['tanggal_mulai'] ?: $b['tanggal_submit'];
            $b['tanggal_selesai'] = $b['tanggal_selesai'] ?: ($b['tanggal_review'] ?: $b['tanggal_submit']);
            $bukti_by_rec[$b['kode_rekomendasi']][] = $b;
        }

        // 2. Group rekomendasi by kode_temuan
        $rec_by_temuan = [];
        foreach ($all_rec as $r) {
            $r['nilai_temuan'] = (float)$r['nilai_temuan'];
            $r['nilai_realisasi'] = (float)$r['nilai_realisasi'];
            $r['selisih'] = (float)$r['selisih'];
            $r['bukti'] = $bukti_by_rec[$r['kode_rekomendasi']] ?? [];
            $rec_by_temuan[$r['kode_temuan']][] = $r;
        }

        // 3. Group temuan by kode_lha
        $temuan_by_lha = [];
        foreach ($all_temuan as $t) {
            $t['rekomendasi'] = $rec_by_temuan[$t['kode_temuan']] ?? [];
            $temuan_by_lha[$t['kode_lha']][] = $t;
        }

        // 4. Attach temuan to each LHA
        foreach ($all_lha as &$lha) {
            $lha['tahun'] = (int)$lha['tahun'];
            $lha['temuan'] = $temuan_by_lha[$lha['kode_lha']] ?? [];
        }

        json_response($all_lha);
    }

    // POST /api/lha -> Tambah LHA Baru
    if ($count === 1 && $method === 'POST') {
        $input = get_json_input();
        $kode_lha = trim($input['kode_lha'] ?? '');
        $sumber_audit = trim($input['sumber_audit'] ?? '');
        $tahun = (int)($input['tahun'] ?? date('Y'));
        $status_laporan = trim($input['status_laporan'] ?? 'Dalam Pemantauan');

        if (empty($kode_lha) || empty($sumber_audit)) {
            json_error("Kode LHA dan Sumber Audit wajib diisi", 400);
        }

        $check = $db->prepare("SELECT kode_lha FROM master_lha WHERE kode_lha = ?");
        $check->execute([$kode_lha]);
        if ($check->fetch()) {
            json_error("Kode LHA sudah terdaftar", 400);
        }

        $stmt = $db->prepare("INSERT INTO master_lha (kode_lha, sumber_audit, tahun, status_laporan, tanggal_input) VALUES (?, ?, ?, ?, NOW())");
        $stmt->execute([$kode_lha, $sumber_audit, $tahun, $status_laporan]);

        $created = $db->prepare("SELECT * FROM master_lha WHERE kode_lha = ?");
        $created->execute([$kode_lha]);
        $row = $created->fetch();
        $row['tahun'] = (int)$row['tahun'];
        $row['temuan'] = [];
        json_response($row, 201);
    }

    // Single LHA: /api/lha/{kode_lha}
    if ($count === 2) {
        $kode_lha = urldecode($segments[1]);

        if ($method === 'GET') {
            $stmt = $db->prepare("SELECT * FROM master_lha WHERE kode_lha = ?");
            $stmt->execute([$kode_lha]);
            $row = $stmt->fetch();
            if (!$row) json_error("LHA tidak ditemukan", 404);
            $row['tahun'] = (int)$row['tahun'];
            json_response($row);
        }

        if ($method === 'PUT') {
            $input = get_json_input();
            $stmt = $db->prepare("SELECT * FROM master_lha WHERE kode_lha = ?");
            $stmt->execute([$kode_lha]);
            $existing = $stmt->fetch();
            if (!$existing) json_error("LHA tidak ditemukan", 404);

            $sumber_audit = trim($input['sumber_audit'] ?? $existing['sumber_audit']);
            $tahun = isset($input['tahun']) ? (int)$input['tahun'] : $existing['tahun'];
            $status_laporan = trim($input['status_laporan'] ?? $existing['status_laporan']);

            $update = $db->prepare("UPDATE master_lha SET sumber_audit = ?, tahun = ?, status_laporan = ? WHERE kode_lha = ?");
            $update->execute([$sumber_audit, $tahun, $status_laporan, $kode_lha]);

            $stmt->execute([$kode_lha]);
            $res = $stmt->fetch();
            $res['tahun'] = (int)$res['tahun'];
            json_response($res);
        }

        if ($method === 'DELETE') {
            $stmt = $db->prepare("SELECT * FROM master_lha WHERE kode_lha = ?");
            $stmt->execute([$kode_lha]);
            if (!$stmt->fetch()) json_error("LHA tidak ditemukan", 404);

            $del = $db->prepare("DELETE FROM master_lha WHERE kode_lha = ?");
            $del->execute([$kode_lha]);
            json_response(["message" => "LHA berhasil dihapus"]);
        }
    }
}

// ====================================================================
// 3. TEMUAN: /api/temuan & /api/temuan/{kode_temuan}
// ====================================================================
if ($count >= 1 && $segments[0] === 'temuan') {
    // POST /api/temuan -> Tambah Temuan
    if ($count === 1 && $method === 'POST') {
        $input = get_json_input();
        $kode_temuan = trim($input['kode_temuan'] ?? '');
        $kode_lha = trim($input['kode_lha'] ?? '');
        $parent_temuan = !empty($input['parent_temuan']) ? trim($input['parent_temuan']) : null;
        $kriteria = trim($input['kriteria'] ?? '');
        $sebab = trim($input['sebab'] ?? '');

        if (empty($kode_temuan) || empty($kode_lha) || empty($kriteria)) {
            json_error("Kode Temuan, Kode LHA, dan Kriteria wajib diisi", 400);
        }

        // Verifikasi LHA induk ada
        $checkLha = $db->prepare("SELECT kode_lha FROM master_lha WHERE kode_lha = ?");
        $checkLha->execute([$kode_lha]);
        if (!$checkLha->fetch()) json_error("LHA tidak ditemukan", 404);

        // Verifikasi kode_temuan unik
        $checkTem = $db->prepare("SELECT kode_temuan FROM tabel_temuan WHERE kode_temuan = ?");
        $checkTem->execute([$kode_temuan]);
        if ($checkTem->fetch()) json_error("Kode temuan sudah terdaftar", 400);

        $stmt = $db->prepare("INSERT INTO tabel_temuan (kode_temuan, kode_lha, parent_temuan, kriteria, sebab, tanggal_input) VALUES (?, ?, ?, ?, ?, NOW())");
        $stmt->execute([$kode_temuan, $kode_lha, $parent_temuan, $kriteria, $sebab]);

        $created = $db->prepare("SELECT * FROM tabel_temuan WHERE kode_temuan = ?");
        $created->execute([$kode_temuan]);
        $row = $created->fetch();
        $row['rekomendasi'] = [];
        json_response($row, 201);
    }

    // Detail & Operasi: /api/temuan/{kode_temuan}
    if ($count === 2) {
        $kode_temuan = urldecode($segments[1]);

        if ($method === 'PUT') {
            $input = get_json_input();
            $check = $db->prepare("SELECT * FROM tabel_temuan WHERE kode_temuan = ?");
            $check->execute([$kode_temuan]);
            $existing = $check->fetch();
            if (!$existing) json_error("Temuan tidak ditemukan", 404);

            $kriteria = trim($input['kriteria'] ?? $existing['kriteria']);
            $sebab = isset($input['sebab']) ? trim($input['sebab']) : $existing['sebab'];

            $update = $db->prepare("UPDATE tabel_temuan SET kriteria = ?, sebab = ? WHERE kode_temuan = ?");
            $update->execute([$kriteria, $sebab, $kode_temuan]);

            $check->execute([$kode_temuan]);
            json_response($check->fetch());
        }

        if ($method === 'DELETE') {
            $check = $db->prepare("SELECT kode_temuan FROM tabel_temuan WHERE kode_temuan = ?");
            $check->execute([$kode_temuan]);
            if (!$check->fetch()) json_error("Temuan tidak ditemukan", 404);

            $del = $db->prepare("DELETE FROM tabel_temuan WHERE kode_temuan = ?");
            $del->execute([$kode_temuan]);
            json_response(["message" => "Temuan berhasil dihapus"]);
        }
    }
}

// ====================================================================
// 4. REKOMENDASI: /api/rekomendasi, /status, /pic
// ====================================================================
if ($count >= 1 && $segments[0] === 'rekomendasi') {
    // POST /api/rekomendasi -> Tambah Rekomendasi
    if ($count === 1 && $method === 'POST') {
        $input = get_json_input();
        $kode_rekomendasi = trim($input['kode_rekomendasi'] ?? '');
        $kode_temuan = trim($input['kode_temuan'] ?? '');
        $rekomendasi = trim($input['rekomendasi'] ?? '');
        $pic = trim($input['pic'] ?? '');
        $rencana_aksi = trim($input['rencana_aksi'] ?? '');
        $jadwal_pelaksanaan = trim($input['jadwal_pelaksanaan'] ?? '');
        $status = trim($input['status'] ?? 'PENDING');

        $nilai_temuan = (float)($input['nilai_temuan'] ?? 0.0);
        $nilai_realisasi = (float)($input['nilai_realisasi'] ?? 0.0);
        $selisih = max(0.00, $nilai_temuan - $nilai_realisasi);

        if (empty($kode_rekomendasi) || empty($kode_temuan) || empty($rekomendasi) || empty($pic)) {
            json_error("Kode Rekomendasi, Temuan, Rekomendasi, dan PIC wajib diisi", 400);
        }

        $checkTem = $db->prepare("SELECT kode_temuan FROM tabel_temuan WHERE kode_temuan = ?");
        $checkTem->execute([$kode_temuan]);
        if (!$checkTem->fetch()) json_error("Temuan tidak ditemukan", 404);

        $checkRec = $db->prepare("SELECT kode_rekomendasi FROM tabel_rekomendasi WHERE kode_rekomendasi = ?");
        $checkRec->execute([$kode_rekomendasi]);
        if ($checkRec->fetch()) json_error("Kode rekomendasi sudah terdaftar", 400);

        $stmt = $db->prepare("INSERT INTO tabel_rekomendasi (kode_rekomendasi, kode_temuan, rekomendasi, pic, rencana_aksi, jadwal_pelaksanaan, status, nilai_temuan, nilai_realisasi, selisih, tanggal_input) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())");
        $stmt->execute([$kode_rekomendasi, $kode_temuan, $rekomendasi, $pic, $rencana_aksi, $jadwal_pelaksanaan, $status, $nilai_temuan, $nilai_realisasi, $selisih]);

        $created = $db->prepare("SELECT * FROM tabel_rekomendasi WHERE kode_rekomendasi = ?");
        $created->execute([$kode_rekomendasi]);
        $row = $created->fetch();
        $row['nilai_temuan'] = (float)$row['nilai_temuan'];
        $row['nilai_realisasi'] = (float)$row['nilai_realisasi'];
        $row['selisih'] = (float)$row['selisih'];
        $row['bukti'] = [];
        json_response($row, 201);
    }

    // GET /api/rekomendasi/pic/{pic_name}
    if ($count === 3 && $segments[1] === 'pic') {
        $pic_name = urldecode($segments[2]);
        $stmt = $db->prepare("SELECT * FROM tabel_rekomendasi WHERE pic LIKE ?");
        $stmt->execute(['%' . $pic_name . '%']);
        $rows = $stmt->fetchAll();
        foreach ($rows as &$r) {
            $r['nilai_temuan'] = (float)$r['nilai_temuan'];
            $r['nilai_realisasi'] = (float)$r['nilai_realisasi'];
            $r['selisih'] = (float)$r['selisih'];
        }
        json_response($rows);
    }

    // PUT /api/rekomendasi/{kode_rekomendasi}/status
    if ($count === 3 && $segments[2] === 'status' && $method === 'PUT') {
        $kode_rekomendasi = urldecode($segments[1]);
        $input = get_json_input();
        $new_status = trim($input['status'] ?? 'PENDING');

        $check = $db->prepare("SELECT * FROM tabel_rekomendasi WHERE kode_rekomendasi = ?");
        $check->execute([$kode_rekomendasi]);
        $rec = $check->fetch();
        if (!$rec) json_error("Rekomendasi tidak ditemukan", 404);

        $nilai_temuan = (float)$rec['nilai_temuan'];
        $nilai_realisasi = (float)$rec['nilai_realisasi'];
        $selisih = (float)$rec['selisih'];

        // Jika diset TUNTAS dan ada target finansial, lunaskan otomatis
        if ($new_status === 'TUNTAS' && $nilai_temuan > 0) {
            $nilai_realisasi = $nilai_temuan;
            $selisih = 0.00;
        }

        $update = $db->prepare("UPDATE tabel_rekomendasi SET status = ?, nilai_realisasi = ?, selisih = ? WHERE kode_rekomendasi = ?");
        $update->execute([$new_status, $nilai_realisasi, $selisih, $kode_rekomendasi]);

        $check->execute([$kode_rekomendasi]);
        $res = $check->fetch();
        $res['nilai_temuan'] = (float)$res['nilai_temuan'];
        $res['nilai_realisasi'] = (float)$res['nilai_realisasi'];
        $res['selisih'] = (float)$res['selisih'];
        json_response($res);
    }

    // Edit / Hapus Rekomendasi: /api/rekomendasi/{kode_rekomendasi}
    if ($count === 2) {
        $kode_rekomendasi = urldecode($segments[1]);

        if ($method === 'PUT') {
            $input = get_json_input();
            $check = $db->prepare("SELECT * FROM tabel_rekomendasi WHERE kode_rekomendasi = ?");
            $check->execute([$kode_rekomendasi]);
            $rec = $check->fetch();
            if (!$rec) json_error("Rekomendasi tidak ditemukan", 404);

            $rekomendasi = trim($input['rekomendasi'] ?? $rec['rekomendasi']);
            $pic = trim($input['pic'] ?? $rec['pic']);
            $rencana_aksi = isset($input['rencana_aksi']) ? trim($input['rencana_aksi']) : $rec['rencana_aksi'];
            $jadwal_pelaksanaan = isset($input['jadwal_pelaksanaan']) ? trim($input['jadwal_pelaksanaan']) : $rec['jadwal_pelaksanaan'];

            $nilai_temuan = isset($input['nilai_temuan']) ? (float)$input['nilai_temuan'] : (float)$rec['nilai_temuan'];
            $nilai_realisasi = (float)$rec['nilai_realisasi'];
            $selisih = max(0.00, $nilai_temuan - $nilai_realisasi);

            $update = $db->prepare("UPDATE tabel_rekomendasi SET rekomendasi = ?, pic = ?, rencana_aksi = ?, jadwal_pelaksanaan = ?, nilai_temuan = ?, selisih = ? WHERE kode_rekomendasi = ?");
            $update->execute([$rekomendasi, $pic, $rencana_aksi, $jadwal_pelaksanaan, $nilai_temuan, $selisih, $kode_rekomendasi]);

            $check->execute([$kode_rekomendasi]);
            $res = $check->fetch();
            $res['nilai_temuan'] = (float)$res['nilai_temuan'];
            $res['nilai_realisasi'] = (float)$res['nilai_realisasi'];
            $res['selisih'] = (float)$res['selisih'];
            json_response($res);
        }

        if ($method === 'DELETE') {
            $check = $db->prepare("SELECT kode_rekomendasi FROM tabel_rekomendasi WHERE kode_rekomendasi = ?");
            $check->execute([$kode_rekomendasi]);
            if (!$check->fetch()) json_error("Rekomendasi tidak ditemukan", 404);

            $del = $db->prepare("DELETE FROM tabel_rekomendasi WHERE kode_rekomendasi = ?");
            $del->execute([$kode_rekomendasi]);
            json_response(["message" => "Rekomendasi berhasil dihapus"]);
        }
    }
}

// ====================================================================
// 5. BUKTI TINDAK LANJUT & REVIEW: /api/bukti
// ====================================================================
if ($count >= 1 && $segments[0] === 'bukti') {
    // GET /api/bukti/pending -> Daftar Bukti Menunggu Review
    if ($count === 2 && $segments[1] === 'pending' && $method === 'GET') {
        $stmt = $db->query("SELECT * FROM tabel_bukti_tindak_lanjut WHERE status_review = 'PENDING' ORDER BY tanggal_submit ASC");
        $rows = $stmt->fetchAll();
        foreach ($rows as &$r) {
            $r['id'] = (int)$r['id'];
        }
        json_response($rows);
    }

    // POST /api/bukti -> Unggah Bukti Eviden (Multipart Form Data)
    if ($count === 1 && $method === 'POST') {
        $kode_rekomendasi = trim($_POST['kode_rekomendasi'] ?? '');
        $output_aktual = trim($_POST['output_aktual'] ?? '');
        $ntpn = !empty($_POST['ntpn']) ? trim($_POST['ntpn']) : null;
        $nilai_setoran = $_POST['nilai_setoran'] ?? null;
        $tanggal_mulai = !empty($_POST['tanggal_mulai']) ? trim($_POST['tanggal_mulai']) : null;
        $tanggal_selesai = !empty($_POST['tanggal_selesai']) ? trim($_POST['tanggal_selesai']) : null;
        $tanggal_tindak_lanjut = !empty($_POST['tanggal_tindak_lanjut']) ? trim($_POST['tanggal_tindak_lanjut']) : null;

        if (empty($kode_rekomendasi) || empty($output_aktual)) {
            json_error("Kode Rekomendasi dan Output Aktual wajib diisi", 400);
        }

        $checkRec = $db->prepare("SELECT * FROM tabel_rekomendasi WHERE kode_rekomendasi = ?");
        $checkRec->execute([$kode_rekomendasi]);
        $rec = $checkRec->fetch();
        if (!$rec) json_error("Rekomendasi tidak ditemukan", 404);

        // Validasi dan simpan file fisik
        $file_path = null;
        if (isset($_FILES['file']) && $_FILES['file']['error'] === UPLOAD_ERR_OK) {
            $tmp_name = $_FILES['file']['tmp_name'];
            $orig_name = $_FILES['file']['name'];
            $file_size = $_FILES['file']['size'];
            $ext = strtolower(pathinfo($orig_name, PATHINFO_EXTENSION));

            if (!in_array($ext, ALLOWED_EXTENSIONS)) {
                json_error("Format file .{$ext} tidak didukung. Gunakan: PDF, PNG, JPG, JPEG, DOC/DOCX, atau XLS/XLSX.", 400);
            }
            if ($file_size > MAX_FILE_SIZE_BYTES) {
                json_error("Ukuran file melebihi batas maksimal " . MAX_FILE_SIZE_MB . " MB.", 400);
            }

            $clean_kode = preg_replace('/[^A-Za-z0-9_\-]/', '_', $kode_rekomendasi);
            $filename = $clean_kode . '_' . date('YmdHis') . '.' . $ext;
            $dest = UPLOAD_DIR . $filename;
            if (move_uploaded_file($tmp_name, $dest)) {
                $file_path = 'uploads/' . $filename;
            }
        }

        // Resolusi rentang tanggal
        $now = date('Y-m-d H:i:s');
        $parsed_mulai = $tanggal_mulai ?: ($tanggal_tindak_lanjut ?: $now);
        $parsed_selesai = $tanggal_selesai ?: ($tanggal_tindak_lanjut ?: $parsed_mulai);

        if ($parsed_mulai && $parsed_selesai && $parsed_selesai < $parsed_mulai) {
            json_error("Tanggal Selesai tidak boleh lebih awal dari Tanggal Mulai.", 400);
        }

        // Pembaruan Realisasi Finansial jika ada setoran
        if ($nilai_setoran) {
            $digits_only = preg_replace('/[^\d]/', '', (string)$nilai_setoran);
            if ($digits_only !== '') {
                $nominal_setor = (float)$digits_only;
                if ($nominal_setor > 0) {
                    $curr_realisasi = (float)$rec['nilai_realisasi'];
                    $target_temuan = (float)$rec['nilai_temuan'];
                    $new_realisasi = $curr_realisasi + $nominal_setor;
                    if ($target_temuan > 0 && $new_realisasi > $target_temuan) {
                        $new_realisasi = $target_temuan;
                    }
                    $selisih = max(0.00, $target_temuan - $new_realisasi);

                    $updateFin = $db->prepare("UPDATE tabel_rekomendasi SET nilai_realisasi = ?, selisih = ? WHERE kode_rekomendasi = ?");
                    $updateFin->execute([$new_realisasi, $selisih, $kode_rekomendasi]);
                }
            }
        }

        // Simpan log bukti tindak lanjut
        $stmt = $db->prepare("INSERT INTO tabel_bukti_tindak_lanjut 
            (kode_rekomendasi, output_aktual, ntpn, file_bukti_path, status_review, tanggal_mulai, tanggal_selesai, tanggal_submit)
            VALUES (?, ?, ?, ?, 'PENDING', ?, ?, ?)");
        $stmt->execute([
            $kode_rekomendasi,
            $output_aktual,
            $ntpn,
            $file_path,
            $parsed_mulai,
            $parsed_selesai,
            $parsed_selesai ?: $now
        ]);
        $new_id = (int)$db->lastInsertId();

        // Otomatis ubah status rekomendasi jadi PROSES jika masih PENDING
        if ($rec['status'] === 'PENDING') {
            $upStatus = $db->prepare("UPDATE tabel_rekomendasi SET status = 'PROSES' WHERE kode_rekomendasi = ?");
            $upStatus->execute([$kode_rekomendasi]);
        }

        $created = $db->prepare("SELECT * FROM tabel_bukti_tindak_lanjut WHERE id = ?");
        $created->execute([$new_id]);
        $row = $created->fetch();
        $row['id'] = (int)$row['id'];
        json_response($row, 201);
    }

    // PUT /api/bukti/{id}/review -> Verifikasi Bukti oleh Auditor
    if ($count === 3 && $segments[2] === 'review' && $method === 'PUT') {
        $bukti_id = (int)$segments[1];
        $input = get_json_input();
        $status_review = trim($input['status_review'] ?? 'PENDING');
        $catatan_auditor = trim($input['catatan_auditor'] ?? '');

        $checkBukti = $db->prepare("SELECT * FROM tabel_bukti_tindak_lanjut WHERE id = ?");
        $checkBukti->execute([$bukti_id]);
        $bukti = $checkBukti->fetch();
        if (!$bukti) json_error("Bukti tindak lanjut tidak ditemukan", 404);

        $now = date('Y-m-d H:i:s');
        $updateBukti = $db->prepare("UPDATE tabel_bukti_tindak_lanjut SET status_review = ?, catatan_auditor = ?, tanggal_review = ? WHERE id = ?");
        $updateBukti->execute([$status_review, $catatan_auditor, $now, $bukti_id]);

        // Sinkronisasi status rekomendasi induk
        $kode_rec = $bukti['kode_rekomendasi'];
        $checkRec = $db->prepare("SELECT * FROM tabel_rekomendasi WHERE kode_rekomendasi = ?");
        $checkRec->execute([$kode_rec]);
        $rec = $checkRec->fetch();

        if ($rec) {
            if ($status_review === 'TUNTAS') {
                $nilai_temuan = (float)$rec['nilai_temuan'];
                if (strpos($kode_rec, 'R-INSP') === 0 || $nilai_temuan > 0) {
                    $upRec = $db->prepare("UPDATE tabel_rekomendasi SET status = 'TUNTAS', nilai_realisasi = nilai_temuan, selisih = 0.00 WHERE kode_rekomendasi = ?");
                } else {
                    $upRec = $db->prepare("UPDATE tabel_rekomendasi SET status = 'TUNTAS' WHERE kode_rekomendasi = ?");
                }
                $upRec->execute([$kode_rec]);
            } elseif ($status_review === 'PROSES') {
                $upRec = $db->prepare("UPDATE tabel_rekomendasi SET status = 'PROSES' WHERE kode_rekomendasi = ?");
                $upRec->execute([$kode_rec]);
            } elseif ($status_review === 'PENDING') {
                $upRec = $db->prepare("UPDATE tabel_rekomendasi SET status = 'PENDING' WHERE kode_rekomendasi = ?");
                $upRec->execute([$kode_rec]);
            }
        }

        $checkBukti->execute([$bukti_id]);
        $res = $checkBukti->fetch();
        $res['id'] = (int)$res['id'];
        json_response($res);
    }
}

// ====================================================================
// 6. BERITA ACARA TINDAK LANJUT (BATL): /api/batl
// ====================================================================
if ($count >= 1 && $segments[0] === 'batl') {
    // GET /api/batl -> Daftar Seluruh Dokumen BATL
    if ($count === 1 && $method === 'GET') {
        $stmt = $db->query("SELECT * FROM tabel_batl ORDER BY tanggal_input DESC");
        $rows = $stmt->fetchAll();
        foreach ($rows as &$b) {
            $b['id'] = (int)$b['id'];
            $b['tanda_tangan_auditor'] = (bool)$b['tanda_tangan_auditor'];
            $b['tanda_tangan_satker'] = (bool)$b['tanda_tangan_satker'];
        }
        json_response($rows);
    }

    // POST /api/batl -> Penerbitan BATL Resmi oleh Auditor
    if ($count === 1 && $method === 'POST') {
        $input = get_json_input();
        $kode_lha = trim($input['kode_lha'] ?? '');
        $nomor_batl = trim($input['nomor_batl'] ?? '');
        $tanggal_penerbitan = trim($input['tanggal_penerbitan'] ?? date('Y-m-d H:i:s'));

        if (empty($kode_lha) || empty($nomor_batl)) {
            json_error("Kode LHA dan Nomor BATL wajib diisi", 400);
        }

        $checkLha = $db->prepare("SELECT kode_lha FROM master_lha WHERE kode_lha = ?");
        $checkLha->execute([$kode_lha]);
        if (!$checkLha->fetch()) json_error("LHA tidak ditemukan", 404);

        // Buat file mock PDF BATL resmi
        $clean_kode = preg_replace('/[^A-Za-z0-9_\-]/', '_', $kode_lha);
        $filename = "BATL_{$clean_kode}_" . date('Ymd') . ".pdf";
        $file_path = UPLOAD_DIR . $filename;
        $relative_path = 'uploads/' . $filename;

        @file_put_contents($file_path, "Berita Acara Tindak Lanjut untuk LHA {$kode_lha}\nNomor: {$nomor_batl}\nTanggal: {$tanggal_penerbitan}");

        $stmt = $db->prepare("INSERT INTO tabel_batl (kode_lha, nomor_batl, tanggal_penerbitan, file_path, tanda_tangan_auditor, tanda_tangan_satker, tanggal_input) VALUES (?, ?, ?, ?, 1, 0, NOW())");
        $stmt->execute([$kode_lha, $nomor_batl, $tanggal_penerbitan, $relative_path]);
        $new_id = (int)$db->lastInsertId();

        // Update status laporan induk LHA
        $upLha = $db->prepare("UPDATE master_lha SET status_laporan = 'Selesai (BATL Terbit)' WHERE kode_lha = ?");
        $upLha->execute([$kode_lha]);

        $created = $db->prepare("SELECT * FROM tabel_batl WHERE id = ?");
        $created->execute([$new_id]);
        $row = $created->fetch();
        $row['id'] = (int)$row['id'];
        $row['tanda_tangan_auditor'] = (bool)$row['tanda_tangan_auditor'];
        $row['tanda_tangan_satker'] = (bool)$row['tanda_tangan_satker'];
        json_response($row, 201);
    }

    // PUT /api/batl/{id}/sign-satker -> Penandatanganan oleh Pimpinan Satker
    if ($count === 3 && $segments[2] === 'sign-satker' && $method === 'PUT') {
        $id = (int)$segments[1];
        $check = $db->prepare("SELECT * FROM tabel_batl WHERE id = ?");
        $check->execute([$id]);
        $batl = $check->fetch();
        if (!$batl) json_error("BATL tidak ditemukan", 404);

        $up = $db->prepare("UPDATE tabel_batl SET tanda_tangan_satker = 1 WHERE id = ?");
        $up->execute([$id]);

        $check->execute([$id]);
        $res = $check->fetch();
        $res['id'] = (int)$res['id'];
        $res['tanda_tangan_auditor'] = (bool)$res['tanda_tangan_auditor'];
        $res['tanda_tangan_satker'] = (bool)$res['tanda_tangan_satker'];
        json_response($res);
    }
}

// Jika tidak ada route yang cocok:
json_error("Endpoint tidak ditemukan: " . $path, 404);
