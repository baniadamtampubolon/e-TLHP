<?php
/**
 * ====================================================================
 * e-TLHP Kemenko Pangan RI - Database Connection Helper
 * ====================================================================
 * Menggunakan PDO dengan Prepared Statements untuk Keamanan Maksimal
 */

require_once __DIR__ . '/config.php';

function get_db_connection() {
    static $pdo = null;

    if ($pdo === null) {
        $dsn = sprintf(
            "mysql:host=%s;dbname=%s;charset=%s",
            DB_HOST,
            DB_NAME,
            DB_CHARSET
        );

        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];

        try {
            $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            json_error("Koneksi Database Gagal: " . $e->getMessage(), 500);
        }
    }

    return $pdo;
}
