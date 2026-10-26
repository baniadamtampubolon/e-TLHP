<?php
/**
 * ====================================================================
 * e-TLHP Kemenko Pangan RI - Database Connection Helper
 * ====================================================================
 * Mendukung MySQL (Hostinger) & SQLite (Lokal Dev Otomatis)
 */

require_once __DIR__ . '/config.php';

function get_db_connection() {
    static $pdo = null;

    if ($pdo === null) {
        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];

        $sqlite_file = __DIR__ . '/../database/tlhp.db';
        $host_header = $_SERVER['HTTP_HOST'] ?? '';
        $is_local = strpos($host_header, 'localhost') !== false || strpos($host_header, '127.0.0.1') !== false;

        $use_mysql = true;
        if (defined('DB_TYPE') && DB_TYPE === 'sqlite') {
            $use_mysql = false;
        }

        // Coba koneksi MySQL terlebih dahulu (prioritas produksi Hostinger)
        if ($use_mysql) {
            try {
                $dsn = sprintf(
                    "mysql:host=%s;dbname=%s;charset=%s",
                    DB_HOST,
                    DB_NAME,
                    DB_CHARSET
                );
                $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
                return $pdo;
            } catch (PDOException $e) {
                // Jika di lingkungan lokal dan MySQL belum dinyalakan, fallback mulus ke SQLite lokal
                if ($is_local && file_exists($sqlite_file)) {
                    $use_mysql = false;
                } else {
                    json_error("Koneksi Database Gagal: " . $e->getMessage(), 500);
                }
            }
        }

        // Fallback SQLite lokal (membuat koding di laptop langsung jalan tanpa instalasi MySQL)
        if (!$use_mysql && file_exists($sqlite_file)) {
            try {
                $pdo = new PDO("sqlite:" . $sqlite_file, null, null, $options);
                $pdo->exec("PRAGMA foreign_keys = ON;");
                return $pdo;
            } catch (PDOException $e) {
                json_error("Koneksi SQLite Lokal Gagal: " . $e->getMessage(), 500);
            }
        }

        json_error("Koneksi Database Gagal: Tidak ada database yang dapat dihubungi.", 500);
    }

    return $pdo;
}
