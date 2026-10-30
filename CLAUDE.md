# ai-hud

The HUD (lumihud-style status pills, money, speedometer, street, voice) and the character's needs: hunger, thirst, stress. Depends on ai-core (character metadata, money, admin panel), reads pma-voice state when it runs, takes item effects from ai-inventory. Research and decisions: `docs/research/ai-hud.md`.

## Decisions

- Needs live in ai-core's character metadata (`hunger`, `thirst`, `stress`, 0-100: the QB keys); ai-hud is their only writer (`server/needs.ts`), decays them every minute and sends the owner a snapshot at load plus a delta when a rounded value changes.
- Stress only increases from the client (`ai-hud:stress`, 1-5, rate limited); everything else is server side.
- Client values (health, armour, vehicle, street, voice) are read on timers and sent to the NUI only on change; the vehicle timer exists only in a vehicle, the shooting check only while armed.
- The HUD hides without a character, in the pause menu and during screen fades.

## Contracts

- Events: `resource/common/hud.ts`. Server exports `GetNeeds(source)`, `SetNeed(source, need, value)`, `AddNeed(source, need, delta)`.
- Listens to `ai-inventory:usedItem` (status values) and ai-core's `playerLoaded` / `playerUnloaded`.
- Reads the vehicle state bag `fuel` (a fuel script sets it), the local player state `seatbelt` (boolean while a seatbelt resource runs, ai-smallresources) and pma-voice's local events.

## Entry points

- Needs: `resource/server/needs.ts`; panel `server/schema.ts`.
- Client: state and visibility `resource/client/index.ts`, value watchers `client/watchers.ts`.
- NUI: `web/src/features/Hud.tsx`; browser preview `bun run webdev` (`?vehicle=1`).
