<?php

declare(strict_types=1);

namespace DrillGuard\Support;

use PHPMailer\PHPMailer\PHPMailer;
use Throwable;

/**
 * Sends alert notifications by email (PHPMailer/SMTP) and SMS (pluggable gateway).
 *
 * SAFE BY DEFAULT: if MAIL_ENABLED=false / SMS_PROVIDER=log, nothing is actually
 * sent — the intent is recorded in the `notifications` table with status 'dryrun'.
 * Drop real credentials in .env to switch to live delivery. Every attempt is logged.
 */
final class Notifier
{
    /** Dispatch an alert to a recipient over both channels. Returns per-channel result. */
    public static function dispatchAlert(array $alert, string $email, ?string $phone = null): array
    {
        $subject = sprintf('[DrillGuard %s] %s', strtoupper($alert['tier'] ?? 'ALERT'), $alert['title'] ?? 'Alert');
        $lines = [
            $alert['title'] ?? 'Drilling alert',
            '',
            $alert['description'] ?? '',
            '',
            'Tier: ' . ($alert['tier'] ?? '—'),
            'Risk score: ' . ($alert['risk_score'] ?? '—'),
            'Well: ' . ($alert['well_label'] ?? $alert['well_id'] ?? '—'),
            isset($alert['index_label']) ? ($alert['index_label'] . ': ' . ($alert['index_value'] ?? '—')) : '',
        ];
        $bodyText = implode("\n", array_filter($lines, fn ($l) => $l !== ''));
        $smsText = sprintf(
            'DrillGuard %s: %s (risk %s). %s',
            strtoupper($alert['tier'] ?? 'ALERT'),
            $alert['title'] ?? 'Alert',
            $alert['risk_score'] ?? '—',
            $alert['well_label'] ?? ''
        );

        $result = [];
        $result['email'] = self::sendEmail($email, $subject, $bodyText, (int) ($alert['id'] ?? 0));
        if ($phone) {
            $result['sms'] = self::sendSms($phone, $smsText, (int) ($alert['id'] ?? 0));
        }
        return $result;
    }

    private static function sendEmail(string $to, string $subject, string $body, int $alertId): array
    {
        $enabled = Config::bool('MAIL_ENABLED', false);
        if (!$enabled) {
            return self::record($alertId, 'email', $to, 'dryrun', 'smtp', 'MAIL_ENABLED=false');
        }
        try {
            $mail = new PHPMailer(true);
            $mail->isSMTP();
            $mail->Host = Config::get('MAIL_HOST', '');
            $mail->Port = Config::int('MAIL_PORT', 587);
            $mail->SMTPAuth = true;
            $mail->Username = Config::get('MAIL_USERNAME', '');
            $mail->Password = Config::get('MAIL_PASSWORD', '');
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
            $mail->setFrom(Config::get('MAIL_FROM', 'alerts@drillguard.local'), Config::get('MAIL_FROM_NAME', 'DrillGuard'));
            $mail->addAddress($to);
            $mail->Subject = $subject;
            $mail->Body = $body;
            $mail->send();
            return self::record($alertId, 'email', $to, 'sent', 'smtp', null);
        } catch (Throwable $e) {
            return self::record($alertId, 'email', $to, 'failed', 'smtp', substr($e->getMessage(), 0, 400));
        }
    }

    private static function sendSms(string $to, string $text, int $alertId): array
    {
        $provider = Config::get('SMS_PROVIDER', 'log');
        if ($provider === 'log' || $provider === null) {
            return self::record($alertId, 'sms', $to, 'dryrun', 'log', 'SMS_PROVIDER=log');
        }
        [$ok, $detail, $networkDown] = self::deliverSms($to, $text);
        if ($networkDown) {
            // OFFLINE / no internet on the rig: queue with the message body so
            // flushQueued() can re-send when the link returns. Store-and-forward.
            return self::record($alertId, 'sms', $to, 'queued', $provider, 'link down — queued for retry', $text);
        }
        return self::record($alertId, 'sms', $to, $ok ? 'sent' : 'failed', $provider, substr($detail, 0, 400));
    }

    /**
     * Raw SMS delivery, shared by first-send and outbox retry.
     * @return array{0: bool ok, 1: string detail, 2: bool networkDown}
     */
    private static function deliverSms(string $to, string $text): array
    {
        $provider = Config::get('SMS_PROVIDER', 'log');
        try {
            if ($provider === 'termii') {
                // Termii expects a JSON body. Channel "dnd" (with an approved sender
                // like N-Alert) delivers to Nigerian DND-listed numbers too.
                // SMS_API_URL override supports testing and self-hosted gateways.
                return self::httpPostJson(
                    Config::get('SMS_API_URL', 'https://api.ng.termii.com/api/sms/send') ?? 'https://api.ng.termii.com/api/sms/send',
                    [
                        'to' => self::normalizePhone($to),
                        'from' => Config::get('SMS_SENDER', 'N-Alert'),
                        'sms' => $text,
                        'type' => 'plain',
                        'channel' => Config::get('SMS_CHANNEL', 'dnd'),
                        'api_key' => Config::get('SMS_API_KEY', ''),
                    ]
                );
            }
            if ($provider === 'twilio') {
                $sid = Config::get('SMS_ACCOUNT_SID', '');
                $ok = self::httpPost(
                    "https://api.twilio.com/2010-04-01/Accounts/{$sid}/Messages.json",
                    ['To' => $to, 'From' => Config::get('SMS_FROM', ''), 'Body' => $text],
                    $sid . ':' . Config::get('SMS_API_KEY', ''),
                    true
                );
                return [$ok, $ok ? 'sent' : 'twilio error', false];
            }
            return [false, 'unknown provider', false];
        } catch (Throwable $e) {
            return [false, substr($e->getMessage(), 0, 400), false];
        }
    }

