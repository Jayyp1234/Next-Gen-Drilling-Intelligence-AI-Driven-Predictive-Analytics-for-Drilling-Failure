<?php

declare(strict_types=1);

/**
 * Seeds a demo user, the wells behind the replay datasets, and the DOCUMENTED
 * alerts/incidents (real field anchors — same events the ML pipeline validated).
 * Idempotent: uses INSERT ... ON DUPLICATE KEY UPDATE / existence checks.
 *
 * Usage: php scripts/seed.php
 */

use DrillGuard\Support\Config;
use DrillGuard\Support\Database;

require __DIR__ . '/../vendor/autoload.php';

Config::boot(dirname(__DIR__));
$pdo = Database::pdo();

/* ---- demo user ---------------------------------------------------------- */
$email = 'engineer@drilcorp.com';
$hash = password_hash('drillguard', PASSWORD_BCRYPT);
$stmt = $pdo->prepare(
    'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE name = VALUES(name)'
);
$stmt->execute(['Drilling Engineer', $email, $hash, 'engineer']);
echo "user: {$email} / drillguard\n";

/* ---- wells (mirror the replay datasets) --------------------------------- */
$wells = [
    ['BILABRI-D2', 'Bilabri Deep-2',   'Niger Delta, Nigeria', 'Rig 12',  'DrilCorp Energy', 'completing'],
    ['BILABRI-D4', 'Bilabri Deep-4',   'Niger Delta, Nigeria', 'Rig 12',  'DrilCorp Energy', 'active'],
    ['15_9-F-14',  'Volve 15/9-F-14',  'North Sea, Norway',    'Maersk',  'Equinor',         'active'],
    ['15_9-F-15S', 'Volve 15/9-F-15 A','North Sea, Norway',    'Maersk',  'Equinor',         'active'],
    ['EOS-MWD9',   '31/5-7 Eos MWD_9', 'Eos, Norway',          'Songa',   'Equinor',         'active'],
];
$wStmt = $pdo->prepare(
    'INSERT INTO wells (code, name, field, rig, operator, status) VALUES (?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE name = VALUES(name), field = VALUES(field)'
);
foreach ($wells as $w) {
    $wStmt->execute($w);
}
$wellId = fn (string $code): ?int => (function () use ($pdo, $code) {
    $s = $pdo->prepare('SELECT id FROM wells WHERE code = ?');
    $s->execute([$code]);
    $id = $s->fetchColumn();
    return $id === false ? null : (int) $id;
})();
echo 'wells: ' . count($wells) . " seeded\n";

/* ---- documented alerts (real anchors) ----------------------------------- */
$alerts = [
    [
        'well' => 'BILABRI-D2', 'dataset' => 'bilabri-heldout-bilabri-d2', 'mechanism' => 'stuck_pipe',
        'tier' => 'Action', 'severity' => 'high', 'risk' => 92.0, 'index_label' => 'Depth (MD)', 'index_value' => 1659.0,
        'title' => 'Stuck pipe precursor — torque/WOB divergence',
        'desc'  => 'RF flagged 50 m before the documented stuck-pipe event at 1659 m (GEOL daily report).',
        'monitors' => 'RF|DTW', 'source' => 'replay',
    ],
    [
        'well' => '15_9-F-15S', 'dataset' => 'usrop-demo-heldout-15-9-f-15s', 'mechanism' => 'pack_off',
        'tier' => 'Watch', 'severity' => 'medium', 'risk' => 74.0, 'index_label' => 'Depth (MD)', 'index_value' => 1416.0,
        'title' => 'Pack-off pattern — SPP + torque rise',
        'desc'  => 'Partial-coverage monitor detected 23.5 m before documented pack-off (Volve DDR).',
        'monitors' => 'RF|LSTM|DTW', 'source' => 'replay',
    ],
    [
        'well' => 'EOS-MWD9', 'dataset' => 'eos-c1-ssi-test-wl-raw-bhpr-gr-mech-time-mwd-9', 'mechanism' => 'stick_slip',
        'tier' => 'Elevated', 'severity' => 'high', 'risk' => 83.0, 'index_label' => 'Time', 'index_value' => 0.0,
        'title' => 'Stick-slip — instrument-confirmed torsional oscillation',
        'desc'  => 'Fused AUC 0.839 vs downhole STICK ground truth.',
        'monitors' => 'RF|LSTM|DTW', 'source' => 'replay',
    ],
];
$existing = (int) $pdo->query('SELECT COUNT(*) FROM alerts')->fetchColumn();
if ($existing === 0) {
    $aStmt = $pdo->prepare(
        'INSERT INTO alerts (well_id, dataset_id, mechanism, tier, severity, risk_score,
            index_label, index_value, title, description, active_monitors, status, source)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    foreach ($alerts as $a) {
        $aStmt->execute([
            $wellId($a['well']), $a['dataset'], $a['mechanism'], $a['tier'], $a['severity'], $a['risk'],
            $a['index_label'], $a['index_value'], $a['title'], $a['desc'], $a['monitors'],
            $a['tier'] === 'Action' ? 'active' : 'active', $a['source'],
        ]);
    }
    echo 'alerts: ' . count($alerts) . " documented anchors seeded\n";
} else {
    echo "alerts: already present ({$existing}) — skipped\n";
}

/* ---- one documented incident (the D2 headline) -------------------------- */
$incExists = (int) $pdo->query('SELECT COUNT(*) FROM incidents')->fetchColumn();
if ($incExists === 0) {
    $iStmt = $pdo->prepare(
        'INSERT INTO incidents (code, title, description, type, severity, status, well_id, well_label,
            origin, detected_at, owner, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    $iStmt->execute([
        'INC-1001', 'Stuck pipe at 1659 m (fault-associated)',
        'Encountered fault with associated pipe stuck & sudden increase in torque (f/3-41 Amps). '
        . 'RF monitor warned 50 m ahead of the documented event.',
        'Stuck Pipe', 'high', 'resolved', $wellId('BILABRI-D2'), 'Bilabri Deep-2',
        'documented', '2006-08-17 00:00:00', 'Drilling Engineer', null,
    ]);
    $incId = (int) $pdo->lastInsertId();
    $pdo->prepare('INSERT INTO incident_activity (incident_id, actor, action, note) VALUES (?, ?, ?, ?)')
        ->execute([$incId, 'System', 'detected', 'RF@99 precursor 50 m before event (0.8% FAR).']);
    echo "incidents: 1 documented incident seeded (INC-1001)\n";
} else {
    echo "incidents: already present ({$incExists}) — skipped\n";
}

echo "seed done.\n";
