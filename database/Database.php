<?php
// database/Database.php
// SkillEx Database Connection & Query Engine using PDO with Prepared Statements
// Supports MySQL (XAMPP default) with automatic fallback to SQLite for zero-config CLI dev

class Database {
    private static ?Database $instance = null;
    private PDO $pdo;
    private string $driver = 'mysql';

    private function __construct() {
        $this->connect();
    }

    public static function getInstance(): Database {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public static function getPDO(): PDO {
        return self::getInstance()->pdo;
    }

    public function getDriver(): string {
        return $this->driver;
    }

    private function connect(): void {
        $host = getenv('DB_HOST') ?: 'localhost';
        $port = getenv('DB_PORT') ?: '3306';
        $dbName = getenv('DB_NAME') ?: 'skillex';
        $user = getenv('DB_USER') ?: 'root';
        $pass = getenv('DB_PASS') !== false ? getenv('DB_PASS') : '';

        // 1. Try MySQL (standard XAMPP setup)
        try {
            $dsn = "mysql:host={$host};port={$port};charset=utf8mb4";
            $rootPdo = new PDO($dsn, $user, $pass, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_TIMEOUT => 2
            ]);

            // Ensure database exists
            $rootPdo->exec("CREATE DATABASE IF NOT EXISTS `{$dbName}` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;");
            $rootPdo->exec("USE `{$dbName}`;");

            $this->pdo = $rootPdo;
            $this->driver = 'mysql';

            // Check if tables exist, initialize if not
            $stmt = $this->pdo->query("SHOW TABLES LIKE 'users'");
            if (!$stmt->fetch()) {
                $this->initSchemaAndSeed();
            }
            return;
        } catch (Throwable $e) {
            // MySQL is not running or unreachable; fall back to SQLite for instant local execution
            $this->driver = 'sqlite';
        }

        // 2. Fallback to SQLite (Embedded zero-config database)
        $sqliteDir = __DIR__;
        if (!is_dir($sqliteDir)) {
            mkdir($sqliteDir, 0777, true);
        }
        $sqliteFile = $sqliteDir . '/skillex.sqlite';
        $isNew = !file_exists($sqliteFile);

        $this->pdo = new PDO("sqlite:{$sqliteFile}", null, null, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
        ]);

