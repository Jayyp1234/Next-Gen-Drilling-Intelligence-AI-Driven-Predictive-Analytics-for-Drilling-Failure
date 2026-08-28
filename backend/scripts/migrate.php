<?php

declare(strict_types=1);

/**
 * Runs every migrations/*.sql in order. Usage: php scripts/migrate.php
 */

use DrillGuard\Support\Config;
use DrillGuard\Support\Database;

require __DIR__ . '/../vendor/autoload.php';

$root = dirname(__DIR__);
Config::boot($root);
$pdo = Database::pdo();

$files = glob($root . '/migrations/*.sql');
sort($files);

foreach ($files as $file) {
    $sql = file_get_contents($file) ?: '';
    // Strip full-line "-- ..." comments so they don't get attached to the next statement.
    $sql = preg_replace('/^\s*--.*$/m', '', $sql) ?? $sql;
    // Split on the semicolon that ends each statement (this schema has no procedures).
    $statements = array_filter(array_map('trim', explode(';', $sql)));
    $count = 0;
    foreach ($statements as $stmt) {
        if ($stmt === '') {
            continue;
        }
        $pdo->exec($stmt);
        $count++;
    }
    echo 'migrated ' . basename($file) . " ({$count} statements)\n";
}

echo "done.\n";
