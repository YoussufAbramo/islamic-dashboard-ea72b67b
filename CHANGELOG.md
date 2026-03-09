# Changelog

All notable changes to EduDash will be documented in this file.

## [1.1.0] - 2026-03-09

### Added
- Monthly Recurring Income (MRI) stat card for admin dashboard
- Lessons calendar with day-by-day lesson view
- Hover effects on all dashboard stat cards
- Version management system and changelog
- Copyright footer (CodeCom.dev)
- New admin account creation via edge function
- Modern Islamic-themed auth pages with geometric patterns
- RTL sidebar layout fix

### Changed
- Redesigned Login and Signup pages with layered Islamic patterns
- Enhanced dashboard with calendar and MRI statistics

### Security
- Hardened RLS policies (RESTRICTIVE → PERMISSIVE conversion)
- Role assignment locked to database trigger (defaults to student)
- Restricted `has_role` function to postgres role only

## [1.0.0] - 2026-03-08

### Added
- Initial release of EduDash Islamic Educational Platform
- Role-based authentication (Admin, Teacher, Student)
- Course management with sections and lessons (12 lesson types)
- Student management with teacher assignment
- Teacher management with weekly schedules
- Timetable with scheduling and attendance tracking
- Subscription management (monthly/yearly)
- Support ticket system with departments and priorities
- Real-time chat between teachers and students
- Notifications and announcements system
- Profile management with avatar support
- Bilingual support (English/Arabic) with RTL
- Dark mode support
- Islamic-themed UI with geometric patterns
