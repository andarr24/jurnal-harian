<?php
header('Content-Type: application/json');
include 'config.php';

$data = json_decode(file_get_contents('php://input'), true);

$id = $data['id'] ?? 0;
$field = $data['field'] ?? '';
$value = $data['value'] ?? '';

// Validasi field yang boleh diubah
$allowed_fields = ['title', 'body', 'mood'];
if (!in_array($field, $allowed_fields)) {
    echo json_encode(['success' => false, 'message' => 'Field tidak valid']);
    exit;
}

// SQL update
$sql = "UPDATE journal_entries SET $field = ? WHERE id = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("si", $value, $id);

if ($stmt->execute()) {
    echo json_encode([
        'success' => true,
        'message' => 'Catatan berhasil diupdate'
    ]);
} else {
    echo json_encode([
        'success' => false,
        'message' => 'Gagal mengupdate catatan'
    ]);
}

$stmt->close();
$conn->close();
?>