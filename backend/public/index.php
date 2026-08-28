<?php

declare(strict_types=1);

/**
 * DrillGuard API — single front controller.
 * Deploy `public/` as the web root on shared hosting (or point a vhost here).
 */

use DrillGuard\Controllers\AlertController;
use DrillGuard\Controllers\AuthController;
use DrillGuard\Controllers\IncidentController;
use DrillGuard\Controllers\InferProxyController;
use DrillGuard\Controllers\MessageController;
use DrillGuard\Controllers\NotificationController;
use DrillGuard\Controllers\ReplayController;
use DrillGuard\Controllers\WellController;
use DrillGuard\Support\Config;
use DrillGuard\Support\Http;
use DrillGuard\Support\Router;

$root = dirname(__DIR__);
require $root . '/vendor/autoload.php';
Config::boot($root);

Http::cors();
header('X-Content-Type-Options: nosniff');

// Fail JSON, not HTML, on any uncaught error.
set_exception_handler(function (Throwable $e) {
    $debug = Config::bool('APP_DEBUG', false);
    Http::error(
        $debug ? $e->getMessage() : 'Internal server error',
        500,
        $debug ? ['type' => $e::class, 'where' => $e->getFile() . ':' . $e->getLine()] : []
    );
});

$router = new Router();

// ---- health ---------------------------------------------------------------
$router->get('/api/health', fn () => Http::json(['ok' => true, 'service' => 'drillguard-api', 'time' => date('c')]));

// ---- auth -----------------------------------------------------------------
$auth = new AuthController();
$router->post('/api/auth/register', fn () => $auth->register());
$router->post('/api/auth/login', fn () => $auth->login());
$router->post('/api/auth/logout', fn () => $auth->logout());
$router->get('/api/auth/me', fn () => $auth->me());
$router->patch('/api/auth/me', fn () => $auth->updateMe());

// ---- wells ----------------------------------------------------------------
$wells = new WellController();
$router->get('/api/wells', fn () => $wells->index());

// ---- alerts ---------------------------------------------------------------
$alerts = new AlertController();
$router->get('/api/alerts', fn () => $alerts->index());
$router->post('/api/alerts', fn () => $alerts->create());
$router->get('/api/alerts/{id}', fn ($a) => $alerts->show($a));
$router->post('/api/alerts/{id}/ack', fn ($a) => $alerts->acknowledge($a));

// ---- incidents ------------------------------------------------------------
$incidents = new IncidentController();
$router->get('/api/incidents', fn () => $incidents->index());
$router->post('/api/incidents', fn () => $incidents->create());
$router->get('/api/incidents/{id}', fn ($a) => $incidents->show($a));
$router->patch('/api/incidents/{id}', fn ($a) => $incidents->update($a));

// ---- crew channel (team messaging) ----------------------------------------
$messages = new MessageController();
$router->get('/api/messages', fn () => $messages->index());
$router->post('/api/messages', fn () => $messages->create());

// ---- notifications (SMS / email delivery) ---------------------------------
$notifications = new NotificationController();
$router->get('/api/notifications', fn () => $notifications->index());
$router->get('/api/notifications/status', fn () => $notifications->status());
$router->post('/api/notifications/test', fn () => $notifications->test());
$router->post('/api/notifications/retry', fn () => $notifications->retry());

// ---- inference proxy (loopback-only model service) ------------------------
$infer = new InferProxyController();
$router->get('/api/infer/{path}', fn ($a) => $infer->forward($a));
$router->post('/api/infer/{path}', fn ($a) => $infer->forward($a));

// ---- replay (pipeline export passthrough) ---------------------------------
$replay = new ReplayController();
$router->get('/api/replay', fn () => $replay->catalog());
$router->get('/api/replay-catalog', fn () => $replay->catalog()); // static-export path parity
$router->get('/api/replay/{id}', fn ($a) => $replay->show($a));

// ---- dispatch -------------------------------------------------------------
$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
$router->dispatch($_SERVER['REQUEST_METHOD'] ?? 'GET', rtrim($path, '/') ?: '/');
