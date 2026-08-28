<?php

declare(strict_types=1);

namespace DrillGuard\Controllers;

use DrillGuard\Support\Auth;
use DrillGuard\Support\Database;
use DrillGuard\Support\Http;

/**
 * Crew channel — team messaging shared by the web and mobile clients.
 * Clients poll GET /api/messages?channel=X&after_id=N (cheap incremental fetch);
 * DrillGuard itself posts system lines into a channel when a high-tier alert
 * fires (see AlertController), so incident coordination lives in one thread.
 */
final class MessageController
{
    public function index(): void
    {
        Auth::require();
        $channel = trim((string) ($_GET['channel'] ?? 'ops')) ?: 'ops';
        $afterId = (int) ($_GET['after_id'] ?? 0);

        if ($afterId > 0) {
            $stmt = Database::pdo()->prepare(
                'SELECT * FROM messages WHERE channel = ? AND id > ? ORDER BY id ASC LIMIT 200'
            );
            $stmt->execute([$channel, $afterId]);
            $rows = $stmt->fetchAll();
        } else {
            // First load: the latest 100, oldest-first for rendering.
            $stmt = Database::pdo()->prepare(
                'SELECT * FROM (SELECT * FROM messages WHERE channel = ? ORDER BY id DESC LIMIT 100) t ORDER BY id ASC'
            );
            $stmt->execute([$channel]);
            $rows = $stmt->fetchAll();
        }

        Http::json(['messages' => array_map([self::class, 'shape'], $rows), 'channel' => $channel]);
    }

    public function create(): void
    {
        $user = Auth::require();
        $b = Http::body();
        $body = trim((string) ($b['body'] ?? ''));
        if ($body === '') {
            Http::error('body is required', 422);
        }
        if (mb_strlen($body) > 1000) {
            $body = mb_substr($body, 0, 1000);
        }
        $channel = trim((string) ($b['channel'] ?? 'ops')) ?: 'ops';

        $pdo = Database::pdo();
        $stmt = $pdo->prepare(
            'INSERT INTO messages (channel, user_id, author, role, body, is_system) VALUES (?, ?, ?, ?, ?, 0)'
        );
        $stmt->execute([$channel, (int) $user['id'], $user['name'], $user['role'] ?? null, $body]);

        $sel = $pdo->prepare('SELECT * FROM messages WHERE id = ?');
        $sel->execute([(int) $pdo->lastInsertId()]);
        Http::json(['message' => self::shape($sel->fetch())], 201);
    }

    /** Post a system line into a channel (used by AlertController on Elevated/Action). */
    public static function postSystem(string $channel, string $body, ?int $alertId = null): void
    {
        try {
            Database::pdo()
                ->prepare('INSERT INTO messages (channel, user_id, author, role, body, is_system, alert_id)
                           VALUES (?, NULL, ?, ?, ?, 1, ?)')
                ->execute([$channel ?: 'ops', 'DrillGuard', 'system', mb_substr($body, 0, 1000), $alertId]);
        } catch (\Throwable) {
            // A failed system message must never break the alert flow.
        }
    }

    private static function shape(array $r): array
    {
        return [
            'id' => (int) $r['id'],
            'channel' => $r['channel'],
            'user_id' => $r['user_id'] !== null ? (int) $r['user_id'] : null,
            'author' => $r['author'],
            'role' => $r['role'],
            'body' => $r['body'],
            'is_system' => (bool) $r['is_system'],
            'alert_id' => $r['alert_id'] !== null ? (int) $r['alert_id'] : null,
            'created_at' => $r['created_at'],
        ];
    }
}
