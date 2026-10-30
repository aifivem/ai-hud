import { addCommand } from "@aicore-fivem/lib/server";
import { Locale } from "common";
import { EVENTS } from "common/hud";

// /hud opens the player's HUD settings (the radial menu reaches them through ai-core's OpenHudSettings).
addCommand("hud", { help: Locale("COMMAND_HUD") }, (source) => {
  if (source > 0) emitNet(EVENTS.openSettings, source);
});
