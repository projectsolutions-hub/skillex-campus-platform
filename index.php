<?php
// index.php
// SkillEx Root Entry Point for Apache / XAMPP / PHP environments

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// 1. API routes -> api/index.php
if (str_starts_with($uri, '/api')) {
    require __DIR__ . '/api/index.php';
    exit;
}

// 2. Static files inside public/
$publicFile = __DIR__ . '/public' . $uri;
if ($uri !== '/' && $uri !== '' && file_exists($publicFile) && !is_dir($publicFile)) {
    $ext = pathinfo($publicFile, PATHINFO_EXTENSION);
    $mimes = [
        'css' => 'text/css; charset=utf-8',
        'js' => 'application/javascript; charset=utf-8',
        'json' => 'application/json; charset=utf-8',
        'png' => 'image/png',
        'jpg' => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'svg' => 'image/svg+xml',
        'gif' => 'image/gif',
        'woff' => 'font/woff',
        'woff2' => 'font/woff2',
        'ttf' => 'font/ttf',
        'zip' => 'application/zip',
        'pdf' => 'application/pdf',
        'ico' => 'image/x-icon'
    ];
    if (isset($mimes[$ext])) {
        header("Content-Type: {$mimes[$ext]}");
    }
    readfile($publicFile);
    exit;
}

// 3. Fallback to SPA Frontend
header("Content-Type: text/html; charset=utf-8");
header("Cache-Control: no-cache, no-store, must-revalidate");
readfile(__DIR__ . '/public/index.html');
exit;
