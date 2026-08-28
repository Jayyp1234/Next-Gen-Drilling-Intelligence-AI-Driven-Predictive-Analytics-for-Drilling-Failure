<?php

declare(strict_types=1);

namespace DrillGuard\Controllers;

use DrillGuard\Support\Auth;
use DrillGuard\Support\Database;
use DrillGuard\Support\Http;
use DrillGuard\Support\Notifier;

final class AlertController
{
    public function index(): void
    {
        Auth::require();
        $status = $_GET['status'] ?? null;
        $sql = 'SELECT a.*, w.code AS well_code, w.name AS well_name FROM alerts a
                LEFT JOIN wells w ON w.id = a.well_id';
        $params = [];
        if ($status !== null && $status !== 'all') {
            $sql .= ' WHERE a.status = ?';
            $params[] = $status;
        }
        $sql .= ' ORDER BY a.created_at DESC';
        $stmt = Database::pdo()->prepare($sql);
        $stmt->execute($params);
        Http::json(['alerts' => array_map([$this, 'shape'], $stmt->fetchAll())]);
    }

    public function show(array $args): void
    {
        Auth::require();
        $stmt = Database::pdo()->prepare(
            'SELECT a.*, w.code AS well_code, w.name AS well_name FROM alerts a
             LEFT JOIN wells w ON w.id = a.well_id WHERE a.id = ?'
        );
        $stmt->execute([(int) $args['id']]);
        $row = $stmt->fetch();
        if (!$row) {
            Http::error('Alert not found', 404);
        }
        Http::json(['alert' => $this->shape($row)]);
    }

    /** Records a fired alert (e.g. from the replay stream crossing a tier) and notifies. */
    public function create(): void
    {
        $user = Auth::require();
        $b = Http::body();
        $title = trim((string) ($b['title'] ?? ''));
        if ($title === '') {
            Http::error('title is required', 422);
        }

        $pdo = Database::pdo();
        $stmt = $pdo->prepare(
            'INSERT INTO alerts (well_id, dataset_id, mechanism, tier, severity, risk_score,
                index_label, index_value, title, description, active_monitors, status, source)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            isset($b['well_id']) ? (int) $b['well_id'] : null,
            $b['dataset_id'] ?? null,
            (string) ($b['mechanism'] ?? 'unknown'),
            (string) ($b['tier'] ?? 'Watch'),
            (string) ($b['severity'] ?? 'medium'),
            isset($b['risk_score']) ? (float) $b['risk_score'] : null,
            $b['index_label'] ?? null,
            isset($b['index_value']) ? (float) $b['index_value'] : null,
            $title,
            $b['description'] ?? null,
            $b['active_monitors'] ?? null,
            'active',
            (string) ($b['source'] ?? 'replay'),
        ]);
        $id = (int) $pdo->lastInsertId();

        $stmt = $pdo->prepare('SELECT a.*, w.code AS well_code, w.name AS well_name FROM alerts a LEFT JOIN wells w ON w.id = a.well_id WHERE a.id = ?');
        $stmt->execute([$id]);
        $alert = $stmt->fetch();

        // Notify on HIGH tiers only (Elevated/Action). Dry-run unless credentials set.
        // SMS goes to the explicit sms_to if given, else the user's profile phone.
        $notified = null;
        if (in_array($alert['tier'], ['Elevated', 'Action'], true)) {
            // Opportunistic outbox flush: if the link is back, drain any SMS that
            // queued while offline before (or alongside) this alert's own send.
            Notifier::flushQueued();
            $notified = Notifier::dispatchAlert(
                array_merge($alert, ['well_label' => $alert['well_name'] ?? $alert['well_code']]),
                $user['email'],
                ($b['sms_to'] ?? null) ?: ($user['phone'] ?? null)
            );
            // Drop a system line into the well's crew channel so coordination
            // starts in the same thread the crew is already talking in.
            $channel = $alert['well_code'] ?? $alert['dataset_id'] ?? 'ops';
            MessageController::postSystem(
                (string) $channel,
                sprintf(
                    '%s — %s. Risk %s. %s',
                    strtoupper((string) $alert['tier']),
                    (string) $alert['title'],
                    $alert['risk_score'] !== null ? (string) round((float) $alert['risk_score']) : '—',
                    'Crew: acknowledge and coordinate response here.'
                ),
                $id
            );
        }

        Http::json(['alert' => $this->shape($alert), 'notified' => $notified], 201);
    }

    public function acknowledge(array $args): void
    {
        $user = Auth::require();
        $pdo = Database::pdo();
        $stmt = $pdo->prepare('SELECT id FROM alerts WHERE id = ?');
        $stmt->execute([(int) $args['id']]);
        if (!$stmt->fetch()) {
            Http::error('Alert not found', 404);
        }
        $pdo->prepare('UPDATE alerts SET status = ?, acknowledged_by = ?, acknowledged_at = CURRENT_TIMESTAMP WHERE id = ?')
            ->execute(['acknowledged', (int) $user['id'], (int) $args['id']]);

        $stmt = $pdo->prepare('SELECT a.*, w.code AS well_code, w.name AS well_name FROM alerts a LEFT JOIN wells w ON w.id = a.well_id WHERE a.id = ?');
        $stmt->execute([(int) $args['id']]);
        Http::json(['alert' => $this->shape($stmt->fetch())]);
    }

    private function shape(array $r): array
    {
        return [
            'id' => (int) $r['id'],
            'well_id' => $r['well_id'] !== null ? (int) $r['well_id'] : null,
            'well' => $r['well_name'] ?? $r['well_code'] ?? null,
            'dataset_id' => $r['dataset_id'],
            'mechanism' => $r['mechanism'],
            'tier' => $r['tier'],
            'severity' => $r['severity'],
            'risk_score' => $r['risk_score'] !== null ? (float) $r['risk_score'] : null,
            'index_label' => $r['index_label'],
            'index_value' => $r['index_value'] !== null ? (float) $r['index_value'] : null,
            'title' => $r['title'],
            'description' => $r['description'],
            'active_monitors' => $r['active_monitors'],
            'status' => $r['status'],
            'acknowledged_by' => $r['acknowledged_by'] !== null ? (int) $r['acknowledged_by'] : null,
            'acknowledged_at' => $r['acknowledged_at'],
            'source' => $r['source'],
            'created_at' => $r['created_at'],
        ];
    }
}
