<?php
$file = "buckets.csv";
$allFile = "buckets.all.csv";

// Ensure the file exists
if (!file_exists($file)) {
    die("Error: File does not exist.");
}

// 1️⃣ Create a backup (e.g., vocabulary_backup_1712345678.json)
copy($allFile, $allFile . "_backup_" . time());

// 2️⃣ Append contents to the archive file (e.g., vocabulary_archive.json)
file_put_contents($allFile, file_get_contents($file) . "\n", FILE_APPEND);

// 3️⃣ Delete the original file
unlink($file);

echo "File successfully backed up & deleted.";
?>