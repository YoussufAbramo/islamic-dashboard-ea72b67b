# Implementation Plan

## 1. Version Management & Changelog

- Create `CHANGELOG.md` at project root with version history (v1.0.0 initial release with all current features documented)
- Create `src/lib/version.ts` exporting `APP_VERSION` constant
- Display version number in the sidebar footer

## 2. Copyright Footer

- Add "© 2026 CodeCom.dev — All rights reserved" text to the sidebar footer and login/signup pages, and in all navigation pages after login.
- Styled subtly in muted text

## 3. Dashboard Enhancements

- **Monthly Recurring Income (MRI)**: Add a new stat card for admin showing MRI calculated from active subscriptions count (placeholder pricing logic since no price column exists — add a `price` column to `subscriptions` table via migration)
- **Lessons Calendar**: Add a mini calendar component below stat cards using the existing `Calendar` component from shadcn, with dots/highlights on days that have timetable entries (upcoming and past). Clicking a day shows that day's lessons in a list below.
- Fix RTL: after switching language to AR the main menu is not moved to the right side. 

## 4. Hover Effects on Stat Cards

- Update `StatCard` component with `hover:shadow-lg hover:scale-[1.02] hover:-translate-y-1 transition-all duration-200 cursor-pointer` and a subtle border-gold glow on hover

## 5. Create New Admin Account

- Deploy an edge function `create-admin` that creates a new admin user with:
  - **Email**: `admin@codecom.dev`
  - **Password**: `test12345678`
- The function will use the service role key to create the user, insert profile, set role to `admin`
- Invoke it once, then provide credentials

## 6. Modern Islamic Auth Pages (Login & Signup)

- Redesign with richer Islamic geometric patterns:
  - Add multiple layered SVG patterns (arabesque borders, star patterns)
  - Animated gradient background with emerald-to-gold transitions
  - Frosted glass card effect with `backdrop-blur-xl`
  - Decorative corner ornaments using CSS/SVG
  - Gold separator lines with Islamic motifs
  - Role selector cards with icon animations on hover
  - Input fields with subtle gold focus rings
  - Add a decorative arch/dome shape at the top of the card
- Add new CSS utilities: `.islamic-arch`, `.islamic-star-pattern`, `.islamic-arabesque`
- Apply same treatment to Signup page for consistency

## Technical Details

### Database Migration

```sql
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS price NUMERIC(10,2) DEFAULT 0;
```

### Edge Function: `create-admin`

- Uses `SUPABASE_SERVICE_ROLE_KEY` to call `supabase.auth.admin.createUser()`
- Inserts into `profiles` and `user_roles` with `admin` role
- Protected by a simple shared secret check

### Files Modified/Created

- `CHANGELOG.md` (new)
- `src/lib/version.ts` (new)
- `supabase/functions/create-admin/index.ts` (new)
- `src/pages/Dashboard.tsx` (MRI card, calendar, hover effects)
- `src/pages/Login.tsx` (full redesign)
- `src/pages/Signup.tsx` (full redesign)
- `src/index.css` (new Islamic pattern utilities)
- `src/components/layout/AppSidebar.tsx` (version + copyright in footer)
- `src/contexts/LanguageContext.tsx` (new translation keys)
- Migration for `price` column on subscriptions