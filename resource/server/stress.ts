import {
  AdminPanel,
  onClientEvent,
  registerExport,
  stress,
} from "@aifivem/lib/server";
import { oneArg, readFinite } from "@aifivem/lib/shared";
import { EVENTS, readSettings } from "common/hud";
import { hudSchema } from "./schema";

/**
 * Stress rules: ai-core keeps the value with the other needs (metadata `stress`) while ai-hud is its stress HUD;
 * ai-hud adds what the client reports (speed, shots) through lib `stress` and tells ai-core how fast stress fades.
 */
const panel = new AdminPanel(hudSchema);
/** Panel settings, kept current by the panel. */
const settings = panel.view("settings", readSettings);

onClientEvent(
  EVENTS.stress,
  {
    args: oneArg((v) => {
      const amount = readFinite(v);
      return amount !== null && amount > 0 && amount <= 5 ? amount : null;
    }),
    rate: { count: 2, windowMs: 1000 },
  },
  (source, amount) => void stress.gain(source, amount),
);

// ai-core's needs pass asks once a second while ai-hud keeps stress.
registerExport("GetStressRelief", () => settings.value.stressRelief);
