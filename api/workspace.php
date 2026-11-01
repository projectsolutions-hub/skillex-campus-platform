<?php
// api/workspace.php
// Project Collaboration Workspace, Deliverables, Chat, & Milestone Workflow Controller

require_once dirname(__DIR__) . '/includes/config.php';
require_once dirname(__DIR__) . '/includes/auth.php';

function formatWorkspaceRecord(array $ws, array $project): array {
    $milestones = is_string($project['milestones']) ? json_decode($project['milestones'], true) : ($project['milestones'] ?? []);
    if (empty($milestones) && !empty($ws['milestones'])) {
        $milestones = is_string($ws['milestones']) ? json_decode($ws['milestones'], true) : $ws['milestones'];
    }

    return [
        'projectId' => $ws['project_id'],
        'clientId' => $ws['client_id'] ?? $project['client_id'],
        'clientName' => $ws['client_name'] ?? $project['client_name'],
        'freelancerId' => $ws['freelancer_id'] ?? $project['assigned_freelancer_id'],
        'freelancerName' => $ws['freelancer_name'] ?? $project['assigned_freelancer_name'],
        'progressPercent' => (int)$ws['progress_percent'],
        'status' => $ws['status'] ?? 'In Progress',
        'milestones' => $milestones,
        'files' => is_string($ws['files']) ? json_decode($ws['files'], true) : ($ws['files'] ?? []),
        'chat' => is_string($ws['chat']) ? json_decode($ws['chat'], true) : ($ws['chat'] ?? []),
        'timeline' => is_string($ws['timeline']) ? json_decode($ws['timeline'], true) : ($ws['timeline'] ?? [])
    ];
}

