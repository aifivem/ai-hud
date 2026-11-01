import {
  AdminWorld,
  cache,
  loadLocaleTexts,
  medical,
} from "@aicore-fivem/lib/client";
import {
  DEFAULT_NEEDS,
  NEEDS,
  readSettings,
  type Need,
  type Needs,
  type Settings,
} from "common/hud";
import { effective, radar } from "../prefs";
import { send } from "../watchers";

/**
 * The HUD's own state: panel settings, the character's needs (server snapshot + deltas), whether it shows. It shows
 * only with a character in the world and no pause menu or fade.
 */
class Hud {
  private readonly world = new AdminWorld(["settings"]);
  private readonly view = this.world.view("settings", readSettings);
  readonly needs: Needs = { ...DEFAULT_NEEDS };
  loaded = false;
  private visible = false;

  constructor() {
    this.world.onChange("settings", () => this.setup());
  }

  get settings(): Settings {
    return this.view.value;
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
    if (!medical.isDead())
      SetEntityHealth(
        ped,
        Math.max(0, GetEntityHealth(ped) - this.settings.emptyDamage),
      );
  }
}

export const hud = new Hud();
