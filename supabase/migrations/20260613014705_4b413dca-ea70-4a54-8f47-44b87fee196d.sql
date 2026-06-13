INSERT INTO public.development_stages (game_id, owner_id, stage_key, title, position, status, dependencies, deliverables)
SELECT g.id, g.owner_id, v.stage_key, v.title, v.position, CASE WHEN v.position = 1 THEN 'ready' ELSE 'planned' END, v.dependencies, v.deliverables
FROM public.games g
CROSS JOIN (VALUES
  ('game-planning','Game planning',1,ARRAY[]::text[],ARRAY['Game design document','Scope and risk register']::text[]),
  ('project-architecture','Project architecture',2,ARRAY['game-planning'],ARRAY['Technical design document','System architecture','Folder and data structure']),
  ('core-gameplay','Core gameplay systems',3,ARRAY['project-architecture'],ARRAY['Core loop','Reusable system contracts']),
  ('character-movement','Character and movement',4,ARRAY['core-gameplay'],ARRAY['Character controllers','Input and camera systems']),
  ('combat-abilities','Combat and abilities',5,ARRAY['character-movement'],ARRAY['Combat framework','Abilities and status effects']),
  ('world-levels','World and level creation',6,ARRAY['core-gameplay'],ARRAY['Level plan','Streaming and world partition strategy']),
  ('enemy-ai','Enemies and boss AI',7,ARRAY['combat-abilities','world-levels'],ARRAY['AI behaviors','Encounter and boss framework']),
  ('quests-story','Quests and story',8,ARRAY['world-levels'],ARRAY['Quest graph','Dialogue, factions, and choice state']),
  ('inventory-crafting','Inventory, equipment, and crafting',9,ARRAY['core-gameplay'],ARRAY['Item database','Inventory and crafting pipelines']),
  ('economy-shops','Economy and shops',10,ARRAY['inventory-crafting'],ARRAY['Economy model','Vendor and reward balancing']),
  ('multiplayer-networking','Multiplayer and networking',11,ARRAY['project-architecture','core-gameplay'],ARRAY['Client/server authority model','Replication and session plan']),
  ('ui-menus','User interface and menus',12,ARRAY['core-gameplay'],ARRAY['UI architecture','Menus, HUD, and accessibility']),
  ('saving-loading','Saving and loading',13,ARRAY['project-architecture'],ARRAY['Versioned save schema','Migration and recovery flow']),
  ('audio-vfx','Audio and visual effects',14,ARRAY['world-levels','combat-abilities'],ARRAY['Audio plan','VFX and feedback pass']),
  ('optimization','Optimization',15,ARRAY['enemy-ai','ui-menus'],ARRAY['Performance budgets','Memory, rendering, loading, and network profiling']),
  ('testing-debugging','Testing and debugging',16,ARRAY['optimization','saving-loading'],ARRAY['Automated test matrix','Regression and platform checklist']),
  ('final-export','Final export',17,ARRAY['testing-debugging'],ARRAY['Export requirements','Signed and validated release artifacts'])
) AS v(stage_key,title,position,dependencies,deliverables)
ON CONFLICT (game_id, stage_key) DO NOTHING;

INSERT INTO public.project_checkpoints (game_id, owner_id, label, summary, stage_key, file_manifest)
SELECT g.id, g.owner_id, 'Advanced production baseline', 'Staged architecture and long-term development roadmap enabled for this existing project.', 'game-planning',
  COALESCE((SELECT jsonb_agg(jsonb_build_object('path', pf.path, 'version', pf.version)) FROM public.project_files pf WHERE pf.game_id = g.id), '[]'::jsonb)
FROM public.games g
WHERE NOT EXISTS (SELECT 1 FROM public.project_checkpoints pc WHERE pc.game_id = g.id);