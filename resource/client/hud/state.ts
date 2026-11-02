import { AdminWorld, loadLocaleTexts } from "@aifivem/lib/client";
import {
  DEFAULT_NEEDS,
  NEEDS,
  readSettings,
  type Needs,
  type Settings,
} from "common/hud";
import { effective, radar } from "../prefs";
import { waypointColor } from "../waypoint";
import { send } from "../watchers";

/**
 * The HUD's own state: panel settings, the character's needs (ai-core's player data: metadata snapshot + deltas),
 * whether it shows. It shows only with a character in the world and no pause menu or fade.
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
    waypointColor.apply(this.settings.waypointColor);
  }

  /** Takes the needs from the character's metadata; the NUI gets only the ones that changed. */
  setNeeds(metadata: Record<string, unknown> | undefined): void {
    const changed: Partial<Needs> = {};
    let any = false;
    for (const need of NEEDS) {
      const value = metadata?.[need];
      if (typeof value !== "number" || value === this.needs[need]) continue;
      this.needs[need] = changed[need] = value;
      any = true;
    }
    if (any) send({ action: "needs", data: changed });
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
}

export const hud = new Hud();
