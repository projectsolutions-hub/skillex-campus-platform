<?php
// api/proposals.php
// Project Proposals & Freelancer Hiring Controller

require_once dirname(__DIR__) . '/includes/config.php';
require_once dirname(__DIR__) . '/includes/auth.php';

function formatProposalRecord(array $pr): array {
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
}

function handleProposalsRoutes(?string $id, ?string $subAction, string $method): void {
    $db = Database::getInstance();

    // GET /api/proposals
    if ($id === null && $method === 'GET') {
        $freelancerId = $_GET['freelancerId'] ?? null;
        $projectId = $_GET['projectId'] ?? null;

        if ($freelancerId) {
            $rows = $db->fetchAll("SELECT * FROM proposals WHERE freelancer_id = ? ORDER BY created_at DESC", [$freelancerId]);
        } elseif ($projectId) {
            $rows = $db->fetchAll("SELECT * FROM proposals WHERE project_id = ? ORDER BY created_at DESC", [$projectId]);
        } else {
            $rows = $db->fetchAll("SELECT * FROM proposals ORDER BY created_at DESC");
        }

        $proposals = array_map('formatProposalRecord', $rows);
        jsonResponse(['proposals' => $proposals]);
    }

    // POST /api/proposals - Submit a proposal
    if ($id === null && $method === 'POST') {
        $body = getJsonInput();
        $projectId = $body['projectId'] ?? '';
        $freelancerId = $body['freelancerId'] ?? '';

        if (!$projectId || !$freelancerId) {
            jsonResponse(['error' => 'Project ID and Freelancer ID are required.'], 400);
        }

        $project = $db->fetch("SELECT * FROM projects WHERE id = ?", [$projectId]);
        if (!$project) {
            jsonResponse(['error' => 'Project not found.'], 404);
        }

        $freelancer = $db->fetch("SELECT * FROM users WHERE id = ?", [$freelancerId]);
        $freelancerName = $freelancer['name'] ?? 'Student Freelancer';
        $department = $freelancer['department'] ?? 'CSE, 2nd year';
        $stats = $freelancer && is_string($freelancer['stats']) ? json_decode($freelancer['stats'], true) : ($freelancer['stats'] ?? []);
        $skills = $freelancer && is_string($freelancer['skills']) ? json_decode($freelancer['skills'], true) : ($freelancer['skills'] ?? ['React']);

        $proposalId = 'prop_' . time();
        $bidAmount = (int)($body['bidAmount'] ?? $project['budget']);
        $deliveryDays = (int)($body['deliveryDays'] ?? 10);
        $coverLetter = trim($body['coverLetter'] ?? 'I have relevant hands-on skills and can complete this milestone on time.');
        $rating = $stats['reputation'] ?? 4.8;
        $onTime = $stats['onTimeRate'] ?? 95;
        $match = rand(82, 98);

        $whyPoints = [
            count($skills) . " verified skills demonstrated",
            "{$onTime}% on-time campus delivery record",
            "Available for regular lab sync"
        ];

        $db->query("INSERT INTO proposals (id, project_id, freelancer_id, freelancer_name, department, match_percent, rating, on_time_rate, skills, bid_amount, delivery_days, cover_letter, why_points, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending')", [
            $proposalId, $projectId, $freelancerId, $freelancerName, $department,
            $match, $rating, $onTime, json_encode($skills), $bidAmount, $deliveryDays,
            $coverLetter, json_encode($whyPoints)
        ]);

        // Increment project proposal count
        $db->query("UPDATE projects SET proposals_count = proposals_count + 1 WHERE id = ?", [$projectId]);

        // Add Notification
        $db->query("INSERT INTO notifications (id, text, time, unread) VALUES (?, ?, 'Just now', 1)", [
            'notif_' . time(), "New proposal received from {$freelancerName} on \"{$project['title']}\""
        ]);

        $created = $db->fetch("SELECT * FROM proposals WHERE id = ?", [$proposalId]);
        jsonResponse([
            'success' => true,
            'proposal' => formatProposalRecord($created)
        ], 201);
    }

    // POST /api/proposals/:id/shortlist
    if ($id !== null && $subAction === 'shortlist' && $method === 'POST') {
        $db->query("UPDATE proposals SET status = 'Shortlisted' WHERE id = ?", [$id]);
        $updated = $db->fetch("SELECT * FROM proposals WHERE id = ?", [$id]);
        if (!$updated) jsonResponse(['error' => 'Proposal not found'], 404);
        jsonResponse(['success' => true, 'proposal' => formatProposalRecord($updated)]);
    }

    // POST /api/proposals/:id/reject
    if ($id !== null && $subAction === 'reject' && $method === 'POST') {
        $db->query("UPDATE proposals SET status = 'Rejected' WHERE id = ?", [$id]);
        $updated = $db->fetch("SELECT * FROM proposals WHERE id = ?", [$id]);
        if (!$updated) jsonResponse(['error' => 'Proposal not found'], 404);
        jsonResponse(['success' => true, 'proposal' => formatProposalRecord($updated)]);
    }

    // POST /api/proposals/:id/select - Assign freelancer, update project and workspace
    if ($id !== null && $subAction === 'select' && $method === 'POST') {
        $db->query("UPDATE proposals SET status = 'Selected' WHERE id = ?", [$id]);
        $proposal = $db->fetch("SELECT * FROM proposals WHERE id = ?", [$id]);
        if (!$proposal) jsonResponse(['error' => 'Proposal not found'], 404);

        $projectId = $proposal['project_id'];
        $project = $db->fetch("SELECT * FROM projects WHERE id = ?", [$projectId]);

        if ($project) {
            $db->query("UPDATE projects SET status = 'In Progress', assigned_freelancer_id = ?, assigned_freelancer_name = ? WHERE id = ?", [
                $proposal['freelancer_id'], $proposal['freelancer_name'], $projectId
            ]);

            // Ensure workspace row exists
            $ws = $db->fetch("SELECT * FROM workspaces WHERE project_id = ?", [$projectId]);
            if (!$ws) {
                $timeline = [
                    [
                        'title' => "{$proposal['freelancer_name']} selected as freelancer",
                        'date' => date('M d'),
                        'desc' => 'Agreement signed, private milestone workspace opened.'
                    ],
                    [
                        'title' => 'Project published',
                        'date' => date('M d', strtotime($project['created_at'])),
                        'desc' => 'Project requirements broadcasted to campus network.'
                    ]
                ];
                $db->query("INSERT INTO workspaces (project_id, client_id, client_name, freelancer_id, freelancer_name, progress_percent, status, milestones, files, chat, timeline) VALUES (?, ?, ?, ?, ?, 0, 'In Progress', ?, '[]', '[]', ?)", [
                    $projectId, $project['client_id'], $project['client_name'],
                    $proposal['freelancer_id'], $proposal['freelancer_name'],
                    $project['milestones'], json_encode($timeline)
                ]);
            } else {
                $db->query("UPDATE workspaces SET freelancer_id = ?, freelancer_name = ?, status = 'In Progress' WHERE project_id = ?", [
                    $proposal['freelancer_id'], $proposal['freelancer_name'], $projectId
                ]);
            }
        }

        // Notification
        $db->query("INSERT INTO notifications (id, text, time, unread) VALUES (?, ?, 'Just now', 1)", [
            'notif_' . time(), "Proposal accepted! Workspace activated with {$proposal['freelancer_name']}."
        ]);

        jsonResponse([
            'success' => true,
            'proposal' => formatProposalRecord($proposal)
        ]);
    }

    jsonResponse(['error' => 'Endpoint not found'], 404);
}
