<?php

declare(strict_types=1);

namespace DrillGuard\Controllers;

use DrillGuard\Support\Config;
use DrillGuard\Support\Http;

/**
 * Serves the replay data exported from the ML pipeline (catalog.json + <id>.json).
 * The transform is owned by the Python/Next pipeline; PHP only serves the export,
 * so there is a single source of truth for what the models produced.
 */
final class ReplayController
{
    public function catalog(): void
    {
        // Public: the replay is demo data, not user-owned. (Add Auth::require() to gate it.)
        $file = $this->dir() . '/catalog.json';
        if (!is_file($file)) {
            Http::error('Replay catalog not exported yet. Run scripts/export_replay.sh.', 503);
        }
        $this->streamJson($file);
    }

    public function show(array $args): void
    {
        $id = preg_replace('/[^a-z0-9\-]/i', '', $args['id']);
        $file = $this->dir() . "/{$id}.json";
        if (!is_file($file)) {
            Http::error('Unknown dataset', 404);
        }
        $this->streamJson($file);
    }

    private function dir(): string
    {
        $rel = Config::get('REPLAY_DIR', 'data/replay');
        return str_starts_with($rel, '/') ? $rel : dirname(__DIR__, 2) . '/' . $rel;
    }

    private function streamJson(string $file): never
    {
        header('Content-Type: application/json; charset=utf-8');
        header('Cache-Control: public, max-age=60');
        readfile($file);
        exit;
    }
}
