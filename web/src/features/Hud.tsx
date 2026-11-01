import { useAppSelector } from "../store/hud";
import { KeyHints } from "./KeyHints";
import { Speedometer } from "./Speedometer";
import { Status } from "./Status";
import { TopRight } from "./TopRight";

/** The HUD over gameplay: nothing else stays on screen (docs/design.md). */
export function Hud() {
  const { visible, settings } = useAppSelector((s) => s.hud);
  return (
    <div
      className={`transition-opacity duration-300 ${visible ? "opacity-100" : "opacity-0"}`}
    >
      {(settings.show.needs || settings.show.street || settings.show.voice) && (
        <Status />
      )}
      {(settings.show.money || settings.show.identity) && <TopRight />}
      {settings.show.speedometer && <Speedometer />}
      {settings.keyHints && <KeyHints />}
    </div>
  );
}
