<?php

declare(strict_types=1);

namespace DrillGuard\Support;

/** JWT auth guard. Resolves the current user from the Bearer token. */
final class Auth
{
    /** Returns the authenticated user row, or halts with 401. */
    public static function require(): array
    {
        $user = self::user();
        if ($user === null) {
            Http::error('Unauthenticated', 401);
        }
        return $user;
    }

    /** Returns the authenticated user row, or null. */
    public static function user(): ?array
    {
        $token = Http::bearerToken();
        if ($token === null) {
            return null;
        }
        $claims = Jwt::verify($token, Config::get('JWT_SECRET', '') ?? '');
        if ($claims === null || !isset($claims['sub'])) {
            return null;
        }
        $stmt = Database::pdo()->prepare(
            'SELECT id, name, email, phone, role, created_at FROM users WHERE id = ? LIMIT 1'
        );
        $stmt->execute([(int) $claims['sub']]);
        $row = $stmt->fetch();
        return $row ?: null;
    }
}
