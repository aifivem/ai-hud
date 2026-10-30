import type { ReactNode } from "react";
import { faGasPump, faUserSlash } from "@fortawesome/free-solid-svg-icons";
import { useLang } from "../lib/lang";
import { useAppSelector } from "../store/hud";
import { DANGER, IconCircle, TEXT_SHADOW } from "./parts";

/** Circumference of the r=48 gauge circle in its 100-unit viewBox. */
const C = 2 * Math.PI * 48;
/** Tick marks on the left half of the gauge (6 to 12 o'clock), every fifth one long. */
const TICKS = Array.from({ length: 21 }, (_, i) => {
  const a = Math.PI / 2 + (i / 20) * Math.PI;
  const long = i % 5 === 0;
  const r0 = long ? 38 : 40;
  return {
    x1: 50 + r0 * Math.cos(a),
    y1: 50 + r0 * Math.sin(a),
    x2: 50 + 43 * Math.cos(a),
    y2: 50 + 43 * Math.sin(a),
    long,
  };
});

/** A half arc (left: bottom to top over 9 o'clock, right: bottom to top over 3 o'clock) filled to `value` 0-1. */
function HalfArc({
  side,
  value,
  color,
}: {
  side: "left" | "right";
  value: number;
  color: string;
}) {
  const transform =
    side === "left"
      ? "rotate(90 50 50)"
      : "rotate(90 50 50) scale(1 -1) translate(0 -100)";
  const half = C / 2;
  return (
    <>
      <circle
        cx="50"
        cy="50"
        r="48"
        fill="none"
        stroke="#fff"
        strokeOpacity="0.2"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeDasharray={`${half} ${C}`}
        transform={transform}
      />
      <circle
        cx="50"
        cy="50"
        r="48"
        fill="none"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeDasharray={`${half * Math.min(1, Math.max(0, value))} ${C}`}
        transform={transform}
        style={{ transition: "stroke-dasharray 150ms linear" }}
      />
    </>
  );
}

/** Small box of the gear row (lumihud `speedometer_gear`). */
const Gear = ({
  children,
  active = false,
}: {
  children: ReactNode;
  active?: boolean;
}) => (
  <span
    className={`flex h-[2.5vh] w-[1.8vh] items-center justify-center rounded-[0.3vh] bg-tgi-dark text-[1.2vh] ${active ? "text-tgi-green" : "text-white/40"}`}
  >
    {children}
  </span>
);

/** lumihud car gauge: rpm arc on the left, fuel arc on the right, gears over the three-digit speed, unit under it. */
export function Speedometer() {
  const t = useLang();
  const vehicle = useAppSelector((s) => s.hud.vehicle);
  const unit = useAppSelector((s) => s.hud.settings.speedUnit);
  if (!vehicle) return null;
  const numeric =
    !(vehicle.speed === 0 && vehicle.gear <= 1) && vehicle.gear !== 0;
  const gear = numeric
    ? String(vehicle.gear)
    : vehicle.gear === 0 && vehicle.speed !== 0
      ? t("UI_REVERSE")
      : t("UI_NEUTRAL");
  const digits = String(Math.min(999, Math.max(0, Math.round(vehicle.speed))));
  const lowFuel = vehicle.fuel < 15;
  return (
    <div className="fixed right-[3vh] bottom-[3vh] size-[22vh]">
      <div className="absolute inset-[0.5vh] [filter:drop-shadow(0.15vh_0.1vh_0_rgba(0,0,0,0.75))]">
        <svg
          viewBox="0 0 100 100"
          className="absolute inset-0 size-full overflow-visible"
        >
          <HalfArc side="left" value={vehicle.rpm} color="var(--green)" />
          <HalfArc
            side="right"
            value={vehicle.fuel / 100}
            color={lowFuel ? DANGER : "#ffffff"}
          />
          {TICKS.map((k, i) => (
            <line
              key={i}
              x1={k.x1}
              y1={k.y1}
              x2={k.x2}
              y2={k.y2}
              stroke="#d9d9d9"
              strokeOpacity={k.long ? 1 : 0.5}
              strokeWidth={k.long ? 1.2 : 0.9}
              strokeLinecap="round"
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-[0.2vh]">
          <span className="flex gap-[0.4vh]" aria-label={t("UI_GEAR")}>
            {numeric && vehicle.gear > 1 && <Gear>{vehicle.gear - 1}</Gear>}
            <Gear active>{gear}</Gear>
            {numeric && <Gear>{vehicle.gear + 1}</Gear>}
          </span>
          <span className="flex text-[5.7vh] leading-[1.15] font-normal tabular-nums">
            {digits
              .padStart(3, "0")
              .split("")
              .map((d, i) => (
                <span
                  key={i}
                  className={
                    i < 3 - digits.length ? "text-white/30" : "text-white"
                  }
                >
                  {d}
                </span>
              ))}
          </span>
          <span className="flex h-[2.5vh] items-center rounded-[0.3vh] bg-tgi-dark px-[0.6vh] text-[1.2vh] uppercase">
            {unit === "mph" ? t("UI_MPH") : t("UI_KMH")}
          </span>
        </div>
      </div>
      {vehicle.belt === false && (
        <span className="absolute top-0 right-0 flex flex-col items-center gap-[0.4vh]">
          <span
            className={`text-[1.2vh] font-semibold text-danger uppercase ${TEXT_SHADOW}`}
          >
            {t("UI_BELT")}
          </span>
          <IconCircle
            icon={faUserSlash}
            color={DANGER}
            className="size-[3vh] bg-tgi-dark"
          />
        </span>
      )}
      <span className="absolute right-0 bottom-0" aria-label={t("UI_FUEL")}>
        <IconCircle
          icon={faGasPump}
          color={lowFuel ? DANGER : "#ffffff"}
          className="size-[3vh] bg-tgi-dark"
        />
      </span>
    </div>
  );
}
