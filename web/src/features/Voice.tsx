import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMicrophone,
  faWalkieTalkie,
} from "@fortawesome/free-solid-svg-icons";
import { useLang } from "../lib/lang";
import { useAppSelector } from "../store/hud";
import { TEXT_SHADOW } from "./parts";

/** Mic fill per range, lumihud style: whisper a third, normal two thirds, shout full. */
const level = (mode: number) =>
  Math.min(100, Math.max(15, Math.round((mode / 3) * 100)));

/**
 * lumihud voice box: a round mic that fills up to the voice range (green while talking, a walkie-talkie on the radio)
 * and the range name beside it, "NORMAL RANGE" or "RADIO ON AIR".
 */
export function Voice() {
  const t = useLang();
  const voice = useAppSelector((s) => s.hud.voice);
  const key = `UI_VOICE_MODE_${voice.mode}`;
  const range = t(key) === key ? t("UI_VOICE_MODE_N", voice.mode) : t(key);
  const live = voice.talking || voice.radio;
  return (
    <div className="flex items-center gap-[0.5vh]" aria-label={t("UI_VOICE")}>
      <span
        className={`relative flex size-[2.6vh] shrink-0 items-center justify-center rounded-full bg-tgi-dark text-[1.3vh] transition-[box-shadow] duration-150 ${live ? "[box-shadow:0_0_0_0.15vh_var(--green-40)]" : ""}`}
      >
        {voice.radio ? (
          <FontAwesomeIcon icon={faWalkieTalkie} className="text-tgi-green" />
        ) : (
          <span className="relative flex">
            <FontAwesomeIcon icon={faMicrophone} className="text-white/25" />
            <FontAwesomeIcon
              icon={faMicrophone}
              className={`absolute inset-0 transition-colors duration-150 ${voice.talking ? "text-tgi-green" : "text-white"}`}
              style={{ clipPath: `inset(${100 - level(voice.mode)}% 0 0 0)` }}
            />
          </span>
        )}
      </span>
      <span
        className={`flex items-center gap-[0.5vh] text-[1.2vh] uppercase ${TEXT_SHADOW}`}
      >
        <span
          className={`font-extrabold transition-colors duration-150 ${live ? "text-tgi-green" : "text-white"}`}
        >
          {voice.radio ? t("UI_VOICE_RADIO") : range}
        </span>
        <span className="text-white/70">
          {voice.radio ? t("UI_VOICE_ON_AIR") : t("UI_VOICE_RANGE")}
        </span>
      </span>
    </div>
  );
}
