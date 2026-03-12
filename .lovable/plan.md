## Rebuild Group Chat Logic

### Problem Analysis

The group chat system is fundamentally broken due to **RLS policy gaps**. Here's what's wrong:

1. `**chats` table RLS**: Students/teachers can only see chats where they are the `student_id`/`teacher_id`. Group chats set these to `null`, so non-admin members cannot see group chats at all.
2. `**chat_messages` table RLS**: The SELECT policy only checks `chats.teacher_id`/`chats.student_id`. The INSERT policy also only checks these columns. Group chat members (stored in `chat_members`) are completely locked out from viewing or sending messages.
3. **Frontend creation**: Sets `student_id`/`teacher_id` to `null` for group chats, then adds members to `chat_members` -- but those members have zero database access due to the RLS issues above.

In short: group chats are created, members are inserted, but nobody except admins can actually use them.

---

### Plan

#### 1. Database Migration -- Fix RLS Policies

`**chats` table**: Add a new SELECT policy allowing users in `chat_members` to view their group chats:

```sql
CREATE POLICY "Group members can view their chats"
ON public.chats FOR SELECT TO authenticated
USING (is_chat_member(auth.uid(), id));
```

`**chat_messages` table**: Update SELECT and INSERT policies to include `chat_members` participants:

```sql
-- New SELECT policy for group chat members
CREATE POLICY "Group members can view messages"
ON public.chat_messages FOR SELECT TO authenticated
USING (is_chat_member(auth.uid(), chat_id));

-- New INSERT policy for group chat members
CREATE POLICY "Group members can send messages"
ON public.chat_messages FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = sender_id
  AND is_chat_member(auth.uid(), chat_id)
  AND (SELECT NOT is_suspended FROM chats WHERE id = chat_id)
);
```

#### 2. Frontend Fixes (Chats.tsx)

- **Direct chat creation**: For direct chats, also insert both participants into `chat_members` so the system is consistent (teacher + student + admin creator).
- **Group chat creation validation**: Require at least one teacher AND one student, or allow flexible member selection but enforce minimum 2 participants total.
- **Members panel**: Remove the "legacy" teacher/student display for group chats since all participants should be in `chat_members`. Show the admin's role label correctly in the members list.
- **Member role display**: Fix the member role label to also show "Admin" instead of defaulting to "Student" for admin members.

#### 3. Summary of Changes


| Area      | Change                                                                              |
| --------- | ----------------------------------------------------------------------------------- |
| Migration | 3 new RLS policies (chats SELECT, chat_messages SELECT + INSERT)                    |
| Chats.tsx | Fix member role labels, remove legacy member display for groups, improve validation |


This addresses the root cause: group chat members stored in `chat_members` currently have no database-level access to chats or messages.  
  
After that make sure that all old logic and code for the group chat feature are removed from the files.