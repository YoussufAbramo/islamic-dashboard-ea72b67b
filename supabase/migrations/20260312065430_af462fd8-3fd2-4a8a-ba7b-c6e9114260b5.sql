
-- Fix RLS for group chats: allow chat_members participants to access chats and messages

-- 1. chats: group members can view their chats
CREATE POLICY "Group members can view their chats"
ON public.chats FOR SELECT TO authenticated
USING (is_chat_member(auth.uid(), id));

-- 2. chat_messages: group members can view messages
CREATE POLICY "Group members can view messages"
ON public.chat_messages FOR SELECT TO authenticated
USING (is_chat_member(auth.uid(), chat_id));

-- 3. chat_messages: group members can send messages (if chat not suspended)
CREATE POLICY "Group members can send messages"
ON public.chat_messages FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = sender_id
  AND is_chat_member(auth.uid(), chat_id)
  AND (SELECT NOT is_suspended FROM public.chats WHERE id = chat_id)
);
