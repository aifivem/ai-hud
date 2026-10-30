import {
  cache,
  callExport,
  isResourceStarted,
  onCache,
} from "@aicore-fivem/lib/client";
import { isRecord } from "@aicore-fivem/lib/shared";
import type { WeaponInfo } from "common/hud";
import { send } from "./watchers";

const INVENTORY = "ox_inventory";

/** Name, label and picture of the held weapon from the inventory (ox_inventory's `getCurrentWeapon`, which ai-inventory answers too). */
function heldWeapon(): { label: string; image?: string } | null {
  if (!isResourceStarted(INVENTORY)) return null;
  try {
    const held: unknown = callExport(INVENTORY, "getCurrentWeapon");
    if (!isRecord(held) || typeof held.name !== "string") return null;
    return {
      label: typeof held.label === "string" ? held.label : held.name,
      image:
        typeof held.image === "string"
          ? held.image
          : `nui://${INVENTORY}/web/images/${held.name}.png`,
    };
  } catch (error) {
    console.error("[ai-hud] reading the held weapon failed", error);
    return null;
  }
}

/**
 * The weapon box: the held weapon's name and picture, the rounds in the clip and the rest. Read four times a second
 * only while a weapon is held, sent only when a value changed.
 */
export class WeaponWatch {
  private timer: ReturnType<typeof setInterval> | null = null;
  private last = "";
  private meta: { label: string; image?: string } | null = null;

  start(): void {
    onCache("weapon", (weapon) => this.watch(weapon));
    this.watch(cache.weapon);
  }

  private watch(weapon: number | false): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.last = "";
    if (weapon === false) return send({ action: "weapon", data: null });
    this.meta = heldWeapon();
    this.timer = setInterval(() => this.read(weapon), 250);
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
