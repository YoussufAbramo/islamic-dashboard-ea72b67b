
-- Chat members join table for multi-member group chats
CREATE TABLE public.chat_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id uuid REFERENCES public.chats(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'member',
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(chat_id, user_id)
);

ALTER TABLE public.chat_members ENABLE ROW LEVEL SECURITY;

-- Admins can manage all chat members
CREATE POLICY "Admins can manage chat members" ON public.chat_members
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Users can view members of chats they belong to
CREATE POLICY "Members can view chat members" ON public.chat_members
  FOR SELECT TO authenticated
  USING (
    chat_id IN (
      SELECT cm.chat_id FROM public.chat_members cm WHERE cm.user_id = auth.uid()
    )
  );

-- Add schedule_days and schedule_time columns to subscriptions
ALTER TABLE public.subscriptions 
  ADD COLUMN IF NOT EXISTS schedule_days text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS schedule_time text DEFAULT NULL;
