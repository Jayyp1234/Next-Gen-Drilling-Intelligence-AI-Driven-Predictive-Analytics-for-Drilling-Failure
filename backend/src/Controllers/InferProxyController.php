<?php

declare(strict_types=1);

namespace DrillGuard\Controllers;

use DrillGuard\Support\Config;
use DrillGuard\Support\Http;

/**
 * Loopback proxy to the Python inference service (uvicorn on 127.0.0.1:8099).
 *
 * On the cPanel VPS the model service is never exposed to the internet —
 * only Apache/PHP on the same machine can reach it (same pattern as the
 * SepalSolver runner shim). Clients point NEXT_PUBLIC_INFER_BASE /
 * EXPO_PUBLIC_INFER_BASE at  https://api.DOMAIN/api/infer  and everything
 * else works unchanged.
 *
 * The raw request body is passed through untouched, so JSON (POST /score)
 * and multipart CSV uploads (POST /score-csv) both survive the hop.
 */
final class InferProxyController
{
    /** Endpoints allowed through the proxy — everything else 404s. */
    private const ALLOW = ['health', 'model', 'score', 'score-csv', 'score-sample'];

    public function forward(array $args): void
    {
        $path = $args['path'] ?? '';
        if (!in_array($path, self::ALLOW, true)) {
            Http::error('Unknown inference endpoint', 404);
        }

        $base = rtrim(Config::get('INFER_URL', 'http://127.0.0.1:8099') ?? 'http://127.0.0.1:8099', '/');
        $qs = (string) ($_SERVER['QUERY_STRING'] ?? '');
        $url = $base . '/' . $path . ($qs !== '' ? "?{$qs}" : '');
        $method = strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET'));

        $contentType = (string) ($_SERVER['CONTENT_TYPE'] ?? '');
        $isMultipart = str_starts_with(strtolower($contentType), 'multipart/');

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CUSTOMREQUEST => $method,
            CURLOPT_TIMEOUT => 120,          // whole-well CSV scoring can take a while
            CURLOPT_CONNECTTIMEOUT => 5,
        ]);
        if ($method !== 'GET' && $method !== 'HEAD') {
            if ($isMultipart) {
                // PHP has already parsed the multipart body into $_POST/$_FILES —
                // php://input is empty. Rebuild the upload for the upstream hop;
                // curl generates a fresh multipart boundary and Content-Type.
                $fields = $_POST;
                foreach ($_FILES as $key => $f) {
                    if (is_array($f['tmp_name'])) {
                        continue; // array uploads not used by the inference API
                    }
                    if ((int) $f['error'] === UPLOAD_ERR_OK && is_uploaded_file($f['tmp_name'])) {
                        $fields[$key] = new \CURLFile(
                            $f['tmp_name'],
                            (string) ($f['type'] ?? 'application/octet-stream'),
                            (string) ($f['name'] ?? 'upload')
                        );
                    }
                }
                curl_setopt($ch, CURLOPT_POSTFIELDS, $fields);
            } else {
                if ($contentType !== '') {
                    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: ' . $contentType]);
                }
                curl_setopt($ch, CURLOPT_POSTFIELDS, file_get_contents('php://input') ?: '');
            }
        }

        $body = curl_exec($ch);
        $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $ctype = (string) (curl_getinfo($ch, CURLINFO_CONTENT_TYPE) ?: 'application/json');

        if ($body === false || $status === 0) {
            Http::error('Inference service unreachable', 502);
        }

        http_response_code($status);
        header('Content-Type: ' . $ctype);
        echo $body;
        exit;
    }
}
