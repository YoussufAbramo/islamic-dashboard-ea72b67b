# Implementation Plan: Version 2.5.0 - Comprehensive Feature Update

This plan covers all requested changes organized into logical groups. Given the scope (~20 changes across 15+ files), I'll address each one systematically.

in dashboard home page, make two sections beside each other with 50% that shows graphs for sales, and attendance performance.

---

## 1. UI Fixes & Styling

### 1a. Red notification/announcement badges (TopBar.tsx)

- Change the `Badge` on announcements and notifications counters to use `className="... bg-red-500 text-white border-red-500"` (currently uses default primary color).

### 1b. Login page: restyle landing page button, move above "Log In"

- Currently there is no landing page button on the Login page. Add a styled "Landing Page" link/button above the "Log In" heading inside the Card, before `<CardHeader>`.

### 1c. Sidebar: show app name when logo not found

- In `AppSidebar.tsx` line 102, when `!appLogo`, instead of showing `BookOpen` icon, show `appName` text (from `useAppSettings`). Already has `appName` available but unused -- show it as styled text.

### 1d. Fix status text displaying raw values

Across these pages, status badges show raw DB values like `in_progress`, `active`, `open` instead of human-readable labels:

- **Support.tsx** (lines 174-175): `ticket.priority` and `ticket.status` shown raw. Add label maps: `{ open: 'Open', in_progress: 'In Progress', resolved: 'Resolved', closed: 'Closed' }` and similar for priority with AR translations.
- **Subscriptions.tsx** (line 157): `sub.subscription_type` shown raw, and line 158 `sub.status` shown raw. Map to readable labels.
- **Reports.tsx** (lines 137-138): `s.subscription_type` and `s.status` raw. Same mapping.
- **Invoices/InvoiceTable.tsx**: Already has proper `statusConfig` -- OK. But `billing_cycle` line 133 already mapped -- OK.

### 1e. Chat message delete: keep original order

- In `Chats.tsx` `deleteMessage` function (line 88-94), the update sets `is_deleted: true` and changes the `message` text. The issue is that `fetchMessages` likely re-sorts by `created_at`. Need to verify the update doesn't change `created_at`. The Supabase `.update()` doesn't change `created_at` unless there's a trigger. The issue is likely that the messages table has no `updated_at` being used for sorting. Will verify the fetch query sorts by `created_at` ascending (which should be stable). If the issue is that re-fetching after delete reorders, ensure we don't update `created_at`. This should already work -- the `created_at` has a default of `now()` only on INSERT, not UPDATE.

---

## 2. Invoice Changes

### 2a. InvoiceView.tsx: Remove app name text, make logo full image, show original + sale price

- Remove the `<h2>` with `appName` text (line 167).
- Make the logo image larger (full width header style).
- Show original price (strikethrough) and sale price if different from amount. This requires the invoice to store both. Currently `invoices` table only has `amount`. Will add display logic: if `notes` contains original price info or we add columns. Since this is a display-only change and the create form already has `original_price` and `sale_price` fields but they get merged into `amount`, we need to store both. **Migration needed**: add `original_price` and `sale_price` columns to `invoices` table, and update the insert logic.

### 2b. InvoiceTable.tsx: Add "View" action button

- Add a view button that navigates to `/invoice/${inv.id}?token=${inv.share_token}` using `window.open` or `useNavigate`.

---

## 3. Settings Changes

### 3a. Rename "SaaS Pricing" to "Pricing Packages" (Settings.tsx)

- Change label on line ~36 from `'SaaS Pricing'` to `'Pricing Packages'` and Arabic equivalent.

### 3b. Authentication settings: replace icons with logos, remove Apple/GitHub, keep Google, add Facebook/Microsoft

- In `AuthenticationSettings.tsx`, update the `providers` array: remove Apple and GitHub entries, keep Google, add Facebook and Microsoft. Replace emoji icons with actual brand logo images/SVGs.

### 3c. General Settings: add default timezone

- Add a timezone selector card to `GeneralSettings.tsx`. Store in `pending.defaultTimezone` via `AppSettingsContext`. Use `Intl.supportedValuesOf('timeZone')` for the timezone list.
- Update `PendingSettings` interface and `loadSaved` in `AppSettingsContext.tsx` to include `defaultTimezone`.

### 3d. Data Management: add "Delete Database Tables Data" option

- Add a new section in `DataManagementCard.tsx` with a button to delete all entries in all tables. Include a warning note that this is typically used after testing. Use same edge function `manage-accounts` with a new action `clear_tables` that deletes all rows from all tables (not just sample data, and not deleting auth users).
- Update `manage-accounts/index.ts` to add the `clear_tables` action.

---

## 4. Backup Improvements

### 4a. Include time in backup name (HH24-MM-SS format based on app timezone)

- In `BackupsSettings.tsx`, auto-generate backup name with timestamp using the app's default timezone setting.

### 4b. Add comment/note field for backups

- Add a `comment` input in the create backup dialog. Pass it to the edge function. The edge function can store the comment as part of the file metadata or prepend it to the filename. Since Supabase Storage metadata is limited, store comments in localStorage or as a JSON manifest alongside backups.

---

## 5. Course Image Upload

### 5a. Allow setting course image when creating/editing

- **Migration**: Add `image_url` column to `courses` table.
- Update `Courses.tsx` create/edit dialog to include an image upload field. Upload to a new `course-images` storage bucket.
- **Migration**: Create `course-images` storage bucket.

---

## 6. Delete Functionality (Frontend)

