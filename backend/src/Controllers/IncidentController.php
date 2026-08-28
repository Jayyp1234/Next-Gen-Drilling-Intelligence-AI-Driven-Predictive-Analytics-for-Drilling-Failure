<?php

declare(strict_types=1);

namespace DrillGuard\Controllers;

use DrillGuard\Support\Auth;
use DrillGuard\Support\Database;
use DrillGuard\Support\Http;

final class IncidentController
{
    public function index(): void
    {
        Auth::require();
        $rows = Database::pdo()->query(
            'SELECT i.*, w.code AS well_code
             FROM incidents i LEFT JOIN wells w ON w.id = i.well_id
             ORDER BY i.created_at DESC'
        )->fetchAll();
        Http::json(['incidents' => array_map([$this, 'shape'], $rows)]);
    }

    public function show(array $args): void
    {
        Auth::require();
        $pdo = Database::pdo();
        $stmt = $pdo->prepare(
            'SELECT i.*, w.code AS well_code FROM incidents i
             LEFT JOIN wells w ON w.id = i.well_id WHERE i.code = ? OR i.id = ? LIMIT 1'
        );
        $id = $args['id'];
        $stmt->execute([$id, is_numeric($id) ? (int) $id : 0]);
        $row = $stmt->fetch();
        if (!$row) {
            Http::error('Incident not found', 404);
        }
        $act = $pdo->prepare('SELECT actor, action, note, created_at FROM incident_activity WHERE incident_id = ? ORDER BY created_at ASC');
        $act->execute([(int) $row['id']]);
        Http::json(['incident' => $this->shape($row), 'activity' => $act->fetchAll()]);
    }

    public function create(): void
    {
        $user = Auth::require();
        $b = Http::body();
        $title = trim((string) ($b['title'] ?? ''));
        if ($title === '') {
            Http::error('title is required', 422);
        }

        $pdo = Database::pdo();
        $code = $this->nextCode($pdo);
        $stmt = $pdo->prepare(
            'INSERT INTO incidents (code, title, description, type, severity, status, well_id, well_label,
                source_alert_id, origin, detected_at, owner, created_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $code,
            $title,
            (string) ($b['description'] ?? ''),
            (string) ($b['type'] ?? 'Other'),
            (string) ($b['severity'] ?? 'medium'),
            (string) ($b['status'] ?? 'open'),
            isset($b['well_id']) ? (int) $b['well_id'] : null,
            $b['well_label'] ?? null,
            isset($b['source_alert_id']) ? (int) $b['source_alert_id'] : null,
            (string) ($b['origin'] ?? 'manual'),
            $b['detected_at'] ?? null,
            $b['owner'] ?? $user['name'],
            (int) $user['id'],
        ]);
        $id = (int) $pdo->lastInsertId();

        $note = isset($b['source_alert_id'])
            ? 'Escalated from alert #' . (int) $b['source_alert_id']
            : 'Incident reported manually';
        $pdo->prepare('INSERT INTO incident_activity (incident_id, actor, action, note) VALUES (?, ?, ?, ?)')
            ->execute([$id, $user['name'], 'created', $note]);

        $stmt = $pdo->prepare('SELECT i.*, w.code AS well_code FROM incidents i LEFT JOIN wells w ON w.id = i.well_id WHERE i.id = ?');
        $stmt->execute([$id]);
        Http::json(['incident' => $this->shape($stmt->fetch())], 201);
    }

    public function update(array $args): void
    {
        $user = Auth::require();
        $b = Http::body();
        $pdo = Database::pdo();

        $stmt = $pdo->prepare('SELECT id FROM incidents WHERE code = ? OR id = ? LIMIT 1');
        $stmt->execute([$args['id'], is_numeric($args['id']) ? (int) $args['id'] : 0]);
        $row = $stmt->fetch();
        if (!$row) {
            Http::error('Incident not found', 404);
        }
        $id = (int) $row['id'];

        $allowed = ['title', 'description', 'type', 'severity', 'status', 'owner'];
        $sets = [];
        $vals = [];
        foreach ($allowed as $f) {
            if (array_key_exists($f, $b)) {
                $sets[] = "$f = ?";
                $vals[] = (string) $b[$f];
            }
        }
        if ($sets) {
            $sets[] = 'updated_at = CURRENT_TIMESTAMP';
            $vals[] = $id;
            $pdo->prepare('UPDATE incidents SET ' . implode(', ', $sets) . ' WHERE id = ?')->execute($vals);
            $action = isset($b['status']) ? 'status:' . $b['status'] : 'updated';
            $pdo->prepare('INSERT INTO incident_activity (incident_id, actor, action, note) VALUES (?, ?, ?, ?)')
                ->execute([$id, $user['name'], $action, (string) ($b['note'] ?? '')]);
        }

        $stmt = $pdo->prepare('SELECT i.*, w.code AS well_code FROM incidents i LEFT JOIN wells w ON w.id = i.well_id WHERE i.id = ?');
        $stmt->execute([$id]);
        Http::json(['incident' => $this->shape($stmt->fetch())]);
    }

    private function nextCode(\PDO $pdo): string
    {
        $n = (int) $pdo->query('SELECT COALESCE(MAX(id),1000) FROM incidents')->fetchColumn();
        return 'INC-' . ($n + 1);
    }

    private function shape(array $r): array
    {
        return [
            'id' => (int) $r['id'],
            'code' => $r['code'],
            'title' => $r['title'],
            'description' => $r['description'],
            'type' => $r['type'],
            'severity' => $r['severity'],
            'status' => $r['status'],
            'well_id' => $r['well_id'] !== null ? (int) $r['well_id'] : null,
            'well' => $r['well_label'] ?? $r['well_code'] ?? null,
            'source_alert_id' => $r['source_alert_id'] !== null ? (int) $r['source_alert_id'] : null,
            'origin' => $r['origin'],
            'detected_at' => $r['detected_at'],
            'owner' => $r['owner'],
            'created_at' => $r['created_at'],
            'updated_at' => $r['updated_at'],
        ];
    }
}
