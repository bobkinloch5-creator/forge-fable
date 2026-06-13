# FableForge Ecosystem Expansion Plan

## Current milestone completed
- The verified account `bobkinloch5@gmail.com` is now assigned the secure **platform owner** role in a separate role table.
- In-app Forge credit deductions are bypassed for this server-verified owner, providing **unlimited platform credits** without exposing a client-side override.
- The database security linter passes with no findings.
- Existing foundations already include project chat history, staged planning, checkpoints, Godot 4 project seeds, connected desktop build agents, desktop artifacts, responsive previews, website publishing UI, and AI 3D generation.

## What I understood
Build a complete, beginner-friendly but professional ecosystem around long-term Godot 4 projects: persistent structured memory, real AI file operations, visual creation tools, automated testing, team workflows, version control, integrations, backend services, publishing, live operations, analytics, asset QA, accessibility, performance optimization, and a creator marketplace.

## Recommended engine and architecture
- **Game engine:** Godot 4, retained as the authoritative generated project format.
- **Platform backend:** Lovable Cloud for project data, auth, permissions, realtime collaboration, analytics, live operations, and secure artifacts.
- **Native builds:** Existing connected build agents for platform SDKs, compilation, signing, packaging, and validation.
- **AI execution:** AI SDK agent tools with approval-gated mutations rather than text-only claims.
- **Project model:** Structured game entities plus files, snapshots, branches, tests, assets, releases, and team membership.

## Build stages

### 1. Make the AI builder real
- Add approval-gated AI tools for creating/updating/removing files, creating checkpoints, updating stages, and recording test results.
- Add structured project memory for story, characters, mechanics, maps, controls, economy, multiplayer rules, art direction, and decisions.
- Summarize older conversations so large projects retain durable context without overflowing the model context window.
- Show proposed changes, impacted systems, dependencies, risks, files, and credit estimate before major work.

### 2. Version control and safe change management
- Store immutable file snapshots rather than only version numbers.
- Add automatic checkpoints, file diffs, undo, restore, duplication, branches, merge proposals, backups, and rollback.
- Require approval for destructive changes, schema changes, large refactors, releases, and merges.

### 3. Visual Godot editor
- Add scene tree, inspector, asset browser, 2D/3D viewport, transform controls, snapping, lighting controls, UI layout editor, and gameplay graph.
- Save visual edits back to Godot scenes/resources through validated server operations.
- Add multiplayer-aware presence, object locks, comments, and change attribution.

### 4. AI playtesting and quality reports
- Queue playtests through connected agents with recorded inputs and deterministic test scenarios.
- Cover movement, combat, quests, menus, saves, loading, multiplayer, touch controls, transitions, accessibility, performance, and crashes.
- Produce evidence-based reports with logs, screenshots, metrics, severity, reproduction steps, and approval-gated safe fixes.

### 5. Collaboration and permissions
- Add project members, workspace roles, invitations, team chat, comments, mentions, approval requests, activity history, and ownership controls.
- Use server-validated roles and project membership for every protected operation.
- Add realtime presence and conflict-safe editing.

### 6. Integrations hub
- Add a plugin manifest and permission system.
- Support Comet API, Fable 5, GitHub, Discord, analytics, cloud storage, payments, asset services, and publishing providers through secure connectors or server-side credentials.
- Treat Firebase, PlayFab, and other external backends as optional export targets while keeping the platform backend authoritative by default.

### 7. Generated game backend services
- Add configurable accounts, cloud saves, inventories, leaderboards, rooms, matchmaking, achievements, purchases, reports, moderation, admin controls, and notifications.
- Generate versioned schemas, access policies, service contracts, Godot client bindings, test fixtures, and migration plans.

### 8. Publishing center
- Complete real web deployment and domain status flows.
- Extend build-agent jobs for Windows, macOS, Linux, Android, and iOS preparation.
- Add Steam, Itch.io, store metadata, artwork, release notes, signing requirements, validation, staged rollout, and rollback.
- Never report a release complete until compilation, packaging, signing requirements, checksums, and platform tests pass.

### 9. Live operations and analytics
- Add announcements, scheduled events, maintenance mode, rewards, player lookup, bans, pricing, limited-time items, crash triage, remote configuration, and release rollback.
- Add active players, retention, session duration, level popularity, deaths, purchases, devices, frame rate, latency, loading, and crash-rate dashboards.
- Add AI explanations grounded in queried metrics, with recommendations and confidence/limitations.

