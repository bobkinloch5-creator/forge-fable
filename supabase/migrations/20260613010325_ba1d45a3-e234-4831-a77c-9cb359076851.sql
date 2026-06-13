CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  display_name text NOT NULL DEFAULT 'Game Creator',
  avatar_url text,
  plan text NOT NULL DEFAULT 'free' CHECK (plan IN ('free','pro','pro_max')),
  credits integer NOT NULL DEFAULT 250 CHECK (credits >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Creators manage own profile" ON public.profiles FOR ALL TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 80),
  platform text NOT NULL CHECK (platform IN ('web','mobile','pc')),
  genre text NOT NULL,
  art_style text NOT NULL,
  player_mode text NOT NULL CHECK (player_mode IN ('single','multiplayer')),
  monetization text NOT NULL DEFAULT 'free',
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','building','ready','published')),
  description text NOT NULL DEFAULT '',
  thumbnail_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.games TO authenticated;
GRANT ALL ON public.games TO service_role;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Creators manage own games" ON public.games FOR ALL TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE INDEX games_owner_updated_idx ON public.games(owner_id, updated_at DESC);
CREATE TRIGGER games_updated_at BEFORE UPDATE ON public.games FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.chat_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL,
  title text NOT NULL DEFAULT 'New build session' CHECK (char_length(title) BETWEEN 1 AND 100),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_threads TO authenticated;
GRANT ALL ON public.chat_threads TO service_role;
ALTER TABLE public.chat_threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Creators manage own threads" ON public.chat_threads FOR ALL TO authenticated USING (auth.uid() = owner_id AND EXISTS (SELECT 1 FROM public.games g WHERE g.id = game_id AND g.owner_id = auth.uid())) WITH CHECK (auth.uid() = owner_id AND EXISTS (SELECT 1 FROM public.games g WHERE g.id = game_id AND g.owner_id = auth.uid()));
CREATE INDEX chat_threads_game_updated_idx ON public.chat_threads(game_id, updated_at DESC);
CREATE TRIGGER chat_threads_updated_at BEFORE UPDATE ON public.chat_threads FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.chat_threads(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL,
  ai_message_id text,
  role text NOT NULL CHECK (role IN ('user','assistant','system')),
  parts jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_messages TO authenticated;
GRANT ALL ON public.chat_messages TO service_role;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Creators manage own messages" ON public.chat_messages FOR ALL TO authenticated USING (auth.uid() = owner_id AND EXISTS (SELECT 1 FROM public.chat_threads t WHERE t.id = thread_id AND t.owner_id = auth.uid())) WITH CHECK (auth.uid() = owner_id AND EXISTS (SELECT 1 FROM public.chat_threads t WHERE t.id = thread_id AND t.owner_id = auth.uid()));
CREATE INDEX chat_messages_thread_created_idx ON public.chat_messages(thread_id, created_at);
CREATE UNIQUE INDEX chat_messages_ai_id_idx ON public.chat_messages(thread_id, ai_message_id) WHERE ai_message_id IS NOT NULL;

CREATE TABLE public.project_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL,
  path text NOT NULL CHECK (path <> ''),
  content text NOT NULL DEFAULT '',
  language text NOT NULL DEFAULT 'text',
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(game_id, path)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_files TO authenticated;
GRANT ALL ON public.project_files TO service_role;
ALTER TABLE public.project_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Creators manage own project files" ON public.project_files FOR ALL TO authenticated USING (auth.uid() = owner_id AND EXISTS (SELECT 1 FROM public.games g WHERE g.id = game_id AND g.owner_id = auth.uid())) WITH CHECK (auth.uid() = owner_id AND EXISTS (SELECT 1 FROM public.games g WHERE g.id = game_id AND g.owner_id = auth.uid()));
CREATE INDEX project_files_game_path_idx ON public.project_files(game_id, path);
CREATE TRIGGER project_files_updated_at BEFORE UPDATE ON public.project_files FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.create_profile_for_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$ BEGIN INSERT INTO public.profiles (id, display_name) VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(COALESCE(NEW.email, 'Game Creator'), '@', 1))) ON CONFLICT (id) DO NOTHING; RETURN NEW; END; $$;
CREATE TRIGGER create_profile_after_signup AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.create_profile_for_new_user();