        if ($isNew) {
            $this->initSqliteSchemaAndSeed();
        }
    }

    public function initSchemaAndSeed(): void {
        $schemaFile = __DIR__ . '/schema.sql';
        $seedFile = __DIR__ . '/seed.sql';

        if (file_exists($schemaFile)) {
            $sql = file_get_contents($schemaFile);
            $this->pdo->exec($sql);
        }

        if (file_exists($seedFile)) {
            $sql = file_get_contents($seedFile);
            $this->pdo->exec($sql);
        }
    }

    private function initSqliteSchemaAndSeed(): void {
        // SQLite compatible tables
        $tables = [
            "CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                role TEXT NOT NULL DEFAULT 'student',
                department TEXT DEFAULT 'CSE',
                year TEXT DEFAULT '2nd year',
                college TEXT DEFAULT 'DYPATU',
                verified INTEGER NOT NULL DEFAULT 1,
                bio TEXT,
                available INTEGER NOT NULL DEFAULT 1,
                suspended INTEGER NOT NULL DEFAULT 0,
                flagged INTEGER NOT NULL DEFAULT 0,
                skills TEXT,
                portfolio TEXT,
                stats TEXT,
                reviews TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            );",
            "CREATE TABLE IF NOT EXISTS projects (
                id TEXT PRIMARY KEY,
                client_id TEXT NOT NULL,
                client_name TEXT NOT NULL,
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                category TEXT NOT NULL,
                budget INTEGER NOT NULL DEFAULT 3000,
                deadline TEXT NOT NULL DEFAULT 'TBD',
                deadline_date TEXT,
                complexity TEXT NOT NULL DEFAULT 'Medium',
                status TEXT NOT NULL DEFAULT 'Open',
                assigned_freelancer_id TEXT,
                assigned_freelancer_name TEXT,
                match_percent INTEGER NOT NULL DEFAULT 90,
                proposals_count INTEGER NOT NULL DEFAULT 0,
                skills TEXT,
                deliverables TEXT,
                milestones TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            );",
            "CREATE TABLE IF NOT EXISTS proposals (
                id TEXT PRIMARY KEY,
                project_id TEXT NOT NULL,
                freelancer_id TEXT NOT NULL,
                freelancer_name TEXT NOT NULL,
                department TEXT NOT NULL,
                match_percent INTEGER NOT NULL DEFAULT 85,
                rating REAL NOT NULL DEFAULT 4.8,
                on_time_rate INTEGER NOT NULL DEFAULT 95,
                skills TEXT,
                bid_amount INTEGER NOT NULL,
                delivery_days INTEGER NOT NULL DEFAULT 7,
                cover_letter TEXT NOT NULL,
                why_points TEXT,
                status TEXT NOT NULL DEFAULT 'Pending',
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            );",
            "CREATE TABLE IF NOT EXISTS workspaces (
                project_id TEXT PRIMARY KEY,
                client_id TEXT,
                client_name TEXT,
                freelancer_id TEXT,
                freelancer_name TEXT,
                progress_percent INTEGER NOT NULL DEFAULT 0,
                status TEXT NOT NULL DEFAULT 'In Progress',
                milestones TEXT,
                files TEXT,
                chat TEXT,
                timeline TEXT,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP
            );",
            "CREATE TABLE IF NOT EXISTS verification_queue (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                email TEXT NOT NULL,
                id_card TEXT DEFAULT 'Uploaded',
                dept TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'Pending',
                submitted_at TEXT DEFAULT CURRENT_TIMESTAMP
            );",
            "CREATE TABLE IF NOT EXISTS skill_demand_supply (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                skill TEXT NOT NULL,
                demand INTEGER NOT NULL DEFAULT 0,
                supply INTEGER NOT NULL DEFAULT 0,
                category TEXT DEFAULT 'General'
            );",
            "CREATE TABLE IF NOT EXISTS moderation_queue (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                reason TEXT NOT NULL,
                user TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'Pending'
            );",
            "CREATE TABLE IF NOT EXISTS disputes (
                id TEXT PRIMARY KEY,
                case_id TEXT,
                title TEXT NOT NULL,
                project TEXT NOT NULL,
                details TEXT,
                filed_by TEXT,
                status TEXT NOT NULL DEFAULT 'Open',
                severity TEXT NOT NULL DEFAULT 'Medium'
            );",
            "CREATE TABLE IF NOT EXISTS audit_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                time TEXT NOT NULL,
                admin TEXT NOT NULL,
                action TEXT NOT NULL,
                target TEXT NOT NULL,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            );",
            "CREATE TABLE IF NOT EXISTS fraud_alerts (
                id TEXT PRIMARY KEY,
                alert TEXT NOT NULL,
                user TEXT NOT NULL,
                level TEXT NOT NULL DEFAULT 'Medium'
            );",
            "CREATE TABLE IF NOT EXISTS notifications (
                id TEXT PRIMARY KEY,
                text TEXT NOT NULL,
                time TEXT NOT NULL DEFAULT 'Just now',
                unread INTEGER NOT NULL DEFAULT 1,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            );"
        ];

        foreach ($tables as $sql) {
            $this->pdo->exec($sql);
        }

        // Seed data using seed.sql
        $seedFile = __DIR__ . '/seed.sql';
        if (file_exists($seedFile)) {
            $lines = file($seedFile);
            $cleanLines = array_filter($lines, fn($l) => !str_starts_with(trim($l), 'USE '));
            $sql = implode('', $cleanLines);
            $this->pdo->exec($sql);
        }
    }

    // Helper: Execute prepared statement with parameters
    public function query(string $sql, array $params = []): PDOStatement {
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt;
    }

    public function fetch(string $sql, array $params = []): ?array {
        $stmt = $this->query($sql, $params);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public function fetchAll(string $sql, array $params = []): array {
        $stmt = $this->query($sql, $params);
        return $stmt->fetchAll();
    }

    public function execute(string $sql, array $params = []): bool {
        $stmt = $this->pdo->prepare($sql);
        return $stmt->execute($params);
    }
}
