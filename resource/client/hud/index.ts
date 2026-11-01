import {
  every,
  getPlayerData,
  hud as uiHud,
  onCache,
  onServerEvent,
  onShot,
  resourceExport,
} from "@aicore-fivem/lib/client";
import { isRecord, readFinite } from "@aicore-fivem/lib/shared";
import {
  CORE,
  KEY_HINTS,
  type KeyHintView,
  NUI_LAYER,
} from "@aicore-fivem/shared";
import { EVENTS, NEEDS, type Need } from "common/hud";
import { identity } from "../identity";
import { openSettings, registerHudExports } from "../prefs";
import { addStress, send } from "../watchers";
import { hud } from "./state";

// Stacking among NUI pages (`NUI_LAYER`): set at start, not left to load order.
SetNuiZindex(NUI_LAYER.hud);

const core = resourceExport("ai-core");
const isHint = (v: unknown): v is KeyHintView =>
  typeof v === "object" &&
  v !== null &&
  typeof Reflect.get(v, "id") === "string" &&
  typeof Reflect.get(v, "key") === "string" &&
  typeof Reflect.get(v, "label") === "string";

const isNeed = (v: unknown): v is Need =>
  typeof v === "string" && (NEEDS as readonly string[]).includes(v);

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
    args: ([raw]) => (isRecord(raw) ? [raw] : null),
  },
  (raw) => hud.setNeeds(raw),
);
onServerEvent(
  EVENTS.need,
  {
    args: ([need, value]) =>
      isNeed(need) && readFinite(value) !== null
        ? [need, value as number]
        : null,
  },
  (need, value) => hud.setNeed(need, value),
);
on(CORE.clientPlayerUnloadedEvent, () => {
  hud.loaded = false;
  hud.updateVisible();
});
// Shooting stresses (lib `onShot`: checked every frame only while armed).
onShot(() => addStress(hud.settings.stressShot));
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
every(250, () => hud.updateVisible(), { name: "visible" });
every(10_000, () => hud.starve(), { name: "starve" });
