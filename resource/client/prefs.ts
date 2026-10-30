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
        this.adminAlways ||
        cache.vehicle !== false);
    // Always applied: other code (the character screen, a spawn) switches the radar too.
    DisplayRadar(show);
    if (show === this.shown) return;
    this.shown = show;
    this.bars.set(show);
    // The minimap often stays empty after DisplayRadar(true) until the big map was shown once: flip it for a moment.
    if (show) {
      SetRadarBigmapEnabled(true, false);
      setTimeout(() => SetRadarBigmapEnabled(false, false), 50);
    }
  }
}

export const radar = new Radar();

const ROWS = [
  ["needs", "HUD_P_NEEDS", "utensils"],
  ["money", "HUD_P_MONEY", "wallet"],
  ["speedometer", "HUD_P_SPEEDOMETER", "gauge"],
  ["street", "HUD_P_STREET", "road"],
  ["voice", "HUD_P_VOICE", "microphone"],
  ["identity", "HUD_P_IDENTITY", "id-card"],
  ["keyHints", "HUD_P_KEYHINTS", "keyboard"],
] as const satisfies ReadonlyArray<
  readonly [keyof Omit<Prefs, "v">, string, string]
>;

/** /hud: one switch row per HUD part; each flip applies at once and the menu stays open until it is closed. */
export async function openSettings(changed: () => void): Promise<void> {
  await menu(
    {
      title: Locale("HUD_SETTINGS"),
      items: ROWS.map(([key, label, icon]) => ({
        id: key,
        label: Locale(label),
        icon,
        checked: prefs.value[key],
      })),
    },
    {
      onToggle: (id, checked) => {
        const row = ROWS.find(([key]) => key === id);
        if (!row) return;
        prefs.value = { ...prefs.value, [row[0]]: checked };
        SetResourceKvp(KVP, JSON.stringify(prefs.value));
        changed();
      },
    },
  );
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
