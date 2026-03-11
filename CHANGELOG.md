# Changelog

All notable changes to EduDash will be documented in this file.

## [3.8.0] - 2026-03-11

### Added
- Error Log page: real-time runtime error, warning, and info capture with search, filter, and detail dialog
- Reusable ComingSoonOverlay component with blur effect and "View Only" dismiss button
- Visit policy button (external link) on published policies in the Policies page

### Changed
- "Report a Bug" floating button replaces "Support" with Bug icon and no right-side rounding
- WhatsApp floating button darkened to #128C7E with "Contact Sales" label
- Developer Mode now enabled by default for new users
- ComingSoonOverlay applied to Activity Log and Role Management pages
- Error Log layout fixed: constrained long messages within screen width (overflow-hidden, truncate)
- Version bumped to 3.8.0

## [3.7.0] - 2026-03-11

### Added
- Floating support ticket and WhatsApp sales buttons on dashboard
- Advanced SEO settings tab in App Settings (canonical URL, robots, JSON-LD, social links)
- SEO metadata fields (meta title, description, OG) for Main Pages and Blog posts
- Media picker dialog for selecting featured images from storage in Blog editor
- Visit page (external link) buttons on published Main Pages and Blog posts
- SeoSettings component for global SEO configuration

### Changed
- Fixed Appearance settings save button not dismissing (useEffect cleanup bug with discardChanges ref)
- Renamed "Website Pages" to "Main Pages" in sidebar and page header
- Replaced language switcher Globe icon with Arabic letter "ع" icon
- Replaced generic Pixels & Tracking icons with company brand logos (Google, Meta, Snapchat, TikTok, Microsoft Clarity)
- Moved Activity Log from System to Developer category
- Removed System category (now empty)
- Version bumped to 3.7.0

## [3.6.0] - 2026-03-11

### Added
- Developer category in main menu with Error Documentation and Webhook Log
- Developer Mode toggle in Settings to show/hide Developer menu category
- Webhook Log page showing incoming webhook requests
- Media Manager redesigned: left folder navigation, right content panel with file detail sidebar
- Manage Roles: "View Only" button to dismiss blur overlay while keeping Coming Soon badge

### Changed
- Moved Media from Messages to Website category
- Moved Error Documentation from Messages to Developer category
- Re-added Coming Soon badge on Manage Roles (kept navigation enabled)
- Version bumped to 3.6.0

## [3.5.0] - 2026-03-11

### Added
- Media Manager: file upload (button + drag-and-drop), delete with confirmation, and open public file actions
- Media Manager: image thumbnail previews for files in public buckets
- Drag-and-drop overlay with visual feedback (animated bounce icon, dashed border)

### Changed
- Version bumped to 3.5.0

## [3.4.0] - 2026-03-11

### Added
- Media Manager page: browse Supabase storage buckets and files from the dashboard (admin-only, under Messages category)
- Time Format setting: toggle between 12-hour (AM/PM) and 24-hour display, placed beside Timezone in General Settings
- Skeleton loading animations on all data pages: Students, Teachers, Courses, Announcements, Notifications, Support, Admins, Timetable, Attendance, Reports, Invoices, Certificates, Subscriptions
- Manage Roles page now opens normally with a "Coming Soon" overlay instead of being blocked from navigation

### Changed
- Dashboard topbar is now sticky (stays visible when scrolling)
- Sidebar light mode text colors fixed for proper contrast across all themes
- Group chat member adding fixed: Select components now reset after adding a member, and already-added members are filtered from the dropdown
- Settings version bumped to v5 (adds timeFormat default)
- Version bumped to 3.3.0

## [3.2.0] - 2026-03-11

### Added
- Comprehensive error notification system: centralized bilingual error mapping with user-friendly messages and "View Details" action
- Error Details page (`/dashboard/error/:code`): full error context with category icon, description, suggestion, technical message, and timestamp
- Error Documentation page (`/dashboard/error-docs`): searchable reference of all system error codes grouped by category (Auth, Validation, Database, Network, Storage, General)
- Error Documentation link added to Messages sidebar category (admin-only)
- `notifyError()` helper replacing all raw `toast.error()` calls across ~19 files
- `errorMessages.ts` mapping Supabase error codes to bilingual (EN/AR) user-friendly messages with suggested fixes
- Error context stored in `sessionStorage` for rich detail page rendering
- Enhanced NotFound page with bilingual UI and navigation options

### Changed
- All `toast.error()` calls across auth, dashboard, and settings pages replaced with centralized `notifyError()` system
- Version bumped to 3.2.0

## [3.1.0] - 2026-03-10

### Added
- Certificate grid view with mini certificate preview cards and enhanced dropdown action menus
- Certificate preview dialog for viewing certificate details before printing/exporting
- Schedule picker component: select weekly days and lesson time when creating subscriptions
- Schedule picker integrated into both Subscription creation and Calculator flows
- Multi-member group chat: `chat_members` join table supporting multiple students and teachers per group
- Group chat creation now allows selecting multiple students and teachers via toggle buttons
- Group member management dialog with add/remove capabilities per member
- Skeleton loading states for all major data pages (Certificates, Subscriptions, Chats)
- `schedule_days` and `schedule_time` columns added to subscriptions table
- Subscription detail view now shows schedule information when available

