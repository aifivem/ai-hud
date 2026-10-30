import {
  AdminWorld,
  cache,
  getPlayerData,
  hud as uiHud,
  loadLocaleTexts,
  onCache,
  onServerEvent,
  resourceExport,
} from "@aicore-fivem/lib/client";
import { CORE, KEY_HINTS, type KeyHintView } from "@aicore-fivem/shared";
import {
  DEFAULT_NEEDS,
  EVENTS,
  NEEDS,
  readSettings,
  type Need,
  type Needs,
} from "common/hud";
import { Identity } from "./identity";
import { effective, openSettings, radar, registerHudExports } from "./prefs";
import { send, Watchers } from "./watchers";
import { WeaponWatch } from "./weapon";

const core = resourceExport("ai-core");
const isHint = (v: unknown): v is KeyHintView =>
  typeof v === "object" &&
  v !== null &&
  typeof Reflect.get(v, "id") === "string" &&
  typeof Reflect.get(v, "key") === "string" &&
  typeof Reflect.get(v, "label") === "string";

const isNeed = (v: unknown): v is Need =>
  typeof v === "string" && (NEEDS as readonly string[]).includes(v);

/**
 * The HUD's own state: panel settings, the character's needs (server snapshot + deltas), whether it shows. It shows
 * only with a character in the world and no pause menu or fade.
 */
class Hud {
  private readonly world = new AdminWorld(["settings"]);
  settings = readSettings(this.world.get("settings"));
  readonly needs: Needs = { ...DEFAULT_NEEDS };
  loaded = false;
  private visible = false;
  private shootTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.world.onChange("settings", () => {
      this.settings = readSettings(this.world.get("settings"));
      this.setup();
    });
  }

  setup(): void {
    send({
      action: "setup",
      data: { texts: loadLocaleTexts(), settings: effective(this.settings) },
    });
    radar.update(this.visible, this.settings);
    send({ action: "radar", data: radar.visible });
  }

  setNeeds(raw: Record<string, unknown>): void {
    for (const need of NEEDS)
      if (typeof raw[need] === "number") this.needs[need] = raw[need];
    this.loaded = true;
    send({ action: "needs", data: this.needs });
  }

  setNeed(need: Need, value: number): void {
    this.needs[need] = value;
    send({ action: "needs", data: { [need]: value } });
  }

  /** False while a full-screen UI is open (ai-core's HUD visibility, lib `hud`). */
  uiAllows = true;

  updateVisible(): void {
    const next =
      this.loaded &&
      this.uiAllows &&
      !IsPauseMenuActive() &&
      !IsScreenFadedOut();
    if (radar.update(next, this.settings))
      send({ action: "radar", data: radar.visible });
    if (next === this.visible) return;
    this.visible = next;
    send({ action: "visible", data: next });
  }

  /** Empty hunger or thirst hurts (the client owns its ped's health). */
  starve(): void {
    if (
      !this.loaded ||
      this.settings.emptyDamage <= 0 ||
      (this.needs.hunger > 0 && this.needs.thirst > 0)
    )
      return;
    const ped = cache.ped;
    if (!IsEntityDead(ped))
      SetEntityHealth(
        ped,
        Math.max(0, GetEntityHealth(ped) - this.settings.emptyDamage),
      );
  }

  /** Shooting stresses; checked once a second only while armed. */
  watchWeapon(weapon: number | false): void {
    if (this.shootTimer) clearInterval(this.shootTimer);
    this.shootTimer =
      weapon === false
        ? null
        : setInterval(
            () => IsPedShooting(cache.ped) && emitNet(EVENTS.stress, 1),
            1000,
          );
  }
}

const hud = new Hud();
const identity = new Identity();

RegisterNuiCallback("ready", (_d: unknown, cb: (r: unknown) => void) => {
  hud.setup();
  send({ action: "keyHints", data: core.GetKeyHints() });
  send({ action: "needs", data: hud.needs });
  identity.resend();
  const money = getPlayerData("money");
  if (money) send({ action: "money", data: money });
  cb({ ok: true });
});
onServerEvent(
  EVENTS.needs,
  {
    args: ([raw]) =>
      typeof raw === "object" && raw !== null
        ? [raw as Record<string, unknown>]
        : null,
  },
  (raw) => hud.setNeeds(raw),
);
onServerEvent(
  EVENTS.need,
  {
    args: ([need, value]) =>
      isNeed(need) && typeof value === "number" ? [need, value] : null,
  },
  (need, value) => hud.setNeed(need, value),
);
on(CORE.clientPlayerUnloadedEvent, () => {
  hud.loaded = false;
  hud.updateVisible();
});
onCache("weapon", (weapon) => hud.watchWeapon(weapon));
onCache("vehicle", () => hud.updateVisible());
// ai-core's key hints: the list for the player's situation, sent again whenever it changes.
on(KEY_HINTS.changedEvent, (list: unknown) => {
  if (Array.isArray(list))
    send({ action: "keyHints", data: list.filter(isHint) });
});
const reopen = () => void openSettings(() => hud.setup());
onServerEvent(EVENTS.openSettings, reopen);
registerHudExports(reopen, () => hud.setup());
uiHud.onChange((visible) => {
  hud.uiAllows = visible;
  hud.updateVisible();
});
setInterval(() => hud.updateVisible(), 250);
setInterval(() => hud.starve(), 10_000);

// Identity seeds ai-core's player data first: the watchers read money from it.
identity.start();
new Watchers(() => hud.settings).start();
new WeaponWatch().start();
