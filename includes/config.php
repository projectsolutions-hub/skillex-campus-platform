<?php
// includes/config.php
// Global SkillEx configuration, sessions, and response helpers

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// CORS Headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Ensure Upload Directory exists
$uploadDir = dirname(__DIR__) . '/public/uploads';
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0777, true);
}

function jsonResponse(array $data, int $status = 200): void {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

function getJsonInput(): array {
    $raw = file_get_contents('php://input');
    if (empty($raw)) {
        return $_POST;
    }
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : $_POST;
}

function sanitizeString(?string $str): string {
    return htmlspecialchars(trim($str ?? ''), ENT_QUOTES, 'UTF-8');
}
