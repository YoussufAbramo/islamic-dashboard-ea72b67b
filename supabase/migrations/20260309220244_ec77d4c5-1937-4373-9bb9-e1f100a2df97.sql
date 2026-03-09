
ALTER TABLE public.chat_messages
ADD CONSTRAINT chat_messages_sender_id_profiles_fkey
FOREIGN KEY (sender_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
