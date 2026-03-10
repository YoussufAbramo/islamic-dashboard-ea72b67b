# Changelog

All notable changes to EduDash will be documented in this file.

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
