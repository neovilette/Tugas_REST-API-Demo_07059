<?php
// Nama : Mutiara Acintyacitra Nirmala
// NIM  : A12.2023.07059
header("Content-Type: application/json; charset=UTF-8");
require 'db.php';
$method = $_SERVER['REQUEST_METHOD'];
function getID()
{
    return isset($_GET['id']) ? $_GET['id'] : null;
}
function getRequestBody()
{
    return json_decode(file_get_contents("php://input"), true);
}
function sanitizeInput($input)
{
    global $koneksi;
    return $koneksi->real_escape_string($input);
}
switch ($method) {
    case 'GET':
        $id = getID();
        if ($id) {
            $id    = sanitizeInput($id);
            $sql   = "SELECT * FROM buku WHERE id = '$id'";
            $res   = $koneksi->query($sql);
            if ($res && $res->num_rows > 0) {
                $data = $res->fetch_assoc();
                echo json_encode($data, JSON_PRETTY_PRINT);
            } else {
                http_response_code(404);
                echo json_encode([
                    "message" => "Data buku dengan ID $id tidak ditemukan"
                ], JSON_PRETTY_PRINT);
            }
        } else {
            $sql  = "SELECT * FROM buku ORDER BY id";
            $res  = $koneksi->query($sql);
            $data = [];
            while ($row = $res->fetch_assoc()) {
                $data[] = $row;
            }
            echo json_encode($data, JSON_PRETTY_PRINT);
        }
        break;
    case 'POST':
        $input = getRequestBody();
        if (
            empty($input['judul']) ||
            empty($input['penulis']) ||
            empty($input['tahun_terbit'])
        ) {
            http_response_code(400);
            echo json_encode([
                "message" => "Data tidak lengkap. 'judul', 'penulis', dan 'tahun_terbit' wajib diisi."
            ], JSON_PRETTY_PRINT);
            break;
        }
        $judul        = sanitizeInput($input['judul']);
        $penulis      = sanitizeInput($input['penulis']);
        $tahun_terbit = sanitizeInput($input['tahun_terbit']);

        // Cek apakah ada ID spesifik yang ingin digunakan
        $id_sql = "";
        $id_value = "";
        if (!empty($input['id'])) {
            $custom_id = sanitizeInput($input['id']);

            // Verifikasi ID tidak ada duplikat
            $check_sql = "SELECT * FROM buku WHERE id = '$custom_id'";
            $check_result = $koneksi->query($check_sql);

            if ($check_result && $check_result->num_rows > 0) {
                http_response_code(400);
                echo json_encode([
                    "status" => false,
                    "message" => "ID $custom_id sudah digunakan. Silakan gunakan ID lain."
                ], JSON_PRETTY_PRINT);
                break;
            }

            $id_sql = "id, ";
            $id_value = "'$custom_id', ";
        }
        $sql = "INSERT INTO buku ($id_sql judul, penulis, tahun_terbit)
                VALUES ($id_value '$judul', '$penulis', '$tahun_terbit')";
        if ($koneksi->query($sql)) {
            http_response_code(201);
            echo json_encode([
                "status"  => true,
                "message" => "Data buku berhasil ditambahkan",
                "id"      => !empty($input['id']) ? $custom_id : $koneksi->insert_id
            ], JSON_PRETTY_PRINT);
        } else {
            http_response_code(500);
            echo json_encode([
                "status"  => false,
                "message" => "Gagal menambahkan data buku: " . $koneksi->error
            ], JSON_PRETTY_PRINT);
        }
        break;
    case 'PUT':
        $id = getID();
        if (!$id) {
            http_response_code(400);
            echo json_encode([
                "message" => "ID tidak ditemukan pada URL"
            ], JSON_PRETTY_PRINT);
            break;
        }
        $input = getRequestBody();
        if (
            empty($input['judul']) ||
            empty($input['penulis']) ||
            empty($input['tahun_terbit'])
        ) {
            http_response_code(400);
            echo json_encode([
                "message" => "Data tidak lengkap. 'judul', 'penulis', dan 'tahun_terbit' wajib diisi."
            ], JSON_PRETTY_PRINT);
            break;
        }

        $id_asal      = sanitizeInput($id);
        $judul        = sanitizeInput($input['judul']);
        $penulis      = sanitizeInput($input['penulis']);
        $tahun_terbit = sanitizeInput($input['tahun_terbit']);

        // Cek apakah ada permintaan untuk mengubah ID
        if (!empty($input['new_id'])) {
            $id_baru = sanitizeInput($input['new_id']);

            // Cek jika ID baru berbeda dari ID lama
            if ($id_baru != $id_asal) {
                // Verifikasi ID baru tidak duplikat
                $check_sql = "SELECT * FROM buku WHERE id = '$id_baru'";
                $check_result = $koneksi->query($check_sql);

                if ($check_result && $check_result->num_rows > 0) {
                    http_response_code(400);
                    echo json_encode([
                        "status" => false,
                        "message" => "ID $id_baru sudah digunakan. Silakan gunakan ID lain."
                    ], JSON_PRETTY_PRINT);
                    break;
                }

                // Gunakan transaksi untuk update ID dan data lainnya
                $koneksi->begin_transaction();
                try {
                    // Update semua data termasuk ID
                    $sql = "UPDATE buku SET 
                            id = '$id_baru',
                            judul = '$judul', 
                            penulis = '$penulis', 
                            tahun_terbit = '$tahun_terbit' 
                            WHERE id = '$id_asal'";

                    if (!$koneksi->query($sql)) {
                        throw new Exception("Error updating book data: " . $koneksi->error);
                    }

                    $koneksi->commit();

                    echo json_encode([
                        "status" => true,
                        "message" => "Data buku berhasil diupdate dengan ID baru",
                        "old_id" => $id_asal,
                        "new_id" => $id_baru
                    ], JSON_PRETTY_PRINT);
                } catch (Exception $e) {
                    $koneksi->rollback();
                    http_response_code(500);
                    echo json_encode([
                        "status" => false,
                        "message" => $e->getMessage()
                    ], JSON_PRETTY_PRINT);
                }
            } else {
                // ID tidak berubah, update data biasa
                $sql = "UPDATE buku SET 
                        judul = '$judul', 
                        penulis = '$penulis', 
                        tahun_terbit = '$tahun_terbit' 
                        WHERE id = '$id_asal'";

                if ($koneksi->query($sql)) {
                    echo json_encode([
                        "status" => true,
                        "message" => "Data buku berhasil diupdate"
                    ], JSON_PRETTY_PRINT);
                } else {
                    http_response_code(500);
                    echo json_encode([
                        "status" => false,
                        "message" => "Gagal mengupdate data buku: " . $koneksi->error
                    ], JSON_PRETTY_PRINT);
                }
            }
        } else {
            // Tidak ada perubahan ID, update data biasa
            $sql = "UPDATE buku SET 
                    judul = '$judul', 
                    penulis = '$penulis', 
                    tahun_terbit = '$tahun_terbit' 
                    WHERE id = '$id_asal'";

            if ($koneksi->query($sql)) {
                echo json_encode([
                    "status" => true,
                    "message" => "Data buku berhasil diupdate"
                ], JSON_PRETTY_PRINT);
            } else {
                http_response_code(500);
                echo json_encode([
                    "status" => false,
                    "message" => "Gagal mengupdate data buku: " . $koneksi->error
                ], JSON_PRETTY_PRINT);
            }
        }
        break;
    case 'DELETE':
        $id = getID();
        if (!$id) {
            http_response_code(400);
            echo json_encode([
                "message" => "ID tidak ditemukan pada URL"
            ], JSON_PRETTY_PRINT);
            break;
        }
        $id  = sanitizeInput($id);
        $sql = "DELETE FROM buku WHERE id = '$id'";
        if ($koneksi->query($sql)) {
            echo json_encode([
                "status" => true,
                "message" => "Data buku berhasil dihapus"
            ], JSON_PRETTY_PRINT);
        } else {
            http_response_code(500);
            echo json_encode([
                "status" => false,
                "message" => "Gagal menghapus data buku: " . $koneksi->error
            ], JSON_PRETTY_PRINT);
        }
        break;
    default:
        http_response_code(405);
        echo json_encode([
            "message" => "Method not allowed"
        ], JSON_PRETTY_PRINT);
        break;
}
$koneksi->close();
