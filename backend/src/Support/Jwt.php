<?php

declare(strict_types=1);

namespace DrillGuard\Support;

/**
 * Minimal, self-contained HS256 JWT (no external dependency).
 * Signs and verifies compact JWTs with constant-time comparison.
 */
final class Jwt
{
    public static function issue(array $claims, int $ttlSeconds, string $secret): string
    {
        $now = time();
        $payload = array_merge($claims, [
            'iat' => $now,
            'exp' => $now + $ttlSeconds,
        ]);
        $h = self::b64(json_encode(['alg' => 'HS256', 'typ' => 'JWT'], JSON_THROW_ON_ERROR));
        $p = self::b64(json_encode($payload, JSON_THROW_ON_ERROR));
        $sig = self::b64(hash_hmac('sha256', "{$h}.{$p}", $secret, true));
        return "{$h}.{$p}.{$sig}";
    }

    /** Returns the claims array, or null if invalid/expired/tampered. */
    public static function verify(string $token, string $secret): ?array
    {
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return null;
        }
        [$h, $p, $sig] = $parts;
        $expected = self::b64(hash_hmac('sha256', "{$h}.{$p}", $secret, true));
        if (!hash_equals($expected, $sig)) {
            return null;
        }
        $payload = json_decode(self::unb64($p), true);
        if (!is_array($payload)) {
            return null;
        }
        if (isset($payload['exp']) && time() >= (int) $payload['exp']) {
            return null;
        }
        return $payload;
    }

    private static function b64(string $bin): string
    {
        return rtrim(strtr(base64_encode($bin), '+/', '-_'), '=');
    }

    private static function unb64(string $s): string
    {
        return base64_decode(strtr($s, '-_', '+/')) ?: '';
    }
}
