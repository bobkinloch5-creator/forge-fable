ALTER TABLE public.games
DROP CONSTRAINT IF EXISTS games_player_mode_check;

UPDATE public.games
SET player_mode = CASE lower(trim(player_mode))
  WHEN 'multiplayer' THEN 'multiplayer'
  WHEN 'multi player' THEN 'multiplayer'
  WHEN 'co-op' THEN 'multiplayer'
  WHEN 'coop' THEN 'multiplayer'
  ELSE 'single'
END;

ALTER TABLE public.games
ALTER COLUMN player_mode SET DEFAULT 'single';

ALTER TABLE public.games
ADD CONSTRAINT games_player_mode_check
CHECK (player_mode IN ('single', 'multiplayer'));
