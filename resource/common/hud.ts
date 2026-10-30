import { bool, num, record } from "@aicore-fivem/lib/shared";
import type { KeyHintView } from "@aicore-fivem/shared";

/** ai-hud's contracts: needs, panel settings, events and the NUI messages. No natives. */

/** What a player turns off for themself in /hud (stored in their KVP); the panel's switches still decide first. */
export interface Prefs {
  v: 1;
  needs: boolean;
  money: boolean;
  speedometer: boolean;
  street: boolean;
  voice: boolean;
  identity: boolean;
  keyHints: boolean;
  /** Minimap on foot even when the panel says "only in a vehicle". */
  minimapAlways: boolean;
}

export const DEFAULT_PREFS: Prefs = {
  v: 1,
  needs: true,
  money: true,
  speedometer: true,
  street: true,
  voice: true,
  identity: true,
  keyHints: true,
  minimapAlways: false,
};

export function readPrefs(raw: unknown): Prefs {
  const p = record(raw);
  if (p.v !== 1) return { ...DEFAULT_PREFS };
  const out = { ...DEFAULT_PREFS };
  for (const key of Object.keys(DEFAULT_PREFS) as Array<keyof Prefs>)
    if (key !== "v" && typeof p[key] === "boolean") out[key] = p[key];
  return out;
}

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
  /** Callback: () -> JobView | null, the job the HUD shows (snapshot when the client starts). */
  job: "ai-hud:job",
  /** Server -> owner: (job: JobView | null) the shown job changed (load, job or duty change). */
  jobSet: "ai-hud:client:job",
  /** Server -> player: () the /hud command: the settings menu opens. */
  openSettings: "ai-hud:client:openSettings",
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
  /** Key hints on the left (ai-core's list: keybinds for the situation and hints scripts add). */
  keyHints: boolean;
  /** The minimap on foot too, or only in a vehicle. */
  minimap: "always" | "vehicle";
  show: {
    needs: boolean;
    money: boolean;
    speedometer: boolean;
    street: boolean;
    voice: boolean;
    identity: boolean;
  };
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
    keyHints: bool(s.keyHints, true),
    minimap: s.minimap === "vehicle" ? "vehicle" : "always",
    show: {
      needs: bool(show.needs, true),
      money: bool(show.money, true),
      speedometer: bool(show.speedometer, true),
      street: bool(show.street, true),
      voice: bool(show.voice, true),
      identity: bool(show.identity, true),
    },
  };
}

/** The job top right: the on-duty job, else the first membership, with ai-core's labels. */
export interface JobView {
  label: string;
  /** Grade label; empty when the job has no such grade. */
  grade: string;
  onDuty: boolean;
}

export function readJob(raw: unknown): JobView | null {
  if (typeof raw !== "object" || raw === null) return null;
  const j = record(raw);
  if (typeof j.label !== "string") return null;
  return {
    label: j.label,
    grade: typeof j.grade === "string" ? j.grade : "",
    onDuty: j.onDuty === true,
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
  | {
      action: "setup";
      data: { texts: Record<string, string>; settings: Settings };
    }
  | { action: "visible"; data: boolean }
  | { action: "keyHints"; data: KeyHintView[] }
  | { action: "needs"; data: Partial<Needs> }
  | { action: "vitals"; data: Vitals }
  | { action: "money"; data: Record<string, number> }
  | { action: "vehicle"; data: VehicleInfo | null }
  | { action: "street"; data: { street: string; zone: string } }
  | {
      action: "voice";
      data: { talking: boolean; mode: number; radio: boolean };
    }
  | { action: "identity"; data: { serverId: number; name: string } | null }
  | { action: "job"; data: JobView | null };
