

# Clear All Database Data

## Current State
The database has data across all tables: 35 courses, 185 lessons, 4 students, 1 teacher, 44 subscriptions, 35 announcements, etc. There are 2 admin accounts (me@abramo.xyz, admin@codecom.dev) and 5 non-admin accounts.

## What Needs to Happen

### 1. Fix `clear_all` in Edge Function
The `manage-accounts` edge function's `clear_all` action is missing `invoices` deletion. Add it before subscriptions (since invoices may reference subscriptions):

**File:** `supabase/functions/manage-accounts/index.ts` (line ~325)

Add after certificates deletion:
```typescript
await adminClient.from('invoices').delete().gte('created_at', '1970-01-01')
```

### 2. Deploy Edge Function
Deploy the updated `manage-accounts` function.

### 3. Execute Clear All
Call the `clear_all` action via the edge function to delete all non-admin data. This will:
- Delete all records from: chat_messages, attendance, student_progress, timetable_entries, chats, certificates, **invoices**, subscriptions, lessons, course_sections, courses, notifications, announcements, support_tickets
- Delete non-admin students, teachers, profiles, and user_roles
- Delete non-admin auth users
- Preserve the 2 admin accounts

### 4. Verify Empty State
Query all tables to confirm they are empty (except admin profiles/roles).

---

This is a one-line code change + deploy + execution. The app already handles empty states gracefully (tables render empty, dashboard shows 0 counts).