### Changed
- Certificate action buttons consolidated into a clean dropdown menu (Print/Export by design, Delete)
- Group chat creation no longer requires a linked subscription (made optional)
- Chat list marks messages as read when entering a chat
- Version bumped to 3.1.0

## [3.0.0] - 2026-03-10

### Added
- "Manage Roles" sidebar item now shows "Coming Soon" badge (renamed from "Role Management")
- Dark mode logo: Upload a white/light logo variant for dark sidebar and dark mode
- Education System settings: 30 coming soon features organized in 3 tabs (10 Teacher, 10 Student, 10 Platform)
- Certificate grid view: Toggle between list and grid views with certificate design previews
- Certificate action buttons: Unified dropdown menu for print/PDF/delete actions per design
- Subscription creation: Schedule picker with weekly day selection and time slot
- Calculator: Schedule picker when creating subscriptions from calculator
- Chat notification badges: Unread message count shown on "Chats" item in sidebar
- New message notifications: Badge indicator beside new chat messages
- Loading screen: CSS-based loading spinner shown before React mounts
- Skeleton loading: Dashboard skeleton placeholders during auth loading
- Font preloading: Google Fonts preconnect and preload for faster initial render
- Auto-discard settings: Unsaved changes automatically discarded when leaving Settings page
- Group chat: Support for multiple students and multiple teachers via chat_members table

### Changed
- Sidebar light mode: Fixed text color contrast for all sidebar elements
- Sidebar logo: Uses dark mode logo variant when sidebar is in dark mode
- Settings version bumped to v4 (force-applies new defaults including dark logo)
- Version bumped to 3.0.0

### Security
- EXECUTE permissions on RLS helper functions re-granted to authenticated users

## [2.9.0] - 2026-03-10

### Added
- Admins page: Lists all admin users under the Users sidebar category
- Role Management page: Design-only page with preset roles (Admin, Teacher, Student as undeletable; Education Content Creator and Customer Support as deletable) with permissions matrix
- Education System settings: New settings tab with Chat Permissions (moved from General) and coming soon features (Homework, Exams, Grading, Auto Scheduling, Learning Paths)
- Calculator: Create Subscription button to generate a subscription from calculated pricing data with searchable student/course/teacher selectors
- Announcements: "Everyone" badge displayed when target audience is all users

### Changed
- Landing page navbar: Fully redesigned with left-aligned logo + nav links and right-aligned actions (cleaner structure)
- Settings save/discard bar: Now fixed at bottom center of screen, always visible when scrolling
- Sidebar Mode renamed to "Main Menu Mode" in Appearance settings
- Action buttons: Reduced to h-8 w-8 with h-3.5 icons across Courses, Teachers, Students, Timetable, and Support pages (matching Invoices)
- Appearance settings: Changes now apply instantly for preview (color theme, button shape, fonts, sidebar mode) without saving — reverted on discard
- Chat Permissions moved from General Settings to new Education System tab
- RTL switch toggle: Fixed white dot positioning with `direction: ltr` override
- Version bumped to 2.9.0

## [2.8.0] - 2026-03-10

### Added
- Calculator page: Standalone finance calculator in sidebar under Finance category with bi-directional price rate/total calculation
- Certificate creation: Searchable combobox dropdowns for recipient and course selection
- Group chat: View group members dialog and redesigned chat header with avatar and member info
- Default signature and stamp images for invoice branding
- Default pricing packages: PayPal and Paymob payment methods enabled by default on public invoice page

### Changed
- Switch components: Forced circular rounded style (`!rounded-full`) regardless of button shape setting
- Arabic text inputs: Right-aligned (`text-right`) in courses, certificates, and announcements creation forms
- Announcement cards: Date and time restyled with Badge components instead of plain text
- Action icon buttons: Unified `rounded-full hover:bg-muted` style across Courses, Timetable, Certificates, Support, Teachers, and Students pages
- Invoice public page: Payment methods now default to PayPal + Paymob when no localStorage config exists
- Invoice public page: Default signature and stamp images shown from `/signature.png` and `/stamp.jpg`
- Settings version bumped to v3 to force-apply new defaults (signature, stamp)
- Version bumped to 2.8.0

## [2.7.0] - 2026-03-10

### Added
- Invoice editing: Admin can edit invoice status, amount, due date, and notes after creation
- Subscription pricing: Price Rate/hr and Total Price fields with automatic bi-directional calculation
- Invoice view: Subscription price shown as old/strikethrough price when discounted
- Invoice view: Favicon and logo loaded from app settings, footer shows app name from settings
- Invoice view: Active payment methods loaded from app settings