function handleWorkspaceRoutes(string $projectId, ?string $sub1, ?string $sub2, ?string $sub3, string $method): void {
    $db = Database::getInstance();

    $project = $db->fetch("SELECT * FROM projects WHERE id = ?", [$projectId]);
    if (!$project) {
        jsonResponse(['error' => 'Project not found.'], 404);
    }

    $ws = $db->fetch("SELECT * FROM workspaces WHERE project_id = ?", [$projectId]);
    if (!$ws) {
        // Initialize workspace if not yet created
        $db->query("INSERT INTO workspaces (project_id, client_id, client_name, freelancer_id, freelancer_name, progress_percent, status, milestones, files, chat, timeline) VALUES (?, ?, ?, ?, ?, 35, 'In Progress', ?, '[]', '[]', '[]')", [
            $projectId, $project['client_id'], $project['client_name'],
            $project['assigned_freelancer_id'] ?? 'u2', $project['assigned_freelancer_name'] ?? 'Aditi Kamble',
            $project['milestones']
        ]);
        $ws = $db->fetch("SELECT * FROM workspaces WHERE project_id = ?", [$projectId]);
    }

    // GET /api/workspace/:projectId
    if ($sub1 === null && $method === 'GET') {
        $formattedProject = formatProjectRecord($project);
        $formattedWs = formatWorkspaceRecord($ws, $project);
        jsonResponse([
            'project' => $formattedProject,
            'workspace' => $formattedWs
        ]);
    }

    // Milestone actions: /api/workspace/:projectId/milestones/:milestoneId/(approve|revision|submit)
    if ($sub1 === 'milestones' && $sub2 !== null && $sub3 !== null && $method === 'POST') {
        $milestoneId = $sub2;
        $action = $sub3;
        $body = getJsonInput();

        $milestones = is_string($project['milestones']) ? json_decode($project['milestones'], true) : ($project['milestones'] ?? []);
        $found = false;
        foreach ($milestones as &$m) {
            if ($m['id'] === $milestoneId) {
                $found = true;
                if ($action === 'approve') {
                    $m['status'] = 'Approved';
                } elseif ($action === 'revision') {
                    $m['status'] = 'Revision Requested';
                    $m['revisionReason'] = $body['reason'] ?? 'Changes requested by client';
                } elseif ($action === 'submit') {
                    $m['status'] = 'Submitted';
                    if (!empty($body['deliverableNote'])) {
                        $m['deliverable'] = $body['deliverableNote'];
                    }
                }
                break;
            }
        }
        unset($m);

        if (!$found) {
            jsonResponse(['error' => 'Milestone not found.'], 404);
        }

        // Calculate progress percentage
        $total = count($milestones);
        $approvedCount = count(array_filter($milestones, fn($x) => ($x['status'] ?? '') === 'Approved'));
        $progress = $total > 0 ? (int)round(($approvedCount / $total) * 100) : 0;

        // Update Project milestones
        $db->query("UPDATE projects SET milestones = ? WHERE id = ?", [json_encode($milestones), $projectId]);

        // Add timeline event
        $timeline = is_string($ws['timeline']) ? json_decode($ws['timeline'], true) : ($ws['timeline'] ?? []);
        $eventTitle = match($action) {
            'approve' => "Milestone approved",
            'revision' => "Revision requested",
            'submit' => "Milestone submitted",
            default => "Milestone updated"
        };
        array_unshift($timeline, [
            'title' => $eventTitle,
            'date' => date('M d'),
            'desc' => $body['reason'] ?? ($body['deliverableNote'] ?? 'Updated on workspace')
        ]);

        $db->query("UPDATE workspaces SET progress_percent = ?, milestones = ?, timeline = ? WHERE project_id = ?", [
            $progress, json_encode($milestones), json_encode($timeline), $projectId
        ]);

        // Add Notification
        $db->query("INSERT INTO notifications (id, text, time, unread) VALUES (?, ?, 'Just now', 1)", [
            'notif_' . time(), "Milestone {$milestoneId} was updated ({$action}) on \"{$project['title']}\""
        ]);

        $updatedProject = $db->fetch("SELECT * FROM projects WHERE id = ?", [$projectId]);
        $updatedWs = $db->fetch("SELECT * FROM workspaces WHERE project_id = ?", [$projectId]);

        jsonResponse([
            'success' => true,
            'project' => formatProjectRecord($updatedProject),
            'workspace' => formatWorkspaceRecord($updatedWs, $updatedProject)
        ]);
    }

    // Chat: /api/workspace/:projectId/chat
    if ($sub1 === 'chat') {
        if ($method === 'GET') {
            $chat = is_string($ws['chat']) ? json_decode($ws['chat'], true) : ($ws['chat'] ?? []);
            jsonResponse(['chat' => $chat]);
        }
        if ($method === 'POST') {
            $body = getJsonInput();
            $text = trim($body['text'] ?? '');
            if (!$text) {
                jsonResponse(['error' => 'Message text cannot be empty.'], 400);
            }

            $senderName = $body['senderName'] ?? 'You';
            $senderId = $body['senderId'] ?? 'u1';
            $isMe = isset($body['isMe']) ? (bool)$body['isMe'] : true;

            $message = [
                'id' => 'c_' . time(),
                'senderId' => $senderId,
                'senderName' => $senderName,
                'text' => $text,
                'timestamp' => date('h:i A'),
                'date' => date('M d'),
                'isMe' => $isMe
            ];

            $chat = is_string($ws['chat']) ? json_decode($ws['chat'], true) : ($ws['chat'] ?? []);
            $chat[] = $message;

            $db->query("UPDATE workspaces SET chat = ? WHERE project_id = ?", [json_encode($chat), $projectId]);

            jsonResponse(['success' => true, 'message' => $message]);
        }
    }

    // Files: /api/workspace/:projectId/files
    if ($sub1 === 'files' && $method === 'POST') {
        $uploader = $_POST['uploader'] ?? 'Student';
        $filesList = is_string($ws['files']) ? json_decode($ws['files'], true) : ($ws['files'] ?? []);

        // Handle multipart upload
        if (isset($_FILES['file']) && $_FILES['file']['error'] === UPLOAD_ERR_OK) {
            $origName = basename($_FILES['file']['name']);
            $fileSize = $_FILES['file']['size'];
            $ext = strtolower(pathinfo($origName, PATHINFO_EXTENSION));

            $blockedExts = ['php', 'phtml', 'php3', 'php4', 'php5', 'php7', 'phps', 'phar', 'exe', 'bat', 'cmd', 'sh', 'cgi', 'pl', 'pyc', 'vbs', 'scr', 'msi', 'com'];
            if (in_array($ext, $blockedExts)) {
                jsonResponse(['error' => 'Executable files are prohibited for campus security.'], 400);
            }

            if ($fileSize > 15 * 1024 * 1024) {
                jsonResponse(['error' => 'File size exceeds 15MB campus workspace limit.'], 400);
            }

            $formattedSize = $fileSize > (1024 * 1024)
                ? round($fileSize / (1024 * 1024), 1) . ' MB'
                : round($fileSize / 1024) . ' KB';

            $safeFileName = time() . '_' . preg_replace('/[^a-zA-Z0-9._-]/', '_', $origName);
            $uploadTarget = dirname(__DIR__) . '/public/uploads/' . $safeFileName;
            move_uploaded_file($_FILES['file']['tmp_name'], $uploadTarget);

            $newFile = [
                'id' => 'f_' . time(),
                'name' => $origName,
                'uploader' => $uploader,
                'date' => date('M d'),
                'size' => $formattedSize,
                'isPrivate' => true,
                'url' => '/uploads/' . $safeFileName
            ];
            $filesList[] = $newFile;
            $db->query("UPDATE workspaces SET files = ? WHERE project_id = ?", [json_encode($filesList), $projectId]);

            jsonResponse(['success' => true, 'file' => $newFile]);
        }

        // Accept JSON / Mock file payload
        $body = getJsonInput();
        if (!empty($body['fileName'])) {
            $newFile = [
                'id' => 'f_' . time(),
                'name' => $body['fileName'],
                'uploader' => $uploader,
                'date' => date('M d'),
                'size' => $body['fileSize'] ?? '2.4 MB',
                'isPrivate' => true,
                'url' => '#'
            ];
            $filesList[] = $newFile;
            $db->query("UPDATE workspaces SET files = ? WHERE project_id = ?", [json_encode($filesList), $projectId]);

            jsonResponse(['success' => true, 'file' => $newFile]);
        }

        jsonResponse(['error' => 'No file was uploaded.'], 400);
    }

    // Dispute: /api/workspace/:projectId/dispute
    if ($sub1 === 'dispute' && $method === 'POST') {
        $body = getJsonInput();
        $reason = $body['reason'] ?? 'Contract dispute';
        $details = $body['details'] ?? 'Flagged for moderation review by participant.';
        $filedBy = $body['filedBy'] ?? 'Student participant';

        $disputeId = 'd_' . time();
        $caseId = '#R-' . rand(100, 999);
        $db->query("INSERT INTO disputes (id, case_id, title, project, details, filed_by, status, severity) VALUES (?, ?, ?, ?, ?, ?, 'Disputed', 'Medium')", [
            $disputeId, $caseId, $reason, $project['title'], $details, $filedBy
        ]);

        $db->query("INSERT INTO notifications (id, text, time, unread) VALUES (?, ?, 'Just now', 1)", [
            'notif_' . time(), "Report filed for \"{$project['title']}\". Campus Admin team notified."
        ]);

        jsonResponse([
            'success' => true,
            'dispute' => [
                'id' => $disputeId,
                'caseId' => $caseId,
                'title' => $reason,
                'project' => $project['title'],
                'details' => $details,
                'filedBy' => $filedBy,
                'status' => 'Disputed'
            ]
        ]);
    }

    jsonResponse(['error' => 'Endpoint not found'], 404);
}
