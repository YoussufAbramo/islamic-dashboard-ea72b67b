

## Plan: Comprehensive Error Notification System with Error Detail Page

### Overview
Replace all raw `toast.error()` calls across the app with a centralized error notification system that shows user-friendly, localized error messages with a "View Details" link that navigates to a dedicated Error Details page.

### Components to Create

**1. Error utility (`src/lib/errorMessages.ts`)**
- Map common Supabase/auth error codes to friendly bilingual messages (e.g., `invalid_credentials` → "Incorrect email or password" / "البريد أو كلمة المرور غير صحيحة")
- Map validation errors (missing fields, password mismatch, etc.)
- Each error gets a unique code, user-friendly title, description, and suggested fix
- Export a `getErrorDetails(error, isAr)` function that returns `{ code, title, message, suggestion }`

**2. Error notification helper (`src/lib/notifyError.ts`)**
- Wraps `toast.error()` with rich content: shows the friendly message + a clickable "View Details" action that navigates to `/dashboard/error/:code`
- Stores the last error in sessionStorage so the error page can read it
- Accepts raw Supabase errors or custom validation error keys

**3. Error Details page (`src/pages/ErrorDetails.tsx`)**
- Route: `/dashboard/error/:code`
- Reads error code from URL params and error context from sessionStorage
- Displays: error icon, code, title, full description, suggested fixes, timestamp, "Go Back" and "Contact Support" buttons
- Fully bilingual (AR/EN)

**4. Route registration**
- Add `/dashboard/error/:code` route inside the dashboard layout in `App.tsx`

**5. Update all pages with toast.error calls (~19 files)**
- Replace `toast.error(message)` and `toast.error(error.message)` with the new `notifyError()` helper
- Files: Login, Signup, ForgotPassword, Profile, Teachers, Students, Admins, Courses, Certificates, Subscriptions, Calculator, Invoices, Chats, Announcements, Notifications, Settings subcomponents, TopBar, RoleManagement, Support

**6. Update NotFound page**
- Enhance with proper bilingual UI, error code display, and navigation options

**7. Translation keys**
- Add error-related keys to `LanguageContext.tsx` for common error labels

### Error Categories Covered
| Category | Examples |
|----------|---------|
| Auth | Invalid credentials, weak password, email taken, session expired |
| Validation | Missing required fields, password mismatch, invalid format |
| Database | Row not found, permission denied, constraint violation |
| Network | Connection timeout, server unavailable |
| Storage | Upload failed, file too large, unsupported format |
| General | Unknown error fallback |

### Technical Notes
- Error details stored in `sessionStorage` (key: `last_error_detail`) so the error page can render full context without URL bloat
- The toast action button uses `sonner`'s action prop to add "View Details" link
- Error codes are short strings like `AUTH_INVALID_CREDS`, `VAL_MISSING_FIELDS`, `DB_PERMISSION_DENIED`

