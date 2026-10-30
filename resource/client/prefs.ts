import {
  cache,
  menu,
  registerExport,
  TickLoop,
} from "@aicore-fivem/lib/client";
import { Locale } from "common";
import { readPrefs, type Prefs, type Settings } from "common/hud";

const KVP = "ai-hud:prefs";

function stored(): Prefs {
  const raw = GetResourceKvpString(KVP);
  if (!raw) return readPrefs(null);
  try {
    return readPrefs(JSON.parse(raw));
  } catch (error) {
    console.error(
      `[ai-hud] stored HUD settings unreadable, using defaults`,
      error,
    );
    return readPrefs(null);
  }
}

/** What this player turned off for themself (/hud), kept in their KVP; the panel's switches decide first. */
export const prefs = { value: stored() };

/** The settings the NUI draws with: the panel's, minus what the player turned off. */
export function effective(settings: Settings): Settings {
  const p = prefs.value;
  return {
    ...settings,
    keyHints: settings.keyHints && p.keyHints,
    show: {
      needs: settings.show.needs && p.needs,
      money: settings.show.money && p.money,
      speedometer: settings.show.speedometer && p.speedometer,
      street: settings.show.street && p.street,
      voice: settings.show.voice && p.voice,
      identity: settings.show.identity && p.identity,
    },
  };
}

/**
 * The minimap: shown while the HUD shows and the panel says "always" (or the player / an admin wants it on foot),
 * else only in a vehicle. GTA's health and armour bars under it stay hidden while it shows.
 */
class Radar {
  adminAlways = false;
  private shown: boolean | null = null;
  private readonly scaleform = RequestScaleformMovie("minimap");
  private readonly bars = new TickLoop(() => {
    BeginScaleformMovieMethod(this.scaleform, "SETUP_HEALTH_ARMOUR");
    ScaleformMovieMethodAddParamInt(3);
    EndScaleformMovieMethod();
  });

  update(hudVisible: boolean, settings: Settings): void {
    const show =
      hudVisible &&
      (settings.minimap === "always" ||
        prefs.value.minimapAlways ||
        this.adminAlways ||
        cache.vehicle !== false);
    if (show === this.shown) return;
    this.shown = show;
    DisplayRadar(show);
    this.bars.set(show);
  }
}

export const radar = new Radar();

const ROWS = [
  ["needs", "HUD_P_NEEDS"],
  ["money", "HUD_P_MONEY"],
  ["speedometer", "HUD_P_SPEEDOMETER"],
  ["street", "HUD_P_STREET"],
  ["voice", "HUD_P_VOICE"],
  ["identity", "HUD_P_IDENTITY"],
  ["keyHints", "HUD_P_KEYHINTS"],
  ["minimapAlways", "HUD_P_MINIMAP"],
] as const satisfies ReadonlyArray<readonly [keyof Omit<Prefs, "v">, string]>;

/** /hud: switches for what this player sees; each pick flips one and the menu opens again until it is closed. */
export async function openSettings(changed: () => void): Promise<void> {
  for (;;) {
    const picked = await menu({
      title: Locale("HUD_SETTINGS"),
      items: ROWS.map(([key, label]) => ({
        id: key,
        label: Locale(label),
        icon: prefs.value[key] ? "check" : "xmark",
        description: Locale(prefs.value[key] ? "HUD_ON" : "HUD_OFF"),
      })),
    });
    const row = ROWS.find(([key]) => key === picked);
    if (!row) return;
    prefs.value = { ...prefs.value, [row[0]]: !prefs.value[row[0]] };
    SetResourceKvp(KVP, JSON.stringify(prefs.value));
    changed();
  }
}

export function registerHudExports(
  open: () => void,
  changed: () => void,
): void {
  registerExport("OpenSettings", open);
  // An admin's own toggle (ai-admin's menu): the minimap on foot whatever the panel says.
  registerExport("SetMinimapAlways", (on: unknown) => {
    radar.adminAlways = on === true;
    changed();
  });
  registerExport("GetMinimapAlways", () => radar.adminAlways);
}
