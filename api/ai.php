<?php
// api/ai.php
// Campus Requirement Analyzer - Analyzes project scope, suggests milestones, deliverables & skills

require_once dirname(__DIR__) . '/includes/config.php';

function handleAiRoutes(string $action, string $method): void {
    if ($action === 'analyze' && $method === 'POST') {
        $body = getJsonInput();
        $title = trim($body['title'] ?? '');
        $description = trim($body['description'] ?? '');
        $category = trim($body['category'] ?? 'Web Dev');

        $content = strtolower($title . ' ' . $description);

        $detectedCategory = $category;
        $suggestedTitle = $title;
        $suggestedSkills = ['React', 'Figma', 'Tailwind'];
        $suggestedDeliverables = ['Figma design prototype', 'Deployed working site', 'Source code + documentation'];
        $suggestedMilestones = ['Design & Wireframes', 'Core Development', 'Testing & Launch'];
        $missingItems = [];
        $complexity = 'Medium';
        $estimatedHours = '35–45 hours';

        if (str_contains($content, 'logo') || str_contains($content, 'brand') || str_contains($content, 'poster') || str_contains($content, 'figma') || str_contains($content, 'ui') || str_contains($content, 'design')) {
            $detectedCategory = 'Design';
            $cleaned = trim(preg_replace('/design|logo/i', '', $title));
            $suggestedTitle = strlen($title) > 5 ? "Complete Brand Identity & UI Kit for " . ($cleaned ?: 'Club') : 'Brand Identity & Visual Design Kit';
            $suggestedSkills = ['Figma', 'Illustrator', 'UI/UX', 'Branding'];
            $suggestedDeliverables = ['Vector logo package (SVG, AI, PNG)', 'Style guide & typography sheet', 'Social media assets kit'];
            $suggestedMilestones = ['Moodboard & 3 Concepts', 'Client Revision & Color Palette', 'Final Vector Package Export'];
            $missingItems = ['Brand colors preference', 'Target audience info', 'Where logos will be displayed (print vs web)'];
            $complexity = 'Low';
            $estimatedHours = '12–18 hours';
        } elseif (str_contains($content, 'flutter') || str_contains($content, 'react native') || str_contains($content, 'android') || str_contains($content, 'ios') || str_contains($content, 'app')) {
            $detectedCategory = 'App Dev';
            $cleaned = trim(preg_replace('/app/i', '', $title));
            $suggestedTitle = strlen($title) > 5 ? "Cross-Platform Mobile App for " . ($cleaned ?: 'Students') : 'High-Performance Campus Mobile App';
            $suggestedSkills = ['Flutter', 'Firebase', 'State Management', 'REST API'];
            $suggestedDeliverables = ['Figma interactive flow', 'Signed release APK build', 'Backend database security rules'];
            $suggestedMilestones = ['Authentication & Navigation', 'Core Feature Screens', 'Testing & PlayStore/APK Build'];
            $missingItems = ['Target Android/iOS versions', 'Backend API endpoints availability', 'Push notification credentials'];
            $complexity = 'High';
            $estimatedHours = '50–70 hours';
        } elseif (str_contains($content, 'data') || str_contains($content, 'python') || str_contains($content, 'pandas') || str_contains($content, 'ml') || str_contains($content, 'survey')) {
            $detectedCategory = 'Data';
            $cleaned = trim(preg_replace('/data/i', '', $title));
            $suggestedTitle = strlen($title) > 5 ? "Data Processing & Automated Insights for " . ($cleaned ?: 'Survey') : 'End-to-End Data Analysis Pipeline';
            $suggestedSkills = ['Python', 'Pandas', 'NumPy', 'Data Visualization', 'Excel'];
            $suggestedDeliverables = ['Reproducible Python/Jupyter pipeline', 'Cleaned dataset (.xlsx/.csv)', 'Executive summary charts deck'];
            $suggestedMilestones = ['Data Ingestion & Cleaning', 'Exploratory Analysis & Metrics', 'Report Generation & Visualization'];
            $missingItems = ['Source file format (CSV, SQL, Forms)', 'Data privacy/anonymization guidelines', 'Required KPI metrics'];
            $complexity = 'Low';
            $estimatedHours = '15–25 hours';
        } elseif (str_contains($content, 'video') || str_contains($content, 'reel') || str_contains($content, 'edit') || str_contains($content, 'premiere')) {
            $detectedCategory = 'Video';
            $cleaned = trim(preg_replace('/video|edit/i', '', $title));
            $suggestedTitle = strlen($title) > 5 ? "Cinematic Showcase Video & Reel for " . ($cleaned ?: 'Event') : 'High-Energy Cinematic Reel Edit';
            $suggestedSkills = ['Premiere Pro', 'After Effects', 'Sound Design', 'Color Grading'];
            $suggestedDeliverables = ['Synced rough cut preview', '1080p & 4K master video', '9:16 vertical reel cut for Instagram'];
            $suggestedMilestones = ['A-Roll Storyline & Music Sync', 'B-Roll & Motion Titles', 'Audio Mastering & Color Grade'];
            $missingItems = ['Raw footage transfer link (Drive)', 'Licensed background music track', 'Aspect ratio specifications'];
            $complexity = 'Medium';
            $estimatedHours = '20–30 hours';
        } elseif (str_contains($content, 'fest') || str_contains($content, 'website') || str_contains($content, 'web') || str_contains($content, 'portal')) {
            $detectedCategory = 'Web Dev';
            $cleaned = trim(preg_replace('/website|web|site/i', '', $title));
            $suggestedTitle = strlen($title) > 5 ? "Responsive Web Portal for " . ($cleaned ?: 'TechNova Fest') : 'Responsive Campus Web Portal';
            $suggestedSkills = ['React', 'Figma', 'Tailwind', 'JavaScript'];
            $suggestedDeliverables = ['Figma design prototype (3 pages)', 'Deployed live site with SSL', 'Clean Git repository + README'];
            $suggestedMilestones = ['Design & Wireframes', 'Frontend Implementation', 'Domain & Launch Handover'];
            $missingItems = ['Hosting platform preference (Vercel/Netlify)', 'Who supplies sponsor logos', 'Registration cap & deadlines'];
            $complexity = 'Medium';
            $estimatedHours = '35–45 hours';
        } else {
            $suggestedTitle = strlen($title) > 3 ? "Optimized {$title}" : 'Campus Project Milestone Specification';
            $suggestedSkills = ['Problem Solving', 'Git', 'Agile'];
            $suggestedDeliverables = ['Complete solution source code', 'Handover documentation', 'Verification test run'];
            $missingItems = ['Detailed acceptance criteria', 'Preferred technology stack', 'Communication channel'];
        }

        jsonResponse([
            'success' => true,
            'category' => $detectedCategory,
            'title' => $suggestedTitle,
            'skills' => $suggestedSkills,
            'skillsString' => implode(', ', $suggestedSkills),
            'deliverables' => $suggestedDeliverables,
            'deliverablesString' => implode(', ', $suggestedDeliverables),
            'milestones' => $suggestedMilestones,
            'milestonesString' => implode(' · ', $suggestedMilestones),
            'missingItems' => $missingItems,
            'complexity' => $complexity,
            'estimatedHours' => $estimatedHours
        ]);
    }

    jsonResponse(['error' => 'Endpoint not found'], 404);
}
