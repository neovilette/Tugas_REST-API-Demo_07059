-- Membuat database campus
CREATE DATABASE IF NOT EXISTS campus;

-- Menggunakan database campus
USE campus;

-- Membuat tabel mahasiswa
CREATE TABLE IF NOT EXISTS mahasiswa (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nim VARCHAR(20) NOT NULL,
    nama VARCHAR(100) NOT NULL,
    jurusan VARCHAR(50) NOT NULL
);

-- Menambahkan beberapa data contoh
INSERT INTO mahasiswa (nim, nama, jurusan) VALUES
('2023001', 'Budi Santoso', 'Teknik Informatika'),
('2023002', 'Dewi Lestari', 'Sistem Informasi'),
('2023003', 'Ahmad Fauzi', 'Teknik Komputer');

-- Membuat tabel buku
CREATE TABLE IF NOT EXISTS buku (
    id INT AUTO_INCREMENT PRIMARY KEY,
    judul VARCHAR(200) NOT NULL,
    penulis VARCHAR(100) NOT NULL,
    tahun_terbit INT NOT NULL
);

-- Menambahkan beberapa data contoh untuk tabel buku
INSERT INTO buku (judul, penulis, tahun_terbit) VALUES
('Pemrograman Web dengan PHP', 'Andi Wijaya', 2022),
('Database MySQL untuk Pemula', 'Budi Raharjo', 2021),
('Algoritma dan Struktur Data', 'Dewi Sartika', 2023);