### 10. Asset consistency, accessibility, and optimization
- Add asset metadata and automated checks for style, scale, proportions, lighting, materials, animation, audio loudness, and UI theme.
- Add controller remapping, subtitles, colorblind modes, text scaling, reduced motion, contrast, difficulty assists, and screen-reader-friendly menus to project requirements and tests.
- Add texture/download audits, unused-file detection, memory/load profiling, frame-time analysis, network diagnostics, compression, LOD recommendations, and platform budgets.

### 11. Marketplace
- Add creator profiles, listings, previews, categories, ratings, reviews, licenses, supported versions, update history, moderation, purchases, downloads, and revenue records.
- Integrate payments only after provider enablement and product approval; paid marketplace work remains a separate approval milestone.

## Initial database additions
- `game_memory`, `game_entities`, `project_decisions`
- `file_revisions`, `branches`, `checkpoint_files`, `change_proposals`
- `project_members`, `project_invites`, `comments`, `approval_requests`, `team_messages`
- `playtest_runs`, `playtest_cases`, `playtest_results`, `performance_samples`
- `project_assets`, `asset_audits`, `integration_connections`
- `game_releases`, `release_targets`, `live_ops_configs`, `live_ops_events`
- `analytics_events`, `crash_reports`
- Marketplace tables in the final stage

Every table will receive explicit grants, row-level access rules, timestamps, indexes, and owner/member scoping in the same migration.

## First implementation slice
1. AI structured memory and long-context summaries.
2. AI file/checkpoint/stage tools with explicit approval.
3. Immutable file revisions, diff, undo, and restore.
4. Real playtest job schema and Build Center report UI.
5. Studio navigation for Editor, Tests, Team, Releases, Live Ops, Analytics, Integrations, and Marketplace, with unavailable later-stage areas clearly labeled rather than mocked as functional.

## Files created first
- `src/lib/game-memory.functions.ts`
- `src/lib/project-changes.functions.ts`
- `src/lib/playtesting.functions.ts`
- `src/components/change-approval-dialog.tsx`
- `src/components/project-memory-panel.tsx`
- `src/components/version-control-panel.tsx`
- `src/components/playtest-center.tsx`
- Secure schema migrations for memory, revisions, approvals, and tests

## Files updated first
- `src/routes/api/chat.ts`
- `src/lib/studio.functions.ts`
- `src/routes/_authenticated/studio.$gameId.$threadId.tsx`
- `src/components/create-game-dialog.tsx`
- `src/components/studio-shell.tsx`
- Generated backend types after approved migrations

## Dependencies
- Existing AI SDK and Lovable AI gateway.
- Existing Godot 4 connected build agents.
- A graph/viewport library will be selected only when the visual editor stage begins, to avoid adding heavy dependencies prematurely.
- Realtime collaboration uses the existing backend realtime channel model with strict cleanup and project-scoped policies.
- Marketplace payments require a separate provider eligibility and enablement approval.

## Risks and limitations
- A browser visual editor cannot replace every native Godot editor feature; it will provide a curated, interoperable subset and preserve export compatibility.
- Windows, macOS, Linux, Android, and iOS binaries require connected machines, SDKs, signing identities, and store credentials.
- Live multiplayer tests require multiple isolated clients and may consume significant build-agent capacity.
- Large assets and world builds need storage, transfer, and execution quotas; performance budgets will be explicit.
- External services vary in API support and licensing; unsupported operations will be reported honestly.
- Credit estimates will be ranges based on selected stages and assets, not guarantees, because model and build usage varies.

## Testing gates
- Server validation, authorization, row-level access, and role-escalation tests.
- File mutation, checkpoint, diff, restore, branch, and rollback tests.
- Agent job authentication, retry, timeout, artifact integrity, and cancellation tests.
- Responsive and accessibility checks across phone, tablet, laptop, and desktop.
- Godot import validation and platform build smoke tests.
- Security scan and database linter after each backend milestone.

## Recommended next step
Approve this plan to begin the first implementation slice. Later stages will remain approval-gated so the platform never presents placeholder controls as completed production systems.