    /**
     * Re-send queued SMS (the offline outbox). Called opportunistically when the
     * system is next online — on alert creation and from POST /api/notifications/retry.
     * Rows older than 48 h are marked expired rather than sent late.
     * @return array{retried: int, sent: int, still_queued: int, expired: int}
     */
    public static function flushQueued(int $limit = 20): array
    {
        $out = ['retried' => 0, 'sent' => 0, 'still_queued' => 0, 'expired' => 0];
        try {
            $pdo = Database::pdo();
            $rows = $pdo->query(
                "SELECT id, recipient, body, created_at FROM notifications
                 WHERE channel = 'sms' AND status = 'queued' AND body IS NOT NULL
                 ORDER BY id ASC LIMIT " . (int) $limit
            )->fetchAll();
            foreach ($rows as $row) {
                if (strtotime((string) $row['created_at']) < time() - 48 * 3600) {
                    $pdo->prepare("UPDATE notifications SET status = 'expired', detail = 'older than 48h — not sent late' WHERE id = ?")
                        ->execute([(int) $row['id']]);
                    $out['expired']++;
                    continue;
                }
                $out['retried']++;
                [$ok, $detail, $networkDown] = self::deliverSms((string) $row['recipient'], (string) $row['body']);
                if ($networkDown) {
                    $out['still_queued']++;
                    continue; // still offline — leave it queued
                }
                $pdo->prepare('UPDATE notifications SET status = ?, detail = ? WHERE id = ?')
                    ->execute([$ok ? 'sent' : 'failed', substr($detail, 0, 400), (int) $row['id']]);
                if ($ok) {
                    $out['sent']++;
                }
            }
        } catch (Throwable) {
            // The outbox must never break the caller.
        }
        return $out;
    }

    /** Normalize Nigerian local numbers (0XXXXXXXXXX) to international 234… format. */
    private static function normalizePhone(string $phone): string
    {
        $digits = preg_replace('/[^0-9]/', '', $phone) ?? '';
        if (strlen($digits) === 11 && str_starts_with($digits, '0')) {
            return '234' . substr($digits, 1);
        }
        return ltrim($digits, '+') ?: $phone;
    }

    /**
     * JSON POST returning [ok, detail, networkDown]. networkDown is true when the
     * request never reached the API (DNS failure, no route, timeout) — the
     * offline case, as opposed to the API rejecting the message.
     * @param array<string,mixed> $fields
     * @return array{0: bool, 1: string, 2: bool}
     */
    private static function httpPostJson(string $url, array $fields): array
    {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
            CURLOPT_POSTFIELDS => json_encode($fields),
            CURLOPT_TIMEOUT => 20,
            CURLOPT_CONNECTTIMEOUT => 8,
        ]);
        $body = (string) curl_exec($ch);
        $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $errno = curl_errno($ch);
        $err = curl_error($ch);
        // Transport-level failures = the link is down (or the host unreachable).
        $networkDown = in_array($errno, [
            CURLE_COULDNT_RESOLVE_HOST, CURLE_COULDNT_CONNECT, CURLE_OPERATION_TIMEDOUT,
            CURLE_SSL_CONNECT_ERROR, CURLE_SEND_ERROR, CURLE_RECV_ERROR, CURLE_GOT_NOTHING,
        ], true) || ($errno !== 0 && $code === 0);
        $json = json_decode($body, true);
        $ok = $code >= 200 && $code < 300 && is_array($json) && ($json['code'] ?? null) === 'ok';
        return [$ok, $body !== '' ? $body : ($err ?: "http {$code}"), $networkDown];
    }

    /** @param array<string,mixed> $fields */
    private static function httpPost(string $url, array $fields, ?string $basicAuth = null, bool $form = true): bool
    {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $form ? http_build_query($fields) : json_encode($fields),
            CURLOPT_TIMEOUT => 15,
        ]);
        if ($basicAuth !== null) {
            curl_setopt($ch, CURLOPT_USERPWD, $basicAuth);
        }
        curl_exec($ch);
        $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        return $code >= 200 && $code < 300;
    }

    private static function record(int $alertId, string $channel, string $to, string $status, string $provider, ?string $detail, ?string $body = null): array
    {
        try {
            $stmt = Database::pdo()->prepare(
                'INSERT INTO notifications (alert_id, channel, recipient, status, provider, detail, body)
                 VALUES (?, ?, ?, ?, ?, ?, ?)'
            );
            $stmt->execute([$alertId ?: null, $channel, $to, $status, $provider, $detail, $body !== null ? substr($body, 0, 500) : null]);
        } catch (Throwable) {
            // Notification logging must never break the alert flow.
        }
        return ['channel' => $channel, 'recipient' => $to, 'status' => $status, 'provider' => $provider, 'detail' => $detail];
    }
}
