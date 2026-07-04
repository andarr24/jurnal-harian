<?php
header('Content-Type: application/json');
include 'config.php';

$data = json_decode(file_get_contents('php://input'), true);
$id = $data['id'] ?? 0;

$sql = "DELETE FROM journal_entries WHERE id = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $id);

if ($stmt->execute()) {
    echo json_encode([
        'success' => true,
        'message' => 'Catatan berhasil dihapus'
    ]);
} else {
    echo json_encode([
        'success' => false,
        'message' => 'Gagal menghapus catatan'
    ]);
}

$stmt->close();
$conn->close();
?>