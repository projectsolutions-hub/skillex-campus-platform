<?php
// api/auth.php
// Student & Admin Authentication Controller with PHP Sessions & Password Hashing

require_once dirname(__DIR__) . '/includes/config.php';
require_once dirname(__DIR__) . '/includes/auth.php';

function handleAuthRoutes(string $action, string $method): void {
    $db = Database::getInstance();

    // POST /api/auth/register
    if ($action === 'register' && $method === 'POST') {
        $body = getJsonInput();
        $name = trim($body['name'] ?? '');
        $email = strtolower(trim($body['email'] ?? ''));

        if (!$name || !$email) {
            jsonResponse(['error' => 'Name and email are required.'], 400);
        }

        if (!isCollegeEmail($email)) {
            jsonResponse([
                'error' => 'Only college domains (*.edu, *.edu.in, *.ac.in) are accepted. Personal emails (gmail, yahoo) are rejected.'
            ], 400);
        }

        $otp = '482913'; // Standard campus demo code
        if (!isset($_SESSION['pending_otps'])) {
            $_SESSION['pending_otps'] = [];
        }
        $_SESSION['pending_otps'][$email] = [
            'name' => $name,
            'otp' => $otp,
            'expires' => time() + 600
        ];

        jsonResponse([
            'success' => true,
            'message' => "Verification code sent to {$email}",
            'demoOtp' => $otp
        ]);
    }

    // POST /api/auth/verify-otp
    if ($action === 'verify-otp' && $method === 'POST') {
        $body = getJsonInput();
        $email = strtolower(trim($body['email'] ?? ''));
        $otp = trim($body['otp'] ?? '');

        if (!$email || !$otp) {
            jsonResponse(['error' => 'Email and OTP code are required.'], 400);
        }

        $pending = $_SESSION['pending_otps'][$email] ?? null;
        if ($otp === '482913' || ($pending && $pending['otp'] === $otp)) {
            if ($email === 'admin@dypatu.edu.in' || $email === 'admin.ritu@dypatu.edu.in') {
                $user = $db->fetch("SELECT * FROM users WHERE email = 'admin.ritu@dypatu.edu.in' OR email = 'admin@dypatu.edu.in' OR role = 'admin' LIMIT 1");
            } else {
                $user = $db->fetch("SELECT * FROM users WHERE email = ?", [$email]);
            }
            if (!$user) {
                $id = 'u_' . time();
                $name = $pending['name'] ?? explode('@', $email)[0];
                $hash = hashPassword('password123');
                $db->query("INSERT INTO users (id, name, email, password_hash, role, department, year, college, verified, bio, available, skills, portfolio, stats, reviews) VALUES (?, ?, ?, ?, 'student', 'CSE', '2nd year', 'DYPATU', 1, 'Passionate student collaborator.', 1, ?, '[]', ?, '[]')", [
                    $id, $name, $email, $hash,
                    json_encode(['React', 'Python', 'UI/UX']),
                    json_encode(['reputation' => 5.0, 'completedProjects' => 0, 'repeatClients' => 0, 'onTimeRate' => 100, 'earnedTerm' => 0])
                ]);
                $user = $db->fetch("SELECT * FROM users WHERE id = ?", [$id]);
            }

            unset($_SESSION['pending_otps'][$email]);
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['user_role'] = $user['role'];

            jsonResponse([
                'success' => true,
                'user' => formatUserRecord($user),
                'token' => 'jwt_mock_' . $user['id']
            ]);
        }

        jsonResponse(['error' => 'Invalid or expired OTP code. Try 482913.'], 400);
    }

    // POST /api/auth/login
    if ($action === 'login' && $method === 'POST') {
        $body = getJsonInput();
        $email = strtolower(trim($body['email'] ?? ''));
        $password = trim($body['password'] ?? '');
        $requiredRole = $body['requiredRole'] ?? null;

        if (!$email || !$password) {
            jsonResponse(['error' => 'Both email and password are required.'], 400);
        }

        if ($email === 'admin@dypatu.edu.in' || $email === 'admin.ritu@dypatu.edu.in') {
            $user = $db->fetch("SELECT * FROM users WHERE email = 'admin.ritu@dypatu.edu.in' OR email = 'admin@dypatu.edu.in' OR role = 'admin' LIMIT 1");
        } else {
            $user = $db->fetch("SELECT * FROM users WHERE email = ?", [$email]);
        }
        if (!$user) {
            jsonResponse(['error' => 'Account not found with this college email.'], 404);
        }

        if (!verifyPassword($password, $user['password_hash'])) {
            jsonResponse(['error' => 'Incorrect password. Please verify your credentials.'], 401);
        }

        if ($requiredRole && $user['role'] !== $requiredRole) {
            jsonResponse([
                'error' => $requiredRole === 'admin'
                    ? 'Access denied. This account does not have Campus Administration clearance.'
                    : 'Please use the Admin Portal login for faculty coordinator accounts.'
            ], 403);
        }

        $_SESSION['user_id'] = $user['id'];
        $_SESSION['user_role'] = $user['role'];

        jsonResponse([
            'success' => true,
            'user' => formatUserRecord($user),
            'token' => 'jwt_mock_' . $user['id']
        ]);
    }

    // GET /api/auth/me
    if ($action === 'me' && $method === 'GET') {
        $user = getCurrentUser();
        jsonResponse(['user' => $user]);
    }

    // PUT /api/auth/profile
    if ($action === 'profile' && ($method === 'PUT' || $method === 'POST')) {
        $body = getJsonInput();
        $currentUser = getCurrentUser();
        $userId = $body['userId'] ?? ($currentUser['id'] ?? 'u1');

        $updates = [];
        $params = [];
        if (isset($body['bio'])) { $updates[] = "bio = ?"; $params[] = $body['bio']; }
        if (isset($body['available'])) { $updates[] = "available = ?"; $params[] = !empty($body['available']) ? 1 : 0; }
        if (isset($body['skills'])) { $updates[] = "skills = ?"; $params[] = json_encode($body['skills']); }
        if (isset($body['department'])) { $updates[] = "department = ?"; $params[] = $body['department']; }

        if (!empty($updates)) {
            $params[] = $userId;
            $db->query("UPDATE users SET " . implode(', ', $updates) . " WHERE id = ?", $params);
        }

        $user = $db->fetch("SELECT * FROM users WHERE id = ?", [$userId]);
        jsonResponse([
            'success' => true,
            'user' => $user ? formatUserRecord($user) : null
        ]);
    }

    // POST /api/auth/forgot-password
    if ($action === 'forgot-password' && $method === 'POST') {
        $body = getJsonInput();
        $email = trim($body['email'] ?? '');
        if (!$email) {
            jsonResponse(['error' => 'Email is required.'], 400);
        }
        jsonResponse(['success' => true, 'message' => "Password reset link dispatched to {$email}"]);
    }

    // GET /api/auth/users
    if ($action === 'users' && $method === 'GET') {
        $users = $db->fetchAll("SELECT * FROM users");
        $formatted = array_map('formatUserRecord', $users);
        jsonResponse(['users' => $formatted]);
    }

    // POST /api/auth/logout
    if ($action === 'logout' && $method === 'POST') {
        session_destroy();
        jsonResponse(['success' => true, 'message' => 'Signed out successfully.']);
    }

    jsonResponse(['error' => 'Endpoint not found'], 404);
}
