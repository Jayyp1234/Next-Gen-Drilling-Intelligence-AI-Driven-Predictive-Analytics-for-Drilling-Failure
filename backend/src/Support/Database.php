<?php

declare(strict_types=1);

namespace DrillGuard\Support;

use PDO;
use RuntimeException;

/** Single shared PDO connection. Supports MySQL/MariaDB (prod) and SQLite (tests). */
final class Database
{
    private static ?PDO $pdo = null;

    public static function pdo(): PDO
    {
        if (self::$pdo instanceof PDO) {
            return self::$pdo;
        }

        $driver = Config::get('DB_DRIVER', 'mysql');
        $opts = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];

        if ($driver === 'sqlite') {
            $path = Config::get('DB_PATH', ':memory:');
            $pdo = new PDO('sqlite:' . $path, null, null, $opts);
            $pdo->exec('PRAGMA foreign_keys = ON');
        } elseif ($driver === 'mysql') {
            $dsn = sprintf(
                'mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4',
                Config::get('DB_HOST', '127.0.0.1'),
                Config::get('DB_PORT', '3306'),
                Config::get('DB_NAME', 'drillguard'),
            );
            $pdo = new PDO($dsn, Config::get('DB_USER', 'root'), Config::get('DB_PASS', ''), $opts);
        } else {
            throw new RuntimeException("Unsupported DB_DRIVER: {$driver}");
        }

        self::$pdo = $pdo;
        return $pdo;
    }

    /** True when running on SQLite (used to bridge a few dialect gaps). */
    public static function isSqlite(): bool
    {
        return Config::get('DB_DRIVER', 'mysql') === 'sqlite';
    }

    /** Reset (test helper). */
    public static function reset(): void
    {
        self::$pdo = null;
    }
}
