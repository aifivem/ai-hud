import { onStop } from "@aifivem/lib/client";

/** HUD_COLOUR_WAYPOINT: the waypoint blip and its GPS route. */
const WAYPOINT = 142;

/** `#rrggbb` (checked by the panel reader) to its red, green and blue parts. */
function rgb(hex: string): [number, number, number] {
  const n = Number.parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** The panel's waypoint colour; the game's own colour comes back when it is switched off or the resource stops. */
class WaypointColor {
  private original: [number, number, number, number] | null = null;
  private applied: string | null = null;

  apply(color: string | null): void {
    if (color === this.applied) return;
    if (color === null) return this.restore();
    this.original ??= GetHudColour(WAYPOINT);
    ReplaceHudColourWithRgba(WAYPOINT, ...rgb(color), 255);
    this.applied = color;
  }

  restore(): void {
    if (this.original && this.applied !== null)
      ReplaceHudColourWithRgba(WAYPOINT, ...this.original);
    this.applied = null;
  }
}

export const waypointColor = new WaypointColor();
onStop(() => waypointColor.restore());
