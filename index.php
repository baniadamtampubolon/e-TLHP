<?php
/**
 * ====================================================================
 * e-TLHP Kemenko Pangan RI - Root Server Router (PHP)
 * ====================================================================
 * Menangani routing API, static assets (JS, CSS, gambar, PDF), dan HTML frontend.
 */

$uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);

// 1. Routing REST API: /api/...
if (strpos($uri, '/api') === 0) {
    require __DIR__ . '/api/index.php';
    exit();
}

// 2. Berkas unggahan dokumen: /uploads/...
if (strpos($uri, '/uploads/') === 0) {
    $filePath = __DIR__ . $uri;
    if (file_exists($filePath) && !is_dir($filePath)) {
        $ext = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));
        $mimes = [
            'pdf' => 'application/pdf',
            'png' => 'image/png',
            'jpg' => 'image/jpeg',
            'jpeg' => 'image/jpeg',
        ];
        header('Content-Type: ' . ($mimes[$ext] ?? 'application/octet-stream'));
        readfile($filePath);
        exit();
    }
}

// 2b. Dokumentasi & Panduan Alur: /docs/...
if (strpos($uri, '/docs/') === 0) {
    $docFile = __DIR__ . $uri;
    if (file_exists($docFile) && !is_dir($docFile)) {
        $ext = strtolower(pathinfo($docFile, PATHINFO_EXTENSION));
        $mimes = [
            'html' => 'text/html; charset=UTF-8',
            'md'   => 'text/markdown; charset=UTF-8',
            'pdf'  => 'application/pdf',
            'png'  => 'image/png',
            'jpg'  => 'image/jpeg',
        ];
        header('Content-Type: ' . ($mimes[$ext] ?? 'text/plain'));
        readfile($docFile);
        exit();
    }
}

// 3. Berkas statis frontend (js, css, gambar, font)
$clean_path = ltrim($uri, '/');
if (strpos($clean_path, 'frontend/') === 0) {
    $clean_path = substr($clean_path, 9);
}

$frontendFile = __DIR__ . '/frontend/' . $clean_path;
if (!empty($clean_path) && file_exists($frontendFile) && !is_dir($frontendFile)) {
    $ext = strtolower(pathinfo($frontendFile, PATHINFO_EXTENSION));
    $mimes = [
        'js'   => 'application/javascript; charset=UTF-8',
        'css'  => 'text/css; charset=UTF-8',
        'png'  => 'image/png',
        'jpg'  => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'svg'  => 'image/svg+xml',
        'ico'  => 'image/x-icon',
        'woff2'=> 'font/woff2',
        'woff' => 'font/woff',
        'ttf'  => 'font/ttf',
    ];
    header('Content-Type: ' . ($mimes[$ext] ?? 'text/plain'));
    readfile($frontendFile);
    exit();
}

// 4. Default: Tampilkan halaman antarmuka utama frontend/index.html
header('Content-Type: text/html; charset=UTF-8');
include __DIR__ . '/frontend/index.html';
exit();
