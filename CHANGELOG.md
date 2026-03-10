# Changelog

All notable changes to EduDash will be documented in this file.

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
- Announcements page (`/dashboard/announcements`) with full CRUD and detail popup
- Notifications page (`/dashboard/notifications`) with mark-read and navigation
- Forgot Password page (`/forgot-password`) as standalone auth page
- Button shape setting (rounded/circular/square) in App Settings
- Certificate design selection (Classic, Modern, Elegant) with isolated print window
- Support ticket detail UI with tabbed layout (Details, Notes, Contact)
- WhatsApp/Email/Call contact buttons in support ticket detail
- Resolution notes textarea in support tickets
- Dashboard widget toggle for 12 individual widgets
- Clickable stat cards navigating to related pages
- Upcoming Lessons, Recent Subscriptions, Announcements dashboard widgets
- "View All" buttons in TopBar announcements and notifications dropdowns
- Announcement detail popup when clicking in TopBar dropdown
- Notification click navigates to related page via `link` field
- Custom scrollbar styling matching dashboard theme
- Font preview loading only on Settings page (optimized)
- `manage-accounts` edge function for email updates and user management
- Islamic geometric corner patterns on auth page

### Changed
- Sidebar menu reordered: Overview → Educate → Messages → Users → Finance
- Added Announcements and Notifications to sidebar Messages category
- Admin quick login password fixed to match actual credentials
- Test accounts updated to `@codecom.dev` emails
- Forgot password changed from inline handler to dedicated page link
- TopBar badge position adjusted (slightly lower on icons)
- Certificate print now opens isolated window instead of printing whole page
- Dashboard calendar styled with gradient headers and ring indicators
- All RLS policies converted from RESTRICTIVE to PERMISSIVE (fixes data visibility)

### Fixed
- Admin quick login not working (wrong password in TEST_ACCOUNTS)
- Students/teachers not showing in dashboard (RESTRICTIVE RLS policies)
- Certificate print printing entire dashboard page
- Font preview not working in Settings page
- Dark mode color issues with non-default color themes

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
