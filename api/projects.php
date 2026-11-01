<?php
// api/projects.php
// Project Marketplace Controller - List, Create, Update, Filter with Prepared Statements

require_once dirname(__DIR__) . '/includes/config.php';
require_once dirname(__DIR__) . '/includes/auth.php';

function formatProjectRecord(array $p): array {
    return [
        'id' => $p['id'],
        'clientId' => $p['client_id'],
        'clientName' => $p['client_name'],
        'title' => $p['title'],
        'description' => $p['description'],
        'category' => $p['category'],
        'budget' => (int)$p['budget'],
        'deadline' => $p['deadline'],
        'deadlineDate' => $p['deadline_date'],
        'complexity' => $p['complexity'],
        'status' => $p['status'],
        'assignedFreelancerId' => $p['assigned_freelancer_id'],
        'assignedFreelancerName' => $p['assigned_freelancer_name'],
        'matchPercent' => (int)$p['match_percent'],
        'proposalsCount' => (int)$p['proposals_count'],
        'skills' => is_string($p['skills']) ? json_decode($p['skills'], true) : ($p['skills'] ?? []),
        'deliverables' => is_string($p['deliverables']) ? json_decode($p['deliverables'], true) : ($p['deliverables'] ?? []),
        'milestones' => is_string($p['milestones']) ? json_decode($p['milestones'], true) : ($p['milestones'] ?? []),
        'createdAt' => $p['created_at']
    ];
}

