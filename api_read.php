<?php
header('Content-Type: application/json');
include 'config.php';

// Ambil semua catatan
$sql = "SELECT * FROM journal_entries ORDER BY created_at DESC";
$result = $conn->query($sql);

$entries = [];
while ($row = $result->fetch_assoc()) {
    $entries[] = [
        'id' => $row['id'],
        'title' => $row['title'],
        'body' => $row['body'],
        'mood' => $row['mood'],
        'date' => date('d F Y', strtotime($row['entry_date'])),
        'createdAt' => strtotime($row['created_at']) * 1000,
        'updatedAt' => strtotime($row['updated_at']) * 1000
    ];
}

echo json_encode($entries);
$conn->close();
?>