<?php

declare(strict_types=1);

namespace DrillGuard\Support;

/** Tiny path-pattern router. Patterns use {name} placeholders. */
final class Router
{
    /** @var array<int, array{method:string, regex:string, params:string[], handler:callable}> */
    private array $routes = [];

    public function add(string $method, string $pattern, callable $handler): void
    {
        $params = [];
        $regex = preg_replace_callback('/\{(\w+)\}/', function ($m) use (&$params) {
            $params[] = $m[1];
            return '([^/]+)';
        }, $pattern);
        $this->routes[] = [
            'method'  => strtoupper($method),
            'regex'   => '#^' . $regex . '$#',
            'params'  => $params,
            'handler' => $handler,
        ];
    }

    public function get(string $p, callable $h): void { $this->add('GET', $p, $h); }
    public function post(string $p, callable $h): void { $this->add('POST', $p, $h); }
    public function patch(string $p, callable $h): void { $this->add('PATCH', $p, $h); }
    public function delete(string $p, callable $h): void { $this->add('DELETE', $p, $h); }

    public function dispatch(string $method, string $path): void
    {
        $method = strtoupper($method);
        if ($method === 'OPTIONS') {
            http_response_code(204);
            exit;
        }
        $pathMatched = false;
        foreach ($this->routes as $r) {
            if (!preg_match($r['regex'], $path, $m)) {
                continue;
            }
            $pathMatched = true;
            if ($r['method'] !== $method) {
                continue;
            }
            $args = [];
            foreach ($r['params'] as $i => $name) {
                $args[$name] = urldecode($m[$i + 1]);
            }
            ($r['handler'])($args);
            return;
        }
        Http::error($pathMatched ? 'Method not allowed' : 'Not found', $pathMatched ? 405 : 404);
    }
}