### Changed
- Landing page: Logout button merged inside the profile element as a single unified component
- Dashboard action icon buttons: Unified hover style (rounded-full with muted hover) across all pages
- Subscription creation: Search bars moved inside dropdown lists (combobox pattern)
- Subscription creation: Start date and renewal date side-by-side at 50% width, removed "auto-calculated" text
- Subscription detail dialog: Unified view/edit in single layout without content duplication
- Timezone settings: Search moved inside the dropdown using combobox pattern
- Version bumped to 2.7.0

## [2.6.0] - 2026-03-10

### Added
- Invoice deletion: Admin can delete invoices from the actions column with confirmation dialog
- Dashboard overview: Added "Invoices" and "Pending Invoices" cards to the overview section
- Landing page: Added logout icon button next to the user profile in the navbar
- Invoice view: Both original price and sale price are now clearly displayed when a discount is applied

### Changed
- Auth page logo: Displayed as full image instead of circular/clipped
- Dashboard sidebar logo: Displayed as full image instead of rounded square
- Invoice view logo: App logo now renders as full image
- TopBar icon buttons: Improved hover effect colors using semantic design tokens
- Message deletion: Deleted messages stay in original order without re-fetching (preserves position and timestamp)
- Timezone settings: Fixed selector — current value always visible, search works correctly with scrollable content
- Subscription editing: Teacher and course assignments can now be edited on existing subscriptions
- Version bumped to 2.6.0

## [2.5.0] - 2026-03-10

### Added
- Dashboard: Sales Performance bar chart and Attendance Performance pie chart (side-by-side)
- Course image upload when creating/editing courses (stored in course-images bucket)
- Status tab filters on Courses, Timetable, Certificates, Support, Subscriptions, and Reports pages
- Delete buttons with confirmation dialogs on Students, Teachers, Courses, Invoices, Timetable, Certificates, Support, Subscriptions, Announcements, and Chats pages
- Editable profile fields (name, phone, email) in Student and Teacher detail dialogs
- Default timezone setting in General Settings
- Timezone-based backup naming (HH-MM-SS format)
- Backup comment/note field shown in backup list
- "Delete Database Tables Data" option in Data Management (resets all table data)
- Searchable subscription dropdowns (student/course/teacher) with search input
- Auto-calculated renewal date based on subscription type
- Weekly lessons and lesson duration fields in subscription creation
- "View" action button on invoice table rows
- Original price and sale price display on invoice view page
- Invoice view: full logo image, removed app name text
- Red notification/announcement badges in TopBar
- Landing page button on Login page
- App name fallback in sidebar when no logo is set
- Human-readable status labels across all pages (Support, Subscriptions, Reports)
- "Pricing Packages" renamed from "SaaS Pricing" in Settings
- Authentication settings: Google, Facebook, Microsoft providers with brand logos
- View invoice button in invoice list redirecting to invoice URL

### Changed
- Dashboard now has configurable "Performance Graphs" section at the top
- Backup names include time (HH-MM-SS) based on app timezone
- Subscription creation: course/student not required, supports weekly lessons and lesson duration
- Version bumped to 2.5.0

### Security
- Lesson content and course sections restricted to enrolled users via RLS policies
- `is_enrolled_in_course` security definer function for subscription-based access control

## [2.2.0] - 2026-03-10

### Added
- 5 new color themes: Rose Garden, Teal Breeze, Amber Glow, Slate Steel, Crimson Fire
- OG image upload support in Landing Page settings (upload or URL)
- Separated SEO and Open Graph into distinct bordered sections in General & SEO tab
- Selective backup: choose which tables to include when creating a backup
- Erase operations (sample data and all data) now log reports to View Log history
- Course auto-populated from subscription when creating invoices

### Changed
- CodeCom.dev copyright link no longer has underline
- Invoice creation shows assigned course from subscription (read-only) instead of course dropdown
- View Log button opens log directly without re-querying database
- Removed Export/Import Settings tab from App Settings
- Version bumped to 2.2.0

### Security
- RPC `get_invoice_by_share_token` now returns limited columns (excludes `share_token`, `subscription_id`, `updated_at`)
- Edge functions return generic error messages instead of raw `err.message`

## [2.1.0] - 2026-03-10

### Added
- Confirmation dialog before erasing sample data
- Persistent log history for seed/erase operations (stored in localStorage)
- "View Log" button always visible, scans for sample data and shows full history
- "Clear Log" option in log dialog
- "Backups" settings tab (coming soon placeholder)
- "Export/Import Setup" settings tab (coming soon placeholder)
- "Home" nav link on landing page that scrolls to top

### Changed
- App Logo now displays at full aspect ratio (not forced square) in Settings and Landing Page
- Landing page navbar shows logo only (no app name text)
- Landing page Home button in TopBar now opens in a new tab
- Erase All Data warning text now lists all affected tables explicitly
- Erase sample data now logs operations to persistent history
- Version bumped to 2.1.0

### Fixed
- "Erase All Data" button was not performing the actual deletion (clear_all action)
- "Erase Sample Data" had no confirmation before executing

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
