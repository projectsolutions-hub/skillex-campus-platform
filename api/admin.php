<?php
// api/admin.php
// Faculty Administration Console Controller - KYC, Moderation, Analytics & Audit Trails

require_once dirname(__DIR__) . '/includes/config.php';
require_once dirname(__DIR__) . '/includes/auth.php';

function handleAdminRoutes(string $sub1, ?string $sub2, ?string $sub3, string $method): void {
    $db = Database::getInstance();

    // GET /api/admin/overview
    if ($sub1 === 'overview' && $method === 'GET') {
        $userCount = $db->fetch("SELECT COUNT(*) as c FROM users WHERE role = 'student'")['c'] ?? 0;
        $projectCount = $db->fetch("SELECT COUNT(*) as c FROM projects")['c'] ?? 0;
        $activeWorkspaces = $db->fetch("SELECT COUNT(*) as c FROM workspaces WHERE status = 'In Progress'")['c'] ?? 0;
        $disputeCount = $db->fetch("SELECT COUNT(*) as c FROM disputes WHERE status = 'Disputed'")['c'] ?? 0;
        $pendingKyc = $db->fetch("SELECT COUNT(*) as c FROM verification_queue WHERE status = 'Pending'")['c'] ?? 0;

        $stats = [
            'activeStudents' => $userCount,
            'totalProjects' => $projectCount,
            'activeWorkspaces' => $activeWorkspaces,
            'openDisputes' => $disputeCount,
            'pendingKyc' => $pendingKyc,
            'disputeRate' => '0.8%',
            'onTimeRate' => '94.2%',
            'campusSpend' => '₹4,86,000'
        ];

        $skillChart = [
            ['React', 48],
            ['Figma', 41],
            ['Python', 36],
            ['Video', 27],
            ['Flutter', 22]
        ];

        $trendLine = [
            'projects' => [20, 28, 35, 33, 48, 60, 72],
            'students' => [300, 420, 510, 560, 700, 880, 960]
        ];

        $fraudAlerts = $db->fetchAll("SELECT * FROM fraud_alerts");

        jsonResponse([
            'stats' => $stats,
            'skillChart' => $skillChart,
            'trendLine' => $trendLine,
            'fraudAlerts' => $fraudAlerts
        ]);
    }

    // GET /api/admin/verification-queue
    if ($sub1 === 'verification-queue' && $method === 'GET') {
        $queue = $db->fetchAll("SELECT * FROM verification_queue ORDER BY submitted_at DESC");
        jsonResponse(['queue' => $queue]);
    }

    // POST /api/admin/verify/:id/approve
    if ($sub1 === 'verify' && $sub2 !== null && $sub3 === 'approve' && $method === 'POST') {
        $db->query("UPDATE verification_queue SET status = 'Approved' WHERE id = ?", [$sub2]);
        $item = $db->fetch("SELECT * FROM verification_queue WHERE id = ?", [$sub2]);
        if (!$item) jsonResponse(['error' => 'Item not found'], 404);

        $db->query("INSERT INTO audit_logs (time, admin, action, target) VALUES (?, 'admin.ritu', 'Approved verification', ?)", [
            date('h:i A'), $item['name']
        ]);

        jsonResponse(['success' => true, 'item' => $item]);
    }

    // POST /api/admin/verify/:id/reject
    if ($sub1 === 'verify' && $sub2 !== null && $sub3 === 'reject' && $method === 'POST') {
        $db->query("UPDATE verification_queue SET status = 'Rejected' WHERE id = ?", [$sub2]);
        $item = $db->fetch("SELECT * FROM verification_queue WHERE id = ?", [$sub2]);
        if (!$item) jsonResponse(['error' => 'Item not found'], 404);

        $db->query("INSERT INTO audit_logs (time, admin, action, target) VALUES (?, 'admin.ritu', 'Rejected verification', ?)", [
            date('h:i A'), $item['name']
        ]);

        jsonResponse(['success' => true, 'item' => $item]);
    }

    // GET /api/admin/skills-analysis
    if ($sub1 === 'skills-analysis' && $method === 'GET') {
        $skills = $db->fetchAll("SELECT * FROM skill_demand_supply");
        jsonResponse(['skills' => $skills]);
    }

    // GET /api/admin/users
    if ($sub1 === 'users' && $sub2 === null && $method === 'GET') {
        $q = strtolower(trim($_GET['q'] ?? ''));
        $users = $db->fetchAll("SELECT * FROM users");
        $formatted = array_map(function($u) {
            $stats = is_string($u['stats']) ? json_decode($u['stats'], true) : ($u['stats'] ?? []);
            return [
                'id' => $u['id'],
                'name' => $u['name'],
                'email' => $u['email'],
                'department' => $u['department'] ?? 'CSE',
                'projectsCount' => $stats['completedProjects'] ?? 0,
                'status' => !empty($u['suspended']) ? 'Suspended' : (!empty($u['flagged']) ? 'Flagged' : 'Active')
            ];
        }, $users);

        if ($q !== '') {
            $formatted = array_filter($formatted, function($u) use ($q) {
                return str_contains(strtolower($u['name']), $q) || str_contains(strtolower($u['department']), $q) || str_contains(strtolower($u['email']), $q);
            });
            $formatted = array_values($formatted);
        }

        jsonResponse(['users' => $formatted]);
    }

    // POST /api/admin/users/:id/toggle-status
    if ($sub1 === 'users' && $sub2 !== null && $sub3 === 'toggle-status' && $method === 'POST') {
        $user = $db->fetch("SELECT * FROM users WHERE id = ?", [$sub2]);
        if (!$user) jsonResponse(['error' => 'User not found'], 404);

        $newSuspended = empty($user['suspended']) ? 1 : 0;
        $db->query("UPDATE users SET suspended = ? WHERE id = ?", [$newSuspended, $sub2]);

        $statusStr = $newSuspended ? 'Suspended' : 'Active';
        $db->query("INSERT INTO audit_logs (time, admin, action, target) VALUES (?, 'admin.ritu', ?, ?)", [
            date('h:i A'), ($newSuspended ? 'Suspended' : 'Reinstated') . ' user', $user['name']
        ]);

        $updated = $db->fetch("SELECT * FROM users WHERE id = ?", [$sub2]);
        jsonResponse([
            'success' => true,
            'status' => $statusStr,
            'user' => formatUserRecord($updated)
        ]);
    }

    // GET /api/admin/moderation
    if ($sub1 === 'moderation' && $sub2 === null && $method === 'GET') {
        $queue = $db->fetchAll("SELECT * FROM moderation_queue");
        jsonResponse(['queue' => $queue]);
    }

    // POST /api/admin/moderation/:id/action
    if ($sub1 === 'moderation' && $sub2 !== null && $sub3 === 'action' && $method === 'POST') {
        $body = getJsonInput();
        $action = $body['action'] ?? 'dismiss'; // 'remove', 'warn', 'dismiss'
        $newStatus = match($action) {
            'remove' => 'Removed',
            'warn' => 'Warned',
            default => 'Dismissed'
        };

        $db->query("UPDATE moderation_queue SET status = ? WHERE id = ?", [$newStatus, $sub2]);
        $item = $db->fetch("SELECT * FROM moderation_queue WHERE id = ?", [$sub2]);
        if (!$item) jsonResponse(['error' => 'Item not found'], 404);

        $db->query("INSERT INTO audit_logs (time, admin, action, target) VALUES (?, 'admin.ritu', ?, ?)", [
            date('h:i A'), "Moderation: {$newStatus}", $item['title']
        ]);

        jsonResponse(['success' => true, 'item' => $item]);
    }

    // GET /api/admin/disputes
    if ($sub1 === 'disputes' && $method === 'GET') {
        $disputes = $db->fetchAll("SELECT * FROM disputes");
        jsonResponse(['disputes' => $disputes]);
    }

    // GET /api/admin/audit-logs
    if ($sub1 === 'audit-logs' && $method === 'GET') {
        $logs = $db->fetchAll("SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 50");
        jsonResponse(['logs' => $logs]);
    }

    jsonResponse(['error' => 'Endpoint not found'], 404);
}
