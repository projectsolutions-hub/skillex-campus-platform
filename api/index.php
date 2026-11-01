<?php
// api/index.php
// SkillEx Master API Front Controller & Router

require_once dirname(__DIR__) . '/includes/config.php';
require_once dirname(__DIR__) . '/database/Database.php';

require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/projects.php';
require_once __DIR__ . '/proposals.php';
require_once __DIR__ . '/workspace.php';
require_once __DIR__ . '/ai.php';
require_once __DIR__ . '/reviews.php';
require_once __DIR__ . '/notifications.php';
require_once __DIR__ . '/admin.php';

// Parse URI
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'];

// Strip base prefix if any (e.g. /SkillEx/api/... or /api/...)
$pos = strpos($uri, '/api');
if ($pos !== false) {
    $path = substr($uri, $pos + 4);
} else {
    $path = $uri;
}
$path = trim($path, '/');
$segments = $path === '' ? [] : explode('/', $path);

$module = $segments[0] ?? '';
$sub1 = $segments[1] ?? null;
$sub2 = $segments[2] ?? null;
$sub3 = $segments[3] ?? null;

// Health endpoint
if ($module === 'health') {
    jsonResponse([
        'status' => 'healthy',
        'timestamp' => date('c'),
        'campus' => 'DYPATU Campus',
        'version' => '1.0.0',
        'backend' => 'PHP ' . PHP_VERSION,
        'database' => Database::getInstance()->getDriver()
    ]);
}

// Reset database endpoint
if ($module === 'reset' && $method === 'POST') {
    Database::getInstance()->initSchemaAndSeed();
    jsonResponse(['success' => true, 'message' => 'Database reset to initial campus seed data.']);
}

// Module routing
switch ($module) {
    case 'auth':
        handleAuthRoutes($sub1 ?? '', $method);
        break;

    case 'projects':
        handleProjectsRoutes($sub1, $method);
        break;

    case 'proposals':
        handleProposalsRoutes($sub1, $sub2, $method);
        break;

    case 'workspace':
        if ($sub1 === null) {
            jsonResponse(['error' => 'Project ID required in workspace path'], 400);
        }
        handleWorkspaceRoutes($sub1, $sub2, $sub3, $segments[4] ?? null, $method);
        break;

    case 'ai':
        handleAiRoutes($sub1 ?? 'analyze', $method);
        break;

    case 'reviews':
        handleReviewsRoutes($sub1 ?? '', $method);
        break;

    case 'notifications':
        handleNotificationsRoutes($sub1 ?? '', $method);
        break;

    case 'admin':
        handleAdminRoutes($sub1 ?? 'overview', $sub2, $sub3, $method);
        break;

    default:
        jsonResponse([
            'error' => 'Not Found',
            'requested_path' => $path,
            'api_version' => '1.0.0'
        ], 404);
}
