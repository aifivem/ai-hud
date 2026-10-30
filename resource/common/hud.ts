import { bool, num, record } from "@aicore-fivem/lib/shared";

/** ai-hud's contracts: needs, panel settings, events and the NUI messages. No natives. */

export const NEEDS = ["hunger", "thirst", "stress"] as const;
export type Need = (typeof NEEDS)[number];
/** 0-100; hunger and thirst count down (100 = full), stress counts up (0 = calm). */
export type Needs = Record<Need, number>;

export const DEFAULT_NEEDS: Needs = { hunger: 100, thirst: 100, stress: 0 };

export const EVENTS = {
  /** Server -> owner: (needs: Needs) snapshot at load; then (need, value) deltas through `need`. */
  needs: "ai-hud:client:needs",
  need: "ai-hud:client:need",
  /** Client -> server: (amount) stress from shooting or speeding; only ever adds. */
  stress: "ai-hud:stress",
} as const;

export interface Settings {
  /** Points lost per minute. */
  hungerRate: number;
  thirstRate: number;
  /** Stress points that fade per minute. */
  stressRelief: number;
  /** Health lost every 10 s while hunger or thirst is at 0. */
  emptyDamage: number;
  speedUnit: "kmh" | "mph";
  show: { needs: boolean; money: boolean; speedometer: boolean; street: boolean; voice: boolean };
}

export function readSettings(raw: unknown): Settings {
  const s = record(raw);
  const show = record(s.show);
  return {
    hungerRate: num(s.hungerRate, 0.25, 0, 10),
    thirstRate: num(s.thirstRate, 0.35, 0, 10),
    stressRelief: num(s.stressRelief, 0.5, 0, 10),
    emptyDamage: num(s.emptyDamage, 2, 0, 50),
    speedUnit: s.speedUnit === "mph" ? "mph" : "kmh",
    show: {
      needs: bool(show.needs, true),
      money: bool(show.money, true),
      speedometer: bool(show.speedometer, true),
      street: bool(show.street, true),
      voice: bool(show.voice, true),
    },
  };
}

export interface Vitals {
  health: number;
  armour: number;
}

export interface VehicleInfo {
  speed: number;
  fuel: number;
  gear: number;
  rpm: number;
  /** The local `seatbelt` state; null without a seatbelt resource or in vehicles without a belt. */
  belt: boolean | null;
}

/** Client -> NUI messages; each carries only what changed. */
export type NuiMessage =
  | { action: "setup"; data: { texts: Record<string, string>; settings: Settings } }
  | { action: "visible"; data: boolean }
  | { action: "needs"; data: Partial<Needs> }
  | { action: "vitals"; data: Vitals }
  | { action: "money"; data: Record<string, number> }
  | { action: "vehicle"; data: VehicleInfo | null }
  | { action: "street"; data: { street: string; zone: string } }
  | { action: "voice"; data: { talking: boolean; mode: number; radio: boolean } };
