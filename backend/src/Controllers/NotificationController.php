<?php

declare(strict_types=1);

namespace DrillGuard\Controllers;

use DrillGuard\Support\Auth;
use DrillGuard\Support\Config;
use DrillGuard\Support\Database;
use DrillGuard\Support\Http;
use DrillGuard\Support\Notifier;

final class NotificationController
{
    /** Recent notification log (what was sent / dry-run / failed, per channel). */
    public function index(): void
    {
        Auth::require();
        $stmt = Database::pdo()->query(
            'SELECT n.*, a.title AS alert_title, a.tier AS alert_tier
             FROM notifications n LEFT JOIN alerts a ON a.id = n.alert_id
             ORDER BY n.created_at DESC, n.id DESC LIMIT 50'
        );
        Http::json(['notifications' => array_map(static fn (array $r) => [
            'id' => (int) $r['id'],
            'alert_id' => $r['alert_id'] !== null ? (int) $r['alert_id'] : null,
            'alert_title' => $r['alert_title'],
            'alert_tier' => $r['alert_tier'],
            'channel' => $r['channel'],
            'recipient' => $r['recipient'],
            'status' => $r['status'],
            'provider' => $r['provider'],
            'detail' => $r['detail'],
            'created_at' => $r['created_at'],
        ], $stmt->fetchAll())]);
    }

    /** Re-send the offline outbox (queued SMS). Also runs opportunistically on new alerts. */
    public function retry(): void
    {
        Auth::require();
        Http::json(['flushed' => Notifier::flushQueued()]);
    }

    /** Delivery configuration status — no secrets, just whether each channel is live. */
    public function status(): void
    {
        $user = Auth::require();
        $smsProvider = Config::get('SMS_PROVIDER', 'log') ?? 'log';
        $smsKeySet = (Config::get('SMS_API_KEY', '') ?? '') !== '';
        $queued = 0;
        try {
            $queued = (int) Database::pdo()
                ->query("SELECT COUNT(*) FROM notifications WHERE channel = 'sms' AND status = 'queued'")
                ->fetchColumn();
        } catch (\Throwable) {
        }
        Http::json(['status' => [
            'queued_sms' => $queued,
            'sms' => [
                'live' => $smsProvider !== 'log' && $smsKeySet,
                'provider' => $smsProvider,
                'sender' => Config::get('SMS_SENDER', 'N-Alert'),
                'channel' => Config::get('SMS_CHANNEL', 'dnd'),
                'key_present' => $smsKeySet,
            ],
            'email' => [
                'live' => Config::bool('MAIL_ENABLED', false),
                'from' => Config::get('MAIL_FROM', 'alerts@drillguard.local'),
            ],
            'recipient' => [
                'email' => $user['email'],
                'phone' => $user['phone'] ?? null,
            ],
        ]]);
    }

    /**
     * Fire a REAL test notification through the same path an alert uses.
     * Body: { "phone": "090..." } (optional — defaults to the profile phone).
     */
    public function test(): void
    {
        $user = Auth::require();
        $b = Http::body();
        $phone = trim((string) ($b['phone'] ?? '')) ?: ($user['phone'] ?? null);

        $result = Notifier::dispatchAlert([
            'id' => 0,
            'tier' => 'Test',
            'title' => 'Notification channel test',
            'description' => 'This is a DrillGuard delivery test. If you received this, alert notifications are working.',
            'risk_score' => 0,
            'well_label' => 'System check',
        ], $user['email'], $phone);

        Http::json(['result' => $result]);
    }
}
