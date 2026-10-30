import { memo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBrain,
  faDrumstickBite,
  faDroplet,
  faHeart,
  faLocationDot,
  faMicrophone,
  faShieldHalved,
  faWalkieTalkie,
  type IconDefinition,
} from "@fortawesome/free-solid-svg-icons";
import { useLang } from "../lib/lang";
import { useAppSelector } from "../store/hud";
import { clamp, DANGER, IconCircle, Pill, TEXT_SHADOW, Value } from "./parts";
import { Speedometer } from "./Speedometer";

/** lumihud status colours (IndicatorBox defaults). */
const COLOR = {
  health: "#e52323",
  armour: "#a554f6",
  hunger: "#ffa754",
  thirst: "#5ef0e6",
  stress: "#b46cff",
};

/** Status with a horizontal bar (health, armour): icon circle + pill with a thin bar and the value. */
const BigStatus = memo(function BigStatus({
  icon,
  value,
  color,
  label,
}: {
  icon: IconDefinition;
  value: number;
  color: string;
  label: string;
}) {
  const tint = value <= 20 ? DANGER : color;
  return (
    <div className="flex gap-[0.5vh]" aria-label={label}>
      <IconCircle icon={icon} color={tint} />
      <Pill>
        <span className="h-[0.4vh] w-[7vh] overflow-hidden rounded-full bg-white/15">
          <span
            className="block h-full w-full origin-left rounded-full transition-transform duration-300 ease-out"
            style={{
              background: tint,
              transform: `scaleX(${clamp(value) / 100})`,
            }}
          />
        </span>
        <Value value={value} />
      </Pill>
    </div>
  );
});

/** Status with a small upright bar (needs): icon circle + pill with a short vertical bar and the value. */
const SmallStatus = memo(function SmallStatus({
  icon,
  value,
  color,
  label,
}: {
  icon: IconDefinition;
  value: number;
  color: string;
  label: string;
}) {
  const tint = value <= 20 ? DANGER : color;
  return (
    <div className="flex gap-[0.5vh]" aria-label={label}>
      <IconCircle icon={icon} color={tint} />
      <Pill className="gap-[0.5vh]">
        <span className="flex h-[1.2vh] w-[0.4vh] overflow-hidden rounded-full bg-white/15">
          <span
            className="block h-full w-full origin-bottom rounded-full transition-transform duration-300 ease-out"
            style={{
              background: tint,
              transform: `scaleY(${clamp(value) / 100})`,
            }}
          />
        </span>
        <Value value={value} />
      </Pill>
    </div>
  );
});

function Street() {
  const { street, zone } = useAppSelector((s) => s.hud.street);
  if (!street && !zone) return null;
  return (
    <div className="flex gap-[0.5vh]">
      <IconCircle
        icon={faLocationDot}
        className="bg-tgi-green text-tgi-green-text"
      />
      <Pill>
        <span className="text-[1.2vh] font-extrabold">{street}</span>
        <span className="text-[1.2vh] text-white/70 uppercase">{zone}</span>
      </Pill>
    </div>
  );
}

/** Mic fill per range, lumihud style: whisper a third, normal two thirds, shout full. */
const level = (mode: number) =>
  Math.min(100, Math.max(15, Math.round((mode / 3) * 100)));

/**
 * lumihud voice box: a round mic that fills up to the voice range (green while talking, a walkie-talkie on the radio)
 * and the range name beside it, "NORMAL RANGE" or "RADIO ON AIR".
 */
function Voice() {
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

function Needs() {
  const t = useLang();
  const { needs, vitals } = useAppSelector((s) => s.hud);
  return (
    <div className="flex flex-wrap items-center gap-x-[1vh] gap-y-[0.8vh]">
      <BigStatus
        icon={faHeart}
        value={vitals.health}
        color={COLOR.health}
        label={t("UI_HEALTH")}
      />
      {vitals.armour > 0 && (
        <BigStatus
          icon={faShieldHalved}
          value={vitals.armour}
          color={COLOR.armour}
          label={t("UI_ARMOUR")}
        />
      )}
      <SmallStatus
        icon={faDrumstickBite}
        value={needs.hunger}
        color={COLOR.hunger}
        label={t("UI_HUNGER")}
      />
      <SmallStatus
        icon={faDroplet}
        value={needs.thirst}
        color={COLOR.thirst}
        label={t("UI_THIRST")}
      />
      {needs.stress > 5 && (
        <SmallStatus
          icon={faBrain}
          value={needs.stress}
          color={COLOR.stress}
          label={t("UI_STRESS")}
        />
      )}
    </div>
  );
}

/** Bottom left, beside the radar: street, voice and the status row stacked like lumihud. */
function Status() {
  const show = useAppSelector((s) => s.hud.settings.show);
  return (
    <div className="fixed bottom-[3vh] left-[29vh] flex flex-col items-start gap-[1vh]">
      {show.street && <Street />}
      {show.voice && <Voice />}
      {show.needs && <Needs />}
    </div>
  );
}

/** lumihud name box: job chip (green on duty) and grade chip, then "[id] Firstname Lastname". */
function Identity() {
  const t = useLang();
  const { identity, job } = useAppSelector((s) => s.hud);
  if (!identity && !job) return null;
  const chip =
    "flex h-[1.9vh] items-center rounded-full px-[1vh] text-[1.1vh] leading-none font-bold uppercase";
  return (
    <div className="flex items-center gap-[0.5vh]">
      {job && (
        <>
          <span
            className={`${chip} ${job.onDuty ? "bg-tgi-green text-tgi-green-text" : "bg-tgi-dark text-white/70"}`}
          >
            {job.label}
          </span>
          {job.grade && (
            <span className={`${chip} bg-tgi-dark text-white`}>
              {job.grade}
            </span>
          )}
          {!job.onDuty && (
            <span className={`${chip} bg-tgi-dark text-white/70`}>
              {t("UI_OFF_DUTY")}
            </span>
          )}
        </>
      )}
      {identity && (
        <span
          className={`ml-[0.5vh] text-[1.8vh] leading-none font-semibold ${TEXT_SHADOW}`}
        >
          <span className="text-white/70 tabular-nums">
            [{identity.serverId}]
          </span>{" "}
          {identity.name}
        </span>
      )}
    </div>
  );
}

function Money() {
  const t = useLang();
  const money = useAppSelector((s) => s.hud.money);
  const format = (n: number | undefined) =>
    `$${(n ?? 0).toLocaleString("en-US")}`;
  return (
    <div className={`flex flex-col items-end gap-[0.5vh] ${TEXT_SHADOW}`}>
      <span
        className="text-[2.4vh] leading-none font-semibold text-tgi-green tabular-nums"
        aria-label={t("UI_CASH")}
      >
        {format(money.cash)}
      </span>
      <span
        className="text-[1.4vh] leading-none font-semibold text-white/60 tabular-nums"
        aria-label={t("UI_BANK")}
      >
        {format(money.bank)}
      </span>
    </div>
  );
}

/** Top right like lumihud: name and job above the money. */
function TopRight() {
  const show = useAppSelector((s) => s.hud.settings.show);
  return (
    <div className="fixed top-[3vh] right-[3vh] flex flex-col items-end gap-[1vh]">
      {show.identity && <Identity />}
      {show.money && <Money />}
    </div>
  );
}

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
    </div>
  );
}
