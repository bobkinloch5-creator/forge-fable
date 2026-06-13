DROP INDEX IF EXISTS public.chat_messages_ai_id_idx;
CREATE UNIQUE INDEX chat_messages_ai_id_idx ON public.chat_messages(thread_id, ai_message_id);