### 6a. Add delete buttons across pages

Add trash/delete buttons to: Students, Teachers, Courses, Subscriptions, Invoices, Certificates, Support Tickets, Timetable entries, Announcements, Chats.

- Each table row gets a delete icon button (admin only).
- Confirmation dialog before delete.
- Call `supabase.from(table).delete().eq('id', id)` then refresh.

---

## 7. Subscription Enhancements

### 7a. Edit subscription: allow editing teacher and course

- In `Subscriptions.tsx` detail dialog edit mode, add teacher and course selects (fetch teachers/courses lists). Update the `saveEdit` to include `teacher_id` and `course_id`.

### 7b. Create subscription: course/student not required, add weekly lessons + duration

- Remove the required validation for `student_id` and `course_id`.
- Add `weekly_lessons` and `lesson_duration` fields to the create form.
- **Migration**: Add `weekly_lessons` (integer, default 1) and `lesson_duration` (integer, default 60) columns to `subscriptions` table.

### 7c. Create subscription: searchable dropdowns for student/course/teacher

- Replace `Select` components with `Command`-based combobox (search + select pattern using cmdk which is already installed).

### 7d. Create subscription: auto-calculate renewal date

- When `subscription_type` changes or `start_date` changes, auto-compute `renewal_date` = start_date + 30 days (monthly) or + 365 days (yearly).

---

## 8. Status Filters (Like Invoices)

### 8a. Add status tab filters to:

- **Courses**: filter by `draft`/`published`/`archived`
- **Timetable**: filter by `scheduled`/`completed`/`cancelled`
- **Certificates**: filter by `status` (active/revoked)
- **Support**: filter by `open`/`in_progress`/`resolved`/`closed`
- **Reports**: add status filter to subscriptions tab (`active`/`expired`/`cancelled`)
- **Subscriptions**: filter by `active`/`expired`/`cancelled`

Each will use the same `Tabs` + `Badge` count pattern from Invoices.

---

## 9. Student/Teacher Edit Enhancement

### 9a. Editable profile fields (name, phone, email) in detail dialogs

- In `Students.tsx` and `Teachers.tsx` detail dialogs, make profile fields (full_name, phone, email) editable in edit mode. Update both `profiles` and entity-specific tables on save.

---

## 10. Version Update

### 10a. Bump to v2.5.0

- Update `src/lib/version.ts` to `2.5.0`.
- Update `CHANGELOG.md` with all changes.

---

## Database Migrations Required

1. **Add `original_price` and `sale_price` to `invoices**`: `ALTER TABLE invoices ADD COLUMN original_price numeric DEFAULT NULL, ADD COLUMN sale_price numeric DEFAULT NULL;`
2. **Add `image_url` to `courses**`: `ALTER TABLE courses ADD COLUMN image_url text DEFAULT '';`
3. **Add `weekly_lessons` and `lesson_duration` to `subscriptions**`: `ALTER TABLE subscriptions ADD COLUMN weekly_lessons integer DEFAULT 1, ADD COLUMN lesson_duration integer DEFAULT 60;`
4. **Create `course-images` storage bucket**: `INSERT INTO storage.buckets (id, name, public) VALUES ('course-images', 'course-images', true);` + RLS policies.

## Edge Function Updates

- `manage-accounts/index.ts`: Add `clear_tables` action that truncates all table data.

## Files to Create/Modify


| File                                                 | Action                                                                       |
| ---------------------------------------------------- | ---------------------------------------------------------------------------- |
| `src/components/layout/TopBar.tsx`                   | Red badges                                                                   |
| `src/pages/Login.tsx`                                | Landing page button                                                          |
| `src/components/layout/AppSidebar.tsx`               | App name fallback                                                            |
| `src/pages/Support.tsx`                              | Status labels + filters + delete                                             |
| `src/pages/Subscriptions.tsx`                        | Status labels + filters + edit teacher/course + create enhancements + delete |
| `src/pages/Reports.tsx`                              | Status labels + filters                                                      |
| `src/pages/Courses.tsx`                              | Image upload + filters + delete                                              |
| `src/pages/Timetable.tsx`                            | Filters + delete                                                             |
| `src/pages/Certificates.tsx`                         | Filters + delete                                                             |
| `src/pages/Students.tsx`                             | Profile editing + delete                                                     |
| `src/pages/Teachers.tsx`                             | Profile editing + delete                                                     |
| `src/pages/InvoiceView.tsx`                          | Remove app name, full logo, prices                                           |
| `src/components/invoices/InvoiceTable.tsx`           | View button                                                                  |
| `src/pages/Invoices.tsx`                             | Store original/sale price + delete                                           |
| `src/pages/Settings.tsx`                             | Rename SaaS Pricing                                                          |
| `src/components/settings/AuthenticationSettings.tsx` | Provider logos                                                               |
| `src/components/settings/GeneralSettings.tsx`        | Timezone setting                                                             |
| `src/components/settings/DataManagementCard.tsx`     | Delete tables data                                                           |
| `src/components/settings/BackupsSettings.tsx`        | Time in name + comment                                                       |
| `src/contexts/AppSettingsContext.tsx`                | Timezone in settings                                                         |
| `src/pages/Chats.tsx`                                | Verify delete order                                                          |
| `supabase/functions/manage-accounts/index.ts`        | clear_tables action                                                          |
| `src/lib/version.ts`                                 | Version bump                                                                 |
| `CHANGELOG.md`                                       | Update                                                                       |
| Migration SQL                                        | 4 schema changes                                                             |
