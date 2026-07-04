<?php
// Konfigurasi database
$host = 'localhost';
$username = 'root';        // Ganti dengan username MySQL Anda
$password = '';            // Ganti dengan password MySQL Anda
$database = 'jurnal_3d';

// Buat koneksi
$conn = new mysqli($host, $username, $password, $database);

// Cek koneksi
if ($conn->connect_error) {
    die("Koneksi gagal: " . $conn->connect_error);
}

// Set charset ke UTF-8
$conn->set_charset("utf8mb4");
?>