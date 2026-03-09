

# Implementation Plan

This is a large set of changes spanning bug fixes, UI enhancements, and new features. Here is the structured plan:

---

## Critical Bug Fix: Sidebar Menu & RLS Policies

**Root cause**: All RLS policies across every table are set to `RESTRICTIVE` (Permissive: No). When multiple RESTRICTIVE SELECT policies exist on a table, a row must satisfy **all** of them. For example, on `user_roles`, a non-admin user fails the "Admins can view all roles" policy, which blocks them from reading their own role — even though "Users can view own role" would pass. This makes `role = null` in AuthContext, so the sidebar renders zero menu items.

**Fix**: Run a migration to drop and recreate all multi-policy SELECT policies as `PERMISSIVE` across all affected tables: `user_roles`, `profiles`, `courses`, `students`, `teachers`, `subscriptions`, `timetable_entries`, `chats`, `chat_messages`, `attendance`, `announcements`, `notifications`, `support_tickets`, `course_sections`, `lessons`. This is the same fix that was attempted previously but did not stick.

---

## 1. Copyright Hover Color Fix

In `CopyrightText.tsx`, accept a `linkClassName` prop. In the sidebar (dark bg), pass `hover:text-white`. In auth pages and dashboard footer (light bg), keep `hover:text-foreground`.

**Files**: `CopyrightText.tsx`, `AppSidebar.tsx`, `DashboardLayout.tsx`, `Login.tsx`, `Signup.tsx`

---

## 2. Dashboard Stats Enhancement

Update `Dashboard.tsx`:
- Show basic stats for all roles: students count, teachers count, courses count
- Add "Incoming Lessons This Week" stat (filter timetable_entries by current week)
- Add a red badge/indicator on the dashboard if a teacher has a `cancelled` status entry (teacher absence indicator)
- Keep existing MRI card and calendar

**Files**: `Dashboard.tsx`

---

## 3. Sidebar Redesign: User Profile & App Settings

Update `AppSidebar.tsx`:
- **Bottom section**: Show user avatar (from `profile.avatar_url`), name, and a settings icon that navigates to `/dashboard/profile`
- **Above it**: Add an "App Settings" collapsible section containing:
  - Theme selector (light/dark/system)
  - App logo display + name/description (read-only display of app branding)
  - Currency selector (name + symbol) stored in localStorage

**Files**: `AppSidebar.tsx`, add new `src/contexts/AppSettingsContext.tsx` for currency state

---

## 4. Add "Create New" to Courses, Teachers, Students, Subscriptions

- **Courses**: Already has create button — no change needed
- **Teachers**: Add "Add Teacher" dialog (admin only) — creates auth user via edge function, assigns teacher role, inserts into `teachers` table
- **Students**: Add "Add Student" dialog (admin only) — creates auth user via edge function, assigns student role, inserts into `students` table  
- **Subscriptions**: Add "Create Subscription" dialog (admin only) — select student, course, teacher, type, price, dates

For Teachers/Students creation, deploy an edge function `manage-users` that uses the service role key to create users and assign roles securely (no hardcoded passwords — admin sets them in the form).

**Files**: `Teachers.tsx`, `Students.tsx`, `Subscriptions.tsx`, new edge function `supabase/functions/manage-users/index.ts`, update `supabase/config.toml`

---

## 5. Timetable: Calendar View Mode

Add a toggle between "List" and "Calendar" views in `Timetable.tsx`:
- **List view**: Current table layout (unchanged)
- **Calendar view**: Monthly grid using the existing `Calendar` component. Each day cell shows lesson count. Clicking a day expands to show lessons for that day in a panel below the calendar.

**Files**: `Timetable.tsx`

---

## 6. Chats: Admin Create Chat & Groups

Update `Chats.tsx`:
- Add "New Chat" button (admin only) with a dialog:
  - Select chat type: 1-on-1 or Group
  - For 1-on-1: Select exactly one student OR one teacher
  - For Group: Select multiple users, required to select a subscription to link the group to
- Database migration: Add `is_group` (boolean, default false), `name` (text, nullable), `subscription_id` (uuid FK nullable) columns to `chats` table

**Files**: `Chats.tsx`, new migration for `chats` table columns, update RLS policies for new columns

---

## 7. Profile: Change Password & Avatar

Update `Profile.tsx`:
- Add "Change Password" section with current password, new password, confirm password fields using `supabase.auth.updateUser({ password })`
- Add avatar upload section:
  - Create a Supabase storage bucket `avatars` (public)
  - Upload image, save URL to `profiles.avatar_url`
  - Show current avatar with `Avatar` component

**Files**: `Profile.tsx`, new migration for storage bucket + policies

---

## 8. Feature Suggestions (Item 9)

Five features to enhance the dashboard (will be presented as suggestions after implementation):
1. **Attendance Tracking Dashboard** — Visual attendance stats with charts per student/teacher
2. **Reports & Analytics** — Export PDF/CSV reports for subscriptions, attendance, finances
3. **Real-time Notifications** — Supabase Realtime subscriptions for instant notification delivery
4. **Student Progress Tracking** — Track lesson completion percentages, course progress bars
5. **Mobile-Responsive PWA** — Add service worker + manifest for installable mobile experience

---

## Translation Keys

Add ~30 new translation keys to `LanguageContext.tsx` for new UI elements (settings, create forms, calendar view, group chat, password change, etc.)

---

## Summary of Files Changed

| File | Change |
|------|--------|
| Migration SQL | Fix RLS (PERMISSIVE), add chats columns, create avatars bucket |
| `CopyrightText.tsx` | Add `linkClassName` prop |
| `AppSidebar.tsx` | User profile section, app settings |
| `Dashboard.tsx` | Weekly lessons stat, teacher absence indicator |
| `Teachers.tsx` | Add teacher dialog |
| `Students.tsx` | Add student dialog |
| `Subscriptions.tsx` | Create subscription dialog |
| `Timetable.tsx` | Calendar view toggle |
| `Chats.tsx` | Create chat/group dialog |
| `Profile.tsx` | Password change, avatar upload |
| `LanguageContext.tsx` | New translation keys |
| `AppSettingsContext.tsx` | New context for currency |
| `supabase/functions/manage-users/index.ts` | New edge function |
| `supabase/config.toml` | Edge function config |
| `DashboardLayout.tsx`, `Login.tsx`, `Signup.tsx` | Copyright link color |

