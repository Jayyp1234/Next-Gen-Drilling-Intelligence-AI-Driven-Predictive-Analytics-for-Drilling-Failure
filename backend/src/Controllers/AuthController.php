<?php

declare(strict_types=1);

namespace DrillGuard\Controllers;

use DrillGuard\Support\Auth;
use DrillGuard\Support\Config;
use DrillGuard\Support\Database;
use DrillGuard\Support\Http;
use DrillGuard\Support\Jwt;

final class AuthController
{
    public function register(): void
    {
        $b = Http::body();
        $name = trim((string) ($b['name'] ?? ''));
        $email = strtolower(trim((string) ($b['email'] ?? '')));
        $password = (string) ($b['password'] ?? '');

        if ($name === '' || !filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($password) < 6) {
            Http::error('Provide name, a valid email, and a password of at least 6 characters.', 422);
        }

        $pdo = Database::pdo();
        $exists = $pdo->prepare('SELECT id FROM users WHERE email = ?');
        $exists->execute([$email]);
        if ($exists->fetch()) {
            Http::error('An account with that email already exists.', 409);
        }

        $stmt = $pdo->prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)');
        $stmt->execute([$name, $email, password_hash($password, PASSWORD_BCRYPT), 'engineer']);
        $id = (int) $pdo->lastInsertId();

        Http::json($this->tokenResponse($id, $name, $email, 'engineer'), 201);
    }

    public function login(): void
    {
        $b = Http::body();
        $email = strtolower(trim((string) ($b['email'] ?? '')));
        $password = (string) ($b['password'] ?? '');

        $pdo = Database::pdo();
        $stmt = $pdo->prepare('SELECT id, name, email, role, password_hash FROM users WHERE email = ? LIMIT 1');
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        if (!$user || !password_verify($password, $user['password_hash'])) {
            Http::error('Invalid email or password.', 401);
        }

        Http::json($this->tokenResponse((int) $user['id'], $user['name'], $user['email'], $user['role']));
    }

    public function me(): void
    {
        $user = Auth::require();
        Http::json(['user' => $this->publicUser($user)]);
    }

    public function logout(): void
    {
        // Stateless JWT: logout is client-side (drop the token). Endpoint exists for symmetry.
        Http::json(['ok' => true]);
    }

    /** Update the current user's profile (phone for SMS alerts; name optional). */
    public function updateMe(): void
    {
        $user = Auth::require();
        $b = Http::body();
        $pdo = Database::pdo();

        if (array_key_exists('phone', $b)) {
            $phone = trim((string) $b['phone']);
            if ($phone !== '' && !preg_match('/^\+?[0-9 \-]{7,20}$/', $phone)) {
                Http::error('Provide a valid phone number (digits, e.g. 0903 221 0788).', 422);
            }
            $pdo->prepare('UPDATE users SET phone = ? WHERE id = ?')
                ->execute([$phone !== '' ? $phone : null, (int) $user['id']]);
        }
        if (isset($b['name']) && trim((string) $b['name']) !== '') {
            $pdo->prepare('UPDATE users SET name = ? WHERE id = ?')
                ->execute([trim((string) $b['name']), (int) $user['id']]);
        }

        $stmt = $pdo->prepare('SELECT id, name, email, phone, role, created_at FROM users WHERE id = ?');
        $stmt->execute([(int) $user['id']]);
        Http::json(['user' => $this->publicUser($stmt->fetch())]);
    }

    private function tokenResponse(int $id, string $name, string $email, string $role): array
    {
        $ttl = Config::int('JWT_TTL_HOURS', 12) * 3600;
        $token = Jwt::issue(['sub' => $id, 'email' => $email, 'role' => $role], $ttl, Config::get('JWT_SECRET', '') ?? '');
        return [
            'token' => $token,
            'expires_in' => $ttl,
            'user' => ['id' => $id, 'name' => $name, 'email' => $email, 'role' => $role],
        ];
    }

    private function publicUser(array $u): array
    {
        return [
            'id' => (int) $u['id'],
            'name' => $u['name'],
            'email' => $u['email'],
            'phone' => $u['phone'] ?? null,
            'role' => $u['role'],
            'created_at' => $u['created_at'] ?? null,
        ];
    }
}
