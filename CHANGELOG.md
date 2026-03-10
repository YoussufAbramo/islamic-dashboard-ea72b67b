# Changelog

All notable changes to EduDash will be documented in this file.

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
