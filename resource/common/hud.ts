import { bool, int, num, record } from "@aifivem/lib/shared";
import type { KeyHintView } from "@aifivem/shared";

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
  /** km/h above which driving may add a stress point. */
  stressSpeed: number;
  /** Chance in % per speed change above `stressSpeed` to add a point. */
  stressSpeedChance: number;
  /** Stress points a shot adds (at most once a second). */
  stressShot: number;
  speedUnit: "kmh" | "mph";
  /** Key hints on the left (ai-core's list: keybinds for the situation and hints scripts add). */
  keyHints: boolean;
  /** The minimap on foot too, or only in a vehicle. */
  minimap: "always" | "vehicle";
  /** `SetRadarZoom` level while in a vehicle (0 = the game's own zoom). */
  minimapZoom: number;
  /** The waypoint's colour (HUD colour 142), or null for the game's own. */
  waypointColor: string | null;
  /** Low hunger / thirst: notifications, and below the critical level dizziness and health loss. */
  warnings: NeedWarningSettings;
  show: {
    needs: boolean;
    money: boolean;
    speedometer: boolean;
    street: boolean;
    voice: boolean;
    identity: boolean;
  };
}

export interface NeedWarningSettings {
  /** Notify below `lowAt` (hungry, thirsty or both), at most every `notifyEvery` seconds. */
  notify: boolean;
  lowAt: number;
  notifyEvery: number;
  /** Below this, dizziness and health loss (each switched on its own) and the critical notification. */
  criticalAt: number;
  /** Dizziness: the screen fades out and in every `faintEvery` seconds. */
  faint: boolean;
  faintEvery: number;
  /** Seconds the fade out / in takes. */
  fadeOut: number;
  fadeIn: number;
  /** Health loss: `damage` health every `hurtEvery` seconds. */
  hurt: boolean;
  damage: number;
  hurtEvery: number;
}

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

export function readSettings(raw: unknown): Settings {
  const s = record(raw);
  const show = record(s.show);
  const waypoint = record(s.waypoint);
  const w = record(s.warnings);
  return {
    hungerRate: num(s.hungerRate, 0.25, 0, 10),
    thirstRate: num(s.thirstRate, 0.35, 0, 10),
    stressRelief: num(s.stressRelief, 0.5, 0, 10),
    stressSpeed: num(s.stressSpeed, 160, 0, 500),
    stressSpeedChance: num(s.stressSpeedChance, 1, 0, 100),
    stressShot: int(s.stressShot, 1, 0, 5),
    speedUnit: s.speedUnit === "mph" ? "mph" : "kmh",
    keyHints: bool(s.keyHints, true),
    minimap: s.minimap === "vehicle" ? "vehicle" : "always",
    minimapZoom: int(s.minimapZoom, 1100, 0, 1400),
    waypointColor: bool(waypoint.custom, true)
      ? typeof waypoint.color === "string" && HEX_COLOR.test(waypoint.color)
        ? waypoint.color
        : "#ff4141"
      : null,
    warnings: {
      notify: bool(w.notify, true),
      lowAt: int(w.lowAt, 15, 1, 100),
      notifyEvery: int(w.notifyEvery, 60, 10, 3600),
      faint: bool(w.faint, true),
      criticalAt: int(w.criticalAt, 5, 1, 100),
      faintEvery: int(w.faintEvery, 20, 10, 3600),
      fadeOut: num(w.fadeOut, 4.5, 0.5, 10),
      fadeIn: num(w.fadeIn, 2.5, 0.5, 10),
      hurt: bool(w.hurt, true),
      damage: num(w.damage, 2, 1, 50),
      hurtEvery: int(w.hurtEvery, 10, 5, 3600),
    },
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
/** The weapon box: label and picture from the inventory, rounds from the game (null for weapons without a clip). */
export interface WeaponInfo {
  label: string;
  image?: string;
  clip: number | null;
  total: number | null;
}

export type NuiMessage =
  | {
      action: "setup";
      data: { texts: Record<string, string>; settings: Settings };
    }
  | { action: "visible"; data: boolean }
  /** The minimap shows: the status group sits beside it, else at the left edge. */
  | { action: "radar"; data: boolean }
  /** The held weapon, null when none. */
  | { action: "weapon"; data: WeaponInfo | null }
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
