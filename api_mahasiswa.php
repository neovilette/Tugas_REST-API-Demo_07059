<?php
// Nama : Mutiara Acintyacitra Nirmala
// NIM  : A12.2023.07059
header("Content-Type: application/json; charset=UTF-8");
require 'db.php';

$method = $_SERVER['REQUEST_METHOD'];

// Fungsi untuk mendapatkan ID dari query parameter
function getID()
{
    return isset($_GET['id']) ? $_GET['id'] : null;
}

// Fungsi untuk mendapatkan request body
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
            // Get specific student
            $id = sanitizeInput($id);
            $sql = "SELECT * FROM mahasiswa WHERE id = '$id'";
            $result = $koneksi->query($sql);

            if ($result->num_rows > 0) {
                $data = $result->fetch_assoc();
                echo json_encode($data, JSON_PRETTY_PRINT);
            } else {
                http_response_code(404);
                echo json_encode(["message" => "Data tidak ditemukan"], JSON_PRETTY_PRINT);
            }
        } else {
            // Get all students
            $sql = "SELECT * FROM mahasiswa";
            $result = $koneksi->query($sql);

            $data = [];
            while ($row = $result->fetch_assoc()) {
                $data[] = $row;
            }

            echo json_encode($data, JSON_PRETTY_PRINT);
        }
        break;

    case 'POST':
        $input = getRequestBody();

        // Validate required fields
        if (!isset($input['nama']) || !isset($input['nim']) || !isset($input['jurusan'])) {
            http_response_code(400);
            echo json_encode(["message" => "Data tidak lengkap. Nama, NIM, dan Jurusan diperlukan"], JSON_PRETTY_PRINT);
            break;
        }

        $nama = sanitizeInput($input['nama']);
        $nim = sanitizeInput($input['nim']);
        $jurusan = sanitizeInput($input['jurusan']);

        $sql = "INSERT INTO mahasiswa (nim, nama, jurusan) VALUES ('$nim', '$nama', '$jurusan')";

        if ($koneksi->query($sql)) {
            http_response_code(201);
            echo json_encode([
                "status" => true,
                "message" => "Data berhasil ditambahkan",
                "id" => $koneksi->insert_id
            ], JSON_PRETTY_PRINT);
        } else {
            http_response_code(500);
            echo json_encode([
                "status" => false,
                "message" => "Gagal menambahkan data: " . $koneksi->error
            ], JSON_PRETTY_PRINT);
        }
        break;

    case 'PUT':
        $id = getID();
        if (!$id) {
            http_response_code(400);
            echo json_encode(["message" => "ID diperlukan"], JSON_PRETTY_PRINT);
            break;
        }

        $input = getRequestBody();

        // Validate required fields
        if (!isset($input['nama']) || !isset($input['jurusan'])) {
            http_response_code(400);
            echo json_encode(["message" => "Data tidak lengkap. Nama dan Jurusan diperlukan"], JSON_PRETTY_PRINT);
            break;
        }

        $id = sanitizeInput($id);
        $nama = sanitizeInput($input['nama']);
        $jurusan = sanitizeInput($input['jurusan']);

        // Check if NIM is provided
        $nim_update = "";
        if (isset($input['nim'])) {
            $nim_val = sanitizeInput($input['nim']);
            $nim_update = ", nim='$nim_val'";
        }

        // Check if new ID is provided for ID update
        if (isset($input['new_id'])) {
            $new_id = sanitizeInput($input['new_id']);

            // Validate if new ID exists
            $check_sql = "SELECT * FROM mahasiswa WHERE id = '$new_id'";
            $check_result = $koneksi->query($check_sql);

            if ($check_result->num_rows > 0 && $new_id != $id) {
                http_response_code(409);
                echo json_encode([
                    "status" => false,
                    "message" => "ID $new_id sudah digunakan oleh data lain"
                ], JSON_PRETTY_PRINT);
                break;
            }

            // Update the ID along with other fields
            $sql = "UPDATE mahasiswa SET id='$new_id', nama='$nama', jurusan='$jurusan'$nim_update WHERE id='$id'";
        } else {
            // Regular update without changing ID
            $sql = "UPDATE mahasiswa SET nama='$nama', jurusan='$jurusan'$nim_update WHERE id='$id'";
        }

        if ($koneksi->query($sql)) {
            if ($koneksi->affected_rows > 0) {
                echo json_encode([
                    "status" => true,
                    "message" => "Data berhasil diupdate"
                ], JSON_PRETTY_PRINT);
            } else {
                http_response_code(404);
                echo json_encode([
                    "status" => false,
                    "message" => "Data dengan ID $id tidak ditemukan"
                ], JSON_PRETTY_PRINT);
            }
        } else {
            http_response_code(500);
            echo json_encode([
                "status" => false,
                "message" => "Gagal mengupdate data: " . $koneksi->error
            ], JSON_PRETTY_PRINT);
        }
        break;

    case 'DELETE':
        $id = getID();
        if (!$id) {
            $input = getRequestBody();
            $id = isset($input['id']) ? $input['id'] : null;

            if (!$id) {
                http_response_code(400);
                echo json_encode(["message" => "ID diperlukan"], JSON_PRETTY_PRINT);
                break;
            }
        }

        $id = sanitizeInput($id);
        $sql = "DELETE FROM mahasiswa WHERE id=$id";

        if ($koneksi->query($sql)) {
            if ($koneksi->affected_rows > 0) {
                echo json_encode([
                    "status" => true,
                    "message" => "Data berhasil dihapus"
                ], JSON_PRETTY_PRINT);
            } else {
                http_response_code(404);
                echo json_encode([
                    "status" => false,
                    "message" => "Data dengan ID $id tidak ditemukan"
                ], JSON_PRETTY_PRINT);
            }
        } else {
            http_response_code(500);
            echo json_encode([
                "status" => false,
                "message" => "Gagal menghapus data: " . $koneksi->error
            ], JSON_PRETTY_PRINT);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(["message" => "Method Not Allowed"], JSON_PRETTY_PRINT);
        break;
}

$koneksi->close();