function handleProjectsRoutes(?string $id, string $method): void {
    $db = Database::getInstance();

    // GET /api/projects - List with filters
    if ($id === null && $method === 'GET') {
        $q = trim($_GET['q'] ?? '');
        $cat = trim($_GET['cat'] ?? 'All');
        $maxBudget = !empty($_GET['maxBudget']) ? (int)$_GET['maxBudget'] : 0;
        $status = trim($_GET['status'] ?? '');

        $sql = "SELECT * FROM projects WHERE 1=1";
        $params = [];

        if ($cat && strtolower($cat) !== 'all') {
            $sql .= " AND LOWER(category) = LOWER(?)";
            $params[] = $cat;
        }

        if ($status) {
            $sql .= " AND LOWER(status) = LOWER(?)";
            $params[] = $status;
        }

        if ($maxBudget > 0) {
            $sql .= " AND budget <= ?";
            $params[] = $maxBudget;
        }

        if ($q !== '') {
            $sql .= " AND (LOWER(title) LIKE ? OR LOWER(description) LIKE ? OR LOWER(skills) LIKE ?)";
            $wildcard = '%' . strtolower($q) . '%';
            $params[] = $wildcard;
            $params[] = $wildcard;
            $params[] = $wildcard;
        }

        $sql .= " ORDER BY created_at DESC";
        $rows = $db->fetchAll($sql, $params);
        $projects = array_map('formatProjectRecord', $rows);

        jsonResponse(['projects' => $projects]);
    }

    // GET /api/projects/:id - Single project details
    if ($id !== null && $method === 'GET') {
        $project = $db->fetch("SELECT * FROM projects WHERE id = ?", [$id]);
        if (!$project) {
            jsonResponse(['error' => 'Project not found'], 404);
        }

        $formattedProject = formatProjectRecord($project);

        // Fetch proposals for this project
        $proposalsRows = $db->fetchAll("SELECT * FROM proposals WHERE project_id = ? ORDER BY created_at DESC", [$id]);
        $proposals = array_map(function($pr) {
            return [
                'id' => $pr['id'],
                'projectId' => $pr['project_id'],
                'freelancerId' => $pr['freelancer_id'],
                'freelancerName' => $pr['freelancer_name'],
                'department' => $pr['department'],
                'matchPercent' => (int)$pr['match_percent'],
                'rating' => (float)$pr['rating'],
                'onTimeRate' => (int)$pr['on_time_rate'],
                'skills' => is_string($pr['skills']) ? json_decode($pr['skills'], true) : ($pr['skills'] ?? []),
                'bidAmount' => (int)$pr['bid_amount'],
                'deliveryDays' => (int)$pr['delivery_days'],
                'coverLetter' => $pr['cover_letter'],
                'whyPoints' => is_string($pr['why_points']) ? json_decode($pr['why_points'], true) : ($pr['why_points'] ?? []),
                'status' => $pr['status'],
                'createdAt' => $pr['created_at']
            ];
        }, $proposalsRows);

        // Fetch client details
        $clientRow = $db->fetch("SELECT * FROM users WHERE id = ?", [$project['client_id']]);
        $client = $clientRow ? formatUserRecord($clientRow) : [
            'name' => $project['client_name'] ?? 'Campus Client',
            'department' => 'DYPATU',
            'stats' => ['completedProjects' => 9, 'reputation' => 4.8]
        ];

        jsonResponse([
            'project' => $formattedProject,
            'proposals' => $proposals,
            'client' => $client
        ]);
    }

    // POST /api/projects - Create project
    if ($id === null && $method === 'POST') {
        $body = getJsonInput();
        $title = trim($body['title'] ?? '');
        $description = trim($body['description'] ?? '');

        if (!$title || !$description) {
            jsonResponse(['error' => 'Title and description are required.'], 400);
        }

        $user = getCurrentUser();
        $clientId = $body['clientId'] ?? ($user['id'] ?? 'u1');
        $clientName = $body['clientName'] ?? ($user['name'] ?? 'Student');

        $skills = $body['skills'] ?? ['General'];
        if (is_string($skills)) {
            $skills = array_filter(array_map('trim', explode(',', $skills)));
        }

        $deliverables = $body['deliverables'] ?? ['Working output', 'Source files'];
        if (is_string($deliverables)) {
            $deliverables = array_filter(array_map('trim', explode(',', $deliverables)));
        }

        $milestones = $body['milestones'] ?? [];
        if (is_string($milestones)) {
            $parts = array_filter(array_map('trim', explode(',', $milestones)));
            $milestones = [];
            foreach ($parts as $idx => $mTitle) {
                $milestones[] = [
                    'id' => 'm' . ($idx + 1),
                    'title' => $mTitle,
                    'deadline' => $body['deadline'] ?? 'TBD',
                    'status' => 'Not started',
                    'deliverable' => 'Agreed milestone deliverable'
                ];
            }
        }
        if (empty($milestones)) {
            $milestones = [
                ['id' => 'm1', 'title' => 'Initial Milestone', 'deadline' => $body['deadline'] ?? 'TBD', 'status' => 'Not started', 'deliverable' => 'Agreed milestone deliverable']
            ];
        }

        $projectId = 'p_' . time();
        $budget = (int)($body['budget'] ?? 3000);
        $deadline = $body['deadline'] ?? 'Nov 30, 2026';
        $deadlineDate = $body['deadlineDate'] ?? date('Y-m-d', strtotime('+30 days'));
        $category = $body['category'] ?? 'Web Dev';
        $complexity = $body['complexity'] ?? 'Medium';

        $db->query("INSERT INTO projects (id, client_id, client_name, title, description, category, budget, deadline, deadline_date, complexity, status, match_percent, proposals_count, skills, deliverables, milestones) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Open', 92, 0, ?, ?, ?)", [
            $projectId, $clientId, $clientName, $title, $description, $category,
            $budget, $deadline, $deadlineDate, $complexity,
            json_encode($skills), json_encode($deliverables), json_encode($milestones)
        ]);

        // Add Notification & Audit Log
        $notifId = 'notif_' . time();
        $db->query("INSERT INTO notifications (id, text, time, unread) VALUES (?, ?, 'Just now', 1)", [
            $notifId, "New project posted: \"{$title}\""
        ]);
        $db->query("INSERT INTO audit_logs (time, admin, action, target) VALUES (?, ?, 'Published project', ?)", [
            date('h:i A'), 'student.' . $clientName, $title
        ]);

        $created = $db->fetch("SELECT * FROM projects WHERE id = ?", [$projectId]);
        jsonResponse([
            'success' => true,
            'project' => formatProjectRecord($created)
        ], 201);
    }

    // PUT /api/projects/:id - Update project
    if ($id !== null && ($method === 'PUT' || $method === 'POST')) {
        $body = getJsonInput();
        $fields = [];
        $params = [];

        foreach (['title', 'description', 'category', 'budget', 'deadline', 'complexity', 'status', 'assigned_freelancer_id', 'assigned_freelancer_name'] as $col) {
            $camel = lcfirst(str_replace(' ', '', ucwords(str_replace('_', ' ', $col))));
            if (isset($body[$camel]) || isset($body[$col])) {
                $val = $body[$camel] ?? $body[$col];
                $fields[] = "`{$col}` = ?";
                $params[] = $val;
            }
        }
        if (isset($body['skills'])) {
            $fields[] = "`skills` = ?";
            $params[] = json_encode($body['skills']);
        }
        if (isset($body['milestones'])) {
            $fields[] = "`milestones` = ?";
            $params[] = json_encode($body['milestones']);
        }

        if (!empty($fields)) {
            $params[] = $id;
            $db->query("UPDATE projects SET " . implode(', ', $fields) . " WHERE id = ?", $params);
        }

        $updated = $db->fetch("SELECT * FROM projects WHERE id = ?", [$id]);
        if (!$updated) {
            jsonResponse(['error' => 'Project not found'], 404);
        }

        jsonResponse([
            'success' => true,
            'project' => formatProjectRecord($updated)
        ]);
    }

    // DELETE /api/projects/:id
    if ($id !== null && $method === 'DELETE') {
        $db->query("DELETE FROM projects WHERE id = ?", [$id]);
        jsonResponse(['success' => true, 'message' => 'Project removed']);
    }

    jsonResponse(['error' => 'Method not allowed'], 405);
}
