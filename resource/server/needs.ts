import {
  AdminPanel,
  onCharacter,
  onClientEvent,
  PlayerMap,
  registerExport,
  resourceExport,
} from "@aicore-fivem/lib/server";
import { isRecord, oneArg, readFinite } from "@aicore-fivem/lib/shared";
import { CORE } from "@aicore-fivem/shared";
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
/** Panel settings, kept current by the panel. */
const settings = panel.view("settings", readSettings);

const clamp = (v: number): number => Math.min(100, Math.max(0, v));
const isNeed = (v: unknown): v is Need =>
  typeof v === "string" && (NEEDS as readonly string[]).includes(v);

/**
 * Needs of every loaded character, kept in ai-core's metadata (`hunger`, `thirst`, `stress`: the keys QB scripts read)
 * and mirrored here. The owner gets a snapshot at load and a delta whenever a rounded value changes.
 */
class NeedsStore {
  private readonly byPlayer = new PlayerMap<Needs>();

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
      this.add(source, "hunger", -settings.value.hungerRate);
      this.add(source, "thirst", -settings.value.thirstRate);
      this.add(source, "stress", -settings.value.stressRelief);
    }
  }
}

export const needs = new NeedsStore();

// Also loads the characters already in the game after a restart of this resource.
onCharacter({
  loaded: (source) => needs.load(source),
  unloaded: (source) => needs.drop(source),
});
setInterval(() => needs.tick(), 60_000);

// Items with hunger / thirst / stress values (ai-core's item use event).
on(CORE.itemUsedEvent, (source: number, _name: string, status: unknown) => {
  if (!isRecord(status)) return;
  for (const [need, value] of Object.entries(status))
    if (isNeed(need) && typeof value === "number")
      needs.add(source, need, value);
});

onClientEvent(
  EVENTS.stress,
  {
    args: oneArg((v) => {
      const amount = readFinite(v);
      return amount !== null && amount > 0 && amount <= 5 ? amount : null;
    }),
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
