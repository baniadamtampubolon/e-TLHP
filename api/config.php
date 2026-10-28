<?php
/**
 * ====================================================================
 * e-TLHP Kemenko Pangan RI - API Configuration
 * ====================================================================
 * Konfigurasi Koneksi Database MySQL & Pengaturan Lingkungan
 */

// 0. Muat Variabel Lingkungan dari Berkas .env (Jika Ada)
$env_paths = [__DIR__ . '/../.env', __DIR__ . '/.env'];
foreach ($env_paths as $env_file) {
    if (file_exists($env_file)) {
        $lines = file($env_file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            $line = trim($line);
            if ($line === '' || strpos($line, '#') === 0) continue;
            if (strpos($line, '=') !== false) {
                list($key, $val) = explode('=', $line, 2);
                $key = trim($key);
                $val = trim($val, " \t\n\r\0\x0B\"'");
                if (!isset($_ENV[$key])) {
                    $_ENV[$key] = $val;
                    putenv("$key=$val");
                }
            }
        }
        break;
    }
}

// 1. Pengaturan Database MySQL Hostinger
// Catatan untuk Hostinger: Buat database di hPanel -> Databases -> MySQL Databases,
// lalu masukkan nama database, user, dan password yang Anda buat di bawah ini (atau gunakan berkas .env):
define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
define('DB_NAME', getenv('DB_NAME') ?: 'tlhp_db');
define('DB_USER', getenv('DB_USER') ?: 'root');
define('DB_PASS', getenv('DB_PASS') ?: '');
define('DB_CHARSET', 'utf8mb4');

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
