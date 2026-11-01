# 🎓 SkillEx — Campus Freelancing & Peer Collaboration Platform

[![Live Demo](https://img.shields.io/badge/Live%20Demo-skillex--dypatu.kesug.com-6366f1?style=for-the-badge&logo=google-chrome&logoColor=white)](https://skillex-dypatu.kesug.com)
[![PHP](https://img.shields.io/badge/PHP-8.2+-777BB4?style=for-the-badge&logo=php&logoColor=white)](https://www.php.net/)
[![MySQL](https://img.shields.io/badge/MySQL-InnoDB-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

> **Your Campus. Your Skills. Your Opportunities.**  
> *Closed Campus Network · Verified College Students Only · DYPATU Campus Edition*

SkillEx is a full-stack campus freelancing and peer collaboration platform designed specifically for college ecosystems. It enables verified students to hire talented batchmates, earn from hands-on skills, collaborate in private milestone workspaces, submit work, and build verifiable proof of work backed by peer reviews.

---

## 🛠️ Selected Technology Stack Overview

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | **HTML5, Tailwind CSS, JavaScript** | Build a responsive interface with reusable styling, interactive elements, and light/dark mode. |
| **Backend** | **PHP (v8.2+)** | Handle authentication, project workflows, form processing, and server-side business logic. |
| **Database** | **MySQL (InnoDB / UTF8mb4)** | Store student accounts, profiles, skills, project listings, applications, submissions, and reviews. |
| **Local Environment** | **XAMPP (Apache + PHP + MySQL)** | Run and test the full application locally during development with zero friction. |
| **Icons** | **Lucide Icons** | Provide a consistent, clean, and modern icon set across navigation, dashboards, and action buttons. |
| **Authentication** | **PHP Sessions + Secure Password Hashing** | Maintain sign-in state via `$_SESSION` and store credentials safely using `password_hash()` (Bcrypt). |

---

## 🧩 Core Application Modules

1. **Student Accounts**:
   - Registration with institutional college domain check (`@dypatu.edu.in`, `*.edu`, `*.edu.in`, `*.ac.in`).
   - Secure login using `password_verify()`.
   - Student profiles with skills inventory, reputation scores, and work showcase.

2. **Project Marketplace**:
   - Post, browse, search, and filter project listings.
   - Skill tags, budgets, deadlines, and complexity ratings.
   - Proposal submission with bid amounts and delivery timeframe estimates.

3. **Workflow & Reviews**:
   - Private milestone workspace with progress tracking.
   - Deliverable submission and client approval / revision loop.
   - Real-time project chat and file attachments.
   - Peer reputation review system evaluating Quality, Communication, Timeliness, and Requirement Adherence.

4. **Admin Panel (Faculty Console)**:
   - Dedicated Faculty Coordinator administration bar.
   - Student KYC verification queue (one-click approve/reject).
   - Campus Skill Demand vs Supply matrix.
   - Content moderation queue and dispute arbitration cases.
   - Tamper-evident administrative audit logs.

5. **Responsive UI**:
   - Full mobile and desktop responsive layouts with safe-area support.
   - Persistent Light & Dark mode switching.
   - Instant command shortcut jump palette (`Ctrl + K`).

6. **College Access & Security**:
   - Server-side domain enforcement rejecting personal emails (Gmail, Yahoo).
   - Strict role guards separating Student Portal from Admin Console.
   - 100% prepared SQL statements (PDO) preventing SQL injection attacks.

---

## 🔐 Credentials & Role Directory (Manual Login)

Every user manually authenticates to maintain strict campus security boundaries and distinct view experiences:

| Role / Persona | College Email (Username) | Password | Portal View | Clearance & Access |
|---|---|---|---|---|
| **Student (Lead)** | `student@dypatu.edu.in` | `password123` | **Student Portal** | Full student dashboard, active projects, proposals, milestone workspace, peer reputation |
| **Student (Freelancer)** | `aditi@dypatu.edu.in` | `password123` | **Student Portal** | Deliverable submissions, project chat, reviews, portfolio management |
| **Student (Client)** | `riya@dypatu.edu.in` | `password123` | **Student Portal** | Post projects, AI requirement insights, proposal shortlisting, freelancer selection |
| **Campus Administrator** | `admin.ritu@dypatu.edu.in` | `admin123` | **Admin Console** | Student verification queue, platform moderation, dispute arbitration, skill analytics, audit trails |

> 💡 **Quick-Fill Buttons**: When on the Sign In page (`#/auth/login`), you can click any **⚡ Quick-Fill** chip to pre-populate credentials immediately!

---

## 🚀 Running the Project

### Option A: Standard XAMPP Setup (Apache + PHP + MySQL)

1. **Copy Project to XAMPP**:
   Place the project folder inside your XAMPP web root:
   ```
   C:\xampp\htdocs\SkillEx
   ```

2. **Start Services in XAMPP Control Panel**:
   - Click **Start** for **Apache**
   - Click **Start** for **MySQL**

3. **Import Database (1-Click in phpMyAdmin)**:
   - Open [http://localhost/phpmyadmin](http://localhost/phpmyadmin)
   - Click on the **Import** tab
   - Select `skillex.sql` located in the root of the project folder
   - Click **Go** (Creates the `skillex` database and seeds all tables with realistic campus data)

4. **Launch Application**:
   - Open [http://localhost/SkillEx](http://localhost/SkillEx) or [http://localhost](http://localhost) in your browser!

---

### Option B: Instant Built-in PHP Server (Zero-Config Development)

You can also run the application immediately using PHP's built-in development server:

```powershell
# From the project directory:
php -S localhost:3000 router.php
```

Or using the included `php.bat` wrapper:
```powershell
.\php.bat -S localhost:3000 router.php
```

Then visit:
👉 **[http://localhost:3000](http://localhost:3000)**

*Note: The built-in PDO layer connects to MySQL if running on port 3306, and automatically uses an embedded SQLite database if MySQL is not yet started, ensuring instant zero-config testing!*

---

## 🗄️ Database Architecture

The MySQL database schema (`skillex.sql` and `database/schema.sql`) contains:
- `users`: Student accounts and faculty administrators with bcrypt password hashes.
- `projects`: Campus project marketplace listings with milestone schedules.
- `proposals`: Student freelancer bids, cover letters, and statuses.
- `workspaces`: Deliverable files, chat history, and timeline events.
- `verification_queue`: Student KYC cards waiting for faculty officer review.
- `skill_demand_supply`: Aggregated demand vs available students per skill.
- `moderation_queue`: Flagged projects and academic integrity warnings.
- `disputes`: Milestone arbitration cases and resolution outcomes.
- `audit_logs`: Administrative actions with timestamps and operator records.
- `notifications`: Student activity notices and alerts.

---

## 🛡️ Implementation Principles

- **Prepared Statements (PDO)**: All queries use parameterized prepared statements (`$pdo->prepare(...)`) to eliminate SQL injection vulnerabilities.
- **Password Security**: Passwords are saved as one-way Bcrypt hashes generated via `password_hash()` and verified via `password_verify()`.
- **Server-Side Verification**: Email domain validation and clearance checks are strictly evaluated on the server.
- **RESTful API**: Standardized JSON request and response structures with HTTP status codes and CORS support.
