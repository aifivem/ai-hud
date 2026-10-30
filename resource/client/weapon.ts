import {
  cache,
  every,
  inventory,
  type Job,
  onCache,
} from "@aicore-fivem/lib/client";
import type { WeaponInfo } from "common/hud";
import { send } from "./watchers";

/**
 * The weapon box: the held weapon's name and picture, the rounds in the clip and the rest. Read four times a second
 * only while a weapon is held, sent only when a value changed.
 */
export class WeaponWatch {
  private timer: Job | null = null;
  private last = "";
  /** Label and picture of the held weapon item (ai-core's inventory layer, whatever inventory runs). */
  private meta: { label: string; image?: string } | null = null;

  start(): void {
    onCache("weapon", (weapon) => this.watch(weapon));
    this.watch(cache.weapon);
  }

  private watch(weapon: number | false): void {
    this.timer?.stop();
    this.timer = null;
    this.last = "";
    if (weapon === false) return send({ action: "weapon", data: null });
    this.meta = inventory.currentWeapon();
    this.timer = every(250, () => this.read(weapon), { name: "weapon" });
    this.read(weapon);
  }

  private read(hash: number): void {
    const ped = cache.ped;
    const hasClip = GetMaxAmmoInClip(ped, hash, true) > 0;
    const [, clip = 0] = GetAmmoInClip(ped, hash);
    const total = Math.max(0, GetAmmoInPedWeapon(ped, hash) - clip);
    const info: WeaponInfo = {
      label: this.meta?.label ?? "",
      image: this.meta?.image,
      clip: hasClip ? clip : null,
      total: hasClip ? total : null,
    };
    const key = `${info.label}|${info.clip}|${info.total}`;
    if (key === this.last) return;
    this.last = key;
    send({ action: "weapon", data: info });
  }
}
