<?php
// api/notifications.php
// Student & Campus Activity Notifications Controller

require_once dirname(__DIR__) . '/includes/config.php';

function handleNotificationsRoutes(string $action, string $method): void {
    $db = Database::getInstance();

    // GET /api/notifications
    if ($action === '' && $method === 'GET') {
        $rows = $db->fetchAll("SELECT * FROM notifications ORDER BY created_at DESC LIMIT 20");
        $notifications = array_map(function($n) {
            return [
                'id' => $n['id'],
                'text' => $n['text'],
                'time' => $n['time'],
                'unread' => (bool)$n['unread']
            ];
        }, $rows);

        jsonResponse(['notifications' => $notifications]);
    }

    // POST /api/notifications/mark-read
    if ($action === 'mark-read' && $method === 'POST') {
        $db->query("UPDATE notifications SET unread = 0");
        $rows = $db->fetchAll("SELECT * FROM notifications ORDER BY created_at DESC LIMIT 20");
        $notifications = array_map(function($n) {
            return [
                'id' => $n['id'],
                'text' => $n['text'],
                'time' => $n['time'],
                'unread' => false
            ];
        }, $rows);

        jsonResponse(['success' => true, 'notifications' => $notifications]);
    }

    jsonResponse(['error' => 'Endpoint not found'], 404);
}
