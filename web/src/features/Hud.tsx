import { memo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBrain, faDroplet, faHeart, faLocationDot, faMicrophone, faShieldHalved, faTowerBroadcast, faUtensils, type IconDefinition } from "@fortawesome/free-solid-svg-icons";
import { useLang } from "../lib/lang";
import { useAppSelector } from "../store/hud";

const RING = 2 * Math.PI * 20;

/** A status: round icon in a thin ring filled by its value (docs/design.md HUD), the value above its label. */
const StatusRing = memo(function StatusRing({ icon, value, color, label, pulse = false, number = true }: { icon: IconDefinition; value: number; color: string; label: string; pulse?: boolean; number?: boolean }) {
  const low = number && value <= 20;
  return (
    <div className="flex w-[6vh] flex-col items-center gap-[0.4vh]">
      <span className={`text-[1.25vh] font-semibold tabular-nums text-text ${number ? "" : "invisible"}`}>{Math.round(value)}</span>
      <div className={`relative size-[4.6vh] ${pulse ? "animate-pulse" : ""}`}>
        <svg viewBox="0 0 46 46" className="absolute inset-0 size-full [transform:rotate(-90deg)]">
          <circle cx="23" cy="23" r="20" fill="rgba(17,22,25,0.85)" stroke="var(--line)" strokeWidth="2.5" />
          <circle
            cx="23"
            cy="23"
            r="20"
            fill="none"
            stroke={low ? "var(--danger)" : color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray={RING}
            strokeDashoffset={RING * (1 - Math.min(100, Math.max(0, value)) / 100)}
            style={{ transition: "stroke-dashoffset 400ms ease-out" }}
          />
        </svg>
        <FontAwesomeIcon icon={icon} className="absolute inset-0 m-auto text-[1.6vh]" style={{ color: low ? "var(--danger)" : color }} />
      </div>
      <span className="text-[1vh] uppercase tracking-[0.18em] text-text-3">{label}</span>
    </div>
  );
});

function Needs() {
  const t = useLang();
  const { needs, vitals, voice, settings } = useAppSelector((s) => s.hud);
  return (
    <div className="fixed inset-x-0 bottom-[2.4vh] flex justify-center gap-[1.2vh]">
      <StatusRing icon={faHeart} value={vitals.health} color="var(--accent)" label={t("UI_HEALTH")} />
      {vitals.armour > 0 && <StatusRing icon={faShieldHalved} value={vitals.armour} color="#5bc8ff" label={t("UI_ARMOUR")} />}
      <StatusRing icon={faUtensils} value={needs.hunger} color="var(--warn)" label={t("UI_HUNGER")} />
      <StatusRing icon={faDroplet} value={needs.thirst} color="#4a8cff" label={t("UI_THIRST")} />
      {needs.stress > 5 && <StatusRing icon={faBrain} value={needs.stress} color="#b46cff" label={t("UI_STRESS")} />}
      {settings.show.voice && (
        <StatusRing icon={voice.radio ? faTowerBroadcast : faMicrophone} value={(voice.mode / 3) * 100} color={voice.talking ? "var(--accent)" : "var(--text-3)"} label={t("UI_VOICE")} number={false} />
      )}
    </div>
  );
}

function Money() {
  const t = useLang();
  const money = useAppSelector((s) => s.hud.money);
  const format = (n: number | undefined) => `$${(n ?? 0).toLocaleString("en-US")}`;
  return (
    <div className="fixed right-[3vh] top-[3vh] flex flex-col items-end gap-[0.4vh] [text-shadow:0_0.1vh_0.4vh_rgba(0,0,0,0.6)]">
      <span className="text-[2.6vh] font-semibold tabular-nums text-accent" aria-label={t("UI_CASH")}>
        {format(money.cash)}
      </span>
      <span className="text-[1.7vh] font-medium tabular-nums text-text" aria-label={t("UI_BANK")}>
        {format(money.bank)}
      </span>
    </div>
  );
}

const ARC = Math.PI * 70;

function Speedometer() {
  const t = useLang();
  const vehicle = useAppSelector((s) => s.hud.vehicle);
  const unit = useAppSelector((s) => s.hud.settings.speedUnit);
  if (!vehicle) return null;
  const gear = vehicle.speed === 0 && vehicle.gear <= 1 ? t("UI_NEUTRAL") : vehicle.gear === 0 ? t("UI_REVERSE") : String(vehicle.gear);
  return (
    <div className="fixed bottom-[3vh] right-[3vh] flex w-[20vh] flex-col items-center">
      <svg viewBox="0 0 160 90" className="w-full">
        <path d="M10 80 A70 70 0 0 1 150 80" fill="none" stroke="var(--line)" strokeWidth="4" strokeLinecap="round" />
        <path
          d="M10 80 A70 70 0 0 1 150 80"
          fill="none"
          stroke="var(--accent)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={ARC}
          strokeDashoffset={ARC * (1 - Math.min(1, vehicle.rpm))}
          style={{ transition: "stroke-dashoffset 120ms linear" }}
        />
      </svg>
      <div className="-mt-[6.6vh] flex flex-col items-center">
        <span className="text-[3.2vh] font-semibold leading-none tabular-nums text-text">{vehicle.speed}</span>
        <span className="text-[1.1vh] uppercase tracking-[0.2em] text-text-3">{unit === "mph" ? t("UI_MPH") : t("UI_KMH")}</span>
      </div>
      <div className="mt-[1vh] flex w-full items-center gap-[1vh] text-[1.2vh] text-text-2">
        <span className="tabular-nums" aria-label={t("UI_GEAR")}>
          {gear}
        </span>
        {vehicle.belt === false && <span className="rounded-[0.4vh] bg-danger px-[0.6vh] text-[1vh] font-semibold uppercase text-text">{t("UI_BELT")}</span>}
        <div className="h-[0.5vh] flex-1 overflow-hidden rounded-full bg-raised" aria-label={t("UI_FUEL")}>
          <div className={`h-full rounded-full ${vehicle.fuel < 15 ? "bg-danger" : "bg-accent"}`} style={{ width: `${vehicle.fuel}%` }} />
        </div>
      </div>
    </div>
  );
}

function Street() {
  const { street, zone } = useAppSelector((s) => s.hud.street);
  if (!street && !zone) return null;
  return (
    <div className="fixed bottom-[3vh] left-[29vh] flex items-center gap-[1vh] [text-shadow:0_0.1vh_0.4vh_rgba(0,0,0,0.7)]">
      <FontAwesomeIcon icon={faLocationDot} className="text-[1.6vh] text-accent" />
      <div className="flex flex-col">
        <span className="text-[1.5vh] font-semibold text-text">{street}</span>
        <span className="text-[1.15vh] text-text-3">{zone}</span>
      </div>
    </div>
  );
}

/** The HUD over gameplay: nothing else stays on screen (docs/design.md). */
export function Hud() {
  const { visible, settings } = useAppSelector((s) => s.hud);
  return (
    <div className={`transition-opacity duration-300 ${visible ? "opacity-100" : "opacity-0"}`}>
      {settings.show.needs && <Needs />}
      {settings.show.money && <Money />}
      {settings.show.speedometer && <Speedometer />}
      {settings.show.street && <Street />}
    </div>
  );
}
