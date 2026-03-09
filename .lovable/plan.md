# Implementation Plan

This is a large set of changes spanning sidebar restructuring, sample data seeding, new features (certificates, reports, progress tracking, PWA), and RTL font improvements. Here is the structured plan:

---

## 1. Sidebar Restructure & App Settings Page

**Sidebar changes** (`AppSidebar.tsx`):

- Remove the collapsible "App Settings" section from the sidebar
- Add a new "Settings" menu item (gear icon) above the user profile card at the bottom, linking to `/dashboard/settings`
- Remove the copyright text from sidebar footer (keep only user avatar/name/role)
- if the sidebar collapse/expand button is turned on for collapsing, the sidebar should be partially disappeared showing only the icons making them more bigger

**New Settings page** (`src/pages/Settings.tsx`):

- Route: `/dashboard/settings` added to `App.tsx`
- Sections:
  1. **Theme Selector**: Multiple color themes (not just dark/light). Offer 4-5 named themes (e.g., "Emerald Gold" (current), "Ocean Blue", "Royal Purple", "Desert Sand", "Midnight"). Each theme sets different CSS variable values. Store in `AppSettingsContext` + localStorage.
  2. **App Branding**: Ability to change logo (upload to avatars bucket under `branding/` path), app name, app description. Stored in localStorage (no DB needed since single-tenant).
  3. **Currency**: Name + Symbol selector (already exists in context, move UI here).

**AppSettingsContext changes**: Add `theme` (color theme name), `appName`, `appDescription`, `appLogo` state persisted to localStorage.

**CSS changes** (`index.css`): Add additional theme classes (`.theme-ocean`, `.theme-purple`, `.theme-desert`, `.theme-midnight`) with different CSS variable values. Applied to root via context.

---

## 2. RTL Font Fix

**Change** (`index.css`): Replace Amiri with `Cairo` or `Noto Kufi Arabic` for RTL — these are much more legible for UI text. Import via Google Fonts. Update the `[dir="rtl"] body` rule.

---

## 3. Sample Data Migration

Insert sample data via a SQL migration (using service role to bypass RLS). Data for all tables, max 5 rows each. This needs to be done carefully — we need existing user IDs for foreign keys.

**Approach**: Use the `manage-users` edge function context. Instead, create a dedicated SQL seed migration that:

- Creates 5 courses (with Arabic titles)
- Creates 5 timetable entries (using existing teacher/student IDs or NULL-safe references)
- Creates 5 subscriptions
- Creates 5 attendance records  
- Creates 5 support tickets
- Creates 5 announcements
- Creates 5 chat messages across existing chats
- Uses `ON CONFLICT DO NOTHING` to be idempotent

Since we don't know exact user IDs, we'll reference them dynamically: `(SELECT id FROM students LIMIT 1)`, `(SELECT id FROM teachers LIMIT 1)`, etc. If no users exist yet, we'll create placeholder courses/announcements that don't require FK references.

---

## 4. Certificates Feature

**New DB table** (`certificates`):

- `id` uuid PK
- `recipient_id` uuid (references profiles.id)
- `recipient_type` text ('student' | 'teacher')
- `title` text
- `title_ar` text
- `description` text
- `issued_at` timestamptz default now()
- `issued_by` uuid (admin user)
- `course_id` uuid nullable (FK to courses)
- `certificate_number` text (auto-generated)
- `status` text default 'active'

**RLS**: Admin can manage all, users can view own.

**New page** (`src/pages/Certificates.tsx`):

- Route: `/dashboard/certificates`
- Sidebar menu item for admin
- Admin view: list all certificates, create new (select recipient type, user, course, title/description)
- Student/teacher view: see own certificates
- Generate a printable certificate view (simple styled div with `window.print()`)

---

## 5. Student Progress Tracking

**New DB table** (`student_progress`):

- `id` uuid PK
- `student_id` uuid (FK to students.id)
- `lesson_id` uuid (FK to lessons.id)
- `completed` boolean default false
- `completed_at` timestamptz nullable
- `score` integer nullable (0-100)
- created_at

**RLS**: Admin full, teachers can view assigned students, students can view/update own.

**UI changes**:

- Add a "Progress" tab in `CourseDetail.tsx` showing per-lesson completion status (checkmarks)
- Add progress bars to `Dashboard.tsx` for student role showing course completion %
- Students can mark lessons as completed

---

## 6. Reports & Analytics Page

**New page** (`src/pages/Reports.tsx`):

- Route: `/dashboard/reports`
- Sidebar item for admin
- Tabs: Subscriptions, Attendance, Finances
- Each tab shows summary stats + a table
- Export buttons:
  - CSV: Generate client-side using `Blob` and `URL.createObjectURL`
  - PDF: Use browser `window.print()` with a print-friendly styled view (no external library needed)

---

## 7. PWA Support

**Files to create**:

- `public/manifest.json`: App name, icons, theme color, display: standalone
- `public/icons/`: Generate PWA icons (192x192, 512x512) — use placeholder SVG-based icons
- `src/sw.ts` or inline registration in `main.tsx`: Basic service worker for offline caching

**Changes**:

- `index.html`: Add `<link rel="manifest">` and meta tags for PWA
- `main.tsx`: Register service worker
- `vite.config.ts`: No special plugin needed for basic SW

---

## 8. Navigation & Routing Updates

Add to `App.tsx`:

- `/dashboard/settings` → `<Settings />`
- `/dashboard/certificates` → `<Certificates />`
- `/dashboard/reports` → `<Reports />`

Add to `AppSidebar.tsx` menu items:

- Settings (gear icon, all roles, above user profile)
- Certificates (award icon, all roles)
- Reports (bar chart icon, admin only)

---

## 9. Translation Keys

Add ~40 new keys to `LanguageContext.tsx` for: settings page labels, certificates, reports, progress tracking, PWA install prompt.

---

## **10. Top Bar Edits**

- The announcement in top bar must show 3 buttons for super admin (view all, read all, add new), and it should shows only view all and read all for teachers and students, the add new feature allows to type "title, message, announced to teacher or students or both, schedule of announcement by time and date.".
- The notification should has view all and read all.

---

## Summary of Files


| File                         | Change                                                                                 |
| ---------------------------- | -------------------------------------------------------------------------------------- |
| SQL Migration                | Create `certificates`, `student_progress` tables + seed data                           |
| `index.css`                  | Add Cairo font import, color theme classes                                             |
| `AppSettingsContext.tsx`     | Add theme, branding state                                                              |
| `AppSidebar.tsx`             | Remove settings collapsible, add Settings/Certificates/Reports links, remove copyright |
| `App.tsx`                    | Add 3 new routes                                                                       |
| `src/pages/Settings.tsx`     | New — full settings page                                                               |
| `src/pages/Certificates.tsx` | New — certificates management                                                          |
| `src/pages/Reports.tsx`      | New — reports with CSV/PDF export                                                      |
| `src/pages/CourseDetail.tsx` | Add progress tracking tab                                                              |
| `src/pages/Dashboard.tsx`    | Add progress bars for students                                                         |
| `LanguageContext.tsx`        | New translation keys                                                                   |
| `public/manifest.json`       | New — PWA manifest                                                                     |
| `index.html`                 | PWA meta tags                                                                          |
| `main.tsx`                   | Service worker registration                                                            |


---

## Testing Prompt (to be provided after implementation)

A comprehensive end-to-end testing script will be provided covering all features: login, sidebar navigation, settings page, CRUD operations, certificates, reports export, progress tracking, RTL mode, theme switching, and PWA installation.