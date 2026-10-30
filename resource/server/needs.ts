import {
  AdminPanel,
  onClientEvent,
  registerExport,
  resourceExport,
} from "@aicore-fivem/lib/server";
import { CORE, type CharacterInfo } from "@aicore-fivem/shared";
import {
  DEFAULT_NEEDS,
  EVENTS,
  NEEDS,
  readSettings,
  type Need,
  type Needs,
} from "common/hud";
import { hudSchema } from "./schema";

const core = resourceExport("ai-core");
const panel = new AdminPanel(hudSchema);
/** Panel settings, parsed again after every change. */
const content = { settings: readSettings(panel.get("settings")) };
panel.onChange(
  "settings",
  () => (content.settings = readSettings(panel.get("settings"))),
);

const clamp = (v: number): number => Math.min(100, Math.max(0, v));
const isNeed = (v: unknown): v is Need =>
  typeof v === "string" && (NEEDS as readonly string[]).includes(v);

/**
 * Needs of every loaded character, kept in ai-core's metadata (`hunger`, `thirst`, `stress`: the keys QB scripts read)
 * and mirrored here. The owner gets a snapshot at load and a delta whenever a rounded value changes.
 */
class NeedsStore {
  private readonly byPlayer = new Map<number, Needs>();

  load(source: number): void {
    const needs = { ...DEFAULT_NEEDS };
    for (const need of NEEDS) {
      const stored = core.GetMeta(source, need);
      if (typeof stored === "number") needs[need] = clamp(stored);
    }
    this.byPlayer.set(source, needs);
    emitNet(EVENTS.needs, source, needs);
  }

  drop(source: number): void {
    this.byPlayer.delete(source);
  }

  get(source: number): Needs | undefined {
    return this.byPlayer.get(source);
  }

  set(source: number, need: Need, value: number): void {
    const needs = this.byPlayer.get(source);
    if (!needs) return;
    const before = Math.round(needs[need]);
    needs[need] = clamp(value);
    core.SetMeta(source, need, Math.round(needs[need] * 100) / 100);
    if (Math.round(needs[need]) !== before)
      emitNet(EVENTS.need, source, need, Math.round(needs[need]));
  }

  add(source: number, need: Need, delta: number): void {
    const needs = this.byPlayer.get(source);
    if (needs) this.set(source, need, needs[need] + delta);
  }

  /** One minute passed: hunger and thirst drop, stress fades. */
  tick(): void {
    for (const source of this.byPlayer.keys()) {
      this.add(source, "hunger", -content.settings.hungerRate);
      this.add(source, "thirst", -content.settings.thirstRate);
      this.add(source, "stress", -content.settings.stressRelief);
    }
  }
}

export const needs = new NeedsStore();

on(CORE.playerLoadedEvent, (source: number, _character: CharacterInfo) =>
  needs.load(source),
);
on(CORE.playerUnloadedEvent, (source: number) => needs.drop(source));
on("playerDropped", () => needs.drop(Number(globalThis.source)));
setInterval(() => needs.tick(), 60_000);

// Items with hunger / thirst / stress values (ai-core's item use event).
on(CORE.itemUsedEvent, (source: number, _name: string, status: unknown) => {
  if (typeof status !== "object" || status === null) return;
  for (const [need, value] of Object.entries(status))
    if (isNeed(need) && typeof value === "number")
      needs.add(source, need, value);
});

onClientEvent(
  EVENTS.stress,
  {
    args: ([amount]) =>
      typeof amount === "number" && amount > 0 && amount <= 5 ? [amount] : null,
    rate: { count: 2, windowMs: 1000 },
  },
  (source, amount) => needs.add(source, "stress", amount),
);

registerExport("GetNeeds", (source: unknown) =>
  typeof source === "number" ? (needs.get(source) ?? null) : null,
);
registerExport("SetNeed", (source: unknown, need: unknown, value: unknown) => {
  if (typeof source === "number" && isNeed(need) && typeof value === "number")
    needs.set(source, need, value);
});
registerExport("AddNeed", (source: unknown, need: unknown, delta: unknown) => {
  if (typeof source === "number" && isNeed(need) && typeof delta === "number")
    needs.add(source, need, delta);
});

/** After a restart of this resource: needs of the players already in the game. */
for (const source of core.GetLoadedSources()) needs.load(source);
