
-- Table to track when each user last read a chat
CREATE TABLE public.chat_read_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id uuid NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_read_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (chat_id, user_id)
);

ALTER TABLE public.chat_read_receipts ENABLE ROW LEVEL SECURITY;

-- Admins can manage all read receipts
CREATE POLICY "Admins can manage read receipts"
  ON public.chat_read_receipts FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Users can upsert their own read receipts
CREATE POLICY "Users can upsert own read receipts"
  ON public.chat_read_receipts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own read receipts"
  ON public.chat_read_receipts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can view read receipts for chats they participate in
CREATE POLICY "Participants can view read receipts"
  ON public.chat_read_receipts FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR auth.uid() = user_id
    OR chat_id IN (
      SELECT c.id FROM chats c
      WHERE c.teacher_id IN (SELECT t.id FROM teachers t WHERE t.user_id = auth.uid())
         OR c.student_id IN (SELECT s.id FROM students s WHERE s.user_id = auth.uid())
    )
    OR is_chat_member(auth.uid(), chat_id)
  );
