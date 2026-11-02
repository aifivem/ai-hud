import {
  cache,
  every,
  fadeIn,
  fadeOut,
  medical,
  notify,
  onStop,
} from "@aifivem/lib/client";
import { Locale } from "common";
import type { NeedWarningSettings, Needs, Settings } from "common/hud";

/**
 * Low hunger / thirst: a notification at most every `notifyEvery` s; below the critical level a dizzy spell (fade out,
 * health loss, fade in) every `faintEvery` s instead. The 1 s job runs only while a loaded character is below a level.
 */
export class NeedWarnings {
  private readonly job = every(1000, () => this.check(), {
    active: false,
    name: "needWarnings",
  });
  private nextNotify = 0;
  private nextFaint = 0;
  private fainting = false;

  constructor(
    private readonly needs: Needs,
    private readonly settings: () => Settings,
  ) {
    // A dizzy spell cut by a stop would leave the screen black.
    onStop(() => {
      if (this.fainting) void fadeIn(0);
    });
  }

  /** Switches the job on while it has something to do; call when needs, settings or the character changed. */
  update(loaded: boolean): void {
    const w = this.settings().warnings;
    const low = Math.min(this.needs.hunger, this.needs.thirst);
    this.job.set(
      loaded &&
        ((w.notify && low < w.lowAt) || (w.faint && low < w.criticalAt)),
    );
  }

  private check(): void {
    if (this.fainting || medical.isDead()) return;
    const { warnings: w, emptyDamage } = this.settings();
    const { hunger, thirst } = this.needs;
    const now = GetGameTimer();
    if (w.faint && Math.min(hunger, thirst) < w.criticalAt) {
      // Another script's fade (teleport, spawn) owns the screen: try again next second.
      if (now < this.nextFaint || !IsScreenFadedIn()) return;
      this.nextFaint = now + w.faintEvery * 1000;
      // Empty food or water already costs `emptyDamage` every 10 s (`Hud.starve`): never both.
      const empty = emptyDamage > 0 && (hunger <= 0 || thirst <= 0);
      void this.faint(w, empty ? 0 : w.damage);
      return;
    }
    if (!w.notify || now < this.nextNotify) return;
    const hungry = hunger < w.lowAt;
    const thirsty = thirst < w.lowAt;
    if (!hungry && !thirsty) return;
    this.nextNotify = now + w.notifyEvery * 1000;
    notify(
      Locale(
        hungry && thirsty
          ? "NEED_LOW_BOTH"
          : hungry
            ? "NEED_LOW_HUNGER"
            : "NEED_LOW_THIRST",
      ),
      "warning",
    );
  }

  private async faint(w: NeedWarningSettings, damage: number): Promise<void> {
    this.fainting = true;
    notify(Locale("NEED_CRITICAL"), "error");
    try {
      await fadeOut(w.fadeOut * 1000);
      // The client owns its ped's health, as for empty needs.
      if (damage > 0 && !medical.isDead()) {
        const ped = cache.ped;
        SetEntityHealth(ped, Math.max(0, GetEntityHealth(ped) - damage));
      }
      await fadeIn(w.fadeIn * 1000);
    } finally {
      this.fainting = false;
    }
  }
}
