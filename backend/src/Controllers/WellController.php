<?php

declare(strict_types=1);

namespace DrillGuard\Controllers;

use DrillGuard\Support\Auth;
use DrillGuard\Support\Database;
use DrillGuard\Support\Http;

final class WellController
{
    public function index(): void
    {
        Auth::require();
        $rows = Database::pdo()->query('SELECT * FROM wells ORDER BY code ASC')->fetchAll();
        Http::json(['wells' => array_map(fn ($r) => [
            'id' => (int) $r['id'],
            'code' => $r['code'],
            'name' => $r['name'],
            'field' => $r['field'],
            'rig' => $r['rig'],
            'operator' => $r['operator'],
            'status' => $r['status'],
        ], $rows)]);
    }
}
