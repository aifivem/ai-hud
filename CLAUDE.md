# ai-hud

The HUD (lumihud-style status pills, money, speedometer, street, voice) and the character's needs: hunger, thirst, stress. Depends on ai-core (character metadata, money, admin panel), reads pma-voice state when it runs, takes item effects from ai-core's item use event.

## Decisions

- Needs live in ai-core's character metadata (`hunger`, `thirst`, `stress`, 0-100: the QB keys); ai-hud is their only writer (`server/needs.ts`), decays them every minute and sends the owner a snapshot at load plus a delta when a rounded value changes.
- Stress only increases from the client (`ai-hud:stress`, 1-5, rate limited; the client sends at most one report per second); everything else is server side. Its sources are panel settings: speed above `stressSpeed` km/h with `stressSpeedChance` % per changed speed sample, `stressShot` points per shot (lib `onShot`).
- Client values (health, armour, vehicle, street, voice) are read on timers and sent to the NUI only on change; the vehicle timer exists only in a vehicle.
- Server: needs and job labels follow lib `onCharacter` (it also loads the players already in the game after a restart), per-player maps are `PlayerMap`s, settings a `panel.view`.
- The HUD hides without a character, in the pause menu, during screen fades and while a full-screen UI is open (ai-core's `CORE.clientHudVisibleEvent`, lib `hud.onChange`).
- Top right shows the job (the on-duty job, else the first membership, as the bridges pick it) with ai-core's labels, the server id and the character name. The client has no job definitions, so `server/job.ts` resolves the labels from `server/definitions.ts` (each definition read once from ai-core, dropped on `CORE.definitionsChangedEvent`; same file in ai-banking and ai-management until the lib has a definitions mirror): the client takes a snapshot through the `ai-hud:job` callback at start, the owner gets `ai-hud:client:job` when the shown job changes. Name and id come from ai-core's player data on the client, seeded from its `GetPlayerData` export (after a restart of ai-hud nothing is pushed again).
- Player preferences (`/hud`, the radial menu's HUD entry through ai-core's `OpenHudSettings`): one switch row per HUD part and the key hints in ai-core's menu (lib `menu` `checked` rows, flipped in place), kept in the client's KVP (`client/prefs.ts`, versioned JSON). A panel switch that is off wins; the NUI gets the effective settings. The minimap mode is not a player choice (owner decision).
- Minimap (`Radar` in `client/prefs.ts`): shown while the HUD shows and the panel says `always` (or an admin's `SetMinimapAlways` from ai-admin's menu), else only in a vehicle. `DisplayRadar` is applied on every update (the character screen and the spawn switch it too); the first time it shows after loading, the big map flips on for 200 ms (the minimap otherwise stays empty), never again. The NUI gets `radar` and moves the street / voice / status group beside the minimap or to the left edge (lumihud keeps separate car and on-foot spots). GTA's health / armour bars under it are hidden by calling the minimap scaleform's `SETUP_HEALTH_ARMOUR` with 3 every frame while it shows.
- Key hints on the left: ai-core's list (`KEY_HINTS` event, `GetKeyHints()` at start) forwarded to the NUI unchanged, drawn as lumihud's help buttons (icon circle + pill with key and label; icon names map in `web/src/features/KeyHints.tsx`, unknown ones draw a keyboard); the panel's `keyHints` switch and the player's preference turn them off.
- Weapon box (top right under the money, `client/weapon.ts`): while a weapon is held, the label and picture come from lib `inventory.currentWeapon()` (ai-core's inventory layer, whatever inventory runs), read on each weapon change; the rounds from natives every 250 ms, sent only on change; no clip = label only.
- Key hint texts are the keybinds' short `hintLabel` (one or two words); the long description stays for GTA's key settings.
- Speedometer copies lumihud's Type1 car gauge: the drop shadow sits only on the arcs and the digits, the belt and fuel icons share the right column (top and bottom).
- Voice: pma-voice range from its player state `proximity.index` (lib `PlayerState` mirror) at start, then its `setTalkingMode` / `radioActive` events; the NUI gets a voice message only when talking, range or radio changed.

## Contracts

- Events: `resource/common/hud.ts`. Client exports `OpenSettings()`, `SetMinimapAlways(on)`, `GetMinimapAlways()`; command `hud`. Server exports `GetNeeds(source)`, `SetNeed(source, need, value)`, `AddNeed(source, need, delta)`.
- Listens to ai-core's `itemUsed` (status values, from inventories that define them) and ai-core's `playerLoaded` / `playerUnloaded` / `jobsChanged` / `dutyChanged`; reads `GetJobs`, `GetDutyJob`, `GetJobDefinitions` only when the shown job may have changed.
- Reads the vehicle state bag `VEHICLE_BAGS.fuel` (a fuel script sets it), the player bag `PLAYER_BAGS.proximity` (pma-voice / ai-voice range), the seat belt from ai-smallresources' `SEATBELT_EVENT` and `GetSeatbelt()` export and pma-voice's local events.

## Entry points

- Needs: `resource/server/needs.ts`; panel `server/schema.ts`.
- Job labels: `resource/server/job.ts`.
- Client: state and visibility `resource/client/index.ts`, value watchers `client/watchers.ts`, name and job `client/identity.ts`.
- NUI: `web/src/features/Hud.tsx`; browser preview `bun run webdev` (`?vehicle=1&radio=1&offduty=1`).
