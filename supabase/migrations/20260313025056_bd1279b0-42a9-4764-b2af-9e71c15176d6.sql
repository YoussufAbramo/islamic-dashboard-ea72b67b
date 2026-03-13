
-- ========================================
-- PURGE ALL TRANSACTIONAL DATA (FK-safe order)
-- ========================================

-- Seed tracking
DELETE FROM public.seed_records;
DELETE FROM public.seed_sessions;

-- Audit logs (no FK deps)
DELETE FROM public.audit_logs;

-- Attendance & Schedule
DELETE FROM public.attendance;
DELETE FROM public.session_reports;
DELETE FROM public.timetable_entries;

-- Student progress
DELETE FROM public.student_progress;

-- Certificates
DELETE FROM public.certificates;

-- Chats (references subscriptions, students, teachers)
DELETE FROM public.chat_read_receipts;
DELETE FROM public.chat_messages;
DELETE FROM public.chat_members;
DELETE FROM public.chats;

-- Billing (after chats since chats refs subscriptions)
DELETE FROM public.invoices;
DELETE FROM public.subscriptions;

-- Ebooks
DELETE FROM public.ebook_downloads;
DELETE FROM public.ebook_views;
DELETE FROM public.ebooks;

-- Courses & Curriculum
DELETE FROM public.lessons;
DELETE FROM public.lesson_sections;
DELETE FROM public.course_sections;
DELETE FROM public.teacher_courses;
DELETE FROM public.courses;
DELETE FROM public.course_categories;
DELETE FROM public.course_levels;
DELETE FROM public.course_tracks;

-- Communications
DELETE FROM public.announcements;
DELETE FROM public.notifications;

-- Support
DELETE FROM public.support_tickets;

-- Blog / Website
DELETE FROM public.blog_posts;

-- Pricing
DELETE FROM public.pricing_packages;

-- Payouts & Expenses
DELETE FROM public.payout_requests;
DELETE FROM public.expenses;
DELETE FROM public.expense_categories;

-- Teachers & Students (before profiles)
DELETE FROM public.students;
DELETE FROM public.teachers;

-- User roles & Profiles
DELETE FROM public.user_roles;
DELETE FROM public.profiles;
