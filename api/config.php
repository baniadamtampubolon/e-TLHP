<?php
/**
 * ====================================================================
 * e-TLHP Kemenko Pangan RI - API Configuration
 * ====================================================================
 * Konfigurasi Koneksi Database MySQL & Pengaturan Lingkungan
 */

// 0. Muat Variabel Lingkungan dari Berkas .env (Prioritas Utama untuk Hostinger)
$env_vars = [];
$env_paths = [
    __DIR__ . '/../.env', // Lokasi root public_html/.env
    __DIR__ . '/.env',    // Lokasi folder public_html/api/.env
];

foreach ($env_paths as $env_file) {
    if (file_exists($env_file) && is_readable($env_file)) {
        $lines = file($env_file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            $line = trim($line);
            // Lewati baris komentar atau baris kosong
            if ($line === '' || strpos($line, '#') === 0 || strpos($line, ';') === 0) continue;
            if (strpos($line, '=') !== false) {
                list($key, $val) = explode('=', $line, 2);
                $key = trim($key);
                $val = trim($val, " \t\n\r\0\x0B\"'");
                $env_vars[$key] = $val;
                $_ENV[$key] = $val;
                $_SERVER[$key] = $val;
                @putenv("$key=$val");
            }
        }
        break;
    }
}

// Helper pengambil nilai konfigurasi dengan urutan prioritas:
// 1. File .env ($env_vars) -> 2. $_ENV -> 3. $_SERVER -> 4. getenv() -> 5. Default
$get_env = function($key, $default = '') use ($env_vars) {
    if (isset($env_vars[$key]) && $env_vars[$key] !== '') {
        return $env_vars[$key];
    }
    if (isset($_ENV[$key]) && $_ENV[$key] !== '') {
        return $_ENV[$key];
    }
    if (isset($_SERVER[$key]) && $_SERVER[$key] !== '') {
        return $_SERVER[$key];
    }
    $val = @getenv($key);
    if ($val !== false && $val !== '') {
        return $val;
    }
    return $default;
};

// 1. Pengaturan Database MySQL Hostinger
// Nilai akan selalu diambil dari berkas .env Anda di Hostinger.
// Ketika Anda melakukan git push / pull, konfigurasi database TIDAK AKAN PERNAH ter-reset.
define('DB_HOST', $get_env('DB_HOST', 'localhost'));
define('DB_NAME', $get_env('DB_NAME', 'tlhp_db'));
define('DB_USER', $get_env('DB_USER', 'root'));
define('DB_PASS', $get_env('DB_PASS', ''));
define('DB_CHARSET', $get_env('DB_CHARSET', 'utf8mb4'));

// 2. Direktori Penyimpanan Berkas Upload Eviden (PDF, Gambar, dll.)
define('UPLOAD_DIR', __DIR__ . '/../uploads/');
if (!is_dir(UPLOAD_DIR)) {
    @mkdir(UPLOAD_DIR, 0755, true);
}

// 3. Batasan Berkas Unggahan
define('MAX_FILE_SIZE_MB', 10);
define('MAX_FILE_SIZE_BYTES', MAX_FILE_SIZE_MB * 1024 * 1024);
define('ALLOWED_EXTENSIONS', ['pdf', 'png', 'jpg', 'jpeg', 'doc', 'docx', 'xls', 'xlsx']);

// 4. Header CORS & Content-Type JSON Global
function setup_cors_and_headers() {
    header("Access-Control-Allow-Origin: *");
    header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
    header("Content-Type: application/json; charset=UTF-8");

    // Tangani preflight OPTIONS request dari browser
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit();
    }
}

// 5. Helper Response JSON
function json_response($data, $status_code = 200) {
    http_response_code($status_code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit();
}

function json_error($message, $status_code = 400) {
    http_response_code($status_code);
    echo json_encode(['detail' => $message], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit();
}

// 6. Helper Parse Request Body JSON
function get_json_input() {
    $raw = file_get_contents('php://input');
    if (empty($raw)) {
        return [];
    }
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}
