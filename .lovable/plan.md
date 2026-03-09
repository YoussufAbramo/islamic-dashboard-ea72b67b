# Implementation Plan

This is a large set of changes covering user management, UI polish, new pages, bug fixes, and data seeding. Here is the structured plan organized by priority:

---

## 1. User Email Updates & Admin Cleanup

**Database changes** (via edge function or direct update):

- Update `student@test.com` → `student@codecom.dev` in auth.users (requires edge function with admin API)
- Update `teacher@test.com` → `teacher@codecom.dev` in auth.users
- Keep `admin@codecom.dev`, remove `admin@edudash.com` / `me@abramo.xyz` admin accounts
- Update corresponding `profiles` table emails
- Update `Login.tsx` TEST_ACCOUNTS to use new `@codecom.dev` emails

**Edge function**: Create `manage-accounts` function to update user emails and delete extra admin users via Supabase Admin API.

---

## 2. Sidebar Menu Reorder

Reorder categories in `AppSidebar.tsx` to: **Overview → Educate → Messages → Users → Finance**

Add new menu items:

- **Announcements** → `/dashboard/announcements` (all roles) add it inside Messages category
- **Notifications** → `/dashboard/notifications` (all roles) add it inside Messages category

---

## 3. New Pages: Announcements & Notifications

`**src/pages/Announcements.tsx**`: Full page listing all announcements with detail popup on click. Admin can create/edit/delete. Shows title, content, audience, date.

`**src/pages/Notifications.tsx**`: Full page listing all notifications with mark-read. Clicking a notification navigates to related page based on `link` field.

**TopBar updates**:

- Add "View All" button in announcements dropdown → navigates to `/dashboard/announcements`
- Add "View All" button in notifications dropdown → navigates to `/dashboard/notifications`
- Clicking an announcement opens a detail popup (Dialog) showing full content
- Clicking a notification navigates to its `link` field URL
- Move badge position: change from `-top-1 -right-1` to `top-0 right-0` (slightly lower)

**Routes**: Add both to `App.tsx`.

---

## 4. Dashboard Enhancements

**Clickable widgets**: Wrap `StatCard` with `onClick` → navigate to related page (e.g., courses→`/dashboard/courses`, students→`/dashboard/students`).

**More widgets** with individual toggle control:

- `topStudents` — Top performing students
- `recentSubscriptions` — Latest subscription activity
- `upcomingLessons` — Next 5 scheduled lessons
- `supportOverview` — Open tickets summary
- `teacherOverview` — Teacher workload summary

Each widget gets its own show/hide toggle in edit mode.

**Fix teachers/students not showing**: The RLS policies are RESTRICTIVE — this is the recurring issue. Need migration to convert all RESTRICTIVE policies to PERMISSIVE.

**Calendar style**: Improve calendar card with colored dots per status, gradient header, and styled day cells.

---

## 5. Auth Page Fixes

**Corner textures**: Replace the simple SVG arcs with more refined Islamic geometric patterns (star/arabesque patterns).

**Fix admin quick login**: Current admin password in TEST_ACCOUNTS is `admin123456` but the actual password for `admin@codecom.dev` is `test12345678`. Update TEST_ACCOUNTS to match.

**Forgot password**: Convert to a link to `/forgot-password` (new route) with its own page showing email input and send reset link button, styled like login page.

---

## 6. Scrollbar Styling

Add custom scrollbar CSS in `index.css` matching the dashboard theme — thin, primary-colored thumb, transparent track. Apply via `::-webkit-scrollbar` and `scrollbar-*` properties.

---

## 7. Settings: Button Shape Option

Add to `AppSettingsContext`:

- `buttonShape: 'rounded' | 'circular' | 'square'`
- Persist to localStorage, apply via CSS variable `--radius` changes or a class on `<html>`

In `Settings.tsx`: Add a "Button Shape" card with 3 visual options.

In `index.css`: Add `.btn-square { --radius: 0 }`, `.btn-circular { --radius: 9999px }`, `.btn-rounded { --radius: 0.5rem }` applied to root.

---

## 8. Support Ticket Detail UI Enhancement

Redesign the detail dialog in `Support.tsx`:

- Tabbed layout: Details | Notes | Contact
- **Notes tab**: Add textarea for resolution_notes with save button
- **Contact tab**: WhatsApp button (opens `wa.me/{phone}`), Email button (opens `mailto:{email}`)
- Better visual hierarchy with icons, badges, and dividers

---

## 9. Timetable Sample Data

Insert 5 timetable entries via edge function or SQL referencing existing students/teachers/courses with dates spread across current and next week.

---

## 10. Certificate Print Fix & Design Selection

**Print fix**: The `window.print()` prints everything. Fix by:

- Adding proper `@media print` CSS: hide everything except `.print-certificate`
- Use a dedicated print class on the certificate container
- Alternatively, open certificate in a new window and print that

**Design selection**: Add 3 certificate templates (Classic, Modern, Elegant) with different border styles, colors, and layouts. Store selection in certificate creation form.

---

## 11. Forgot Password Page

Create `src/pages/ForgotPassword.tsx`:

- Standalone auth-styled page at `/forgot-password`
- Email input + submit button
- Calls `supabase.auth.resetPasswordForEmail`
- Success/error toast feedback
- Link back to login

Update `Login.tsx`: Change "Forgot password?" from inline handler to `<Link to="/forgot-password">`.

---

## 12. Font Preview Fix in Settings

Current issue: Font preview text uses `style={{ fontFamily }}` but fonts aren't loaded. Fix:

- In `Settings.tsx` only, dynamically load a Google Fonts `<link>` tag when the settings page mounts, loading ALL 20 fonts (10 LTR + 10 RTL)
- On unmount, remove the link tag to avoid polluting the global app
- This way previews work but fonts don't bloat the main app bundle
- The main app only loads the 2 selected fonts (already handled by `AppSettingsContext`)

---

## 13. RLS Policy Fix (Critical)

All policies are still RESTRICTIVE. Run migration to:

- Drop and recreate all multi-SELECT policies as PERMISSIVE
- This fixes: students/teachers not showing in dashboard, data visibility issues across the app

---

## **Summary of Files**

after each new edits, update changelog file and add all edited and added things inside it.


| Area          | Files                                                                         |
| ------------- | ----------------------------------------------------------------------------- |
| Edge function | New `manage-accounts/index.ts` for email updates                              |
| Migration     | Fix RLS RESTRICTIVE→PERMISSIVE, sample timetable data                         |
| Sidebar       | `AppSidebar.tsx` — reorder, add Announcements/Notifications                   |
| New pages     | `Announcements.tsx`, `Notifications.tsx`, `ForgotPassword.tsx`                |
| TopBar        | Badge position, View All buttons, announcement popup, notification navigation |
| Dashboard     | `Dashboard.tsx` — clickable widgets, more widgets, calendar restyle           |
| Login         | `Login.tsx` — fix corners, fix admin credentials, forgot password link        |
| Settings      | `Settings.tsx` + `AppSettingsContext.tsx` — button shape, font preview fix    |
| Support       | `Support.tsx` — enhanced detail dialog with notes & contact                   |
| Certificates  | `Certificates.tsx` — print fix, design templates                              |
| CSS           | `index.css` — scrollbar, button shapes, print styles                          |
| Routes        | `App.tsx` — add announcements, notifications, forgot-password                 |
