# Launch Readiness Plan

This is a comprehensive plan to make the application fully functional and production-ready. After thorough code review, the app is already well-structured with working auth, CRUD operations, role-based access, and database integration. Below are the gaps and fixes needed.

---

## 1. Replace Remaining Hardcoded "EduDash" References

**Files affected:** `LandingPage.tsx`, `manifest.json`

The landing page has 3 hardcoded "EduDash" references (navbar, footer logo, copyright). These need to use the dynamic `appName` from `AppSettingsContext`. The `manifest.json` also has hardcoded "EduDash".

- Landing page: Import `useAppSettings`, read `appName`/`appLogo`, replace all 3 instances
- `manifest.json`: Use a generic name like "Islamic Dashboard" (can't be dynamic but should match default)
- Also update `ForgotPassword.tsx` and `ResetPassword.tsx` to use `appName`/`appLogo` from settings instead of hardcoded BookOpen icon

---

## 2. Landing Page: Use Dynamic App Settings & Bilingual Support

**File:** `LandingPage.tsx`

- Pull `appName`, `appLogo`, `appDescription` from `useAppSettings()` and use in navbar, hero, and footer
- Use `useLanguage()` for bilingual content rendering (currently hardcoded to English labels for nav links, pricing toggle, footer)
- Show Arabic content when `language === 'ar'` for features, pricing cards, nav items, and footer
- Edit the copyright put the developer name and url
- The nav menu should be hanged, and the items smoothly scrolled to the section

---

## 3. Invoice Public View: Use Currency from Settings

**File:** `InvoiceView.tsx`

- Currently hardcodes `$` for amount formatting. Should read `currency` from localStorage (since this page is outside auth context) or accept it as part of invoice data
- The `InvoiceView` is a public route outside `AppSettingsProvider`, so we need to read currency from localStorage directly

---

## 4. Fix RLS Policy: Invoices Public Access

The `/invoice/:id` route is public but the `invoices` table requires authentication (`authenticated` role for SELECT). Anonymous users visiting an invoice link will get no data.

- **Solution:** Add an RLS policy allowing `anon` SELECT on invoices by ID, or create a Supabase Edge Function that fetches invoice data server-side
- Recommended: Add a permissive SELECT policy for `anon` role on `invoices` table (invoices are already accessible via public URL, so this is intentional)

---

## 5. Landing Page: Public Data Access for Packages & Content

The `pricing_packages` and `landing_content` tables already have `anon` SELECT policies. However, the Supabase client is created with the anon key and the landing page is outside `AuthProvider` rendering. This should work, but need to verify the client is accessible. **Currently works** since supabase client is initialized at module level.

---

## 6. Fix `ForgotPassword.tsx` and `ResetPassword.tsx` Branding

Both pages use hardcoded `BookOpen` icon instead of dynamic `appLogo` from settings. Since these pages are within `AppSettingsProvider` (per `App.tsx`), they should use `useAppSettings()`.

we have reset password and forget password, they are the same feature, keep only one of them and delete all related code to the deleted one.

---

## 7. Edge Function: Ensure `manage-users` is Deployed

The `manage-users` edge function exists but verify it's deployed. The `manage-accounts` function handles seed/clear/export. Both need to be confirmed deployed.

---

## 8. PWA & Meta Tags

- Update `manifest.json` to remove hardcoded "EduDash"
- Verify `index.html` meta tags are dynamic (they were updated in v1.6.4)
- Add secondary menu "PWA" in App Settings to make PWA setup

---

## 9. Production Security Checks

- Verify all tables have proper RLS policies (already confirmed from schema review - all tables have RLS)
- Ensure `verify_jwt = false` is set for edge functions that handle their own auth (already set in `config.toml`)
- The `handle_new_user` trigger correctly defaults all signups to `student` role

---

## 10. Database Migration: Allow Anonymous Invoice Access

Create a migration to add an anon SELECT policy on `invoices` for the public invoice view page.

```sql
CREATE POLICY "Anyone can view invoices by direct link"
ON public.invoices FOR SELECT
TO anon
USING (true);
```

---

## Summary of Changes


| Task                                             | Files                                     | Type         |
| ------------------------------------------------ | ----------------------------------------- | ------------ |
| Replace "EduDash" in LandingPage                 | `LandingPage.tsx`                         | Code edit    |
| Dynamic branding in ForgotPassword/ResetPassword | `ForgotPassword.tsx`, `ResetPassword.tsx` | Code edit    |
| Bilingual landing page                           | `LandingPage.tsx`                         | Code edit    |
| Currency in InvoiceView                          | `InvoiceView.tsx`                         | Code edit    |
| Anon invoice access RLS                          | Migration SQL                             | DB migration |
| Update manifest.json                             | `manifest.json`                           | Code edit    |
| Deploy edge functions                            | `manage-users`, `manage-accounts`         | Deploy       |
| Bump version to 1.7.0                            | `version.ts`, `CHANGELOG.md`              | Code edit    |


Total estimated: 8 file edits + 1 migration + 2 function deploys.