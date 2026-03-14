# Changelog

All notable changes to EduDash will be documented in this file.

## [5.9.6] - 2026-03-14

### Changed
- **Lesson Builder — Lesson name visibility** — lesson title in the builder popup is now larger (`text-sm font-semibold`) and uses `text-foreground` instead of muted color
- **Lesson Builder — Split Screen active side selector** — added Left/Right toggle in the split screen header bar to choose which column new elements are added to
- **Lesson Builder — Transfer blocks between sides** — each block in split screen mode now has an ↔ arrow button to move it from left to right or vice versa
- **Lesson Builder — Page Break auto-numbering** — removed manual page label inputs; page breaks are now auto-numbered and show their page number (#2, #3…) beside the "New Page" label in the block header
- **Lesson Builder — BETA badges** — all element types except Text, Image, Video, Divider, New Page, Split Screen, and Table of Content now display a β badge in both the palette and block headers

---

## [5.9.5] - 2026-03-14

### Changed
- **Lesson Builder — Split Screen constraints** — Split Screen element is now locked to one per lesson (lock icon shown when already used); disabled with tooltip if other elements already exist; removing split screen unassigns all side assignments
- **Lesson Builder — Split Screen sub-block routing** — when Split Screen is active, all newly added elements are automatically placed inside the split screen columns (left first, then right); content area renders in a two-column layout with side badges and block counts

---

## [5.9.4] - 2026-03-14

### Added
- **Change Log page** — new developer page under the Developer sidebar showing full version history with timeline UI, search, category-colored badges (Added/Changed/Fixed/Improved/Removed/Security), bold item parsing, and Latest/Major/Minor version badges

---

## [5.9.3] - 2026-03-13

### Changed
- **Lesson Builder — Block palette restyled** — element categories now display in a 2-column grid with card-style buttons, category headers with item counts, and separators between groups
- **Lesson Builder — New "Layout" category** — Divider, New Page, Split Screen, and Table of Content moved from Media/Content into a dedicated 🧩 Layout group
- **Lesson content page navigation** — replaced top/bottom duplicate pagination bars with a single sticky frosted-glass bar fixed at the bottom of the content area
- **Divider block — text labels** — added optional text inside dividers with font size that scales dynamically based on selected thickness
- **Divider block — new styles & thicknesses** — added Groove and Ridge border styles; expanded thickness presets to 6px and 8px; all divider colors now render at 15% opacity
- **Lesson Builder — blocks collapsed by default** — all block elements start collapsed for cleaner editing; drag handle on the grip icon enables drag-and-drop reordering

---

## [5.9.2] - 2026-03-13

### Added
- **Clear All Content** — new card in Data Management that permanently deletes ALL data (not just seeded) from selected categories: Blog Posts, Website Pages, Courses & Curriculum, Expenses, Pricing Packages, and Support System (tickets, departments, priorities)
- **Clear Logs** — new card with checkboxes to selectively clear Audit Logs (database), Seed Log (sessions + records), and Error Log (localStorage), with confirmation dialogs
- **`clear_content` edge function action** — deletes all rows from selected content table groups respecting FK order
- **`clear_logs` edge function action** — deletes audit_logs and/or seed_sessions/seed_records from database

---

## [5.9.1] - 2026-03-13

### Changed — Database Consolidation
- **Merged `auto_backup_config` into `app_settings`** — backup configuration (enabled, schedule, retention, format, scheduled_time) is now stored as `backup_config` key inside `app_settings.settings` jsonb, eliminating a standalone table
- **Updated `manage-backups` edge function** — reads backup config from `app_settings.settings.backup_config` instead of the removed table
- **Updated `BackupsSettings` component** — reads/writes backup config via `app_settings` instead of `auto_backup_config`
- **Removed `auto_backup_config`** from backup table lists and settings backup scope

---

## [5.9.0] - 2026-03-13

### Added
- **Actions Queue** — new developer page under the Developer sidebar that logs all user CRUD actions (add/modify/delete) to localStorage with type filtering, stats cards, detail dialog, and clear functionality
- **`logAction()` utility** — reusable function in `src/lib/actionsQueue.ts` to record actions from any module; integrated into Course Tracks mutations as the first use case

### Changed — Global Search
- **Removed invoice preloading** — the search dialog no longer fetches invoices on open; only static page navigation results are shown for instant performance

### Changed — Course Tracks Redesign
- **Stats row** — added 4 KPI cards (total tracks, linked courses, levels, unassigned courses)
- **Enhanced track cards** — numbered track badges, vertical separator before actions, improved empty state with guidance text
- **Better create/edit dialog** — section headers with dot indicators, placeholder examples, saving spinner state, and description subtitle
- **Published course badges** — green-tinted badges for published status

### Fixed
- **Floating action X buttons** — dismiss icons now have a visible background (`bg-muted` with border) instead of transparent, improving discoverability

---

## [5.8.0] - 2026-03-13

### Added
- **Drop All Students edge function** — new `drop-students` edge function performs full cleanup of all student accounts (auth, profiles, roles, and all related data) with admin-only access
- **`drop_all_students` action** — added to `manage-accounts` edge function as an alternative entry point

### Changed — Course Learning Immersive Mode
- **App sidebar auto-collapse** — the main application sidebar now automatically collapses when entering the Course Learning page and restores its previous state on exit

### Security
- **XSS prevention** — integrated DOMPurify to sanitize all `dangerouslySetInnerHTML` content in the Course Learning page
- **Lesson Builder two-panel layout** — restructured the builder dialog into a left editor panel and right element palette sidebar for improved UX

### Fixed
- **Course content not rendering** — expanded the ContentViewer to support all 16 block types (was only rendering 4 basic types)

---

## [5.7.0] - 2026-03-13

### Changed — Course Learning Sidebar (Major)
- **Hierarchical sidebar** — rebuilt the learning page sidebar with a full 3-level collapsible tree: Topics (L1) → Sections (L2) → Lessons (L3) using native `<details>` elements
- **Visual tree structure** — each nesting level has a left border line, indentation, and distinct icons (FolderTree for topics, Layers for sections, Play/Circle/Check for lessons)
- **Section progress** — each section shows completion percentage or a check icon when all lessons are done
- **Completed lesson styling** — finished lessons show strikethrough text with reduced opacity; active lesson shows a filled play icon

### Changed — Course Builder UX
- **Topic delete button** — replaced the three-dot menu on topics with a direct trash icon button (confirmation dialog preserved)
- **Section "Move To"** — replaced the section edit button with a "Move To" sub-menu allowing sections to be moved between topics
- **Skill level icon** — changed from Signal to Settings2 icon in course detail badge

### Fixed
- **Content Editor RTL reversal** — fixed text typing in reverse (e.g. "olleH" instead of "Hello") when the UI is in Arabic mode by adding `dir="auto"` and `unicodeBidi: plaintext`

### Changed — Manage Content → Lesson Builder
- **"Manage Content" button** in the Course Learning page now opens the full Lesson Builder dialog (with all 16 block types) instead of the old simple URL/text form
- Removed legacy edit dialog code (video/audio/PDF URL fields, plain text editor)

---

## [5.6.0] - 2026-03-13

### Changed — Lesson Types → Builder Elements (Major)
- **Lesson types moved to Lesson Builder** — the 12 hardcoded lesson types (Table of Content, Read & Listen, Memorization, Exercises, etc.) are no longer a property of the lesson row; they are now selectable content block types inside the Lesson Builder
- **Lesson type dropdown removed** — removed the inline type selector from lesson rows in the course builder and the type field from the Add/Edit Lesson dialog
- **Lesson dialog simplified** — creating/editing a lesson now only requires Title (EN/AR); content and type are managed entirely in the Lesson Builder

### Added
- **16 block types in Lesson Builder** — expanded from 4 (Text, Image, Video, Audio) to 16 with full editors:
  - **Media**: Text, Image, Video, Audio
  - **Content**: Table of Content, Read & Listen, Memorization, Revision, Homework (rich text with optional audio for Read & Listen / Memorization)
  - **Exercises**: Listen & Choose, Choose Correct, Choose Multiple, True/False, Text Match, Rearrange, Missing Text — each with appropriate question, options, pairs, or items editors
- **Grouped block selector** — builder shows blocks organized into Media, Content, and Exercises groups with labeled sections
- **Exercise editors** — Choose Correct/Multiple with radio/checkbox option selection, True/False with radio group, Text Match with pairs editor, Rearrange with ordered items editor, Missing Text with sentence/word fields, Listen & Choose with audio + options

### Removed
- **`contentTypeGroups` constant** — removed hardcoded lesson type definitions from CourseDetail
- **Lesson type badge** — removed from the course learning page header

---

## [5.5.0] - 2026-03-13

### Added
- **Lesson Builder** — block-based content editor for lessons supporting Text (rich HTML), Image (URL + caption + alt), Video, and Audio blocks with drag reorder, inline preview, and legacy content auto-migration
- **Course Documentation dialog** — "Full Documentation" button inside the course info accordion opens a wide bilingual popup explaining content hierarchy, all 12 lesson types, builder blocks, and preset usage tips
- **Preset topic selector** — preset insertion dialog now includes a dropdown to choose an existing topic or create a new one per preset

### Improved
- **Preset English translations** — fixed untranslated Arabic labels in English mode (Virtues of the Surah, Reasons of Revelation, Prophetic Context, Lessons Learned, Ethics of the Surah)

---

## [5.4.0] - 2026-03-13

### Changed
- **Course hierarchy terminology refactored** — renamed the three-level course structure from "Lesson → Section → Content" to "Topic → Section → Lesson" across the entire system
- **Translation keys updated** — added `courses.topics` and `courses.addTopic` keys; repurposed `courses.lessons`/`courses.addLesson` for the bottom-level learning units; removed old `courses.content`/`courses.addContent`/`courses.contentType` keys
- **Course builder updated** — all UI labels, dialogs, documentation panel, and example text now reflect the new Topic → Section → Lesson hierarchy
- **Manage Content button** — added inline lesson content editing from the learning page (admin/teacher only)
- **Floating action buttons** — each button now has its own individual dismiss X instead of a shared dismiss button

### Added
- **Leave confirmation dialog** — back button on the learning page now shows a warning about unsaved progress before navigating away

### Improved
- **Top bar animation** — smooth slide transition when toggling the top bar on the course learning page
- **Learning page defaults** — sidebar starts collapsed and top bar auto-hides for distraction-free learning
- **Copyright footer contrast** — darker text for better readability

---

## [5.3.0] - 2026-03-13

### Added
- **Course Learning Page** — full session-based learning interface at `/courses/:id/learn` with sidebar navigation, content viewer (video, audio, PDF, text, external links), progress tracking, and mark-complete functionality
- **Learn Now button** — added to both course cards and course detail page for direct access to the learning experience
- **Auto-resume learning** — system detects learner's last completed lesson and opens the next one automatically
- **System Reset feature** — new destructive action in App Settings that wipes all operational data, clears storage buckets, and restores the platform to a fresh installation state with typed confirmation safety mechanism
- **Top bar toggle on learning page** — top bar auto-hides when entering course learning for a distraction-free experience, with a toggle button to show/hide it

### Improved
- **Seed data scaling** — timetable entries, attendance, and session reports now scale proportionally with the user-selected multiplier
- **Learning page layout** — compact copyright footer and zero-padding main area for full-bleed learning experience

---

## [5.2.0] - 2026-03-13

### Added
- **Global Attend button** — TopBar now shows an "Attend" button across all dashboard pages when a session is starting within 15 minutes, using a new `useUpcomingAttend` hook that polls every 30 seconds
- **Expanded sample data categories** — seed system now covers all database areas: Expenses (categories + records), E-Books, Student Progress & Session Reports, Support Config (departments + priorities)
- **Realistic session data in seeding** — schedule category now generates attended sessions with session reports (logged time, summaries, observations, performance remarks), cancelled sessions with reasons, and proper attendance records
- **Session report details in seed data** — reports include realistic duration with ±2min variance, proper `started_at`/`ended_at` timestamps, subscription linking, and varied summaries/observations

### Changed
- **Backup dialog redesigned** — expanded to `max-w-2xl` with 3-column table selection grid and visual toggle cards for format selection (JSON, SQL, CSV)
- **Renamed backup buttons** — "Run a Full Backup Now" → "Generate Full Backup"; "Backup Settings" → "Generate App Settings Backup"
- **Sample data deduplication** — seeding multiple times now adds new data without duplicating fixed-pool records (tracks, categories, levels, courses, announcements, packages, etc.)
- **Session-unique dynamic records** — expenses, blogs, and pages use session ID slices in titles to ensure uniqueness across runs

### Improved
- **Schedule seeding distribution** — ~40% completed (with attendance + reports), ~15% cancelled (with reasons), remaining scheduled for future dates
- **Clear all sample data** — cleanup process updated to handle all new tables in proper FK-safe deletion order

---

## [5.1.0] - 2026-03-13

### Changed
- **Course action icons updated** — "View" button now uses Edit (pencil) icon, "Edit" button now uses Settings (gear) icon for clearer semantic distinction between viewing course content and editing course settings
- **Backup system improvements** — full database backup now covers all 46 tables; new standalone "Backup App Settings" card for exporting configuration data independently
- **Landing page editor animation** — smooth slide-in animation when opening the section editor panel
- **Subscription renewal dates** — quarterly billing cycle corrected to 88 days; seed data now generates proper renewal dates based on billing cycle

### Added
- **Separate App Settings backup** — new card in Backups settings to export only configuration tables (app_settings, auto_backup_config, payment_gateway_config, landing_content, pricing_packages, policies)
- **Live session URLs in seed data** — sample subscriptions now include Google Meet and Zoom URLs

### Fixed
- **Quarterly renewal label** — corrected from "84 days" to "88 days" in subscription creation form

---

## [5.0.0] - 2026-03-13

### Added — Sample Data System v2 (Major)
- **New `seed-data` edge function** — fully re-engineered database seeding tool, separate from legacy `manage-accounts` for backward compatibility
- **Session-based tracking** — every seed operation creates a `seed_sessions` record with metadata (categories, multiplier, counts, errors, status, timestamps)
- **Record-level tracking** — every generated record is logged in `seed_records` (session_id, table_name, record_id) enabling precise, safe cleanup
- **Safe cleanup** — delete only tracked seed records in FK-safe order while preserving all real/production data; supports per-session or bulk cleanup
- **Unique email namespacing** — seeded users use session-scoped emails (`seed-{session_id}-s1@sample.edu`) preventing collisions across sessions
- **Full entity coverage** — seeds students, teachers, courses (tracks/categories/levels/sections/lessons), subscriptions, invoices, timetable, attendance, announcements, notifications, chats, messages, support tickets, certificates, blog posts, pages, and pricing packages
- **Session History UI** — expandable session cards showing status badges, record counts per entity, error logs, and per-session delete buttons
- **Database tables** — `seed_sessions` and `seed_records` with admin-only RLS policies and optimized indexes

### Improved
- **DataManagementCard** — completely rebuilt UI with cleaner layout, category descriptions, active session summary, and integrated history dialog
- **Relational integrity** — seeding logic respects all FK constraints, enum values, and column defaults across the full schema

### Security
- New tables use admin-only RLS policies via `has_role()` security definer function

---

## [4.19.0] - 2026-03-13

### Fixed
- **Critical: Infinite RLS recursion breaking all data access** — cross-table RLS policies between `profiles`, `teachers`, `students`, and `attendance` created circular dependency chains (`profiles → students → teachers → students → ...`), causing PostgreSQL error `42P17: infinite recursion detected in policy for relation "teachers"`. This made ALL data appear deleted (profiles, students, teachers, subscriptions, invoices) even though the data was intact in the database
- **Root cause** — RLS policies on `profiles` queried `students` joined with `teachers`, while `teachers` policies queried `students`, and `students` policies queried `teachers` — forming an unbreakable circular evaluation chain

### Security
- Created 5 new `SECURITY DEFINER` helper functions (`get_teacher_id_for_user`, `get_student_ids_for_teacher`, `get_student_user_ids_for_teacher`, `get_assigned_teacher_id`, `get_student_id_for_user`) to safely bypass RLS during policy evaluation
- Rewrote RLS policies on `profiles`, `teachers`, `students`, and `attendance` to use these helper functions instead of raw cross-table subqueries
- All helper functions have proper `EXECUTE` grants for `authenticated` and `anon` roles

---

## [4.18.0] - 2026-03-13

### Fixed
- **Critical: Users disappearing from dashboard** — the `has_role()` database function was missing its `EXECUTE` grant to `authenticated` and `anon` roles, causing all RLS policies that depend on it (admin access to profiles, students, teachers, etc.) to silently fail and return empty results
- **Root cause** — a previous migration that recreated the `has_role()` function via `CREATE OR REPLACE` dropped the implicit EXECUTE grant, making every `has_role()` call in RLS policies evaluate to `false`

### Security
- Restored `GRANT EXECUTE` on `has_role(uuid, app_role)` to `authenticated` and `anon` roles

---

## [4.17.0] - 2026-03-13

### Added
- **Monthly Student Report** — new per-student monthly report view in Students Reports showing all teacher session reports for a selected month with summary stats (total sessions, attended, absent, learning minutes) and detailed report cards
- **Monthly report dialog** — month picker with last 12 months, session reports grouped by date with course, teacher, summary, observations, and performance remarks
- **Beta badge on CodeCom Meeting** — added Beta badge to the CodeCom Meeting option in the Join Meeting platform selection dialog

### Improved
- **Teacher RLS security hardening** — replaced blanket `USING(true)` SELECT policy on teachers table with scoped policies: teachers view own record, students view assigned teacher only, admins retain full access
- **Public teacher data** — created `get_public_teachers()` security-definer RPC to safely expose only non-sensitive fields for the landing page
- **Duplicate email handling** — Teachers and Students creation now shows a clear localized error toast when attempting to register an already-existing email
- **Payout support tickets** — Submit Ticket from payout request details now auto-locks subject and department (billing) fields
- **Document preview** — added Download button to the CV/Contract PDF preview dialog

### Security
- **Teachers table RLS** — sensitive fields (hourly_rate, cv_url, contract_url, date_of_birth, gender) no longer exposed to students via overly permissive SELECT policy

---

## [4.16.0] - 2026-03-12

### Added
- **Session Timer** — real-time session duration tracking (MM:SS / HH:MM:SS) starts when joining a meeting and persists until ended
- **End Session flow** — "End Session" button in header triggers a structured report dialog
- **Session Report Dialog** — teachers/admins submit session summary, observations, and student performance remarks upon ending
- **`session_reports` database table** — stores duration, summary, observations, performance remarks, and links to timetable entries, students, teachers, courses, and subscriptions
- **Report column in Attend Lesson table** — shows ✅ Done badge for reported sessions
- **Active Session Banner** — prominent emerald-themed banner with course/student info during active sessions
- **Session Reports in Subscription details** — last 5 session reports visible in the subscription view dialog
- **`SessionReportsList` reusable component** — filterable by student, teacher, course, or subscription with detail dialog
- **RLS policies** — admins manage all reports; teachers insert/view own; students view their session reports

### Improved
- **Attend button state** — disabled during active sessions and for already-reported entries to prevent duplicate sessions
- **JoinMeetingDialog** — now triggers `onSessionStart` callback upon successful join across all platforms (Google Meet, Zoom, Vconnct)
- **Lesson status badges** — new "🟢 In Session" status for actively tracked sessions

---

## [4.15.0] - 2026-03-12

### Added
- **Auto Renewal toggle** — new `auto_renew` boolean column on subscriptions with Switch UI in both create and edit dialogs
- **Automatic invoice generation** — when auto-renew is enabled, invoices are auto-generated at the renewal date via the `auto-invoice` edge function
- **Vconnct dashboard link** — "+" button next to Vconnct URL input opens `dashboard.vconnct.me` for creating meeting links

### Improved
- **Auto-invoice edge function** — now filters subscriptions by `auto_renew = true` to only generate invoices for opted-in subscriptions
- **Library PDF reader** — added expand/minimize toggle for full-screen viewing

---

## [4.14.0] - 2026-03-12

### Added
- **Join Meeting Dialog refactored** — extracted into dedicated `JoinMeetingDialog` component with platform selection workflow (select platform → click Join)
- **Vconnct in-platform meeting** — Vconnct sessions open in an embedded iframe modal inside the dashboard instead of redirecting externally
- **Vconnct branding** — Vconnct favicon icon downloaded and displayed; all references renamed from "Vconnect" to "Vconnct"
- **URL masking** — meeting URLs in the dialog are masked after the domain (e.g., `https://meet.google.com/••••••`) for security
- **Vconnct URL validation** — validates that entered URLs contain `vconnct` in the hostname before allowing join
- **Iframe sandbox security** — Vconnct iframe uses `sandbox` and `allow` attributes for camera, microphone, and display-capture permissions

### Improved
- **Meeting dialog UX** — replaced direct-click-to-join with a two-step select-then-join flow with visual selection state (checkmark indicator)
- **Vconnct URL input** — input field now appears inside the Vconnct card (same box) with a Link2 icon prefix
- **External platform description** — Google Meet and Zoom cards now show "You will be redirected to..." instead of the masked URL
- **Subscription URL matching** — improved lookup to match by `student_id + teacher_id + course_id` first, with fallback to `student_id + teacher_id`, preventing wrong URL for multi-subscription pairs
- **Code architecture** — dialog logic extracted from `AttendLesson.tsx` (445→334 lines) into `src/components/attend/JoinMeetingDialog.tsx`

## [4.13.0] - 2026-03-12

### Added
- **Attend Lesson page** — new section under Educate menu (`/dashboard/attend-lesson`) with weekly scheduled lessons table showing Date, Time, Student, Teacher, Duration, Status, and Attend action
- **Smart lesson status indicators** — Live (🔴 pulsing), Starting Soon, Coming Later, Completed, Ended, and Cancelled statuses with real-time 30-second refresh
- **15-minute attend rule** — Attend button auto-enables 15 minutes before lesson start and stays active until lesson ends
- **Join Method modal** — choose between Google Meet, Zoom, or Vconnect when attending a lesson; Google Meet and Zoom open configured URLs from the subscription; Vconnect requires manual URL entry with validation
- **Attend Lesson stats cards** — Live Now, Today's Lessons, and This Week counters
- **3-Month (Quarterly) billing cycle** — new subscription type with 12-week calculation for pricing
- **Renewal date descriptive note** — displays the exact day-cycle below the renewal date field (28 days for monthly, 84 for quarterly, 365 for yearly)
- **BETA badge on Webhook Log** sidebar item

### Improved
- **Subscription "Type" renamed to "Billing Cycle"** (`دورة الفوترة`) for clarity across UI and labels
- **Renewal date calculation** — uses fixed day counts instead of calendar months (28/84/365 days)
- **Time picker redesigned** — dual-column Hour + Minute selector with 15-minute increments, full-width trigger, and AM/PM formatting
- **Schedule section redesigned** — subscription detail now shows a card with full day names as styled chips and a dedicated time display with icon
- **Live Session URLs restyled** — Google Meet and Zoom favicons with card-style layout in both detail view and create dialog
- **URL overflow fix** — long session URLs now clip properly with `break-all` and `line-clamp-1`
- **Status badge alignment** — badge in subscription detail view properly aligned below its label

## [4.12.0] - 2026-03-12

### Changed
- **FAQ Section redesign** — boxed layout with heavy border radius (`rounded-3xl`), background contained within container instead of full-width
- **FAQ animation** — smooth expand/collapse animation using CSS Grid `grid-template-rows` transition
- **Newsletter Section redesign** — compact horizontal layout with reduced vertical footprint, inline form, and boxed styling with border and muted background

## [4.11.0] - 2026-03-12

### Added
- **Certificate Type column** — table now shows whether recipient is a Student or Teacher
- **Radio buttons for Recipient Type** — replaced dropdown with radio buttons in certificate creation dialog

## [4.10.0] - 2026-03-12

### Changed
- **Copyright text updated** — "All Rights Reserved © 2026 — Developed By CodeCom.dev"
- **Rich text editor for Policies** — replaced plain textareas with visual content editor (HTML mode removed)

## [4.9.0] - 2026-03-12

### Added
- **Additional content field** in Copyright settings — EN/AR text displayed below the copyright line
- Copyright text is now non-editable, always uses developer copyright from version.ts

## [4.8.0] - 2026-03-12

### Added
- **System Pages in Copyright links** — Home, Contact, Blog added as selectable links in the copyright bar dropdown
- Link type extended to support `system` pages with direct URL paths

## [4.7.0] - 2026-03-12

### Added
- **Copyright Bar** moved to its own separate tab in Landing Page settings (Header → Sections → Footer → Copyright)
- **Support RLS policies** — added SELECT policies for `support_departments` and `support_priorities` for authenticated users

### Changed
- Support ticket creation now dynamically fetches departments and priorities from sub-menu managed data

## [4.6.0] - 2026-03-11

### Added
- **Footer Editor** in Landing Page settings — new "Footer" tab with:
  - App branding section (logo, title EN/AR, description EN/AR)
  - Column layout selector (1–4 columns)
  - Per-column title and link items editor with bilingual labels and URLs
  - Dynamic footer rendering on the landing page with responsive grid
- Reordered tabs: Header → Sections → Footer → SEO

## [4.5.0] - 2026-03-11

### Added
- **Header Style tab** in Landing Page settings — moved from SEO & General to its own dedicated tab
- **Editable navigation menu items** — add, remove, and reorder header nav links with bilingual labels (EN/AR) and section IDs
- **Split menu editor for Centered style** — edit left and right menu items independently when using the centered header layout
- Auto-initialization of split menus when switching to centered style
- `nav_items`, `nav_items_left`, `nav_items_right` fields in landing content general settings

## [4.4.0] - 2026-03-11

### Added
- **Landing Page Header Styles System** — 3 selectable header styles for the landing page:
  - **Classic Navigation**: Logo left, navigation links and action buttons right (default)
  - **Centered Navigation**: Logo centered with nav links split symmetrically on both sides
  - **CTA Focused**: Modern layout with stronger visual hierarchy, separate Sign In/Start Free buttons
- Header Style Picker in Dashboard → Landing Page → SEO & General tab with visual mini-previews
- `header_style` field in `defaultGeneralContent` persisted to `landing_content` table
- Modular `LandingHeaders.tsx` component with shared utilities (LogoBlock, DarkToggle, LangToggle, UserActions, MobileMenu) for consistent behavior across all styles
- All header styles share responsive mobile menu, dark mode toggle, language switcher, and auth state handling
- Architecture supports adding future header styles with minimal code changes

### Changed
- Refactored LandingPage.tsx to use dynamic header component resolution via `getHeaderComponent()`
- Version bumped to 4.4.0

## [4.3.6] - 2026-03-11

### Added
- Auto Fill button in the Support page's Create Ticket dialog, matching the Report a Bug dialog style
- Version bumped to 4.3.6

## [4.3.5] - 2026-03-11

### Added
- Phone number field in the support ticket dialog, auto-filled from the user's profile
- Version bumped to 4.3.5

## [4.3.4] - 2026-03-11

### Added
- Auto Fill button on the support ticket dialog that populates name and email from the logged-in user's profile
- Version bumped to 4.3.4

## [4.3.3] - 2026-03-11

### Added
- Added side-by-side analytics charts (50% width each) to Reports & Analytics page
- Subscriptions tab: Monthly Subscriptions bar chart + Subscription Status pie chart
- Attendance tab: Monthly Attendance stacked bar chart + Attendance Distribution pie chart
- Finances tab: Monthly Revenue line chart + Revenue by Type pie chart
- All charts use semantic design tokens and consistent tooltip styling

### Changed
- Version bumped to 4.3.3

## [4.3.2] - 2026-03-11

### Changed
- Standardized all action buttons across the entire project to match the Invoice page reference style
- Created shared `actionBtnClass.ts` module with `ACTION_BTN`, `ACTION_BTN_DESTRUCTIVE`, and `ACTION_ICON` constants
- Updated 14 files to use the shared action button classes: Courses, CourseDetail, CourseTracks, CourseLevels, CourseCategories, Teachers, Students, Support, Timetable, Subscriptions, Certificates, AuditTrail, BlogPosts, WebsitePages, Policies
- Unified icon sizes from mixed `h-3.5 w-3.5` / `h-3 w-3` to consistent `h-4 w-4` across all action buttons
- Unified button dimensions from mixed `h-7 w-7` / `h-6 w-6` to consistent `h-8 w-8` across all action buttons
- Standardized hover states: `text-muted-foreground hover:text-foreground hover:bg-muted` for default, `hover:text-destructive hover:bg-destructive/10` for destructive
- Version bumped to 4.3.2

## [4.3.1] - 2026-03-11

### Fixed
- Website Mode & Developer Mode switch toggles now update visually immediately (were reading saved state instead of pending state)

### Changed
- Website Mode route guards: dashboard routes (Landing Page, Policies, Main Pages, Blogs) now redirect to `/dashboard` when website mode is disabled, preventing direct URL access
- Public routes (landing page, blog posts, public pages, policies) already blocked via PublicRouteGuard
- Media separated from Website category: Media now appears in its own standalone sidebar category, always accessible regardless of website mode
- Sidebar label renamed from "Blog" to "Blogs"
- Removed "Delete Database Tables Data" and "Erase All Data" functionality from Data Management settings and backend edge function
- Version bumped to 4.3.1

## [4.2.0] - 2026-03-11

### Added
- Seed data quantity slider: replaced preset buttons (small/medium/large) with a dynamic 1x–10x range slider showing real-time estimated counts per category
- Separated "Pricing Packages" into its own independent seed category (📦) distinct from Website
- Media Manager: loading spinner on image thumbnails (file list & detail panel) while images load
- Media Manager: 1px border on preview images in the detail panel

### Changed
- Seed data backend refactored: accepts numeric multiplier (1–10) with proportional entity generation for all categories
- Media Manager: fixed width overflow caused by long file names — added `min-w-0` to file rows for proper truncation
- Website seed category renamed to "Blogs & Pages" (🌐) now focused on blog posts and website pages only
- Version bumped to 4.2.0

## [4.1.0] - 2026-03-11

### Added
- Course hierarchy restructured: Course → Lessons → Sections → Content (3-level nested structure)
- New `lesson_sections` database table as middle tier between course_sections and lessons
- RLS policies on `lesson_sections` for admin/teacher management and enrolled user viewing
- New translation keys: `courses.content`, `courses.addContent`, `courses.contentType` (EN/AR)

### Changed
- `course_sections` now represent "Lessons" (top-level grouping under a course)
- `lesson_sections` represent "Sections" (grouping inside each lesson)
- `lessons` table repurposed as "Content" items (read & listen, exercises, homework, etc.)
- `lessons.section_id` FK migrated from `course_sections` to `lesson_sections`
- CourseDetail page fully rewritten with 3-level nested accordion UI
- Existing data auto-migrated: default section created per lesson, content items re-linked
- Version bumped to 4.1.0

## [4.0.0] - 2026-03-11

### Added
- Fully functional auto-backup system: scheduled backups via pg_cron calling manage-backups edge function daily at 2:00 AM UTC
- Auto-backup settings UI: enable/disable toggle, schedule (daily/weekly/monthly), retention count (3–30), format (JSON/SQL/CSV)
- `auto_backup_config` database table with RLS restricted to admins
- Automatic retention enforcement: old auto-backup files deleted beyond configured limit
- Image picker (MediaPickerDialog) now supports private storage buckets with signed URLs
- Avatars bucket added to media picker for profile avatar selection
- Profile avatar upload replaced with reusable ImagePickerField component (same as app logo picker)

### Changed
- manage-backups edge function refactored: shared `createBackupFile` and `enforceRetention` helpers
- MediaPickerDialog generates batch signed URLs for private bucket thumbnails
- Profile page cartoon avatar selection now updates display immediately without requiring page reload
- Version bumped to 4.0.0

## [3.9.0] - 2026-03-11

### Added
- Courses grid/list view toggle: grid view shows course cover images, category, and skill level badges
- Courses submenu: Tracks, Categories, and Levels simple list pages under Courses in sidebar
- Course detail fields: Category (dropdown), Duration in weeks, Skill Level (dropdown), auto-detected Number of Lessons
- Cartoon avatar picker in Profile settings: 3 pre-generated cartoon avatars to choose from
- Supabase connection status card in App Settings showing project URL, ID, and dashboard link
- Database columns: `category`, `duration_weeks`, `skill_level` added to courses table

### Changed
- Course creation/edit dialog now includes Category, Skill Level, and Duration fields
- Course detail page shows image, category, skill level, duration, and total lesson count badges
- Sidebar supports nested submenu items (Courses → Tracks, Categories, Levels)
- Version bumped to 3.9.0

## [3.8.1] - 2026-03-11

### Added
- Global Search command palette (Ctrl+K / ⌘K) searching across pages, students, courses, and invoices
- Audit Trail system with database triggers on 10 key tables, diff viewer, and admin-only dashboard page
- Automated recurring invoice generation edge function with daily pg_cron trigger
- Manual "Auto-Renew" button on Invoices page for on-demand invoice generation
- CodeCom.dev developer logo in dashboard footer

### Changed
- Full white-label: removed all Lovable branding from frontend (meta tags, OG images, badges)
- Dashboard footer layout: developer logo on left, copyright text on right
- CodeCom.dev link styled without underline decoration
- Badge removal hardened with CSS injection and MutationObserver
- Version bumped to 3.8.1

## [3.8.0] - 2026-03-11

### Added
- Error Log page: real-time runtime error, warning, and info capture with search, filter, and detail dialog
- Reusable ComingSoonOverlay component with blur effect and "View Only" dismiss button
- Visit policy button (external link) on published policies in the Policies page

### Changed
- "Report a Bug" floating button replaces "Support" with Bug icon and no right-side rounding
- WhatsApp floating button darkened to #128C7E with "Contact Sales" label
- Developer Mode now enabled by default for new users
- ComingSoonOverlay applied to Activity Log and Role Management pages
- Error Log layout fixed: constrained long messages within screen width (overflow-hidden, truncate)
- Version bumped to 3.8.0

## [3.7.0] - 2026-03-11

### Added
- Floating support ticket and WhatsApp sales buttons on dashboard
- Advanced SEO settings tab in App Settings (canonical URL, robots, JSON-LD, social links)
- SEO metadata fields (meta title, description, OG) for Main Pages and Blog posts
- Media picker dialog for selecting featured images from storage in Blog editor
- Visit page (external link) buttons on published Main Pages and Blog posts
- SeoSettings component for global SEO configuration

### Changed
- Fixed Appearance settings save button not dismissing (useEffect cleanup bug with discardChanges ref)
- Renamed "Website Pages" to "Main Pages" in sidebar and page header
- Replaced language switcher Globe icon with Arabic letter "ع" icon
- Replaced generic Pixels & Tracking icons with company brand logos (Google, Meta, Snapchat, TikTok, Microsoft Clarity)
- Moved Activity Log from System to Developer category
- Removed System category (now empty)
- Version bumped to 3.7.0

## [3.6.0] - 2026-03-11

### Added
- Developer category in main menu with Error Documentation and Webhook Log
- Developer Mode toggle in Settings to show/hide Developer menu category
- Webhook Log page showing incoming webhook requests
- Media Manager redesigned: left folder navigation, right content panel with file detail sidebar
- Manage Roles: "View Only" button to dismiss blur overlay while keeping Coming Soon badge

### Changed
- Moved Media from Messages to Website category
- Moved Error Documentation from Messages to Developer category
- Re-added Coming Soon badge on Manage Roles (kept navigation enabled)
- Version bumped to 3.6.0

## [3.5.0] - 2026-03-11

### Added
- Media Manager: file upload (button + drag-and-drop), delete with confirmation, and open public file actions
- Media Manager: image thumbnail previews for files in public buckets
- Drag-and-drop overlay with visual feedback (animated bounce icon, dashed border)

### Changed
- Version bumped to 3.5.0

## [3.4.0] - 2026-03-11

### Added
- Media Manager page: browse Supabase storage buckets and files from the dashboard (admin-only, under Messages category)
- Time Format setting: toggle between 12-hour (AM/PM) and 24-hour display, placed beside Timezone in General Settings
- Skeleton loading animations on all data pages: Students, Teachers, Courses, Announcements, Notifications, Support, Admins, Timetable, Attendance, Reports, Invoices, Certificates, Subscriptions
- Manage Roles page now opens normally with a "Coming Soon" overlay instead of being blocked from navigation

### Changed
- Dashboard topbar is now sticky (stays visible when scrolling)
- Sidebar light mode text colors fixed for proper contrast across all themes
- Group chat member adding fixed: Select components now reset after adding a member, and already-added members are filtered from the dropdown
- Settings version bumped to v5 (adds timeFormat default)
- Version bumped to 3.3.0

## [3.2.0] - 2026-03-11

### Added
- Comprehensive error notification system: centralized bilingual error mapping with user-friendly messages and "View Details" action
- Error Details page (`/dashboard/error/:code`): full error context with category icon, description, suggestion, technical message, and timestamp
- Error Documentation page (`/dashboard/error-docs`): searchable reference of all system error codes grouped by category (Auth, Validation, Database, Network, Storage, General)
- Error Documentation link added to Messages sidebar category (admin-only)
- `notifyError()` helper replacing all raw `toast.error()` calls across ~19 files
- `errorMessages.ts` mapping Supabase error codes to bilingual (EN/AR) user-friendly messages with suggested fixes
- Error context stored in `sessionStorage` for rich detail page rendering
- Enhanced NotFound page with bilingual UI and navigation options

### Changed
- All `toast.error()` calls across auth, dashboard, and settings pages replaced with centralized `notifyError()` system
- Version bumped to 3.2.0

## [3.1.0] - 2026-03-10

### Added
- Certificate grid view with mini certificate preview cards and enhanced dropdown action menus
- Certificate preview dialog for viewing certificate details before printing/exporting
- Schedule picker component: select weekly days and lesson time when creating subscriptions
- Schedule picker integrated into both Subscription creation and Calculator flows
- Multi-member group chat: `chat_members` join table supporting multiple students and teachers per group
- Group chat creation now allows selecting multiple students and teachers via toggle buttons
- Group member management dialog with add/remove capabilities per member
- Skeleton loading states for all major data pages (Certificates, Subscriptions, Chats)
- `schedule_days` and `schedule_time` columns added to subscriptions table
- Subscription detail view now shows schedule information when available

### Changed
- Certificate action buttons consolidated into a clean dropdown menu (Print/Export by design, Delete)
- Group chat creation no longer requires a linked subscription (made optional)
- Chat list marks messages as read when entering a chat
- Version bumped to 3.1.0

## [3.0.0] - 2026-03-10

### Added
- "Manage Roles" sidebar item now shows "Coming Soon" badge (renamed from "Role Management")
- Dark mode logo: Upload a white/light logo variant for dark sidebar and dark mode
- Education System settings: 30 coming soon features organized in 3 tabs (10 Teacher, 10 Student, 10 Platform)
- Certificate grid view: Toggle between list and grid views with certificate design previews
- Certificate action buttons: Unified dropdown menu for print/PDF/delete actions per design
- Subscription creation: Schedule picker with weekly day selection and time slot
- Calculator: Schedule picker when creating subscriptions from calculator
- Chat notification badges: Unread message count shown on "Chats" item in sidebar
- New message notifications: Badge indicator beside new chat messages
- Loading screen: CSS-based loading spinner shown before React mounts
- Skeleton loading: Dashboard skeleton placeholders during auth loading
- Font preloading: Google Fonts preconnect and preload for faster initial render
- Auto-discard settings: Unsaved changes automatically discarded when leaving Settings page
- Group chat: Support for multiple students and multiple teachers via chat_members table

### Changed
- Sidebar light mode: Fixed text color contrast for all sidebar elements
- Sidebar logo: Uses dark mode logo variant when sidebar is in dark mode
- Settings version bumped to v4 (force-applies new defaults including dark logo)
- Version bumped to 3.0.0

### Security
- EXECUTE permissions on RLS helper functions re-granted to authenticated users

## [2.9.0] - 2026-03-10

### Added
- Admins page: Lists all admin users under the Users sidebar category
- Role Management page: Design-only page with preset roles (Admin, Teacher, Student as undeletable; Education Content Creator and Customer Support as deletable) with permissions matrix
- Education System settings: New settings tab with Chat Permissions (moved from General) and coming soon features (Homework, Exams, Grading, Auto Scheduling, Learning Paths)
- Calculator: Create Subscription button to generate a subscription from calculated pricing data with searchable student/course/teacher selectors
- Announcements: "Everyone" badge displayed when target audience is all users

### Changed
- Landing page navbar: Fully redesigned with left-aligned logo + nav links and right-aligned actions (cleaner structure)
- Settings save/discard bar: Now fixed at bottom center of screen, always visible when scrolling
- Sidebar Mode renamed to "Main Menu Mode" in Appearance settings
- Action buttons: Reduced to h-8 w-8 with h-3.5 icons across Courses, Teachers, Students, Timetable, and Support pages (matching Invoices)
- Appearance settings: Changes now apply instantly for preview (color theme, button shape, fonts, sidebar mode) without saving — reverted on discard
- Chat Permissions moved from General Settings to new Education System tab
- RTL switch toggle: Fixed white dot positioning with `direction: ltr` override
- Version bumped to 2.9.0

## [2.8.0] - 2026-03-10

### Added
- Calculator page: Standalone finance calculator in sidebar under Finance category with bi-directional price rate/total calculation
- Certificate creation: Searchable combobox dropdowns for recipient and course selection
- Group chat: View group members dialog and redesigned chat header with avatar and member info
- Default signature and stamp images for invoice branding
- Default pricing packages: PayPal and Paymob payment methods enabled by default on public invoice page

### Changed
- Switch components: Forced circular rounded style (`!rounded-full`) regardless of button shape setting
- Arabic text inputs: Right-aligned (`text-right`) in courses, certificates, and announcements creation forms
- Announcement cards: Date and time restyled with Badge components instead of plain text
- Action icon buttons: Unified `rounded-full hover:bg-muted` style across Courses, Timetable, Certificates, Support, Teachers, and Students pages
- Invoice public page: Payment methods now default to PayPal + Paymob when no localStorage config exists
- Invoice public page: Default signature and stamp images shown from `/signature.png` and `/stamp.jpg`
- Settings version bumped to v3 to force-apply new defaults (signature, stamp)
- Version bumped to 2.8.0

## [2.7.0] - 2026-03-10

### Added
- Invoice editing: Admin can edit invoice status, amount, due date, and notes after creation
- Subscription pricing: Price Rate/hr and Total Price fields with automatic bi-directional calculation
- Invoice view: Subscription price shown as old/strikethrough price when discounted
- Invoice view: Favicon and logo loaded from app settings, footer shows app name from settings
- Invoice view: Active payment methods loaded from app settings

### Changed
- Landing page: Logout button merged inside the profile element as a single unified component
- Dashboard action icon buttons: Unified hover style (rounded-full with muted hover) across all pages
- Subscription creation: Search bars moved inside dropdown lists (combobox pattern)
- Subscription creation: Start date and renewal date side-by-side at 50% width, removed "auto-calculated" text
- Subscription detail dialog: Unified view/edit in single layout without content duplication
- Timezone settings: Search moved inside the dropdown using combobox pattern
- Version bumped to 2.7.0

## [2.6.0] - 2026-03-10

### Added
- Invoice deletion: Admin can delete invoices from the actions column with confirmation dialog
- Dashboard overview: Added "Invoices" and "Pending Invoices" cards to the overview section
- Landing page: Added logout icon button next to the user profile in the navbar
- Invoice view: Both original price and sale price are now clearly displayed when a discount is applied

### Changed
- Auth page logo: Displayed as full image instead of circular/clipped
- Dashboard sidebar logo: Displayed as full image instead of rounded square
- Invoice view logo: App logo now renders as full image
- TopBar icon buttons: Improved hover effect colors using semantic design tokens
- Message deletion: Deleted messages stay in original order without re-fetching (preserves position and timestamp)
- Timezone settings: Fixed selector — current value always visible, search works correctly with scrollable content
- Subscription editing: Teacher and course assignments can now be edited on existing subscriptions
- Version bumped to 2.6.0

## [2.5.0] - 2026-03-10

### Added
- Dashboard: Sales Performance bar chart and Attendance Performance pie chart (side-by-side)
- Course image upload when creating/editing courses (stored in course-images bucket)
- Status tab filters on Courses, Timetable, Certificates, Support, Subscriptions, and Reports pages
- Delete buttons with confirmation dialogs on Students, Teachers, Courses, Invoices, Timetable, Certificates, Support, Subscriptions, Announcements, and Chats pages
- Editable profile fields (name, phone, email) in Student and Teacher detail dialogs
- Default timezone setting in General Settings
- Timezone-based backup naming (HH-MM-SS format)
- Backup comment/note field shown in backup list
- "Delete Database Tables Data" option in Data Management (resets all table data)
- Searchable subscription dropdowns (student/course/teacher) with search input
- Auto-calculated renewal date based on subscription type
- Weekly lessons and lesson duration fields in subscription creation
- "View" action button on invoice table rows
- Original price and sale price display on invoice view page
- Invoice view: full logo image, removed app name text
- Red notification/announcement badges in TopBar
- Landing page button on Login page
- App name fallback in sidebar when no logo is set
- Human-readable status labels across all pages (Support, Subscriptions, Reports)
- "Pricing Packages" renamed from "SaaS Pricing" in Settings
- Authentication settings: Google, Facebook, Microsoft providers with brand logos
- View invoice button in invoice list redirecting to invoice URL

### Changed
- Dashboard now has configurable "Performance Graphs" section at the top
- Backup names include time (HH-MM-SS) based on app timezone
- Subscription creation: course/student not required, supports weekly lessons and lesson duration
- Version bumped to 2.5.0

### Security
- Lesson content and course sections restricted to enrolled users via RLS policies
- `is_enrolled_in_course` security definer function for subscription-based access control

## [2.2.0] - 2026-03-10

### Added
- 5 new color themes: Rose Garden, Teal Breeze, Amber Glow, Slate Steel, Crimson Fire
- OG image upload support in Landing Page settings (upload or URL)
- Separated SEO and Open Graph into distinct bordered sections in General & SEO tab
- Selective backup: choose which tables to include when creating a backup
- Erase operations (sample data and all data) now log reports to View Log history
- Course auto-populated from subscription when creating invoices

### Changed
- CodeCom.dev copyright link no longer has underline
- Invoice creation shows assigned course from subscription (read-only) instead of course dropdown
- View Log button opens log directly without re-querying database
- Removed Export/Import Settings tab from App Settings
- Version bumped to 2.2.0

### Security
- RPC `get_invoice_by_share_token` now returns limited columns (excludes `share_token`, `subscription_id`, `updated_at`)
- Edge functions return generic error messages instead of raw `err.message`

## [2.1.0] - 2026-03-10

### Added
- Confirmation dialog before erasing sample data
- Persistent log history for seed/erase operations (stored in localStorage)
- "View Log" button always visible, scans for sample data and shows full history
- "Clear Log" option in log dialog
- "Backups" settings tab (coming soon placeholder)
- "Export/Import Setup" settings tab (coming soon placeholder)
- "Home" nav link on landing page that scrolls to top

### Changed
- App Logo now displays at full aspect ratio (not forced square) in Settings and Landing Page
- Landing page navbar shows logo only (no app name text)
- Landing page Home button in TopBar now opens in a new tab
- Erase All Data warning text now lists all affected tables explicitly
- Erase sample data now logs operations to persistent history
- Version bumped to 2.1.0

### Fixed
- "Erase All Data" button was not performing the actual deletion (clear_all action)
- "Erase Sample Data" had no confirmation before executing

## [2.0.0] - 2026-03-10

### Added
- Global `ErrorBoundary` component to prevent white-screen crashes
- JSON-LD structured data for SEO (WebApplication schema)
- Canonical URL and full Open Graph / Twitter Card metadata
- `share_token` column on invoices for secure public link sharing
- `get_invoice_by_share_token` RPC function for unauthenticated invoice access

### Changed
- Invoice public URLs now use `?token=` query param for secure access
- SEO title updated to keyword-rich format (<60 chars)
- Meta description expanded with actionable copy (<160 chars)

### Security
- **CRITICAL**: Removed dangerous anon RLS policy (`USING (true)`) on invoices table — was exposing all student PII and financial data to unauthenticated users
- Enabled Row Level Security on `pricing_packages` and `landing_content` tables (policies existed but RLS was not enabled)
- Draft courses now hidden from students (only published courses visible to non-admin/teacher roles)
- Added error handling to `AppSettingsContext` to prevent provider crashes from corrupt localStorage

### Fixed
- `useAppSettings must be used within AppSettingsProvider` crash caused by corrupt localStorage JSON

## [1.9.0] - 2026-03-10

### Added
- Language switcher on Landing Page (EN/AR toggle)
- Home button in dashboard TopBar to navigate to Landing Page
- Logout icon button in sidebar profile section
- Invoice creation: original price, sale price, and course selection fields
- Public invoice page (`/invoice/:id`) shows app branding (logo + name)
- Payment method selection on public invoice page with "Pay Now" action

### Changed
- Removed profile icon from TopBar (moved to sidebar)
- Invoice preview dialog no longer shows payment methods (moved to public page)
- Logout moved from TopBar dropdown to sidebar as inline icon

## [1.8.0] - 2026-03-10

### Added
- Decimal Places dropdown now shows inline examples (e.g., `2 — $1234.57`)
- Favicon upload field in Settings > Appearance > Branding
- Dynamic favicon updates via `useEffect` hook
- "Get Started" button on Landing Page (replaces Login/Signup buttons)
- Authenticated users see avatar + name on Landing Page (click navigates to dashboard)
- App Name & App Description moved to General Settings

### Changed
- Sidebar header shows only app logo (centered), no text name
- Dashboard "Upcoming Lessons" and "Recent Subscriptions" widgets side-by-side (50% width)
- Sorting (Newest/Oldest) added to Support Help Center and Chats pages
- Sort button height matched to adjacent search bar (`h-9`)

## [1.6.3] - 2026-03-10

### Added
- Signature image upload field in Settings > Appearance > Branding
- Stamp image upload field in Settings > Appearance > Branding
- Signature and stamp images displayed in invoice preview footer
- Both images stored in Supabase avatars bucket under `branding/` prefix

## [1.6.2] - 2026-03-10

### Changed
- Pagination aligned to the right side with "Showing X to Y of Z" on a single line
- Pagination active page now uses primary color (`default` variant) instead of outline
- Chat body background now uses the same Islamic pattern effect as the auth pages
- Removed time sorting button from Attendance page

### Fixed
- "Showing X to Y" text wrapping to two lines (added `whitespace-nowrap`)

## [1.6.1] - 2026-03-10

### Added
- Public invoice view page at `/invoice/:id` — accessible via copied invoice URL
- Invoice not-found state with friendly error message
- Print support on public invoice page

### Fixed
- Invoice "Copy URL" now resolves to a working page instead of a 404

## [1.6.0] - 2026-03-10

### Added
- Custom app favicon (Islamic educational theme icon)
- Sort toggle (newest/oldest) on Attendance, Timetable, Certificates, Reports, Invoices, and Subscriptions pages
- Timetable calendar redesigned with custom grid layout (monthly & weekly views)
- Monthly/weekly timeframe toggle on Timetable calendar view
- Navigation controls (prev/next/today) on calendar
- Lesson count indicators (dots) on calendar day cells
- Pagination on Timetable list view (upcoming & past tabs)

### Changed
- Timetable calendar replaced with custom-built responsive calendar grid
- Calendar day cells show lesson dot indicators instead of simple highlighting
- Weekly view shows 7-day strip with lesson details panel

## [1.5.0] - 2026-03-10

### Added
- Font search functionality in Appearance settings with popover picker
- Custom font option — add any Google Font by name for LTR or RTL
- Seed data log dialog showing detailed record counts per table
- 3-step confirmation flow for Erase All Data feature
- Payment gateway activate/deactivate toggle per gateway
- API key input fields per payment gateway (stored server-side)
- Eye/hide toggle for secret API fields
- Payment gateway logos (PayPal, Stripe, Fawaterak, Xpay, Paymob)

### Changed
- Button shape setting now only affects buttons and inputs, not all elements (cards, sections, etc.)
- Decimal Places selector redesigned with proper RadioGroup component
- Payment Methods redesigned with per-gateway activation and API configuration
- "Clear All Data" renamed to "Erase All Data" with 3-step confirmation (warning → backup → final input)
- Confirmation code changed from "DELETE NOW" to "ERASE NOW"
- Font picker changed from Select dropdown to searchable Popover with preview

### Fixed
- Circular button shape was applying `border-radius: 9999px` to all elements (cards, sections, dropdowns)
- Font preview not rendering correctly when switching fonts

## [1.4.0] - 2026-03-10

### Added
- Numeric pagination (20 rows per page) across all list pages
- Reusable `usePagination` hook and `PaginationControls` component
- Chat message avatars beside each message bubble
- Islamic background texture in chat body (matches auth pages)
- "Showing X to Y of Z" pagination info text

### Changed
- Settings page secondary menu changed to vertical sidebar layout
- Settings tabs reordered: General → Appearance → Authentication → Payment Methods → Data Management
- Appearance settings reordered: Branding first, then Color Theme, Button Shape, Fonts
- Chat message deletion now replaces text with "deleted by admin/teacher" instead of hiding
- Both admins and teachers can now delete chat messages
- Search bars moved inline beside create buttons on all list pages
- All deleted messages remain visible with italic styling

### Fixed
- Chat messages were fully hidden on delete instead of showing deletion notice

## [1.3.0] - 2026-03-10

### Added
- Invoice page redesign with stats cards, status filter tabs, and professional preview dialog
- Payment methods section with "Pay Now" button in invoice preview
- Invoice signature/stamp footer for branding
- Mobile card layout for invoices table
- Search bars on Certificates, Chats, and Notifications pages
- Settings page with tabbed secondary menu (Appearance, Payment, Data, Auth, General)
- Appearance settings: color theme, button shape, fonts, branding
- Authentication settings with OAuth provider links
- General settings: currency and teacher chat permissions

## [1.2.0] - 2026-03-09

### Added
- Announcements page with full CRUD and detail popup
- Notifications page with mark-read and navigation
- Forgot Password page as standalone auth page
- Button shape setting in App Settings
- Certificate design selection with isolated print window
- Support ticket detail UI with tabbed layout
- Dashboard widget toggle for 12 individual widgets
- Custom scrollbar styling matching dashboard theme

### Changed
- Sidebar menu reordered
- All RLS policies converted from RESTRICTIVE to PERMISSIVE

## [1.1.0] - 2026-03-09

### Added
- Monthly Recurring Income stat card
- Lessons calendar with day-by-day lesson view
- Version management system and changelog
- Copyright footer
- Modern Islamic-themed auth pages

### Security
- Hardened RLS policies
- Role assignment locked to database trigger

## [1.0.0] - 2026-03-08

### Added
- Initial release of EduDash Islamic Educational Platform
