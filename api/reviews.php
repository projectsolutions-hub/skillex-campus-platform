<?php
// api/reviews.php
// Peer Reputation Review Submission & Rating Engine

require_once dirname(__DIR__) . '/includes/config.php';
require_once dirname(__DIR__) . '/includes/auth.php';

function handleReviewsRoutes(string $action, string $method): void {
    $db = Database::getInstance();

    if ($method === 'POST') {
        $body = getJsonInput();
        $targetUserId = $body['targetUserId'] ?? 'u2';
        $targetUserName = $body['targetUserName'] ?? 'Aditi Kamble';
        $reviewerName = $body['reviewerName'] ?? 'Student Reviewer';
        $quality = (int)($body['quality'] ?? 5);
        $communication = (int)($body['communication'] ?? 5);
        $timeliness = (int)($body['timeliness'] ?? 5);
        $adherence = (int)($body['adherence'] ?? 5);
        $comment = trim($body['comment'] ?? 'Delivered with exceptional quality, diligence, and communication.');

        $targetUser = $db->fetch("SELECT * FROM users WHERE id = ?", [$targetUserId]);
        if ($targetUser) {
            $reviews = is_string($targetUser['reviews']) ? json_decode($targetUser['reviews'], true) : ($targetUser['reviews'] ?? []);
            $stats = is_string($targetUser['stats']) ? json_decode($targetUser['stats'], true) : ($targetUser['stats'] ?? []);

            $avgScore = round(($quality + $communication + $timeliness + $adherence) / 4, 1);

            array_unshift($reviews, [
                'id' => 'rev_' . time(),
                'reviewer' => $reviewerName,
                'comment' => $comment,
                'rating' => $avgScore,
                'date' => 'Just now'
            ]);

            $currentRep = $stats['reputation'] ?? 4.8;
            $newRep = round(($currentRep * 0.8) + ($avgScore * 0.2), 1);
            $completed = ($stats['completedProjects'] ?? 1) + 1;

            $stats['reputation'] = $newRep;
            $stats['completedProjects'] = $completed;

            $db->query("UPDATE users SET reviews = ?, stats = ? WHERE id = ?", [
                json_encode($reviews), json_encode($stats), $targetUserId
            ]);
        }

        $db->query("INSERT INTO notifications (id, text, time, unread) VALUES (?, ?, 'Just now', 1)", [
            'notif_' . time(), "New ★5 review received from {$reviewerName}"
        ]);
        $db->query("INSERT INTO audit_logs (time, admin, action, target) VALUES (?, ?, 'Submitted review', ?)", [
            date('h:i A'), 'student.' . $reviewerName, "For {$targetUserName} on project"
        ]);

        jsonResponse([
            'success' => true,
            'message' => 'Review successfully recorded.'
        ]);
    }

    jsonResponse(['error' => 'Method not allowed'], 405);
}
