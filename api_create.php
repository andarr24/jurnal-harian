<?php
header('Content-Type: application/json');
include 'config.php';

// Ambil data dari request
$data = json_decode(file_get_contents('php://input'), true);

$title = $data['title'] ?? '';
$body = $data['body'] ?? '';
$mood = $data['mood'] ?? '#8FAE93';
$date = date('Y-m-d');

// SQL insert
$sql = "INSERT INTO journal_entries (title, body, mood, entry_date) 
        VALUES (?, ?, ?, ?)";

$stmt = $conn->prepare($sql);
$stmt->bind_param("ssss", $title, $body, $mood, $date);

if ($stmt->execute()) {
    $id = $conn->insert_id;
    echo json_encode([
        'success' => true,
        'id' => $id,
        'message' => 'Catatan berhasil ditambahkan'
    ]);
} else {
    echo json_encode([
        'success' => false,
        'message' => 'Gagal menambahkan catatan'
    ]);
}

$stmt->close();
$conn->close();
?>