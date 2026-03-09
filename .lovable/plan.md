

# Educational Dashboard — Implementation Plan

## Authentication & Roles
- **Sign up / Log in pages** with email & password via Supabase Auth
- Role selection during signup: **Student**, **Teacher**, **Super Admin**
- Roles stored in a dedicated `user_roles` table (not on profiles) with RLS policies
- **Profiles table** for personal info (name, phone, email, avatar, preferred language)
- After login, redirect to role-specific dashboard

## Database Tables
- `profiles` — user details, linked to auth.users
- `user_roles` — role per user (student/teacher/admin)
- `courses` — title, description, status, created_by
- `course_sections` — ordered sections within a course
- `lessons` — type-specific lessons within sections (Table of Content, Revision, Read & Listen, Memorization, Exercise subtypes, Homework)
- `students` — extended student info (renewal date, subscription type, lesson duration, weekly schedule)
- `teachers` — extended teacher info (personal details, weekly timetable)
- `subscriptions` — links student ↔ course ↔ teacher, with subscription dates, type (monthly/yearly), attendance tracking
- `attendance` — per-lesson attendance records
- `support_tickets` — name, email, phone, subject, message, department, priority, status, assigned_to
- `timetable_entries` — global lesson schedule (student, teacher, course, datetime, status)
- `chats` — conversation between teacher & student, with suspend/unsuspend flag
- `chat_messages` — individual messages within a chat
- `announcements` — admin announcements
- `notifications` — per-user notifications

## Pages & Features

### 1. Courses (All roles, edit for Teacher/Admin)
- List view with search/filter
- Create/Edit course form
- Course detail → Sections → Lessons tree
- Lesson editor with type selector (structured UI with input fields for each type)
- Exercise types: text match, single/multi-choice, rearrange, fill-in-blank, true/false, listen & choose

### 2. Students List (Admin/Teacher)
- Table: name, phone, email, renewal date, subscribed courses
- Detail drawer/page: assigned teacher, schedule, subscription info, lesson duration, weekly recurrence, monthly attendance table
- Edit all details inline

### 3. Teachers List (Admin)
- Table: name, phone, email
- Detail view: weekly timetable, assigned students, responsible courses, personal info, per-lesson attendance
- Edit capability

### 4. Support Help Center (Admin)
- Ticket list with filters (status, priority, department)
- Ticket details: name, email, phone, subject, message, department, priority, status, assigned agent, created date, resolution notes

### 5. Timetable (All roles, filtered by role)
- Global calendar/list view of all lessons
- Tabs: Upcoming / Past
- Filterable by teacher, student, course

### 6. Subscriptions (Admin)
- List of all subscriptions with details
- Each shows: student, teacher, course, dates, type, attendance summary
- Edit capability

### 7. Chats (Teacher ↔ Student; Admin sees all)
- Basic messaging interface (send/receive, polling-based)
- Admin: view all chats, delete messages, suspend/unsuspend chats
- Teacher: chat only with assigned students

### Top Bar (Global)
- Dark mode toggle (using next-themes)
- Notifications dropdown
- Admin announcements panel
- Profile dropdown: edit profile, logout

### Role-Specific Dashboards
- **Student**: My courses, my schedule, my subscription info, chat with teacher
- **Teacher**: My students, my courses, my timetable, chat with students
- **Super Admin**: Full access to all 7 menu items + all management features

## Bilingual Support (EN/AR)
- Language switcher in top bar
- RTL layout support when Arabic is selected
- Translatable UI strings via a simple i18n context

## Design
- Clean sidebar navigation with role-based menu items
- Responsive layout using shadcn/ui components
- Cards, tables, and forms following the existing design system
- Dark/light theme support

